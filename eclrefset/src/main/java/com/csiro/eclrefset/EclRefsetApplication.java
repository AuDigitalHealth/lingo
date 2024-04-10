package com.csiro.eclrefset;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.snomed.langauges.ecl.ECLException;
import org.snomed.langauges.ecl.ECLObjectFactory;
import org.snomed.langauges.ecl.ECLQueryBuilder;
import org.snomed.langauges.ecl.domain.Pair;
import org.snomed.langauges.ecl.domain.expressionconstraint.CompoundExpressionConstraint;
import org.snomed.langauges.ecl.domain.expressionconstraint.ExpressionConstraint;
import org.snomed.langauges.ecl.domain.expressionconstraint.SubExpressionConstraint;
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
	private static final String SNOWSTORM_URL = "https://dev-au-authoring.ihtsdotools.org/snowstorm/snomed-ct/";
	private static final String BRANCH = "MAIN%7CSNOMEDCT-AU";

	@Value("${refset-percent-change-threshold}")
	private double PERCENT_CHANGE_THRESHOLD;

	private Map<String, Integer> conceptsToReplaceMap = new HashMap<String, Integer>();

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

			// TODO: use webclient

			ImsService imsService = ctx.getBean(ImsService.class);
			Cookie cookie = imsService.getDefaultCookie();
			restTemplate.setInterceptors(
					Collections.singletonList(new AuthInterceptor(cookie.getName(), cookie.getValue())));

			Data refsetQueryResponse = getReferenceSetQueryResponse(restTemplate);
			//log.info("refsetQueryResponse" + refsetQueryResponse);
			List<JSONObject> bulkChangeList = new ArrayList<JSONObject>();
			for (Item item : refsetQueryResponse.getItems()) {
				//log.info(item.additionalFields.toString());
				//log.info("!!!!");
				//log.info(item.additionalFields.query);
				//log.info("refset id:" + item.referencedComponent.conceptId());
//618906891000087104|Nyando virus| AND
// a released concept 29550004|Inner cerebellar funiculus|
				String ecl = "(" + item.getAdditionalFields().getQuery() + ")";//OR 294803071000087109 |Human astrovirus 1| )";//OR << 49872002|Virus|// MINUS (294803071000087109 |Human astrovirus 1|)";
				//log.info("ECL!!!!" + ecl);
				//String ecl = "^ 32570061000036105|Body structure foundation reference set| AND (<< 280115004|Acquired body structure| OR (<< 91723000|Anatomical structure| AND << 4421005|Cell structure| AND << 122453002|Intercellular anatomical structure| AND << 118956008|Morphologically altered structure|))";
				//"<404684003 |Clinical finding|: " + 
				// 						"{ 363698007 |Finding site| = * } " + 
				// 						"OR { 116676008 |Associated morphology| = * }");

				ECLQueryBuilder eclQueryBuilder = new ECLQueryBuilder(new ECLObjectFactory());
				try {
					// Use the parser to ensure that the ECL we have received is correct
					ExpressionConstraint ec = eclQueryBuilder.createQuery(ecl);
					//log.info(ec.toString());

					if (ec instanceof CompoundExpressionConstraint) {
						this.processCompoundExpressionConstraint((CompoundExpressionConstraint)ec);
					}
					else if (ec instanceof SubExpressionConstraint) {
						this.processSubExpressionConstraint((SubExpressionConstraint)ec);
					}
					else {
						//TODO: does dotted need to be supported
						throw new Exception("unexpected ECL expression, code not coping");
					}
					
					// Unfortunately the SI ECL parser does not round trip.  If I could have altered and then
					// generated the ECL string this would have been my ideal situation.  But given that 
					// it is a simple concept id <--> ECL replacment, I think processing the ECL as a string
					// is simpler than implementing full round tripping. Then the parser can once again be used
					// to verify the replacment.

					//log.info("XXXX Concepts to replace XXXX");
					//log.info(this.conceptsToReplaceMap.toString());

					// check what changes are necessary to update the distributed refsets
					String addEcl = "(" + ecl + ") MINUS (^ " + item.getReferencedComponent().getConceptId() + ")";
					String removeEcl = "(^ " + item.getReferencedComponent().getConceptId() + ") MINUS (" + ecl + ")";

					//log.info("addEcl:" + addEcl);
					String baseAddQuery = SNOWSTORM_URL + BRANCH + "/concepts?ecl=" + addEcl + "&activeFilter=true&includeLeafFlag=false&form=inferred";
					//log.info("request:" + addQuery);
					String baseRemoveQuery = SNOWSTORM_URL + BRANCH + "/concepts?ecl=" + removeEcl + "&activeFilter=true&includeLeafFlag=false&form=inferred";

					AddOrRemoveQueryResponse allAddQueryResponse = getAddOrRemoveQueryResponse(restTemplate, baseAddQuery);

					String refsetMemberCountQuery = SNOWSTORM_URL + BRANCH + "/members?referenceSet=" + item.getReferencedComponent().getConceptId() + "&active=true&offset=0&limit=1";
					Data refsetMemberCountResponse = restTemplate.getForObject(refsetMemberCountQuery, Data.class);
					Integer totalCount = refsetMemberCountResponse.getTotal();

					log.info("### Processing refsetId: " + item.getReferencedComponent().getConceptId() + " for additions");
					log.info("### ---------------------------------------------------------");
					Integer addCount = 0;
					for (AddRemoveItem i : allAddQueryResponse.getItems()) {

						addCount++;

						String existingMemberQuery = SNOWSTORM_URL + BRANCH + "/members?referenceSet=" + 
							item.getReferencedComponent().getConceptId() + "&referencedComponentId=" + i.getConceptId() + "&active=false&offset=0&limit=1";
						String existingMemberQueryResult = restTemplate.getForObject(existingMemberQuery, String.class);
						//log.info("existingMemberQueryResult" + existingMemberQueryResult);
						ObjectMapper objectMapper = new ObjectMapper();
						JsonNode jsonNode = objectMapper.readTree(existingMemberQueryResult);
						Integer total = jsonNode.get("total").asInt();

						
						if (total > 0) {
							log.info("### Wil reactivate referencedComponentId " + i.getConceptId());

							JSONObject reactivateRefsetMember = new JSONObject();
							reactivateRefsetMember.put("active", true);
							reactivateRefsetMember.put("referencedComponentId", i.getConceptId());
							reactivateRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
							reactivateRefsetMember.put("moduleId", item.getModuleId());
							bulkChangeList.add(reactivateRefsetMember);
						}
						else {
							log.info("### Will add referencedComponentId " + i.getConceptId());

							JSONObject addRefsetMember = new JSONObject();
							addRefsetMember.put("active", true);
							addRefsetMember.put("referencedComponentId", i.getConceptId());
							addRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
							addRefsetMember.put("moduleId", item.getModuleId());
							bulkChangeList.add(addRefsetMember);
						}
					}
					LogThresholdInfo.logAdd(addCount, totalCount, PERCENT_CHANGE_THRESHOLD);

					log.info("### ---------------------------------------------------------");
					log.info("###");


					//log.info("bulkChangeList" + bulkChangeList.toString());
					//log.info("removeQuery " + removeQuery);
					//String removeQueryResponse1 = restTemplate.getForObject(removeQuery, String.class);
					//log.info("removeQueryResponse1" + removeQueryResponse1);

					AddOrRemoveQueryResponse allRemoveQueryResponse = getAddOrRemoveQueryResponse(restTemplate, baseRemoveQuery);

					log.info("### Processing refsetId: " + item.getReferencedComponent().getConceptId() + " for removals");
					log.info("### ---------------------------------------------------------");
					Integer removeCount = 0;
					for (AddRemoveItem i : allRemoveQueryResponse.getItems()) {

						removeCount++;

						log.info("### Will remove referencedComponentId " + i.getConceptId());

						// need to run an additional query to get the member id
						String memberIdQuery = SNOWSTORM_URL + BRANCH + "/members?referenceSet=" + item.getReferencedComponent().getConceptId() + "&referencedComponentId=" + i.getConceptId() + 
						"&offset=0&limit=1";
						// String memberIdResonse = restTemplate.getForObject(memberIdQuery, String.class);
						// log.info("memberIdResonse" + memberIdResonse);
						Data memberIdResonse = restTemplate.getForObject(memberIdQuery, Data.class);
						//log.info("memberIdResonse" + memberIdResonse);

						JSONObject removeRefsetMember = new JSONObject();
						removeRefsetMember.put("active", false);
						removeRefsetMember.put("referencedComponentId", i.getConceptId());
						removeRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
						removeRefsetMember.put("moduleId", item.getModuleId());
						removeRefsetMember.put("memberId", memberIdResonse.getItems().get(0).getMemberId());
						//log.info("removeRefsetMember:" + removeRefsetMember);
						bulkChangeList.add(removeRefsetMember);
						
					}

					//log.info("### Remove count:" + removeCount);
					LogThresholdInfo.logRemove(removeCount, totalCount, PERCENT_CHANGE_THRESHOLD);
					log.info("### ---------------------------------------------------------");

				}
				catch (ECLException e) {
					log.info("invalid ECL:" + e.getLocalizedMessage());
					log.info("==>" + ecl);
					System.exit(-1);
				}
				catch (RestClientException e) {
					log.info("Exception" + e);
					System.exit(-1);
				}

				// bulk update
				HttpHeaders headers = new HttpHeaders();
				headers.setAccept(Collections.singletonList(MediaType.ALL));
				headers.setContentType(MediaType.APPLICATION_JSON);
				String requestBody = bulkChangeList.toString();
				//log.info("requestBody" + requestBody);
				HttpEntity<String> request = new HttpEntity<String>(requestBody, headers);
				String bulkQuery = SNOWSTORM_URL + BRANCH + "/members/bulk";
				HttpEntity<String> bulkQueryResult = restTemplate.exchange(bulkQuery, HttpMethod.POST, request, String.class);
				//log.info("bulkQueryResult" + bulkQueryResult);
				//log.info("path" + bulkQueryResult.getHeaders().getLocation().getPath());
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
					//log.info("bulkStatusResponse" + bulkStatusResponse);
					ObjectMapper objectMapper = new ObjectMapper();
					JsonNode jsonNode = objectMapper.readTree(bulkStatusResponse);
					String status = jsonNode.get("status").asText();

					if (!status.equals("RUNNING")) {
						running = false;

						if (status.equals("COMPLETED")) {
							log.info("batch update completed in " + jsonNode.get("secondsDuration").asText());
						}
						else {
							// maybe an error status?
							log.info("batch status is " + status);
							throw new Exception("Unexpected Batch status:" + status);
						}
					}

				}

			}

		};
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
			String nextQueryResponse1 = restTemplate.getForObject(query, String.class);
			log.info("nextQueryResponse1:" + nextQueryResponse1);
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

		String queryResponse1 = restTemplate.getForObject(query, String.class);
		log.info("queryResponse1" + queryResponse1);

		AddOrRemoveQueryResponse allQueryResponse = new AddOrRemoveQueryResponse();
		AddOrRemoveQueryResponse queryResponse = restTemplate.getForObject(query, AddOrRemoveQueryResponse.class);
		allQueryResponse.getItems().addAll(queryResponse.getItems());
		allQueryResponse.setOffset(queryResponse.getOffset());
		allQueryResponse.setLimit(queryResponse.getLimit());
		allQueryResponse.setTotal(queryResponse.getTotal());

		while (allQueryResponse.getTotal() > allQueryResponse.getOffset() + allQueryResponse.getLimit()) {
			// more pages of data to process
			query = baseQuery + "&offset=" + (allQueryResponse.getOffset() + allQueryResponse.getLimit());
			String nextQueryResponse1 = restTemplate.getForObject(query, String.class);
			log.info("nextQueryResponse1:" + nextQueryResponse1);
			AddOrRemoveQueryResponse nextQueryResponse = restTemplate.getForObject(query, AddOrRemoveQueryResponse.class);
			allQueryResponse.getItems().addAll(nextQueryResponse.getItems());
			allQueryResponse.setOffset(nextQueryResponse.getOffset());
			allQueryResponse.setLimit(nextQueryResponse.getLimit());
			allQueryResponse.setTotal(nextQueryResponse.getTotal());
		}
		return allQueryResponse;
	}

	private void processCompoundExpressionConstraint(CompoundExpressionConstraint cec) throws Exception{
		List<SubExpressionConstraint> conjunctionList = cec.getConjunctionExpressionConstraints();
		List<SubExpressionConstraint> disjunctionList = cec.getDisjunctionExpressionConstraints();
		Pair<SubExpressionConstraint> exclusionList = cec.getExclusionExpressionConstraints();

		if (conjunctionList != null) {
			//log.info("conjunctionList" + conjunctionList);
			for (SubExpressionConstraint sec : conjunctionList) { 
				this.processSubExpressionConstraint((SubExpressionConstraint)sec);
			}
		}

		if (disjunctionList != null) {
			//log.info("disjunctionList" + disjunctionList);
			for (SubExpressionConstraint sec : disjunctionList) { 
				this.processSubExpressionConstraint((SubExpressionConstraint)sec);
			}
		}

		if (exclusionList != null) {
			//log.info("exclusionList" + exclusionList);
			SubExpressionConstraint firstSec = exclusionList.getFirst();
			this.processSubExpressionConstraint(firstSec);
			SubExpressionConstraint secondSec = exclusionList.getSecond();
			this.processSubExpressionConstraint(secondSec);
		}

	}

	private void processSubExpressionConstraint(SubExpressionConstraint sec) throws Exception {
		//log.info("SEC:" + sec.getConceptId());
		// TODO look up properly
		if (sec.getConceptId() != null) {
			//log.info("SEC term:" + sec.getTerm());
			if (sec.getTerm() != null && sec.getTerm().toUpperCase().indexOf("REFERENCE SET") >= 0) {
				log.info("!!!!!! BINGO !!!!!!" + sec.getConceptId());
				conceptsToReplaceMap.put(sec.getConceptId(), null);
			}
		}
		else {
			ExpressionConstraint ec = sec.getNestedExpressionConstraint();
			if (ec instanceof CompoundExpressionConstraint) {
				this.processCompoundExpressionConstraint((CompoundExpressionConstraint)ec);
			}
			else if (ec instanceof SubExpressionConstraint) {
				this.processSubExpressionConstraint((SubExpressionConstraint)ec);
			}
			else {
				throw new Exception("unprocessed ECL" + ec);
			}
		}

	}
}
