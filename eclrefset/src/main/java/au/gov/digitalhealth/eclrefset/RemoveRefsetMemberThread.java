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
import au.gov.digitalhealth.eclrefset.model.refsetqueryresponse.Data;
import au.gov.digitalhealth.eclrefset.model.refsetqueryresponse.Item;
import java.util.List;
import lombok.extern.java.Log;
import org.json.JSONObject;
import org.springframework.web.client.RestTemplate;

@Log
public class RemoveRefsetMemberThread extends Thread {

  RestTemplate restTemplate;
  List<JSONObject> bulkChangeList;
  int threadCount;
  AddRemoveItem addRemoveItem;
  Item item;
  String snowstormUrl;

  public RemoveRefsetMemberThread(
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

    log.info(
        "### Will remove referencedComponentId "
            + addRemoveItem.getIdAndFsnTerm()
            + "(active="
            + addRemoveItem.isActive()
            + ")");

    // need to run an additional query to get the member id
    String memberIdQuery =
        snowstormUrl
            + EclRefsetApplication.BRANCH
            + "/members?referenceSet="
            + item.getReferencedComponent().getConceptId()
            + "&referencedComponentId="
            + addRemoveItem.getConceptId()
            + "&offset=0&limit=1";

    Data memberIdResonse = restTemplate.getForObject(memberIdQuery, Data.class);

    JSONObject removeRefsetMember = new JSONObject();
    removeRefsetMember.put("active", false);
    removeRefsetMember.put("referencedComponentId", addRemoveItem.getConceptId());
    removeRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
    removeRefsetMember.put("moduleId", item.getModuleId());
    removeRefsetMember.put("memberId", memberIdResonse.getItems().get(0).getMemberId());

    bulkChangeList.add(removeRefsetMember);

    log.fine("Thread:" + threadCount + " finished");
  }
}
