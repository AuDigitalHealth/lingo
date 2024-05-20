package com.csiro.snomio.service;

import com.csiro.snomio.util.SnomioConstants;
import jakarta.validation.constraints.NotNull;
import java.util.*;

public class AtomicCache {

  private final Map<String, String> idToFsnMap;

  private int nextId = -2;

  public <T extends SnomioConstants> AtomicCache(
      Map<String, String> idFsnMap, T[]... enumerations) {
    this.idToFsnMap = idFsnMap;

    Arrays.stream(enumerations)
        .flatMap(Arrays::stream)
        .filter(SnomioConstants::hasLabel)
        .filter(con -> !this.containsFsnFor(con.getValue()))
        .forEach(con -> this.addFsn(con.getValue(), con.getLabel()));
  }

  public String substituteIdsInAxiom(String axiom, @NotNull Integer conceptId) {
    synchronized (idToFsnMap) {
      for (String id : getFsnIds()) {
        axiom = substituteIdInAxiom(axiom, id, getFsn(id));
      }
      axiom = substituteIdInAxiom(axiom, conceptId.toString(), "");

      return axiom;
    }
  }

  private String substituteIdInAxiom(String axiom, String id, String replacement) {
    return axiom
        .replaceAll(
            "(<http://snomed\\.info/id/" + id + ">|: *'?" + id + "'?)", ":'" + replacement + "'")
        .replace("''", "");
  }

  private boolean containsFsnFor(String id) {
    synchronized (idToFsnMap) {
      return idToFsnMap.containsKey(id);
    }
  }

  public void addFsn(String id, String fsn) {
    synchronized (idToFsnMap) {
      idToFsnMap.put(id, fsn);
    }
  }

  public Set<String> getFsnIds() {
    synchronized (idToFsnMap) {
      return this.idToFsnMap.keySet();
    }
  }

  public String getFsn(String id) {
    synchronized (idToFsnMap) {
      return this.idToFsnMap.get(id);
    }
  }

  public synchronized int getNextId() {
    return nextId--;
  }
}
