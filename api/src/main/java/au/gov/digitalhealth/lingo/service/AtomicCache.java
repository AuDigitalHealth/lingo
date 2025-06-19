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

/** An id to FSN map that can be used to substitute ids in axioms with their FSNs. */
public class AtomicCache {

  private final Map<String, String> idToFsnMap;
  private final Map<String, String> idToPtMap;

  private int nextId = -2;

  public <T extends LingoConstants> AtomicCache(
      Map<String, String> idFsnMap,
      Map<String, String> idPtMap,
      @SuppressWarnings("unchecked") T[]... enumerations) {
    this.idToFsnMap = idFsnMap;
    this.idToPtMap = idPtMap;

    Arrays.stream(enumerations)
        .flatMap(Arrays::stream)
        .filter(LingoConstants::hasLabel)
        .filter(con -> !this.containsFsnFor(con.getValue()))
        .forEach(con -> this.addFsnAndPt(con.getValue(), con.getLabel(), con.getLabel()));
  }

  public String substituteIdsForFsnInAxiom(String axiom, @NotNull Integer conceptId) {
    synchronized (idToFsnMap) {
      for (String id : getFsnIds()) {
        axiom = substituteIdInAxiom(axiom, id, getFsn(id));
      }
      axiom = substituteIdInAxiom(axiom, conceptId.toString(), "");

      return axiom;
    }
  }

  public String substituteIdsForPtInAxiom(String axiom, @NotNull Integer conceptId) {
    synchronized (idToPtMap) {
      for (String id : getPtIds()) {
        axiom = substituteIdInAxiom(axiom, id, getPt(id));
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

  public void addFsnAndPt(String id, String fsn, String pt) {
    synchronized (idToFsnMap) {
      idToFsnMap.put(id, fsn);
    }
    synchronized (idToPtMap) {
      idToPtMap.put(id, pt);
    }
  }

  public Set<String> getFsnIds() {
    synchronized (idToFsnMap) {
      return this.idToFsnMap.keySet();
    }
  }

  public Set<String> getPtIds() {
    synchronized (idToPtMap) {
      return this.idToPtMap.keySet();
    }
  }

  public String getFsn(String id) {
    synchronized (idToFsnMap) {
      return this.idToFsnMap.get(id);
    }
  }

  public String getPt(String id) {
    synchronized (idToPtMap) {
      return this.idToPtMap.get(id);
    }
  }

  public synchronized int getNextId() {
    return nextId--;
  }
}
