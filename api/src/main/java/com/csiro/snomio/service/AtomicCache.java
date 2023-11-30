package com.csiro.snomio.service;

import com.csiro.snomio.util.AmtConstants;
import com.csiro.snomio.util.SnomedConstants;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AtomicCache {

    ObjectMapper mapper = new ObjectMapper();

    Random random = new Random();

    Map<String, String> idToFsnMap = new HashMap<>();
    BiMap<String, String> tempIdMap = HashBiMap.create();


    public void addFsn(String id, String fsn) {
        idToFsnMap.put(id, fsn);
    }

    public void addTempId(String id, String tempId) {
        tempIdMap.put(id, tempId);
    }

    public boolean containsTempIdFor(String id) {
        return tempIdMap.containsKey(id);
    }

    public boolean containsTempId(String tempId) {
        return tempIdMap.containsValue(tempId);
    }

    private boolean containsFsnFor(String id) {
        return idToFsnMap.containsKey(id);
    }

    public AtomicCache preload(Object obj) {
        try {
            String details = mapper.writeValueAsString(obj);
            Pattern pattern = Pattern.compile("[a-f0-9]{8}(?:-[a-f0-9]{4}){4}[a-f0-9]{8}");
            Matcher matcher = pattern.matcher(details);
            Set<String> uuids = new HashSet<>();
            while (matcher.find()) {
                String str = matcher.group();
                uuids.add(str);
            }
            for (String uuid : uuids) {
                if (!this.containsTempIdFor(uuid)) {
                    String newId = "" + nextNegativeInt();
                    while (this.containsTempId(newId)) {
                        newId = "" + nextNegativeInt();
                    }
                    this.addTempId(uuid, newId);
                }
            }
            pattern = Pattern.compile("\"idAndFsnTerm\":\"([^\"]+)\"");
            matcher = pattern.matcher(details);
            while (matcher.find()) {
                String str = matcher.group();
                String[] parts = str.split("\"")[3].split("\\|");
                String id = parts[0].trim();
                if (!this.containsFsnFor(id)) {
                    String fsn = parts[1].trim();
                    this.addFsn(id, fsn);
                }
            }
            Arrays.stream(AmtConstants.values()).filter(AmtConstants::hasLabel)
                    .filter(con -> !this.containsFsnFor(con.getValue()))
                    .forEach(con -> this.addFsn(con.getValue(), con.getLabel()));
            Arrays.stream(SnomedConstants.values()).filter(SnomedConstants::hasLabel)
                    .filter(con -> !this.containsFsnFor(con.getValue()))
                    .forEach(con -> this.addFsn(con.getValue(), con.getLabel()));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        return this;
    }

    public int nextNegativeInt() {
        return (random.nextInt(Integer.MAX_VALUE - 1) + 1) * -1;
    }

    public String getTempIdTarget(String tempId) {
        return tempIdMap.inverse().get(tempId);
    }

    public String getTempIdFor(String id) {
        if (this.containsTempIdFor(id)) {
            return tempIdMap.get(id);
        }
        return null;
    }

    public void removeTempIdFor(String id) {
        if (tempIdMap.containsKey(id)) {
            tempIdMap.remove(id);
        }
    }

    public Set<String> getTempIds() {
        return this.tempIdMap.values();
    }

    public Set<String> getFsnIds() {
        return this.idToFsnMap.keySet();
    }

    public String getFsn(String id) {
        return this.idToFsnMap.get(id);
    }
}
