package com.csiro.eclrefset;

import java.util.List;

import org.json.JSONObject;
import org.springframework.web.client.RestTemplate;

import com.csiro.eclrefset.model.addorremovequeryresponse.AddRemoveItem;
import com.csiro.eclrefset.model.refsetqueryresponse.Data;
import com.csiro.eclrefset.model.refsetqueryresponse.Item;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.java.Log;

@Log
public class AddRefsetMemberThread extends Thread {

    RestTemplate restTemplate;
    List<JSONObject> bulkChangeList;
    int threadCount;
    AddRemoveItem addRemoveItem;
    Item item;
    String snowstormUrl;

    public AddRefsetMemberThread(RestTemplate restTemplate, List<JSONObject> bulkChangeList, int threadCount, AddRemoveItem addRemoveItem, Item item, String snowstormUrl) {
        this.restTemplate = restTemplate;
        this.bulkChangeList = bulkChangeList;
        this.threadCount = threadCount;
        this.addRemoveItem = addRemoveItem;
        this.item = item;
        this.snowstormUrl = snowstormUrl;
    }

    public void run() {

        log.fine("Thread:" + threadCount + " started");

        String existingMemberQuery = snowstormUrl + EclRefsetApplication.BRANCH + "/members?referenceSet=" +
        item.getReferencedComponent().getConceptId() + "&referencedComponentId=" + addRemoveItem.getConceptId()
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
            log.info("### Will reactivate referencedComponentId " + addRemoveItem.getConceptId());

            JSONObject reactivateRefsetMember = new JSONObject();
            reactivateRefsetMember.put("active", true);
            reactivateRefsetMember.put("referencedComponentId", addRemoveItem.getConceptId());
            reactivateRefsetMember.put("refsetId", item.getReferencedComponent().getConceptId());
            reactivateRefsetMember.put("moduleId", item.getModuleId());
            bulkChangeList.add(reactivateRefsetMember);
        } else {
            log.info("### Will add referencedComponentId " + addRemoveItem.getConceptId());

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