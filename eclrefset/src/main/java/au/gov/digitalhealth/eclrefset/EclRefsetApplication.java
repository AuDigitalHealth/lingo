/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.eclrefset;

import au.gov.digitalhealth.eclrefset.model.addorremovequeryresponse.AddOrRemoveQueryResponse;
import au.gov.digitalhealth.eclrefset.model.addorremovequeryresponse.AddRemoveItem;
import au.gov.digitalhealth.eclrefset.model.refsetqueryresponse.Data;
import au.gov.digitalhealth.eclrefset.model.refsetqueryresponse.Item;
import au.gov.digitalhealth.eclrefset.model.refsetqueryresponse.ReferencedComponent;
import au.gov.digitalhealth.tickets.ExternalProcessDto;
import au.gov.digitalhealth.tickets.JobResultDto;
import au.gov.digitalhealth.tickets.JobResultDto.ResultDto;
import au.gov.digitalhealth.tickets.JobResultDto.ResultDto.ResultItemDto;
import au.gov.digitalhealth.tickets.JobResultDto.ResultDto.ResultNotificationDto;
import au.gov.digitalhealth.tickets.JobResultDto.ResultDto.ResultNotificationDto.ResultNotificationType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.Cookie;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
import org.snomed.langauges.ecl.domain.expressionconstraint.RefinedExpressionConstraint;
import org.snomed.langauges.ecl.domain.expressionconstraint.SubExpressionConstraint;
import org.snomed.langauges.ecl.domain.refinement.EclAttribute;
import org.snomed.langauges.ecl.domain.refinement.EclAttributeGroup;
import org.snomed.langauges.ecl.domain.refinement.EclAttributeSet;
import org.snomed.langauges.ecl.domain.refinement.EclRefinement;
import org.snomed.langauges.ecl.domain.refinement.Operator;
import org.snomed.langauges.ecl.domain.refinement.SubAttributeSet;
import org.snomed.langauges.ecl.domain.refinement.SubRefinement;
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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.DefaultUriBuilderFactory;

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

  private JobResultDto jobResultDto;

  @Value("${performance-snowstorm-url}")
  private String perfSnowstormUrl;

  @Value("${main-snowstorm-url}")
  private String mainSnowstormUrl;

  @Value("${refset-percent-change-threshold}")
  private double percentChangeThreshold;

  @Value("${refset-count-change-threshold}")
  private int countChangeThreshold;

  @Value("${ignore-refset-count-change-threshold-error}")
  private boolean ignoreCountChangeThresholdError;

  @Value("${snodine.process.name}")
  private String processName;

  public static void main(String[] args) {
    log.info("STARTING: ECL REFSET PROCESS");
    SpringApplication.run(EclRefsetApplication.class, args);

    log.info("FINISHED: ECL REFSET PROCESS");
  }

  private void initializeJobResultDto() {
    jobResultDto = new JobResultDto();
    jobResultDto.setJobName("ECL Refset Job");

    // Generate encoded jobId based on current date/time
    LocalDateTime now = LocalDateTime.now();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    String encodedJobId = now.format(formatter);
    jobResultDto.setJobId(encodedJobId);

    jobResultDto.setResults(new ArrayList<>());
  }

  private ExternalProcessDto getExternalProcessByName(LingoService lingoService, Cookie cookie, String processName) {

    List<ExternalProcessDto> externalProcessDto = lingoService.getExternalProcesses(cookie);

    return externalProcessDto.stream().filter(process -> {
      return process.getProcessName().equals(processName);
    }).findFirst().orElse(null);

  }

  @Bean
  public RestTemplate restTemplate(RestTemplateBuilder builder) {

    // Create a DefaultUriBuilderFactory with no encoding as it doesn't handle the encoding
    // of {{}} (descriptions filters) .. we will do our own encoding elsewhere
    DefaultUriBuilderFactory uriBuilderFactory = new DefaultUriBuilderFactory();
    uriBuilderFactory.setEncodingMode(DefaultUriBuilderFactory.EncodingMode.NONE);

    // Build the RestTemplate with the custom UriBuilderFactory
    RestTemplate restTemplate = builder.uriTemplateHandler(uriBuilderFactory).build();

    return restTemplate;
  }

  @Bean
  public CommandLineRunner commandLineRunner(ApplicationContext ctx, RestTemplate restTemplate) {
    return args -> {
      FileAppender fileAppender = new FileAppender("threshold.txt");
      LingoService lingoService = ctx.getBean(LingoService.class);
      initializeJobResultDto();

      ImsService imsService = ctx.getBean(ImsService.class);
      Cookie cookie = imsService.getDefaultCookie();

      ExternalProcessDto externalProcessDto = getExternalProcessByName(lingoService, cookie, processName);

      if(externalProcessDto == null){
        log.severe("No Corresponding process name found in lingo");
        return;
      }

      if(!externalProcessDto.isEnabled()){
        log.severe("Corresponding process name found in lingo, but snodine has intentionally been disabled");
        return;
      }

      log.severe("Corresponding process name found in lingo, and Snodine has been enabled.");

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
            this.processCompoundExpressionConstraint(
                compoundExpressionConstraint, restTemplate, item.getReferencedComponent().getId());
          } else if (ec instanceof SubExpressionConstraint subExpressionConstraint) {
            this.processSubExpressionConstraint(
                subExpressionConstraint, restTemplate, item.getReferencedComponent().getId());
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
          log.info(
              "ERROR: Unexpected volume of processing while expanding transitive ECL.  This is usually due to a circular dependency.");
          log.info(
              "       Ids with a NULL value in the following map could be the starting point for investigation.");
          log.info("       " + this.conceptsToReplaceMap);
          throw new EclRefsetProcessingException(
              "Unexpected volume of processing while expanding transitive ECL.  This is usually due to a circular dependency. Ids with a NULL value in the following map could be the starting point for investigation. "
                  + this.conceptsToReplaceMap);
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

              // tick refset and self references do not get expanded
              boolean allRefSetsDontGetExpanded = true;
              while (matcher.find()) {

                String conceptId = matcher.group(1);

                // anything in refComponentIdToECLMap is an ECL refset and should be expanded
                // except if it is a self reference
                if ((!this.refComponentIdToECLMap.containsKey(conceptId))
                    || (!conceptId.equals(concept))) {
                  allRefSetsDontGetExpanded = false;
                  break;
                }
              }
              if (allRefSetsDontGetExpanded) {
                this.conceptsToReplaceMap.put(concept, this.refComponentIdToECLMap.get(concept));
              } else {
                // need to expand ecl refsets
                String expandedEcl = this.expandEcl(concept);
                this.conceptsToReplaceMap.put(concept, expandedEcl);
              }
            }
          }
        }
      }

      // expand ecl

      for (Map.Entry<String, String> entry : this.refComponentIdToECLMap.entrySet()) {
        String concept = entry.getKey();
        String expandedEcl = this.expandEcl(concept);
        this.refComponentIdToECLMap.put(concept, expandedEcl);
      }

      // Third pass, add/remove as required and log
      for (Item item : refsetQueryResponse.getItems()) {

        // set up a ResultDto for this ecl query, including it's additions + deletions that will be
        // added to as calculated
        ResultDto resultDto =
            ResultDto.builder()
                .name(
                    item.getReferencedComponent().getId()
                        + " | "
                        + item.getReferencedComponent().getPt().getTerm())
                .build();
        ResultDto addResult = ResultDto.builder().name("Added Concepts").build();
        ResultDto removeResult = ResultDto.builder().name("Removed Concepts").build();
        List<ResultDto> results = new ArrayList<>();
        results.add(addResult);
        results.add(removeResult);
        resultDto.setResults(results);
        jobResultDto.getResults().add(resultDto);

        boolean countThresholdExceeded = false;

        String ecl = "(" + refComponentIdToECLMap.get(item.getReferencedComponent().getId()) + ")";

        // Unfortunately the SI ECL parser does not round trip. If I could have altered
        // and then generated the ECL string this would have been my ideal situation.
        // But given that it is a simple concept id <--> ECL replacment, I think
        // processing the ECL as a string is simpler than implementing full round
        // tripping.

        // check what changes are necessary to update the distributed refsets
        // we also encode here as refsetTemplate does not handle {{}} (description filters)
        // and replace + encoding of spaces with %20 as URLEncoder encodes to +
        String addEcl =
            "(" + ecl + ") MINUS (^ " + item.getReferencedComponent().getConceptId() + ")";
        addEcl = URLEncoder.encode(addEcl, StandardCharsets.UTF_8.name());
        addEcl = addEcl.replace("+", "%20");
        String removeEcl =
            "(^ " + item.getReferencedComponent().getConceptId() + ") MINUS (" + ecl + ")";
        removeEcl = URLEncoder.encode(removeEcl, StandardCharsets.UTF_8.name());
        removeEcl = removeEcl.replace("+", "%20");

        String baseAddQuery =
            perfSnowstormUrl
                + BRANCH
                + "/concepts?ecl="
                + addEcl
                + "&activeFilter=true&includeLeafFlag=false&form=inferred";
        String baseRemoveQuery =
            perfSnowstormUrl
                + BRANCH
                + "/concepts?ecl="
                + removeEcl
                + "&activeFilter=true&includeLeafFlag=false&form=inferred";

        String removeInactiveConceptQuery = mainSnowstormUrl
            + BRANCH
            + "/concepts?ecl="
            // equates to "^ "
            + "%5E%20"
            + item.getReferencedComponent().getId()
            // equates to " {{C active = 0}}"
            + "%20%7B%7BC%20active%20%3D%200%7D%7D"
            + "&includeLeafFlag=false&form=inferred";

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
                item.getReferencedComponent().getConceptId(),
                addResult);

        String refsetMemberCountQuery =
            perfSnowstormUrl
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
              fileAppender,
              addResult);

          addResult.setCount(allAddQueryResponse.getTotal());

          List<ResultItemDto> addResultItems =
              allAddQueryResponse.getItems().stream()
                  .map(
                      (addRemoveItem ->
                          ResultItemDto.builder()
                              .id(addRemoveItem.getId())
                              .title(addRemoveItem.getFsn().getTerm())
                              .build()))
                  .toList();

          addResult.setItems(addResultItems);

          logAndAddRefsetMembersToBulk(allAddQueryResponse, item, restTemplate, bulkChangeList);

          this.doBulkUpdate(restTemplate, bulkChangeList, resultDto, item);
          bulkChangeList.clear();

          // process remaining pages
          while (allAddQueryResponse.getOffset() + allAddQueryResponse.getLimit()
              >= MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE) {
            allAddQueryResponse =
                getAddQueryResponse(
                    restTemplate,
                    baseAddQuery,
                    fileAppender,
                    item.getReferencedComponent().getConceptId(),
                    addResult);
            logAndAddRefsetMembersToBulk(allAddQueryResponse, item, restTemplate, bulkChangeList);

            addResultItems =
                allAddQueryResponse.getItems().stream()
                    .map(
                        (addRemoveItem ->
                            ResultItemDto.builder()
                                .id(addRemoveItem.getId())
                                .title(addRemoveItem.getFsn().getTerm())
                                .build()))
                    .toList();

            addResult.getItems().addAll(addResultItems);

            this.doBulkUpdate(restTemplate, bulkChangeList, resultDto, item);
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
                  item.getReferencedComponent().getConceptId(),
                  removeResult);

          AddOrRemoveQueryResponse allInactiveQueryResponse =
              getRemoveQueryResponse(
                  restTemplate,
                  removeInactiveConceptQuery,
                  fileAppender,
                  item.getReferencedComponent().getConceptId(),
                  removeResult);

          int totalToRemove = 0;
          totalToRemove += allRemoveQueryResponse != null ? allRemoveQueryResponse.getTotal()  : 0;
          totalToRemove += allInactiveQueryResponse != null ? allInactiveQueryResponse.getTotal()  : 0;
          removeResult.setCount(totalToRemove);

          removeResult.setItems(new ArrayList<>());

          LogThresholdInfo.logRemove(
              item.getReferencedComponent().getConceptId(),
              totalToRemove,
              totalCount,
              percentChangeThreshold,
              fileAppender,
              resultDto);

          if(allRemoveQueryResponse != null){
            processRefsetRemovals(allRemoveQueryResponse, restTemplate, baseRemoveQuery, bulkChangeList, fileAppender, item, removeResult);
          }

          if(allInactiveQueryResponse != null){
            processRefsetRemovals(allInactiveQueryResponse, restTemplate, removeInactiveConceptQuery, bulkChangeList, fileAppender, item, removeResult);
          }

          log.info(LOG_SEPARATOR_LINE);
          log.info("###");

          resultDto.setCount(removeResult.getCount() + addResult.getCount());
        }
      }

      log.info(LOG_SEPARATOR_LINE);
      jobResultDto.setFinishedTime(Instant.now());
      jobResultDto.setAcknowledged(false);
      lingoService.postJobResult(jobResultDto, cookie);
    };
  }

  private String expandEcl(String concept) {
    String ecl = this.refComponentIdToECLMap.get(concept);

    Pattern pattern = Pattern.compile("\\^\\s?(\\d{6,})(?:\\s?\\|\\s?([\\w\\s\\-.]+)\\|)?");
    Matcher matcher = pattern.matcher(ecl);
    StringBuilder expandedEcl = new StringBuilder(ecl);
    int offset = 0; // To adjust the positions after replacements

    while (matcher.find()) {
      String conceptId = matcher.group(1);
      String replacement = this.conceptsToReplaceMap.get(conceptId);

      if (replacement != null && !conceptId.equals(concept)) {
        int start = matcher.start() + offset; // Adjust start position
        int end = matcher.end() + offset; // Adjust end position

        // Concatenate the prefix, replacement string, and suffix
        expandedEcl.replace(start, end, "(" + replacement + ")");

        // Update the offset based on the change in length
        offset += ("(" + replacement + ")").length() - (end - start);
      }
    }

    return expandedEcl.toString();
  }

  private void logAndAddRefsetMembersToBulk(
      AddOrRemoveQueryResponse allAddQueryResponse,
      Item item,
      RestTemplate restTemplate,
      List<JSONObject> bulkChangeList)
      throws InterruptedException {

    int threadCount = 0;

    ExecutorService executor = Executors.newFixedThreadPool(NUM_CONCURRENT_THREADS);

    for (AddRemoveItem i : allAddQueryResponse.getItems()) {
      executor.execute(
          new AddRefsetMemberThread(
              restTemplate, bulkChangeList, threadCount++, i, item, perfSnowstormUrl));
    }

    executor.shutdown();
    executor.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);
  }

  private void processRefsetRemovals(AddOrRemoveQueryResponse queryResponse, RestTemplate restTemplate, String removeQuery,
      List<JSONObject> bulkChangeList, FileAppender fileAppender, Item item, ResultDto removeResult) throws InterruptedException, Exception{

    List<ResultItemDto> removeResultItems =
        queryResponse.getItems().stream()
            .map(
                (addRemoveItem ->
                    ResultItemDto.builder()
                        .id(addRemoveItem.getId())
                        .title(addRemoveItem.getFsn().getTerm())
                        .build()))
            .toList();

    removeResult.getItems().addAll(removeResultItems);

    logAndRemoveRefsetMembersToBulk(
        queryResponse, item, restTemplate, bulkChangeList);

    this.doBulkUpdate(restTemplate, bulkChangeList, removeResult, item);
    bulkChangeList.clear();

    // process remaining pages
    while (queryResponse.getOffset() + queryResponse.getLimit()
        >= MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE) {
      queryResponse =
          getRemoveQueryResponse(
              restTemplate,
              removeQuery,
              fileAppender,
              item.getReferencedComponent().getConceptId(),
              removeResult);

      logAndRemoveRefsetMembersToBulk(
          queryResponse, item, restTemplate, bulkChangeList);

      removeResultItems =
          queryResponse.getItems().stream()
              .map(
                  (addRemoveItem ->
                      ResultItemDto.builder()
                          .id(addRemoveItem.getId())
                          .title(addRemoveItem.getFsn().getTerm())
                          .build()))
              .toList();

      removeResult.getItems().addAll(removeResultItems);

      this.doBulkUpdate(restTemplate, bulkChangeList, removeResult, item);
      bulkChangeList.clear();
    }
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
              restTemplate, bulkChangeList, threadCount++, i, item, perfSnowstormUrl));
    }

    executor.shutdown();
    executor.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);
  }

  private void doBulkUpdate(RestTemplate restTemplate, List<JSONObject> bulkChangeList,
      ResultDto resultDto, Item item)
      {
    if (!bulkChangeList.isEmpty()) {
      // bulk update
      HttpHeaders headers = new HttpHeaders();
      headers.setAccept(Collections.singletonList(MediaType.ALL));
      headers.setContentType(MediaType.APPLICATION_JSON);
      String requestBody = bulkChangeList.toString();
      HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
      String bulkQuery = perfSnowstormUrl + BRANCH + "/members/bulk";
      try{
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

          String bulkStatusQuery = perfSnowstormUrl + BRANCH + "/members/bulk/" + bulkChangeId;
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
      } catch (Exception e){
        ResultNotificationDto resultNotificationDto = ResultNotificationDto.builder()
            .type(ResultNotificationType.ERROR)
            .description(
                "Error posting update to refset: "
                    + item.getRefsetId()
                    + LogThresholdInfo.ACTION_HAS_NOT_BEEN_CARRIED_OUT_MESSAGE)
            .build();
        resultDto.setNotification(resultNotificationDto);
      }

    }
  }

  private Data getReferenceSetQueryResponse(RestTemplate restTemplate) {
    String baseQuery = perfSnowstormUrl + BRANCH + "/members?referenceSet=" + ECL_REFSET_ID;
    String query = baseQuery + "&offset=0";
    Data allResponse = getAllResponse(restTemplate, query);

    while (allResponse.getTotal() > allResponse.getOffset() + allResponse.getLimit()) {
      // more pages of data to process
      query = baseQuery + "&offset=" + (allResponse.getOffset() + allResponse.getLimit());
      Data nextPage = getAllResponse(restTemplate, query);
      allResponse.getItems().addAll(nextPage.getItems());
      allResponse.setOffset(nextPage.getOffset());
    }
    return allResponse;
  }

  private Data getAllResponse(RestTemplate restTemplate, String query) {

    Data response = restTemplate.getForObject(query, Data.class);
    assert response != null;
    return Data.builder()
        .items(response.getItems())
        .offset(response.getOffset())
        .limit(response.getLimit())
        .total(response.getTotal())
        .build();
  }

  // null return value indicates count threshold exceeded
  private AddOrRemoveQueryResponse getAddQueryResponse(
      RestTemplate restTemplate,
      String baseQuery,
      FileAppender fileAppender,
      String refsetConceptId,
      ResultDto resultDto)
      throws InterruptedException {
    return this.getAddOrRemoveQueryResponse(
        restTemplate, baseQuery, fileAppender, refsetConceptId, "add", resultDto);
  }

  // null return value indicates count threshold exceeded
  private AddOrRemoveQueryResponse getRemoveQueryResponse(
      RestTemplate restTemplate,
      String baseQuery,
      FileAppender fileAppender,
      String refsetConceptId,
      ResultDto resultDto)
      throws InterruptedException {
    return this.getAddOrRemoveQueryResponse(
        restTemplate, baseQuery, fileAppender, refsetConceptId, "remove", resultDto);
  }

  // null return value indicates count threshold exceeded
  private AddOrRemoveQueryResponse getAddOrRemoveQueryResponse(
      RestTemplate restTemplate,
      String baseQuery,
      FileAppender fileAppender,
      String refsetConceptId,
      String mode,
      ResultDto resultDto)
      throws InterruptedException {

    String query = baseQuery + "&offset=0";

    long startTime = System.nanoTime();

    try {
      AddOrRemoveQueryResponse queryResponse =
          restTemplate.getForObject(query, AddOrRemoveQueryResponse.class);

      long endTime = System.nanoTime();
      long elapsedTime = endTime - startTime;
      double elapsedTimeInSeconds = elapsedTime / 1_000_000_000.0;

      log.info("Query took " + elapsedTimeInSeconds + " seconds.");

      assert queryResponse != null;
      if ((queryResponse.getTotal() >= countChangeThreshold) && (!ignoreCountChangeThresholdError)) {
        resultDto.setCount(0);
        String countThresholdMessage =
            String.format(
                LogThresholdInfo.COUNT_THRESHOLD_MESSAGE,
                queryResponse.getTotal(),
                countChangeThreshold,
                refsetConceptId,
                mode);
        resultDto.setNotification(
            ResultNotificationDto.builder()
                .type(ResultNotificationType.ERROR)
                .description(
                    countThresholdMessage
                        + ". "
                        + LogThresholdInfo.ACTION_HAS_NOT_BEEN_CARRIED_OUT_MESSAGE)
                .build());
        log.info(countThresholdMessage);

        log.info("###" + LogThresholdInfo.ACTION_HAS_NOT_BEEN_CARRIED_OUT_MESSAGE);
        List<AddRemoveItem> addRemoveItems = queryResponse.getItems();
        for (AddRemoveItem item : addRemoveItems) {
          String idAndFsn = item.getIdAndFsnTerm();
          boolean status = item.isActive();
          log.info(
              "### Wanted to " + mode + " referencedComponentId " + idAndFsn + " (" + status + ")");
        }
        fileAppender.appendToFile(countThresholdMessage);
        fileAppender.appendToFile("###" + LogThresholdInfo.ACTION_HAS_NOT_BEEN_CARRIED_OUT_MESSAGE);
        return null;
      } else {

        // user has chosen to proceed despite the error
        if ((queryResponse.getTotal() >= countChangeThreshold)) {
          String countThresholdMessage =
              String.format(
                  LogThresholdInfo.COUNT_THRESHOLD_MESSAGE,
                  queryResponse.getTotal(),
                  countChangeThreshold,
                  refsetConceptId,
                  mode);
          log.info(countThresholdMessage);
          log.info("###" + LogThresholdInfo.ACTION_HAS_BEEN_CARRIED_OUT_MESSAGE);
          resultDto.setNotification(
              ResultNotificationDto.builder()
                  .type(ResultNotificationType.WARNING)
                  .description(
                      countThresholdMessage
                          + ". "
                          + LogThresholdInfo.ACTION_HAS_BEEN_CARRIED_OUT_MESSAGE)
                  .build());
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
        AddOrRemoveQueryResponse allQueryResponse =
            AddOrRemoveQueryResponse.builder()
                .items(queryResponse.getItems())
                .offset(queryResponse.getOffset())
                .limit(queryResponse.getLimit())
                .total(queryResponse.getTotal())
                .build();

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
    } catch (HttpClientErrorException e) {
      String errorMessage = e.getMessage();
      log.info(String.format("Error during REST call: {%s}", errorMessage));
      resultDto.setNotification(
          ResultNotificationDto.builder()
              .type(ResultNotificationType.ERROR)
              .description("REST call failed: " + errorMessage)
              .build());
      resultDto.setNotification(
          ResultNotificationDto.builder()
              .type(ResultNotificationType.ERROR)
              .description(
                  errorMessage
                      + ". "
                      + LogThresholdInfo.ACTION_HAS_NOT_BEEN_CARRIED_OUT_MESSAGE)
              .build());
      fileAppender.appendToFile("### ERROR: REST call failed: " + errorMessage);
      return null;
    }

  }

  private void processCompoundExpressionConstraint(
      CompoundExpressionConstraint cec, RestTemplate restTemplate, String refComponentId)
      throws Exception {
    List<SubExpressionConstraint> conjunctionList = cec.getConjunctionExpressionConstraints();
    List<SubExpressionConstraint> disjunctionList = cec.getDisjunctionExpressionConstraints();
    Pair<SubExpressionConstraint> exclusionList = cec.getExclusionExpressionConstraints();

    if (conjunctionList != null) {
      for (SubExpressionConstraint sec : conjunctionList) {
        this.processSubExpressionConstraint(sec, restTemplate, refComponentId);
      }
    }

    if (disjunctionList != null) {
      for (SubExpressionConstraint sec : disjunctionList) {
        this.processSubExpressionConstraint(sec, restTemplate, refComponentId);
      }
    }

    if (exclusionList != null) {
      SubExpressionConstraint firstSec = exclusionList.getFirst();
      this.processSubExpressionConstraint(firstSec, restTemplate, refComponentId);
      SubExpressionConstraint secondSec = exclusionList.getSecond();
      this.processSubExpressionConstraint(secondSec, restTemplate, refComponentId);
    }
  }

  private void processSubExpressionConstraint(
      SubExpressionConstraint sec, RestTemplate restTemplate, String refComponentId)
      throws Exception {
    if (sec.getConceptId() != null) {
      if (sec.getOperator() != null
          && sec.getOperator().equals(Operator.memberOf)
          && this.refComponentIdToECLMap.containsKey(sec.getConceptId())
          && (!sec.getConceptId().equals(refComponentId))) {
        conceptsToReplaceMap.put(sec.getConceptId(), null);
      }

    } else {
      ExpressionConstraint ec = sec.getNestedExpressionConstraint();
      if (null != ec) {
        if (ec instanceof CompoundExpressionConstraint cec) {
          this.processCompoundExpressionConstraint(cec, restTemplate, refComponentId);
        } else if (ec instanceof SubExpressionConstraint sec2) {
          this.processSubExpressionConstraint(sec2, restTemplate, refComponentId);
        } else if (ec instanceof DottedExpressionConstraint dec) {
          this.processDottedExpressionConstraint(dec, restTemplate, refComponentId);
        } else if (ec instanceof RefinedExpressionConstraint rec) {
          this.processRefinedExpressionConstraint(rec, restTemplate, refComponentId);
        } else {
          log.info("The class of ec is: " + ec.getClass().getName());
          throw new EclRefsetProcessingException("unprocessed ECL " + ec);
        }
      }
    }
  }

  private void processDottedExpressionConstraint(
      DottedExpressionConstraint dec, RestTemplate restTemplate, String refComponentId)
      throws Exception {
    this.processSubExpressionConstraint(
        dec.getSubExpressionConstraint(), restTemplate, refComponentId);
  }

  private void processEclAttribute(
      EclAttribute ea, RestTemplate restTemplate, String refComponentId) throws Exception {
    SubExpressionConstraint sec = ea.getAttributeName();
    this.processSubExpressionConstraint(sec, restTemplate, refComponentId);

    // subExpressionConstraint belonging to expressionComparisonOperator
    SubExpressionConstraint ecsec = ea.getValue();
    if (null != ecsec) {
      this.processSubExpressionConstraint(ecsec, restTemplate, refComponentId);
    }
  }

  private void processSubAttributeSet(
      SubAttributeSet sas, RestTemplate restTemplate, String refComponentId) throws Exception {

    EclAttribute ea = sas.getAttribute();
    EclAttributeSet eas = sas.getAttributeSet();

    if (null != ea) {
      this.processEclAttribute(ea, restTemplate, refComponentId);
    } else if (null != eas) {
      this.processEclAttributeSet(eas, restTemplate, refComponentId);
    } else {
      throw new EclRefsetProcessingException("processSubAttributeSet did not find expected types");
    }
  }

  private void processEclAttributeSet(
      EclAttributeSet eas, RestTemplate restTemplate, String refComponentId) throws Exception {
    SubAttributeSet sas = eas.getSubAttributeSet();
    this.processSubAttributeSet(sas, restTemplate, refComponentId);

    List<SubAttributeSet> cas = eas.getConjunctionAttributeSet();
    List<SubAttributeSet> das = eas.getDisjunctionAttributeSet();
    if (null != cas && !cas.isEmpty()) {
      for (SubAttributeSet sas1 : cas) {
        this.processSubAttributeSet(sas1, restTemplate, refComponentId);
      }
    } else if (null != das && !das.isEmpty()) {
      for (SubAttributeSet sas1 : das) {
        this.processSubAttributeSet(sas1, restTemplate, refComponentId);
      }
    }
  }

  private void processEclAttributeGroup(
      EclAttributeGroup eag, RestTemplate restTemplate, String refComponentId) throws Exception {
    EclAttributeSet eas = eag.getAttributeSet();
    this.processEclAttributeSet(eas, restTemplate, refComponentId);
  }

  private void processSubRefinement(
      SubRefinement sr, RestTemplate restTemplate, String refComponentId) throws Exception {

    EclAttributeSet eas = sr.getEclAttributeSet();
    EclAttributeGroup eag = sr.getEclAttributeGroup();
    EclRefinement er = sr.getEclRefinement();

    if (null != eas) {
      this.processEclAttributeSet(eas, restTemplate, refComponentId);
    } else if (null != eag) {
      this.processEclAttributeGroup(eag, restTemplate, refComponentId);
    } else if (null != er) {
      this.processEclRefinement(er, restTemplate, refComponentId);
    } else {
      throw new EclRefsetProcessingException("processSubRefinement did not find expected types");
    }
  }

  private void processEclRefinement(
      EclRefinement er, RestTemplate restTemplate, String refComponentId) throws Exception {
    SubRefinement sr = er.getSubRefinement();
    this.processSubRefinement(sr, restTemplate, refComponentId);

    List<SubRefinement> conjSubRefinements = er.getConjunctionSubRefinements();
    List<SubRefinement> disjSubRefinements = er.getDisjunctionSubRefinements();
    if (null != conjSubRefinements && !conjSubRefinements.isEmpty()) {
      for (SubRefinement csr : conjSubRefinements) {
        this.processSubRefinement(csr, restTemplate, refComponentId);
      }
    } else if (null != disjSubRefinements && !disjSubRefinements.isEmpty()) {
      for (SubRefinement dsr : disjSubRefinements) {
        this.processSubRefinement(dsr, restTemplate, refComponentId);
      }
    }
  }

  private void processRefinedExpressionConstraint(
      RefinedExpressionConstraint rec, RestTemplate restTemplate, String refComponentId)
      throws Exception {

    SubExpressionConstraint sec = rec.getSubexpressionConstraint();
    this.processSubExpressionConstraint(sec, restTemplate, refComponentId);
    EclRefinement er = rec.getEclRefinement();
    this.processEclRefinement(er, restTemplate, refComponentId);
  }
}
