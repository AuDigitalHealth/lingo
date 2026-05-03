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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import au.gov.digitalhealth.lingo.traceability.ComponentChange.ChangeType;
import au.gov.digitalhealth.lingo.traceability.ComponentChange.ComponentType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class BranchChangeSummaryTest {

  @Test
  void from_emptyActivities_yieldsEmptySummary() {
    BranchChangeSummary summary = BranchChangeSummary.from(List.of());

    assertTrue(summary.conceptIdsTouched().isEmpty());
    assertTrue(summary.refsetMemberIdsStillOnBranch().isEmpty());
    assertTrue(summary.relationshipIdsStillOnBranch().isEmpty());
  }

  @Test
  void from_createWithoutDelete_keepsComponent() {
    Activity create = activity("t1", "2026-01-01T00:00:00Z", "concept-1", refsetMemberCreate("m1"));

    BranchChangeSummary summary = BranchChangeSummary.from(List.of(create));

    assertEquals(Set.of("m1"), summary.refsetMemberIdsStillOnBranch());
    assertEquals(Set.of("concept-1"), summary.conceptIdsTouched());
  }

  @Test
  void from_createThenDelete_dropsComponent() {
    // Created and then later deleted on the same branch — net effect: not present. Mirrors the
    // IEDC-7374 case where concepts and most of their refset members were created and then
    // deleted; only the dangling members from a later activity should survive.
    Activity create = activity("t1", "2026-01-01T00:00:00Z", "concept-1", refsetMemberCreate("m1"));
    Activity delete = activity("t2", "2026-01-02T00:00:00Z", "concept-1", refsetMemberDelete("m1"));

    BranchChangeSummary summary = BranchChangeSummary.from(List.of(create, delete));

    assertTrue(summary.refsetMemberIdsStillOnBranch().isEmpty());
    assertEquals(Set.of("concept-1"), summary.conceptIdsTouched());
  }

  @Test
  void from_supersededChangesAreIgnored() {
    Activity superseded =
        activity(
            "t1",
            "2026-01-01T00:00:00Z",
            "concept-1",
            new ComponentChange(
                "m1", ChangeType.CREATE, ComponentType.REFERENCE_SET_MEMBER, null, true, true));

    BranchChangeSummary summary = BranchChangeSummary.from(List.of(superseded));

    assertTrue(summary.refsetMemberIdsStillOnBranch().isEmpty());
  }

  @Test
  void from_outOfOrderActivities_areReorderedByCommitDate() {
    // The aggregator must not depend on caller-supplied ordering — it sorts by commitDate so
    // CREATE then DELETE in the wrong wall-clock order still nets to "deleted".
    Activity delete = activity("t2", "2026-01-02T00:00:00Z", "concept-1", refsetMemberDelete("m1"));
    Activity create = activity("t1", "2026-01-01T00:00:00Z", "concept-1", refsetMemberCreate("m1"));

    BranchChangeSummary summary = BranchChangeSummary.from(List.of(delete, create));

    assertTrue(summary.refsetMemberIdsStillOnBranch().isEmpty());
  }

  @Test
  void from_relationshipCreates_areTrackedSeparatelyFromMembers() {
    Activity activity =
        activity(
            "t1",
            "2026-01-01T00:00:00Z",
            "concept-1",
            new ComponentChange(
                "rel-1", ChangeType.CREATE, ComponentType.RELATIONSHIP, null, true, false),
            refsetMemberCreate("mem-1"));

    BranchChangeSummary summary = BranchChangeSummary.from(List.of(activity));

    assertEquals(Set.of("rel-1"), summary.relationshipIdsStillOnBranch());
    assertEquals(Set.of("mem-1"), summary.refsetMemberIdsStillOnBranch());
  }

  private static Activity activity(
      String id, String commitDate, String conceptId, ComponentChange... changes) {
    return new Activity(
        id,
        "tester",
        "MAIN/PROJECT/TASK",
        "MAIN/PROJECT/TASK",
        OffsetDateTime.parse(commitDate),
        "CONTENT_CHANGE",
        List.of(new ConceptChange(conceptId, List.of(changes))));
  }

  private static ComponentChange refsetMemberCreate(String id) {
    return new ComponentChange(
        id, ChangeType.CREATE, ComponentType.REFERENCE_SET_MEMBER, null, true, false);
  }

  private static ComponentChange refsetMemberDelete(String id) {
    return new ComponentChange(
        id, ChangeType.DELETE, ComponentType.REFERENCE_SET_MEMBER, null, true, false);
  }
}
