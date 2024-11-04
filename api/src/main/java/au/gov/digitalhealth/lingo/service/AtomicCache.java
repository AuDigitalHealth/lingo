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
package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.util.LingoConstants;
import jakarta.validation.constraints.NotNull;
import java.util.*;

public class AtomicCache {

  private final Map<String, String> idToFsnMap;

  private int nextId = -2;

  public <T extends LingoConstants> AtomicCache(
      Map<String, String> idFsnMap, @SuppressWarnings("unchecked") T[]... enumerations) {
    this.idToFsnMap = idFsnMap;

    Arrays.stream(enumerations)
        .flatMap(Arrays::stream)
        .filter(LingoConstants::hasLabel)
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
