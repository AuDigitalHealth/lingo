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
package au.gov.digitalhealth.lingo.traceability;

import au.gov.digitalhealth.lingo.traceability.ComponentChange.ChangeType;
import au.gov.digitalhealth.lingo.traceability.ComponentChange.ComponentType;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The net effect of a sequence of traceability activities on a single branch.
 *
 * <p>Replays the activity log chronologically (oldest commit first), ignoring entries marked
 * {@code superseded=true}, and reports — per component type — which IDs were touched and which
 * are still present (i.e. the most recent non-superseded change is not a {@code DELETE}).
 *
 * <p>Used by dangling-reference detection to scope inspection to exactly the components the task
 * actually authored, instead of inferring scope from Snowstorm queries that don't always mean
 * what we want.
 */
public record BranchChangeSummary(
    Set<String> conceptIdsTouched,
    Set<String> refsetMemberIdsStillOnBranch,
    Set<String> relationshipIdsStillOnBranch) {

  public static BranchChangeSummary from(List<Activity> activities) {
    // Sort defensively so callers don't have to. Activities with a null commitDate sort last so
    // they don't get misordered ahead of dated entries; same-date ties keep insertion order.
    List<Activity> ordered = new ArrayList<>(activities);
    ordered.sort(
        Comparator.comparing(
            Activity::commitDate, Comparator.nullsLast(Comparator.naturalOrder())));

    Set<String> conceptIdsTouched = new HashSet<>();
    // Track only the LAST non-superseded change per componentId. ChangeType=DELETE on the latest
    // change means the component is gone; anything else means it's still there.
    Map<String, ChangeType> lastMemberChange = new HashMap<>();
    Map<String, ChangeType> lastRelationshipChange = new HashMap<>();

    for (Activity activity : ordered) {
      if (activity.conceptChanges() == null) continue;
      for (ConceptChange conceptChange : activity.conceptChanges()) {
        if (conceptChange.conceptId() != null) conceptIdsTouched.add(conceptChange.conceptId());
        if (conceptChange.componentChanges() == null) continue;
        for (ComponentChange change : conceptChange.componentChanges()) {
          if (Boolean.TRUE.equals(change.superseded())) continue;
          if (change.componentId() == null || change.componentType() == null) continue;
          if (change.componentType() == ComponentType.REFERENCE_SET_MEMBER) {
            lastMemberChange.put(change.componentId(), change.changeType());
          } else if (change.componentType() == ComponentType.RELATIONSHIP) {
            lastRelationshipChange.put(change.componentId(), change.changeType());
          }
        }
      }
    }

    return new BranchChangeSummary(
        conceptIdsTouched,
        stillPresent(lastMemberChange),
        stillPresent(lastRelationshipChange));
  }

  private static Set<String> stillPresent(Map<String, ChangeType> latest) {
    Set<String> present = new HashSet<>();
    for (Map.Entry<String, ChangeType> entry : latest.entrySet()) {
      if (entry.getValue() != ChangeType.DELETE) present.add(entry.getKey());
    }
    return present;
  }

}
