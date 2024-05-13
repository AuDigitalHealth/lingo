package com.csiro.eclrefset;

import java.util.List;

import javax.net.ssl.SSLHandshakeException;

import org.json.JSONObject;
import org.springframework.web.client.RestTemplate;

import com.csiro.eclrefset.model.addorremovequeryresponse.AddRemoveItem;
import com.csiro.eclrefset.model.refsetqueryresponse.Data;
import com.csiro.eclrefset.model.refsetqueryresponse.Item;

import lombok.extern.java.Log;

@Log
public class RemoveRefsetMemberThread extends Thread {

    RestTemplate restTemplate;
    List<JSONObject> bulkChangeList;
    int threadCount;
    AddRemoveItem addRemoveItem;
    Item item;
    String snowstormUrl;

    public RemoveRefsetMemberThread(RestTemplate restTemplate, List<JSONObject> bulkChangeList, int threadCount, AddRemoveItem addRemoveItem, Item item, String snowstormUrl) {
        this.restTemplate = restTemplate;
        this.bulkChangeList = bulkChangeList;
        this.threadCount = threadCount;
        this.addRemoveItem = addRemoveItem;
        this.item = item;
        this.snowstormUrl = snowstormUrl;
    }

    public void run() {

        log.fine("Thread:" + threadCount + " started");

        log.info("### Will remove referencedComponentId " + addRemoveItem.getConceptId());

        // need to run an additional query to get the member id
        String memberIdQuery = snowstormUrl + EclRefsetApplication.BRANCH + "/members?referenceSet="
                + item.getReferencedComponent().getConceptId() + "&referencedComponentId="
                + addRemoveItem.getConceptId() +
                "&offset=0&limit=1";

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