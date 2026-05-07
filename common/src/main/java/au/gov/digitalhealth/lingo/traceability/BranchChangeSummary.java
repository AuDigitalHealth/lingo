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
import java.util.logging.Logger;

/**
 * The net effect of a sequence of traceability activities on a single branch.
 *
 * <p>Replays the activity log chronologically (oldest commit first), ignoring entries marked
 * {@code superseded=true}, and reports three id sets keyed by what dangling-reference detection
 * needs to look up:
 *
 * <ul>
 *   <li>{@link #refsetMemberIdsStillOnBranch()} — refset members whose latest non-superseded
 *       change is not a {@code DELETE}. Used to fetch per-id from Snowstorm and check that each
 *       member's referenced concept is still active.
 *   <li>{@link #relationshipIdsStillOnBranch()} — same shape for non-defining relationships.
 *   <li>{@link #conceptIdsInactivatedOnBranch()} — concepts whose latest non-superseded change
 *       is an {@code INACTIVATE}. Used to fan out and find any active member or relationship on
 *       the branch that still references them; those are dangling and need cleanup too.
 * </ul>
 *
 * <p>Description changes are intentionally not tracked. The returned record is immutable: the
 * canonical constructor wraps each input set in a defensive {@link Set#copyOf}, so accessors
 * hand out unmodifiable views even if a caller supplied mutable inputs.
 */
public record BranchChangeSummary(
    Set<String> refsetMemberIdsStillOnBranch,
    Set<String> relationshipIdsStillOnBranch,
    Set<String> conceptIdsInactivatedOnBranch) {

  private static final Logger log = Logger.getLogger(BranchChangeSummary.class.getName());

  public BranchChangeSummary {
    refsetMemberIdsStillOnBranch =
        refsetMemberIdsStillOnBranch == null ? Set.of() : Set.copyOf(refsetMemberIdsStillOnBranch);
    relationshipIdsStillOnBranch =
        relationshipIdsStillOnBranch == null ? Set.of() : Set.copyOf(relationshipIdsStillOnBranch);
    conceptIdsInactivatedOnBranch =
        conceptIdsInactivatedOnBranch == null
            ? Set.of()
            : Set.copyOf(conceptIdsInactivatedOnBranch);
  }

  public static BranchChangeSummary from(List<Activity> activities) {
    if (activities == null || activities.isEmpty()) {
      return new BranchChangeSummary(Set.of(), Set.of(), Set.of());
    }
    // Track only the LAST non-superseded change per componentId. For members/rels, DELETE on
    // the latest change means the component is gone; anything else means it's still there. For
    // concepts, INACTIVATE on the latest change means the concept ended up retired on this task
    // (so its inherited references may be dangling).
    Map<String, ChangeType> lastMemberChange = new HashMap<>();
    Map<String, ChangeType> lastRelationshipChange = new HashMap<>();
    Map<String, ChangeType> lastConceptChange = new HashMap<>();
    for (Activity activity : orderedByCommitDate(activities)) {
      recordActivity(activity, lastMemberChange, lastRelationshipChange, lastConceptChange);
    }
    return new BranchChangeSummary(
        stillPresent(lastMemberChange),
        stillPresent(lastRelationshipChange),
        inactivated(lastConceptChange));
  }

  // Sort defensively so callers don't have to. Activities with a null commitDate sort last so
  // they don't get misordered ahead of dated entries; same-date ties keep insertion order.
  private static List<Activity> orderedByCommitDate(List<Activity> activities) {
    List<Activity> ordered = new ArrayList<>(activities);
    ordered.sort(
        Comparator.comparing(
            Activity::commitDate, Comparator.nullsLast(Comparator.naturalOrder())));
    return ordered;
  }

  private static void recordActivity(
      Activity activity,
      Map<String, ChangeType> lastMember,
      Map<String, ChangeType> lastRel,
      Map<String, ChangeType> lastConcept) {
    if (activity != null && activity.conceptChanges() != null) {
      for (ConceptChange conceptChange : activity.conceptChanges()) {
        recordConceptChange(conceptChange, lastMember, lastRel, lastConcept);
      }
    }
  }

  private static void recordConceptChange(
      ConceptChange conceptChange,
      Map<String, ChangeType> lastMember,
      Map<String, ChangeType> lastRel,
      Map<String, ChangeType> lastConcept) {
    if (conceptChange != null && conceptChange.componentChanges() != null) {
      for (ComponentChange change : conceptChange.componentChanges()) {
        recordComponentChange(
            change, conceptChange.conceptId(), lastMember, lastRel, lastConcept);
      }
    }
  }

  private static void recordComponentChange(
      ComponentChange change,
      String conceptIdForLog,
      Map<String, ChangeType> lastMember,
      Map<String, ChangeType> lastRel,
      Map<String, ChangeType> lastConcept) {
    if (change == null || Boolean.TRUE.equals(change.superseded())) {
      return;
    }
    if (!isWellFormed(change)) {
      // The traceability service should never emit a record without componentId / componentType
      // / changeType — log it so a genuine contract violation surfaces instead of being dropped.
      log.log(
          java.util.logging.Level.WARNING,
          "Skipping malformed traceability ComponentChange on concept {0}"
              + " (componentId={1}, componentType={2}, changeType={3})",
          new Object[] {
            conceptIdForLog, change.componentId(), change.componentType(), change.changeType()
          });
      return;
    }
    Map<String, ChangeType> target =
        mapFor(change.componentType(), lastMember, lastRel, lastConcept);
    if (target != null) {
      target.put(change.componentId(), change.changeType());
    }
  }

  private static boolean isWellFormed(ComponentChange change) {
    return change.componentId() != null
        && change.componentType() != null
        && change.changeType() != null;
  }

  // Picks the bucket the change should land in, or null for component types we intentionally
  // don't track (DESCRIPTION today). Centralised so the recordComponentChange body stays a
  // straight line of decisions rather than a chain of if/else-if/else-if.
  private static Map<String, ChangeType> mapFor(
      ComponentType type,
      Map<String, ChangeType> lastMember,
      Map<String, ChangeType> lastRel,
      Map<String, ChangeType> lastConcept) {
    return switch (type) {
      case REFERENCE_SET_MEMBER -> lastMember;
      case RELATIONSHIP -> lastRel;
      case CONCEPT -> lastConcept;
      default -> null;
    };
  }

  // The latest change for each component id is anything but a DELETE — so the component is
  // still present on the branch.
  private static Set<String> stillPresent(Map<String, ChangeType> latest) {
    Set<String> result = new HashSet<>();
    for (Map.Entry<String, ChangeType> entry : latest.entrySet()) {
      if (entry.getValue() != ChangeType.DELETE) result.add(entry.getKey());
    }
    return result;
  }

  // The latest change for each component id is INACTIVATE — concepts retired on the task.
  private static Set<String> inactivated(Map<String, ChangeType> latest) {
    Set<String> result = new HashSet<>();
    for (Map.Entry<String, ChangeType> entry : latest.entrySet()) {
      if (entry.getValue() == ChangeType.INACTIVATE) result.add(entry.getKey());
    }
    return result;
  }
}
