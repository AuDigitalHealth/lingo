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

import au.gov.digitalhealth.eclrefset.model.addorremovequeryresponse.AddRemoveItem;
import au.gov.digitalhealth.eclrefset.model.refsetqueryresponse.Item;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import lombok.extern.java.Log;
import org.json.JSONObject;
import org.springframework.web.client.RestTemplate;

@Log
public class AddRefsetMemberThread extends Thread {

  RestTemplate restTemplate;
  List<JSONObject> bulkChangeList;
  int threadCount;
  AddRemoveItem addRemoveItem;
  Item item;
  String snowstormUrl;

  public AddRefsetMemberThread(
      RestTemplate restTemplate,
      List<JSONObject> bulkChangeList,
      int threadCount,
      AddRemoveItem addRemoveItem,
      Item item,
      String snowstormUrl) {
    this.restTemplate = restTemplate;
    this.bulkChangeList = bulkChangeList;
    this.threadCount = threadCount;
    this.addRemoveItem = addRemoveItem;
    this.item = item;
    this.snowstormUrl = snowstormUrl;
  }

  @Override
  public void run() {

    log.fine("Thread:" + threadCount + " started");

    String existingMemberQuery =
        snowstormUrl
            + EclRefsetApplication.BRANCH
            + "/members?referenceSet="
            + item.getReferencedComponent().getConceptId()
            + "&referencedComponentId="
            + addRemoveItem.getConceptId()
            + "&active=false&offset=0&limit=1";
    String existingMemberQueryResult = restTemplate.getForObject(existingMemberQuery, String.class);

    ObjectMapper objectMapper = new ObjectMapper();
    JsonNode jsonNode = null;
    try {
      jsonNode = objectMapper.readTree(existingMemberQueryResult);
    } catch (JsonProcessingException e) {
      log.info("problem reading results from Snowstorm:" + e.getLocalizedMessage());
      System.exit(-1);
    }
    Integer total = jsonNode.get("total").asInt();

    if (total > 0) {
      log.info(
          "### Will reactivate referencedComponentId "
              + addRemoveItem.getIdAndFsnTerm()
              + "(active="
              + addRemoveItem.isActive()
              + ")");

      JSONObject reactivateRefsetMember = new JSONObject();
      reactivateRefsetMember.put("active", true);
      reactivateRefsetMember.put("referencedComponentId", addRemoveItem.getConceptId());
      reactivateRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
      reactivateRefsetMember.put("moduleId", item.getModuleId());
      bulkChangeList.add(reactivateRefsetMember);
    } else {
      log.info(
          "### Will add referencedComponentId "
              + addRemoveItem.getIdAndFsnTerm()
              + "(active="
              + addRemoveItem.isActive()
              + ")");

      JSONObject addRefsetMember = new JSONObject();
      addRefsetMember.put("active", true);
      addRefsetMember.put("referencedComponentId", addRemoveItem.getConceptId());
      addRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
      addRefsetMember.put("moduleId", item.getModuleId());
      bulkChangeList.add(addRefsetMember);
    }

    log.fine("Thread:" + threadCount + " finished");
  }
}
