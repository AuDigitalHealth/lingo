package com.csiro.snomio.service;

import com.csiro.snomio.util.SnomioConstants;
import java.util.*;

public class AtomicCache {

  Map<String, String> idToFsnMap;

  int nextId = -2;

  public <T extends SnomioConstants> AtomicCache(
      Map<String, String> idFsnMap, T[]... enumerations) {
    this.idToFsnMap = idFsnMap;

    Arrays.stream(enumerations)
        .flatMap(Arrays::stream)
        .filter(SnomioConstants::hasLabel)
        .filter(con -> !this.containsFsnFor(con.getValue()))
        .forEach(con -> this.addFsn(con.getValue(), con.getLabel()));
  }

  private boolean containsFsnFor(String id) {
    return idToFsnMap.containsKey(id);
  }

  public void addFsn(String id, String fsn) {
    idToFsnMap.put(id, fsn);
  }

  public Set<String> getFsnIds() {
    return this.idToFsnMap.keySet();
  }

  public String getFsn(String id) {
    return this.idToFsnMap.get(id);
  }

  public int getNextId() {
    return nextId--;
  }
}
