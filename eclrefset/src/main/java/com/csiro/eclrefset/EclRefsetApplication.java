package com.csiro.eclrefset;

import com.csiro.eclrefset.model.addorremovequeryresponse.AddOrRemoveQueryResponse;
import com.csiro.eclrefset.model.addorremovequeryresponse.AddRemoveItem;
import com.csiro.eclrefset.model.refsetqueryresponse.Data;
import com.csiro.eclrefset.model.refsetqueryresponse.Item;
import com.csiro.eclrefset.model.refsetqueryresponse.ReferencedComponent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.Cookie;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.json.JSONObject;
import org.snomed.langauges.ecl.ECLException;
import org.snomed.langauges.ecl.ECLObjectFactory;
import org.snomed.langauges.ecl.ECLQueryBuilder;
import org.snomed.langauges.ecl.domain.Pair;
import org.snomed.langauges.ecl.domain.expressionconstraint.CompoundExpressionConstraint;
import org.snomed.langauges.ecl.domain.expressionconstraint.DottedExpressionConstraint;
import org.snomed.langauges.ecl.domain.expressionconstraint.ExpressionConstraint;
import org.snomed.langauges.ecl.domain.expressionconstraint.SubExpressionConstraint;
import org.snomed.langauges.ecl.domain.refinement.Operator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@Log
public class EclRefsetApplication {

  public static final String BRANCH = "MAIN%7CSNOMEDCT-AU";
  public static final String LOG_SEPARATOR_LINE =
      "### ---------------------------------------------------------";
  private static final String ECL_REFSET_ID = "900000000000513000";
  // snowstorm limitation, can be addressed with searchAfter, but 10K seems like a
  // reasonable batch to prevent lost work due to 6 hour pipeline limitation and
  // there could be limitations on the size of the batch changes that we hit
  // anyway?
  private static final int MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE = 10000;
  private static final int NUM_CONCURRENT_THREADS = 50;
  private final Map<String, String> conceptsToReplaceMap = new HashMap<>();
  private final Map<String, String> refComponentIdToECLMap = new HashMap<>();

  @Value("${snowstorm-url}")
  private String snowstormUrl;

  @Value("${refset-percent-change-threshold}")
  private double percentChangeThreshold;

  @Value("${refset-count-change-threshold}")
  private int countChangeThreshold;

  @Value("${ignore-refset-count-change-threshold-error}")
  private boolean ignoreCountChangeThresholdError;

  public static void main(String[] args) {
    log.info("STARTING: ECL REFSET PROCESS");
    SpringApplication.run(EclRefsetApplication.class, args);

    log.info("FINISHED: ECL REFSET PROCESS");
  }

  @Bean
  public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder.build();
  }

  @Bean
  public CommandLineRunner commandLineRunner(ApplicationContext ctx, RestTemplate restTemplate) {
    return args -> {
      FileAppender fileAppender = new FileAppender("threshold.txt");

      ImsService imsService = ctx.getBean(ImsService.class);
      Cookie cookie = imsService.getDefaultCookie();
      restTemplate.setInterceptors(
          Collections.singletonList(new AuthInterceptor(cookie.getName(), cookie.getValue())));

      Data refsetQueryResponse = getReferenceSetQueryResponse(restTemplate);
      List<JSONObject> bulkChangeList = new CopyOnWriteArrayList<>();

      log.info(
          "Found "
              + refsetQueryResponse.getItems().size()
              + " members of the ECL refset ("
              + ECL_REFSET_ID
              + ") to process which are "
              + refsetQueryResponse.getItems().stream()
                  .map(Item::getReferencedComponent)
                  .map(ReferencedComponent::getConceptId)
                  .collect(Collectors.joining(", ")));

      // First pass, collect all the ecl refset concept ids for later user
      for (Item item : refsetQueryResponse.getItems()) {
        String ecl = "(" + item.getAdditionalFields().getQuery() + ")";
        refComponentIdToECLMap.put(item.getReferencedComponent().getId(), ecl);
      }

      // Second pass, make sure the supplied ECL is valid and collect the reference
      // sets that need to be expanded
      for (Item item : refsetQueryResponse.getItems()) {

        String ecl = this.refComponentIdToECLMap.get(item.getReferencedComponent().getId());
        ECLQueryBuilder eclQueryBuilder = new ECLQueryBuilder(new ECLObjectFactory());
        try {
          // Use the parser to ensure that the ECL we have received is correct
          ExpressionConstraint ec = eclQueryBuilder.createQuery(ecl);

          if (ec instanceof CompoundExpressionConstraint compoundExpressionConstraint) {
            this.processCompoundExpressionConstraint(compoundExpressionConstraint, restTemplate);
          } else if (ec instanceof SubExpressionConstraint subExpressionConstraint) {
            this.processSubExpressionConstraint(subExpressionConstraint, restTemplate);
          } else {
            throw new EclRefsetProcessingException(
                "ERROR: unexpected ECL expression, code not coping" + ec);
          }
        } catch (ECLException e) {
          log.info("invalid ECL:" + e.getLocalizedMessage());
          log.info("==>" + ecl);
          System.exit(-1);
        } catch (RestClientException e) {
          log.info("Exception" + e);
          System.exit(-1);
        }
      }

      int maxExecutions = 0;
      while (this.conceptsToReplaceMap.containsValue(null)) {
        maxExecutions++;
        if (maxExecutions > 100) {
          throw new EclRefsetProcessingException(
              "unexpected volume of processing " + this.conceptsToReplaceMap);
        }
        for (Map.Entry<String, String> entry : this.conceptsToReplaceMap.entrySet()) {
          if (entry.getValue() == null) {
            String concept = entry.getKey();
            if (!this.refComponentIdToECLMap.containsKey(concept)) {
              throw new EclRefsetProcessingException(
                  "ERROR: unexpected event: unable to find replacement ECL for " + concept);
            }

            String ecl = this.refComponentIdToECLMap.get(concept);

            if (!ecl.contains("^")) {
              this.conceptsToReplaceMap.put(concept, this.refComponentIdToECLMap.get(concept));
            } else {

              Pattern pattern =
                  Pattern.compile("\\^\\s?(\\d{6,})(?:\\s?\\|\\s?([\\w\\s\\-.]+)\\|)?");
              Matcher matcher = pattern.matcher(ecl);

              boolean allRefSetsArePickLists = true;
              while (matcher.find()) {

                String conceptId = matcher.group(1);

                if (this.refComponentIdToECLMap.containsKey(conceptId)) {
                  allRefSetsArePickLists = false;
                  break;
                }
              }
              if (allRefSetsArePickLists) {
                this.conceptsToReplaceMap.put(concept, this.refComponentIdToECLMap.get(concept));
              }
            }
          }
        }
      }

      // expand ecl

      for (Map.Entry<String, String> entry : this.refComponentIdToECLMap.entrySet()) {
        String concept = entry.getKey();
        String ecl = this.refComponentIdToECLMap.get(concept);

        if (ecl.contains("^")) {

          Pattern pattern = Pattern.compile("\\^\\s?(\\d{6,})(?:\\s?\\|\\s?([\\w\\s\\-.]+)\\|)?");
          Matcher matcher = pattern.matcher(ecl);

          while (matcher.find()) {
            int start = matcher.start();
            int end = matcher.end();

            String conceptId = matcher.group(1);

            String replacement = this.conceptsToReplaceMap.get(conceptId);
            if (replacement != null) {
              // Get the substring before the characters to replace
              String prefix = ecl.substring(0, start);

              // Get the substring after the characters to replace
              String suffix = ecl.substring(end);

              // Concatenate the prefix, replacement string, and suffix
              ecl = prefix + "(" + replacement + ")" + suffix;

              this.refComponentIdToECLMap.put(concept, ecl);
            }
          }
        }
      }

      // Third pass, add/remove as required and log
      for (Item item : refsetQueryResponse.getItems()) {

        boolean countThresholdExceeded = false;

        String ecl = "(" + refComponentIdToECLMap.get(item.getReferencedComponent().getId()) + ")";

        // Unfortunately the SI ECL parser does not round trip. If I could have altered
        // and then generated the ECL string this would have been my ideal situation.
        // But given that it is a simple concept id <--> ECL replacment, I think
        // processing the ECL as a string is simpler than implementing full round
        // tripping.

        // check what changes are necessary to update the distributed refsets
        String addEcl =
            "(" + ecl + ") MINUS (^ " + item.getReferencedComponent().getConceptId() + ")";
        String removeEcl =
            "(^ " + item.getReferencedComponent().getConceptId() + ") MINUS (" + ecl + ")";

        String baseAddQuery =
            snowstormUrl
                + BRANCH
                + "/concepts?ecl="
                + addEcl
                + "&activeFilter=true&includeLeafFlag=false&form=inferred";
        String baseRemoveQuery =
            snowstormUrl
                + BRANCH
                + "/concepts?ecl="
                + removeEcl
                + "&activeFilter=true&includeLeafFlag=false&form=inferred";

        log.info("### Processing refsetId: " + item.getReferencedComponent().getConceptId());
        log.info("### ECL:" + ecl);
        log.info("### Processing for additions");
        log.info(LOG_SEPARATOR_LINE);

        // Process additions

        AddOrRemoveQueryResponse allAddQueryResponse =
            getAddQueryResponse(
                restTemplate,
                baseAddQuery,
                fileAppender,
                item.getReferencedComponent().getConceptId());

        String refsetMemberCountQuery =
            snowstormUrl
                + BRANCH
                + "/members?referenceSet="
                + item.getReferencedComponent().getConceptId()
                + "&active=true&offset=0&limit=1";
        Data refsetMemberCountResponse =
            restTemplate.getForObject(refsetMemberCountQuery, Data.class);
        assert refsetMemberCountResponse != null;
        Integer totalCount = refsetMemberCountResponse.getTotal();

        if (allAddQueryResponse == null) {
          countThresholdExceeded = true;
        } else {

          LogThresholdInfo.logAdd(
              item.getReferencedComponent().getConceptId(),
              allAddQueryResponse.getTotal(),
              totalCount,
              percentChangeThreshold,
              fileAppender);

          logAndAddRefsetMembersToBulk(allAddQueryResponse, item, restTemplate, bulkChangeList);

          this.doBulkUpdate(restTemplate, bulkChangeList);
          bulkChangeList.clear();

          // process remaining pages
          while (allAddQueryResponse.getOffset() + allAddQueryResponse.getLimit()
              >= MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE) {
            allAddQueryResponse =
                getAddQueryResponse(
                    restTemplate,
                    baseAddQuery,
                    fileAppender,
                    item.getReferencedComponent().getConceptId());
            logAndAddRefsetMembersToBulk(allAddQueryResponse, item, restTemplate, bulkChangeList);

            this.doBulkUpdate(restTemplate, bulkChangeList);
            bulkChangeList.clear();
          }
        }

        log.info(LOG_SEPARATOR_LINE);

        // Process removals

        if (!countThresholdExceeded) {
          log.info("### Processing for removals");
          log.info(LOG_SEPARATOR_LINE);

          AddOrRemoveQueryResponse allRemoveQueryResponse =
              getRemoveQueryResponse(
                  restTemplate,
                  baseRemoveQuery,
                  fileAppender,
                  item.getReferencedComponent().getConceptId());

          if (allRemoveQueryResponse != null) {

            LogThresholdInfo.logRemove(
                item.getReferencedComponent().getConceptId(),
                allRemoveQueryResponse.getTotal(),
                totalCount,
                percentChangeThreshold,
                fileAppender);

            logAndRemoveRefsetMembersToBulk(
                allRemoveQueryResponse, item, restTemplate, bulkChangeList);

            this.doBulkUpdate(restTemplate, bulkChangeList);
            bulkChangeList.clear();

            // process remaining pages
            while (allRemoveQueryResponse.getOffset() + allRemoveQueryResponse.getLimit()
                >= MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE) {
              allRemoveQueryResponse =
                  getRemoveQueryResponse(
                      restTemplate,
                      baseRemoveQuery,
                      fileAppender,
                      item.getReferencedComponent().getConceptId());

              logAndRemoveRefsetMembersToBulk(
                  allRemoveQueryResponse, item, restTemplate, bulkChangeList);

              this.doBulkUpdate(restTemplate, bulkChangeList);
              bulkChangeList.clear();
            }
          }
          log.info(LOG_SEPARATOR_LINE);
          log.info("###");
        }
      }

      log.info(LOG_SEPARATOR_LINE);
    };
  }

  private void logAndAddRefsetMembersToBulk(
      AddOrRemoveQueryResponse allAddQueryResponse,
      Item item,
      RestTemplate restTemplate,
      List<JSONObject> bulkChangeList)
      throws Exception {

    int threadCount = 0;

    ExecutorService executor = Executors.newFixedThreadPool(NUM_CONCURRENT_THREADS);

    for (AddRemoveItem i : allAddQueryResponse.getItems()) {
      executor.execute(
          new AddRefsetMemberThread(
              restTemplate, bulkChangeList, threadCount++, i, item, snowstormUrl));
    }

    executor.shutdown();
    executor.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);
  }

  private void logAndRemoveRefsetMembersToBulk(
      AddOrRemoveQueryResponse allRemoveQueryResponse,
      Item item,
      RestTemplate restTemplate,
      List<JSONObject> bulkChangeList)
      throws InterruptedException {

    int threadCount = 0;

    ExecutorService executor = Executors.newFixedThreadPool(NUM_CONCURRENT_THREADS);

    for (AddRemoveItem i : allRemoveQueryResponse.getItems()) {
      executor.execute(
          new RemoveRefsetMemberThread(
              restTemplate, bulkChangeList, threadCount++, i, item, snowstormUrl));
    }

    executor.shutdown();
    executor.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);
  }

  private void doBulkUpdate(RestTemplate restTemplate, List<JSONObject> bulkChangeList)
      throws Exception {
    if (!bulkChangeList.isEmpty()) {
      // bulk update
      HttpHeaders headers = new HttpHeaders();
      headers.setAccept(Collections.singletonList(MediaType.ALL));
      headers.setContentType(MediaType.APPLICATION_JSON);
      String requestBody = bulkChangeList.toString();
      HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
      String bulkQuery = snowstormUrl + BRANCH + "/members/bulk";
      HttpEntity<String> bulkQueryResult =
          restTemplate.exchange(bulkQuery, HttpMethod.POST, request, String.class);
      String location =
          Objects.requireNonNull(bulkQueryResult.getHeaders().getLocation()).getPath();
      String bulkChangeId = location.substring(location.lastIndexOf('/') + 1);

      boolean running = true;
      while (running) {
        try {
          Thread.sleep(5000); // 5000 milliseconds = 5 seconds
        } catch (InterruptedException e) {
          Thread.currentThread().interrupt();
        }

        String bulkStatusQuery = snowstormUrl + BRANCH + "/members/bulk/" + bulkChangeId;
        String bulkStatusResponse = restTemplate.getForObject(bulkStatusQuery, String.class);

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode jsonNode = objectMapper.readTree(bulkStatusResponse);
        String status = jsonNode.get("status").asText();

        if (!status.equals("RUNNING")) {
          running = false;

          if (status.equals("COMPLETED")) {
            log.info(
                "bulk update with id:"
                    + bulkChangeId
                    + " COMPLETED in "
                    + jsonNode.get("secondsDuration").asText());
          } else if (status.equals("FAILED")) {
            log.info(
                "bulk update with id:"
                    + bulkChangeId
                    + " FAILED in "
                    + jsonNode.get("secondsDuration").asText());
            log.info("error message:" + jsonNode.get("message"));
            throw new EclRefsetProcessingException("Bulk Update Failed:" + jsonNode.get("message"));
          } else {
            // maybe an error status?
            log.info("batch status is " + status);
            throw new EclRefsetProcessingException("Unexpected Bulk status:" + status);
          }
        }
      }
    }
  }

  private Data getReferenceSetQueryResponse(RestTemplate restTemplate) {
    String baseQuery = snowstormUrl + BRANCH + "/members?referenceSet=" + ECL_REFSET_ID;
    String query = baseQuery + "&offset=0";
    Data allResponse = getAllResponse(restTemplate, query);

    while (allResponse.getTotal() > allResponse.getOffset() + allResponse.getLimit()) {
      // more pages of data to process
      query = baseQuery + "&offset=" + (allResponse.getOffset() + allResponse.getLimit());
      allResponse = getAllResponse(restTemplate, query);
    }
    return allResponse;
  }

  private Data getAllResponse(RestTemplate restTemplate, String query) {

    Data response = restTemplate.getForObject(query, Data.class);
    assert response != null;
    Data allResponse = Data.builder().items(response.getItems()).offset(response.getOffset()).limit(response.getLimit()).total(response.getTotal()).build();
    return allResponse;
  }

  // null return value indicates count threshold exceeded
  private AddOrRemoveQueryResponse getAddQueryResponse(
      RestTemplate restTemplate,
      String baseQuery,
      FileAppender fileAppender,
      String refsetConceptId)
      throws InterruptedException {
    return this.getAddOrRemoveQueryResponse(
        restTemplate, baseQuery, fileAppender, refsetConceptId, "add");
  }

  // null return value indicates count threshold exceeded
  private AddOrRemoveQueryResponse getRemoveQueryResponse(
      RestTemplate restTemplate,
      String baseQuery,
      FileAppender fileAppender,
      String refsetConceptId)
      throws InterruptedException {
    return this.getAddOrRemoveQueryResponse(
        restTemplate, baseQuery, fileAppender, refsetConceptId, "remove");
  }

  // null return value indicates count threshold exceeded
  private AddOrRemoveQueryResponse getAddOrRemoveQueryResponse(
      RestTemplate restTemplate,
      String baseQuery,
      FileAppender fileAppender,
      String refsetConceptId,
      String mode)
      throws InterruptedException {

    String query = baseQuery + "&offset=0";



    long startTime = System.nanoTime();

    AddOrRemoveQueryResponse queryResponse =
        restTemplate.getForObject(query, AddOrRemoveQueryResponse.class);

    long endTime = System.nanoTime();
    long elapsedTime = endTime - startTime;
    double elapsedTimeInSeconds = elapsedTime / 1_000_000_000.0;

    log.info("Query took " + elapsedTimeInSeconds + " seconds.");

    assert queryResponse != null;
    if ((queryResponse.getTotal() >= countChangeThreshold) && (!ignoreCountChangeThresholdError)) {
      log.info(
          "### ERROR: "
              + queryResponse.getTotal()
              + " has exceeded the COUNT threshold of "
              + countChangeThreshold
              + " for refset "
              + refsetConceptId
              + " while attempting to add or remove concepts");
      log.info(
          "### This action HAS NOT been carried out.  You will need to investigate and fix the ECL, or override the count threshold check by setting the ignore-refset-count-change-threshold-error variable to true");
      fileAppender.appendToFile(
          "### ERROR: Attempting to "
              + mode
              + " "
              + queryResponse.getTotal()
              + " members for refset "
              + refsetConceptId
              + " has exceeded the COUNT threshold of "
              + countChangeThreshold
              + ".");
      fileAppender.appendToFile(
          "### This action HAS NOT been carried out.  You will need to investigate and fix the ECL, or override the count threshold check by setting the ignore-refset-count-change-threshold-error variable to true.");
      return null;
    } else {

      // user has chosen to proceed despite the error
      if ((queryResponse.getTotal() >= countChangeThreshold)) {
        log.info(
            "### ERROR: "
                + queryResponse.getTotal()
                + " has exceeded the COUNT threshold of "
                + countChangeThreshold
                + " for refset "
                + refsetConceptId
                + " while attempting to add or remove concepts");
        log.info(
            "### As you have chosen to IGNORE this warning, this action HAS been carried out.");
        fileAppender.appendToFile(
            "### ERROR: Attempting to "
                + mode
                + " "
                + queryResponse.getTotal()
                + " members for refset "
                + refsetConceptId
                + " has exceeded the COUNT threshold of "
                + countChangeThreshold
                + ".");
        fileAppender.appendToFile(
            "### As you have chosen to IGNORE this warning, this action HAS been carried out.");
      }
      AddOrRemoveQueryResponse allQueryResponse = AddOrRemoveQueryResponse.builder().items(queryResponse.getItems()).offset(queryResponse.getOffset()).limit(queryResponse.getLimit()).total(queryResponse.getTotal()).build();

      int threadCount = 0;

      ExecutorService executor = Executors.newFixedThreadPool(NUM_CONCURRENT_THREADS);

      int offset = allQueryResponse.getOffset();
      while (allQueryResponse.getTotal() > offset + allQueryResponse.getLimit()
          && (offset + allQueryResponse.getLimit() < MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE)) {

        // more pages of data to process .. start up multiple threads

        executor.execute(
            new AddRemoveQueryThread(
                restTemplate,
                baseQuery,
                allQueryResponse,
                threadCount++,
                offset,
                allQueryResponse.getLimit()));

        offset = offset + allQueryResponse.getLimit();
      }

      executor.shutdown();
      executor.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);

      return allQueryResponse;
    }
  }

  private void processCompoundExpressionConstraint(
      CompoundExpressionConstraint cec, RestTemplate restTemplate) throws Exception {
    List<SubExpressionConstraint> conjunctionList = cec.getConjunctionExpressionConstraints();
    List<SubExpressionConstraint> disjunctionList = cec.getDisjunctionExpressionConstraints();
    Pair<SubExpressionConstraint> exclusionList = cec.getExclusionExpressionConstraints();

    if (conjunctionList != null) {
      for (SubExpressionConstraint sec : conjunctionList) {
        this.processSubExpressionConstraint(sec, restTemplate);
      }
    }

    if (disjunctionList != null) {
      for (SubExpressionConstraint sec : disjunctionList) {
        this.processSubExpressionConstraint(sec, restTemplate);
      }
    }

    if (exclusionList != null) {
      SubExpressionConstraint firstSec = exclusionList.getFirst();
      this.processSubExpressionConstraint(firstSec, restTemplate);
      SubExpressionConstraint secondSec = exclusionList.getSecond();
      this.processSubExpressionConstraint(secondSec, restTemplate);
    }
  }

  private void processSubExpressionConstraint(
      SubExpressionConstraint sec, RestTemplate restTemplate) throws Exception {
    if (sec.getConceptId() != null) {
      if (sec.getOperator() != null
          && sec.getOperator().equals(Operator.memberOf)
          && this.refComponentIdToECLMap.containsKey(sec.getConceptId())) {
        conceptsToReplaceMap.put(sec.getConceptId(), null);
      }

    } else {
      ExpressionConstraint ec = sec.getNestedExpressionConstraint();
      if (ec instanceof CompoundExpressionConstraint cec) {
        this.processCompoundExpressionConstraint(cec, restTemplate);
      } else if (ec instanceof SubExpressionConstraint sec2) {
        this.processSubExpressionConstraint(sec2, restTemplate);
      } else if (ec instanceof DottedExpressionConstraint dec) {
        this.processDottedExpressionConstraint(dec, restTemplate);
      } else {
        throw new EclRefsetProcessingException("unprocessed ECL " + ec);
      }
    }
  }

  private void processDottedExpressionConstraint(
      DottedExpressionConstraint dec, RestTemplate restTemplate) throws Exception {
    this.processSubExpressionConstraint(dec.getSubExpressionConstraint(), restTemplate);
  }
}
