package com.csiro.eclrefset;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONObject;
import org.snomed.langauges.ecl.ECLException;
import org.snomed.langauges.ecl.ECLObjectFactory;
import org.snomed.langauges.ecl.ECLQueryBuilder;
import org.snomed.langauges.ecl.domain.Pair;
import org.snomed.langauges.ecl.domain.expressionconstraint.CompoundExpressionConstraint;
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

import com.csiro.eclrefset.model.addorremovequeryresponse.AddOrRemoveQueryResponse;
import com.csiro.eclrefset.model.addorremovequeryresponse.AddRemoveItem;
import com.csiro.eclrefset.model.refsetqueryresponse.Data;
import com.csiro.eclrefset.model.refsetqueryresponse.Item;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.restassured.http.Cookie;
import lombok.extern.java.Log;

@SpringBootApplication
@Log
public class EclRefsetApplication {

	private static final String ECL_REFSET_ID = "900000000000513000";
	private static final String BRANCH = "MAIN%7CSNOMEDCT-AU";
	private static final int MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE = 10000; // snowstorm limitation

	@Value("${snowstorm-url}")
	private String SNOWSTORM_URL; // = "https://dev-au-authoring.ihtsdotools.org/snowstorm/snomed-ct/";
	@Value("${refset-percent-change-threshold}")
	private double PERCENT_CHANGE_THRESHOLD;

	private Map<String, String> conceptsToReplaceMap = new HashMap<String, String>();
	private Map<String, String> refComponentIdToECLMap = new HashMap<String, String>();

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

			// TODO: use webclient?

			ImsService imsService = ctx.getBean(ImsService.class);
			Cookie cookie = imsService.getDefaultCookie();
			restTemplate.setInterceptors(
					Collections.singletonList(new AuthInterceptor(cookie.getName(), cookie.getValue())));

			Data refsetQueryResponse = getReferenceSetQueryResponse(restTemplate);
			// log.info("refsetQueryResponse" + refsetQueryResponse);
			List<JSONObject> bulkChangeList = new ArrayList<JSONObject>();

			// First pass, collect all the ecl refset concept ids for later user
			for (Item item : refsetQueryResponse.getItems()) {
				String ecl = "(" + item.getAdditionalFields().getQuery() + ")";
				log.info("ecl" + ecl);
				refComponentIdToECLMap.put(item.getReferencedComponent().getId(), ecl);
			}
			// refComponentIdToECLMap.put("32570131000036100", "(<< 260787004 | Physical
			// object |) MINUS (874799005|Microbial cryotube|)" );
			log.info("refComponentIdToECLMap:" + refComponentIdToECLMap);

			// Second pass, make sure the supplied ECL is valid and collect the reference
			// sets that need to be expanded
			for (Item item : refsetQueryResponse.getItems()) {

				// TODO: remove
				if (item.getReferencedComponent().getId().equals("6021000036108")
						|| item.getReferencedComponent().getId().equals("32570081000036100")
						|| item.getReferencedComponent().getId().equals("1183941000168107")) {
					continue;
				}
				// if (!item.getReferencedComponent().getId().equals("1164231000168107")
				// && !item.getReferencedComponent().getId().equals("32570131000036100")) {
				// continue;
				// }
				// if (item.getReferencedComponent().getId().equals("6021000036108")) {
				// continue;
				// }
				// String ecl = "(" + item.getAdditionalFields().getQuery() + ")";
				// log.info("ecl" + ecl);
				// refComponentIdToECLMap.put(item.getReferencedComponent().getId(), ecl);
				String ecl = this.refComponentIdToECLMap.get(item.getReferencedComponent().getId());
				ECLQueryBuilder eclQueryBuilder = new ECLQueryBuilder(new ECLObjectFactory());
				try {
					// Use the parser to ensure that the ECL we have received is correct
					ExpressionConstraint ec = eclQueryBuilder.createQuery(ecl);
					// log.info(ec.toString());

					if (ec instanceof CompoundExpressionConstraint) {
						this.processCompoundExpressionConstraint((CompoundExpressionConstraint) ec, restTemplate);
					} else if (ec instanceof SubExpressionConstraint) {
						this.processSubExpressionConstraint((SubExpressionConstraint) ec, restTemplate);
					} else {
						// TODO: does dotted need to be supported
						throw new Exception("unexpected ECL expression, code not coping");
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
					throw new Exception("unexpected volume of processing " + this.conceptsToReplaceMap);
				}
				for (Map.Entry<String, String> entry : this.conceptsToReplaceMap.entrySet()) {
					if (entry.getValue() == null) {
						String concept = entry.getKey();
						if (!this.refComponentIdToECLMap.containsKey(concept)) {
							throw new Exception("unexpected event: unable to find replacement ECL for " + concept);
						}
						// if (!this.refComponentIdToECLMap.get(concept).contains("^") ||
						// (this.refComponentIdToECLMap.get(concept).contains("^") &&
						// this.refComponentIdToECLMap))

						String ecl = this.refComponentIdToECLMap.get(concept);
						log.info("porcessing for replacement" + ecl);

						if (!ecl.contains("^")) {
							this.conceptsToReplaceMap.put(concept, this.refComponentIdToECLMap.get(concept));
						} else if (ecl.contains("^")) {
							// TODO: check if ^ is a pick list and if so accept

							Pattern pattern = Pattern.compile("\\^\\s?(\\d{6,})(?:\\s?\\|\\s?([\\w\\s\\-_.]+)\\|)?");
							Matcher matcher = pattern.matcher(ecl);

							boolean allRefSetsPickLists = true;
							while (matcher.find()) {
								int start = matcher.start();
								int end = matcher.end();

								String conceptId = matcher.group(1);
								String term = "?";
								try {
									term = matcher.group(2); // This will capture the term part if present
								} catch (IndexOutOfBoundsException ioe) {

								}
								System.out.println("Concept ID1: " + conceptId + ", Start: " + start + ", End: " + end);
								if (term != null) {
									System.out.println("Term1: " + term + ", Start: " + start + ", End: " + end);
								}

								if (this.refComponentIdToECLMap.containsKey(conceptId)) {
									allRefSetsPickLists = false;
									break;
								}

							}
							if (allRefSetsPickLists) {
								this.conceptsToReplaceMap.put(concept, this.refComponentIdToECLMap.get(concept));
							}
						}
					}

				}
			}

			// refComponentIdToECLMap.put("1164231000168107", "<< 260787004 | Physical
			// object | AND << 706046003|Specimen receptacle| AND << 874799005|Microbial
			// cryotube|");

			log.info("before this.refComponentIdToECLMap" + this.refComponentIdToECLMap.toString());
			// log.info("BEFORE conceptsToReplaceMap:" + conceptsToReplaceMap.toString());

			// expand ecl

			for (Map.Entry<String, String> entry : this.refComponentIdToECLMap.entrySet()) {
				String concept = entry.getKey();
				String ecl = this.refComponentIdToECLMap.get(concept);
				log.info("ecl" + ecl);
				if (ecl.contains("^")) {
					log.info("contains ^");
					Pattern pattern = Pattern.compile("\\^\\s?(\\d{6,})(?:\\s?\\|\\s?([\\w\\s\\-_.]+)\\|)?");
					Matcher matcher = pattern.matcher(ecl);

					while (matcher.find()) {
						int start = matcher.start();
						int end = matcher.end();

						String conceptId = matcher.group(1);
						String term = "?";
						try {
							term = matcher.group(2); // This will capture the term part if present
						} catch (IndexOutOfBoundsException ioe) {

						}
						System.out.println("Concept ID: " + conceptId + ", Start: " + start + ", End: " + end);
						if (term != null) {
							System.out.println("Term: " + term + ", Start: " + start + ", End: " + end);
						}

						log.info("EXTRACT:" + ecl.substring(start, end));
						String replacement = this.conceptsToReplaceMap.get(conceptId);
						log.info("replacement" + replacement);
						if (replacement != null) {
							// Get the substring before the characters to replace
							String prefix = ecl.substring(0, start);

							// Get the substring after the characters to replace
							String suffix = ecl.substring(end);

							// Concatenate the prefix, replacement string, and suffix
							ecl = prefix + "(" + replacement + ")" + suffix;
							log.info("new ecl");

							this.refComponentIdToECLMap.put(concept, ecl);
						} else {
							// TODO: .. what check should I have here
							// throw new Exception("unable to replace reference set:" + ecl.substring(start,
							// end));
						}

					}
				}

			}
			log.info("AFTER refComponentIdToECLMap:" + refComponentIdToECLMap.toString());

			// Third pass, add/remove as required and log
			for (Item item : refsetQueryResponse.getItems()) {

				// TODO: remove
				if (item.getReferencedComponent().getId().equals("6021000036108")
						|| item.getReferencedComponent().getId().equals("32570081000036100")
						|| item.getReferencedComponent().getId().equals("1183941000168107")) {
					continue;
				}
				// has an inactive concept 32570081000036100
				// has an inactive concept 1183941000168107
				// is a brand new one with lots of concepts to add 6021000036108
				// if (item.getReferencedComponent().getId().equals("6021000036108")) {
				// continue;
				// }

				String ecl = "(" + refComponentIdToECLMap.get(item.getReferencedComponent().getId()) + ")";

				// Unfortunately the SI ECL parser does not round trip. If I could have altered
				// and then
				// generated the ECL string this would have been my ideal situation. But given
				// that
				// it is a simple concept id <--> ECL replacment, I think processing the ECL as
				// a string
				// is simpler than implementing full round tripping. Then the parser can once
				// again be used
				// to verify the replacment.

				// check what changes are necessary to update the distributed refsets
				String addEcl = "(" + ecl + ") MINUS (^ " + item.getReferencedComponent().getConceptId() + ")";
				String removeEcl = "(^ " + item.getReferencedComponent().getConceptId() + ") MINUS (" + ecl + ")";

				// log.info("addEcl:" + addEcl);
				String baseAddQuery = SNOWSTORM_URL + BRANCH + "/concepts?ecl=" + addEcl
						+ "&activeFilter=true&includeLeafFlag=false&form=inferred";
				// log.info("request:" + addQuery);
				String baseRemoveQuery = SNOWSTORM_URL + BRANCH + "/concepts?ecl=" + removeEcl
						+ "&activeFilter=true&includeLeafFlag=false&form=inferred";

				log.info("### Processing refsetId: "  + item.getReferencedComponent().getConceptId());
				log.info("### ECL:" + ecl);
				log.info("### Processing for additions");
				log.info("### ---------------------------------------------------------");

				AddOrRemoveQueryResponse allAddQueryResponse = getAddOrRemoveQueryResponse(restTemplate, baseAddQuery);

				String refsetMemberCountQuery = SNOWSTORM_URL + BRANCH + "/members?referenceSet="
						+ item.getReferencedComponent().getConceptId() + "&active=true&offset=0&limit=1";
				Data refsetMemberCountResponse = restTemplate.getForObject(refsetMemberCountQuery, Data.class);
				Integer totalCount = refsetMemberCountResponse.getTotal();

				LogThresholdInfo.logAdd(allAddQueryResponse.getTotal(), totalCount, PERCENT_CHANGE_THRESHOLD);

				logAndAddRefsetMembersToBulk(allAddQueryResponse, item, restTemplate, bulkChangeList);

				this.doBulkUpdate(restTemplate, bulkChangeList);
				bulkChangeList.clear();

				while (allAddQueryResponse.getOffset()
						+ allAddQueryResponse.getLimit() > MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE) {
					allAddQueryResponse = getAddOrRemoveQueryResponse(restTemplate,
							baseRemoveQuery);
					logAndAddRefsetMembersToBulk(allAddQueryResponse, item, restTemplate, bulkChangeList);

					this.doBulkUpdate(restTemplate, bulkChangeList);
					bulkChangeList.clear();
				}

				log.info("### ---------------------------------------------------------");

				logAndRemoveRefsetMembersToBulk(allAddQueryResponse, item, restTemplate, bulkChangeList);

				this.doBulkUpdate(restTemplate, bulkChangeList);
				bulkChangeList.clear();

				/////////////////////

				log.info("### Processing for removals");
				log.info("### ---------------------------------------------------------");

				AddOrRemoveQueryResponse allRemoveQueryResponse = getAddOrRemoveQueryResponse(restTemplate,
						baseRemoveQuery);

				LogThresholdInfo.logRemove(allRemoveQueryResponse.getTotal(), totalCount, PERCENT_CHANGE_THRESHOLD);

				logAndRemoveRefsetMembersToBulk(allRemoveQueryResponse, item, restTemplate, bulkChangeList);

				this.doBulkUpdate(restTemplate, bulkChangeList);
				bulkChangeList.clear();

				while (allRemoveQueryResponse.getOffset()
						+ allRemoveQueryResponse.getLimit() > MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE) {
					allRemoveQueryResponse = getAddOrRemoveQueryResponse(restTemplate,
							baseRemoveQuery);

					logAndRemoveRefsetMembersToBulk(allRemoveQueryResponse, item, restTemplate, bulkChangeList);

					this.doBulkUpdate(restTemplate, bulkChangeList);
					bulkChangeList.clear();
				}
				log.info("### ---------------------------------------------------------");
				log.info("###");
			}

			log.info("### ---------------------------------------------------------");

		};
	}

	private void logAndAddRefsetMembersToBulk(AddOrRemoveQueryResponse allAddQueryResponse, Item item,
			RestTemplate restTemplate, List<JSONObject> bulkChangeList) throws Exception {

		for (AddRemoveItem i : allAddQueryResponse.getItems()) {

			String existingMemberQuery = SNOWSTORM_URL + BRANCH + "/members?referenceSet=" +
					item.getReferencedComponent().getConceptId() + "&referencedComponentId=" + i.getConceptId()
					+ "&active=false&offset=0&limit=1";
			String existingMemberQueryResult = restTemplate.getForObject(existingMemberQuery, String.class);
			// log.info("existingMemberQueryResult" + existingMemberQueryResult);
			ObjectMapper objectMapper = new ObjectMapper();
			JsonNode jsonNode = objectMapper.readTree(existingMemberQueryResult);
			Integer total = jsonNode.get("total").asInt();

			if (total > 0) {
				log.info("### Will reactivate referencedComponentId " + i.getConceptId());

				JSONObject reactivateRefsetMember = new JSONObject();
				reactivateRefsetMember.put("active", true);
				reactivateRefsetMember.put("referencedComponentId", i.getConceptId());
				reactivateRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
				reactivateRefsetMember.put("moduleId", item.getModuleId());
				bulkChangeList.add(reactivateRefsetMember);
			} else {
				log.info("### Will add referencedComponentId " + i.getConceptId());

				JSONObject addRefsetMember = new JSONObject();
				addRefsetMember.put("active", true);
				addRefsetMember.put("referencedComponentId", i.getConceptId());
				addRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
				addRefsetMember.put("moduleId", item.getModuleId());
				bulkChangeList.add(addRefsetMember);
			}
		}
	}

	private void logAndRemoveRefsetMembersToBulk(AddOrRemoveQueryResponse allRemoveQueryResponse, Item item,
			RestTemplate restTemplate, List<JSONObject> bulkChangeList) {

		for (AddRemoveItem i : allRemoveQueryResponse.getItems()) {

			log.info("### Will remove referencedComponentId " + i.getConceptId());

			// need to run an additional query to get the member id
			String memberIdQuery = SNOWSTORM_URL + BRANCH + "/members?referenceSet="
					+ item.getReferencedComponent().getConceptId() + "&referencedComponentId="
					+ i.getConceptId() +
					"&offset=0&limit=1";
			// String memberIdResonse = restTemplate.getForObject(memberIdQuery,
			// String.class);
			// log.info("memberIdResonse" + memberIdResonse);
			Data memberIdResonse = restTemplate.getForObject(memberIdQuery, Data.class);
			// log.info("memberIdResonse" + memberIdResonse);

			JSONObject removeRefsetMember = new JSONObject();
			removeRefsetMember.put("active", false);
			removeRefsetMember.put("referencedComponentId", i.getConceptId());
			removeRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
			removeRefsetMember.put("moduleId", item.getModuleId());
			removeRefsetMember.put("memberId", memberIdResonse.getItems().get(0).getMemberId());
			// log.info("removeRefsetMember:" + removeRefsetMember);
			bulkChangeList.add(removeRefsetMember);

		}
	}

	private void doBulkUpdate(RestTemplate restTemplate, List<JSONObject> bulkChangeList) throws Exception {
		if (bulkChangeList.size() > 0) {
			// bulk update
			HttpHeaders headers = new HttpHeaders();
			headers.setAccept(Collections.singletonList(MediaType.ALL));
			headers.setContentType(MediaType.APPLICATION_JSON);
			String requestBody = bulkChangeList.toString();
			// log.info("requestBody" + requestBody);
			HttpEntity<String> request = new HttpEntity<String>(requestBody, headers);
			String bulkQuery = SNOWSTORM_URL + BRANCH + "/members/bulk";
			HttpEntity<String> bulkQueryResult = restTemplate.exchange(bulkQuery, HttpMethod.POST, request,
					String.class);
			// log.info("bulkQueryResult" + bulkQueryResult);
			// log.info("path" + bulkQueryResult.getHeaders().getLocation().getPath());
			String location = bulkQueryResult.getHeaders().getLocation().getPath();
			String bulkChangeId = location.substring(location.lastIndexOf('/') + 1);

			Boolean running = true;
			while (running) {
				try {
					Thread.sleep(5000); // 5000 milliseconds = 5 seconds
				} catch (InterruptedException e) {
					Thread.currentThread().interrupt();
				}

				String bulkStatusQuery = SNOWSTORM_URL + BRANCH + "/members/bulk/" + bulkChangeId;
				String bulkStatusResponse = restTemplate.getForObject(bulkStatusQuery, String.class);
				// log.info("bulkStatusResponse" + bulkStatusResponse);
				ObjectMapper objectMapper = new ObjectMapper();
				JsonNode jsonNode = objectMapper.readTree(bulkStatusResponse);
				String status = jsonNode.get("status").asText();

				if (!status.equals("RUNNING")) {
					running = false;

					if (status.equals("COMPLETED")) {
						log.info("bulk update with id:" + bulkChangeId + " COMPLETED in "
								+ jsonNode.get("secondsDuration").asText());
					} else if (status.equals("FAILED")) {
						log.info("bulk update with id:" + bulkChangeId + " FAILED in "
								+ jsonNode.get("secondsDuration").asText());
						log.info("error message:" + jsonNode.get("message"));
						throw new Exception("Bulk Update Failed:" + jsonNode.get("message"));
					} else {
						// maybe an error status?
						log.info("batch status is " + status);
						throw new Exception("Unexpected Bulk status:" + status);
					}
				}

			}
		}
	}

	private Data getReferenceSetQueryResponse(RestTemplate restTemplate) {
		String baseQuery = SNOWSTORM_URL + BRANCH + "/members?referenceSet=" + ECL_REFSET_ID;
		String query = baseQuery + "&offset=0";
		Data allResponse = new Data();
		Data response = restTemplate.getForObject(query, Data.class);
		allResponse.getItems().addAll(response.getItems());
		allResponse.setOffset(response.getOffset());
		allResponse.setLimit(response.getLimit());
		allResponse.setTotal(response.getTotal());

		while (allResponse.getTotal() > allResponse.getOffset() + allResponse.getLimit()) {
			// more pages of data to process
			query = baseQuery + "&offset=" + (allResponse.getOffset() + allResponse.getLimit());
			// String nextQueryResponse1 = restTemplate.getForObject(query, String.class);
			// log.info("nextQueryResponse1:" + nextQueryResponse1);
			Data nextQueryResponse = restTemplate.getForObject(query, Data.class);
			allResponse.getItems().addAll(nextQueryResponse.getItems());
			allResponse.setOffset(nextQueryResponse.getOffset());
			allResponse.setLimit(nextQueryResponse.getLimit());
			allResponse.setTotal(nextQueryResponse.getTotal());
		}
		return allResponse;
	}

	private AddOrRemoveQueryResponse getAddOrRemoveQueryResponse(RestTemplate restTemplate, String baseQuery) {

		String query = baseQuery + "&offset=0";

		// String queryResponse1 = restTemplate.getForObject(query, String.class);
		// log.info("queryResponse1" + queryResponse1);

		AddOrRemoveQueryResponse allQueryResponse = new AddOrRemoveQueryResponse();
		AddOrRemoveQueryResponse queryResponse = restTemplate.getForObject(query, AddOrRemoveQueryResponse.class);
		allQueryResponse.getItems().addAll(queryResponse.getItems());
		allQueryResponse.setOffset(queryResponse.getOffset());
		allQueryResponse.setLimit(queryResponse.getLimit());
		allQueryResponse.setTotal(queryResponse.getTotal());

		while (allQueryResponse.getTotal() > allQueryResponse.getOffset() + allQueryResponse.getLimit() &&
				(allQueryResponse.getOffset() + allQueryResponse.getLimit() < MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE)) {
			// more pages of data to process
			query = baseQuery + "&offset=" + (allQueryResponse.getOffset() + allQueryResponse.getLimit());
			String nextQueryResponse1 = restTemplate.getForObject(query, String.class);
			log.info("nextQueryResponse1:" + nextQueryResponse1);
			AddOrRemoveQueryResponse nextQueryResponse = restTemplate.getForObject(query,
					AddOrRemoveQueryResponse.class);
			allQueryResponse.getItems().addAll(nextQueryResponse.getItems());
			allQueryResponse.setOffset(nextQueryResponse.getOffset());
			allQueryResponse.setLimit(nextQueryResponse.getLimit());
			allQueryResponse.setTotal(nextQueryResponse.getTotal());
		}
		return allQueryResponse;
	}

	// private AddOrRemoveQueryResponse getAddOrRemoveQueryResponse(RestTemplate
	// restTemplate, String baseQuery) {

	// int offset = 0;// + "&offset=0";
	// int indexedMaxQuerySize = MAXIMUM_UNSORTED_OFFSET_PLUS_PAGE_SIZE;
	// AddOrRemoveQueryResponse response =
	// getAddOrRemoveQueryResponse2(restTemplate, baseQuery, offset,
	// indexedMaxQuerySize);

	// // snowstorm has a maximum number of results it will return .. if we have
	// more, we need to run the query again
	// while (response.getOffset() + response.getLimit() < response.getTotal()) {
	// log.info("running again due to exceeding max query size of " +
	// indexedMaxQuerySize);
	// indexedMaxQuerySize += indexedMaxQuerySize;
	// AddOrRemoveQueryResponse furtherResponse =
	// getAddOrRemoveQueryResponse2(restTemplate, baseQuery, response.getOffset(),
	// indexedMaxQuerySize);
	// response.getItems().addAll(furtherResponse.getItems());
	// response.setOffset(furtherResponse.getOffset());
	// }

	// return response;
	// }

	// private AddOrRemoveQueryResponse getAddOrRemoveQueryResponse2(RestTemplate
	// restTemplate, String baseQuery, int offset, int indexedMaxQuerySize) {

	// String query = baseQuery + "&offset=" + offset;

	// // String queryResponse1 = restTemplate.getForObject(query, String.class);
	// // log.info("queryResponse1" + queryResponse1);

	// AddOrRemoveQueryResponse allQueryResponse = new AddOrRemoveQueryResponse();
	// AddOrRemoveQueryResponse queryResponse = restTemplate.getForObject(query,
	// AddOrRemoveQueryResponse.class);
	// allQueryResponse.getItems().addAll(queryResponse.getItems());
	// allQueryResponse.setOffset(queryResponse.getOffset());
	// allQueryResponse.setLimit(queryResponse.getLimit());
	// allQueryResponse.setTotal(queryResponse.getTotal());

	// while ((allQueryResponse.getTotal() > allQueryResponse.getOffset() +
	// allQueryResponse.getLimit()) &&
	// (allQueryResponse.getOffset() + allQueryResponse.getLimit() <
	// indexedMaxQuerySize)) {
	// // more pages of data to process
	// query = baseQuery + "&offset=" + (allQueryResponse.getOffset() +
	// allQueryResponse.getLimit());
	// String nextQueryResponse1 = restTemplate.getForObject(query, String.class);
	// log.info("nextQueryResponse1:" + nextQueryResponse1);
	// AddOrRemoveQueryResponse nextQueryResponse = restTemplate.getForObject(query,
	// AddOrRemoveQueryResponse.class);
	// allQueryResponse.getItems().addAll(nextQueryResponse.getItems());
	// allQueryResponse.setOffset(nextQueryResponse.getOffset());
	// //allQueryResponse.setLimit(nextQueryResponse.getLimit());
	// //allQueryResponse.setTotal(nextQueryResponse.getTotal());
	// }
	// return allQueryResponse;
	// }

	private void processCompoundExpressionConstraint(CompoundExpressionConstraint cec, RestTemplate restTemplate)
			throws Exception {
		List<SubExpressionConstraint> conjunctionList = cec.getConjunctionExpressionConstraints();
		List<SubExpressionConstraint> disjunctionList = cec.getDisjunctionExpressionConstraints();
		Pair<SubExpressionConstraint> exclusionList = cec.getExclusionExpressionConstraints();

		if (conjunctionList != null) {
			// log.info("conjunctionList" + conjunctionList);
			for (SubExpressionConstraint sec : conjunctionList) {
				this.processSubExpressionConstraint((SubExpressionConstraint) sec, restTemplate);
			}
		}

		if (disjunctionList != null) {
			// log.info("disjunctionList" + disjunctionList);
			for (SubExpressionConstraint sec : disjunctionList) {
				this.processSubExpressionConstraint((SubExpressionConstraint) sec, restTemplate);
			}
		}

		if (exclusionList != null) {
			// log.info("exclusionList" + exclusionList);
			SubExpressionConstraint firstSec = exclusionList.getFirst();
			this.processSubExpressionConstraint(firstSec, restTemplate);
			SubExpressionConstraint secondSec = exclusionList.getSecond();
			this.processSubExpressionConstraint(secondSec, restTemplate);
		}

	}

	private void processSubExpressionConstraint(SubExpressionConstraint sec, RestTemplate restTemplate)
			throws Exception {
		log.info("SEC:" + sec.getConceptId());
		// TODO look up properly
		// 'https://dev-au-authoring.ihtsdotools.org/snowstorm/snomed-ct/MAIN%7CSNOMEDCT-AU/concepts?activeFilter=true&ecl=%28%3C%20900000000000455006%7CReference%20set%7C%20AND%2032570061000036105%7CBody%20structure%20foundation%20reference%20set%7C%29&includeLeafFlag=false&form=inferred&offset=0&limit=50
		if (sec.getConceptId() != null) {
			log.info("SEC term:" + sec.getTerm());
			// Need to look up every memberOf concept as it could come in without a term (or
			// the term could be wrong)
			log.info("operator:" + sec.getOperator());
			if (sec.getOperator() != null && sec.getOperator().equals(Operator.memberOf)) {
				log.info("!!!!!! Found a reference set !!!!!!" + sec.getConceptId());
				log.info("!this.refComponentIdToECLMap" + this.refComponentIdToECLMap.keySet());
				if (this.refComponentIdToECLMap.keySet().contains(sec.getConceptId())) {
					log.info("!!!!!! ECL Reference Set");
					conceptsToReplaceMap.put(sec.getConceptId(), null);
				} else {
					log.info("!!!!!! Pick list Reference Set");
				}
			}

			// Data queryResponse = restTemplate.getForObject(eclRefsetQuery, Data.class);
			// if (sec.getTerm() != null && sec.getTerm().toUpperCase().indexOf("REFERENCE
			// SET") >= 0) {
			// reference set may be a pick reference set or an ecl reference set
			// log.info("!!!!!! Found a reference set !!!!!!" + sec.getConceptId());
			// String eclRefsetQuery = SNOWSTORM_URL + BRANCH + "/members?referenceSet=" +
			// ECL_REFSET_ID
			// + "&referencedComponentId=" +
			// sec.getConceptId() + "&active=true&offset=0&limit=1";
			// String queryResponse1 = restTemplate.getForObject(eclRefsetQuery,
			// String.class);
			// log.info("queryResponse1:" + queryResponse1);
			// log.info("eclRefsetQuery:" + eclRefsetQuery);
			// Data queryResponse = restTemplate.getForObject(eclRefsetQuery, Data.class);
			// if (queryResponse.getTotal() > 0) {
			// log.info("!!!!!! ECL Reference Set");
			// conceptsToReplaceMap.put(sec.getConceptId(), null);
			// } else {
			// log.info("!!!!!! Pick list Reference Set");
			// }
			// }
		} else {
			ExpressionConstraint ec = sec.getNestedExpressionConstraint();
			if (ec instanceof CompoundExpressionConstraint) {
				this.processCompoundExpressionConstraint((CompoundExpressionConstraint) ec, restTemplate);
			} else if (ec instanceof SubExpressionConstraint) {
				this.processSubExpressionConstraint((SubExpressionConstraint) ec, restTemplate);
			} else {
				throw new Exception("unprocessed ECL" + ec);
			}
		}

	}
}
