package com.csiro.snomio.service;

import java.util.*;

public class AtomicCache {

  Map<String, String> idToFsnMap;

  int nextId = -2;

  public AtomicCache(Map<String, String> idFsnMap) {
    this.idToFsnMap = idFsnMap;
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
