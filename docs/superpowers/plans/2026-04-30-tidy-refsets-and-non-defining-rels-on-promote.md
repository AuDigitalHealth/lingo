# Tidy refsets and non-defining relationships on promote — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect dangling reference set members and dangling non-defining relationships left behind by Authoring Platform retire/delete on a task branch, present a summary in the existing `PromoteTaskModal`, and on user confirmation tidy them (delete unreleased, inactivate released) before delegating to `auto-promote`.

**Architecture:** Two new Lingo endpoints — `GET /api/tasks/{projectKey}/{taskKey}/dangling-references` (read-only detection) and `POST /api/tasks/{projectKey}/{taskKey}/dangling-references/tidy` (cleanup with per-item result). Detection uses `nullEffectiveTime=true` to filter refset members modified on the task branch and a client-side `released=false` filter on non-defining relationships (characteristic type `900000000000227009`). UI calls detection eagerly when the modal opens and chains tidy → auto-promote when the user confirms.

**Tech Stack:** Java 17 + Spring Boot (`api/`), TypeScript + React + MUI (`ui/`), Snowstorm Java Client. Tests: JUnit 5 (backend), React Testing Library / Cypress (frontend, where conventions exist).

**Spec:** `docs/superpowers/specs/2026-04-30-tidy-refsets-and-non-defining-rels-on-promote-design.md`

---

## File Structure

**Create (backend):**
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/ConceptStatus.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/DanglingRefsetMember.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/DanglingNonDefiningRelationship.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/DanglingReferenceSummary.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidyAction.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidyKind.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidySuccess.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidyFailure.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidyResult.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java`
- `api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java`

**Create (frontend):**
- `ui/src/types/danglingReferences.ts`
- `ui/src/hooks/api/task/useDanglingReferences.tsx`
- `ui/src/hooks/api/task/useTidyDanglingReferences.tsx`

**Modify (backend):**
- `common/src/main/java/au/gov/digitalhealth/lingo/service/SnowstormClient.java` — add `getRefsetMembersModifiedOnBranch(...)`, `getNonDefiningRelationshipsModifiedOnBranch(...)`, `inactivateRefsetMember(...)`, `deleteRefsetMember(...)` (or reuse `removeRefsetMembers`), `inactivateRelationship(...)`, `deleteRelationship(...)`.
- `api/src/main/java/au/gov/digitalhealth/lingo/controllers/TasksController.java` — add the two new endpoints delegating to `DanglingReferenceService`.

**Modify (frontend):**
- `ui/src/api/TasksService.ts` — add `getDanglingReferences(projectKey, taskKey)` and `tidyDanglingReferences(projectKey, taskKey)`.
- `ui/src/pages/tasks/components/PromoteTaskModal.tsx` — render dangling-reference section, change Promote button label, chain tidy → auto-promote, surface detection/tidy errors.

---

## Task 1: Backend DTOs

**Files:**
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/ConceptStatus.java`
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/DanglingRefsetMember.java`
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/DanglingNonDefiningRelationship.java`
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/DanglingReferenceSummary.java`
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidyAction.java`
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidyKind.java`
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidySuccess.java`
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidyFailure.java`
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/promotion/TidyResult.java`

- [ ] **Step 1: Create the enums and records.**

`ConceptStatus.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

public enum ConceptStatus {
  ACTIVE,
  RETIRED,
  DELETED
}
```

`TidyKind.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

public enum TidyKind {
  REFSET_MEMBER,
  NON_DEFINING_RELATIONSHIP
}
```

`TidyAction.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

public enum TidyAction {
  DELETED,
  INACTIVATED
}
```

`DanglingRefsetMember.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

public record DanglingRefsetMember(
    String memberId,
    String refsetId,
    String refsetPt,
    String referencedConceptId,
    String referencedConceptPt,
    ConceptStatus referencedConceptStatus,
    boolean released) {}
```

`DanglingNonDefiningRelationship.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

public record DanglingNonDefiningRelationship(
    String relationshipId,
    String typeId,
    String typePt,
    String sourceId,
    String sourcePt,
    ConceptStatus sourceStatus,
    String destinationId,
    String destinationPt,
    ConceptStatus destinationStatus,
    boolean released) {}
```

`DanglingReferenceSummary.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

import java.util.List;

public record DanglingReferenceSummary(
    String branch,
    List<DanglingRefsetMember> danglingRefsetMembers,
    List<DanglingNonDefiningRelationship> danglingNonDefiningRelationships) {

  public boolean hasDanglingReferences() {
    return !danglingRefsetMembers.isEmpty() || !danglingNonDefiningRelationships.isEmpty();
  }
}
```

`TidySuccess.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

public record TidySuccess(TidyKind kind, String id, TidyAction action) {}
```

`TidyFailure.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

public record TidyFailure(TidyKind kind, String id, TidyAction attemptedAction, String errorMessage) {}
```

`TidyResult.java`:
```java
package au.gov.digitalhealth.lingo.promotion;

import java.util.List;

public record TidyResult(List<TidySuccess> succeeded, List<TidyFailure> failed) {

  public boolean hasFailures() {
    return !failed.isEmpty();
  }
}
```

- [ ] **Step 2: Compile.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml -pl api -am compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit.**

```bash
git add api/src/main/java/au/gov/digitalhealth/lingo/promotion/
git commit -m "feat(api): add dangling-reference DTOs for issue #1753"
```

---

## Task 2: SnowstormClient — fetch refset members modified on branch

**Files:**
- Modify: `common/src/main/java/au/gov/digitalhealth/lingo/service/SnowstormClient.java`

- [ ] **Step 1: Add a method `getRefsetMembersModifiedOnBranch`.**

Insert near the existing `getRefsetMembers` block (around line 514-535):

```java
public Mono<List<SnowstormReferenceSetMember>> getRefsetMembersModifiedOnBranch(String branch) {
  SnowstormMemberSearchRequestComponent searchRequestComponent =
      new SnowstormMemberSearchRequestComponent()
          .active(true)
          .nullEffectiveTime(true);
  return collectAllPages(
      offset ->
          getRefsetMembersApi()
              .findRefsetMembers(branch, searchRequestComponent, offset, 1000, languageHeader));
}

private Mono<List<SnowstormReferenceSetMember>> collectAllPages(
    java.util.function.IntFunction<Mono<SnowstormItemsPageReferenceSetMember>> pageFetcher) {
  return pageFetcher
      .apply(0)
      .flatMap(
          first -> {
            int total = first.getTotal() == null ? 0 : first.getTotal().intValue();
            int pageSize = first.getItems() == null ? 0 : first.getItems().size();
            if (pageSize == 0 || pageSize >= total) {
              return Mono.just(
                  first.getItems() == null ? List.<SnowstormReferenceSetMember>of() : first.getItems());
            }
            int pages = (int) Math.ceil((double) total / pageSize);
            return reactor.core.publisher.Flux.range(1, pages - 1)
                .concatMap(i -> pageFetcher.apply(i * pageSize))
                .flatMapIterable(p -> p.getItems() == null ? List.of() : p.getItems())
                .startWith(first.getItems())
                .collectList();
          });
}
```

- [ ] **Step 2: Compile.**

Run: `mvn -f /Users/mcm184/Projects/snomio/common/pom.xml compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit.**

```bash
git add common/src/main/java/au/gov/digitalhealth/lingo/service/SnowstormClient.java
git commit -m "feat(common): add getRefsetMembersModifiedOnBranch for #1753"
```

---

## Task 3: SnowstormClient — fetch non-defining relationships modified on branch

**Files:**
- Modify: `common/src/main/java/au/gov/digitalhealth/lingo/service/SnowstormClient.java`

- [ ] **Step 1: Add `getNonDefiningRelationshipsModifiedOnBranch`.**

Insert after the existing `getRelationships` method:

```java
public static final String NON_DEFINING_CHARACTERISTIC_TYPE = "900000000000227009";

public Mono<List<SnowstormRelationship>> getNonDefiningRelationshipsModifiedOnBranch(String branch) {
  RelationshipsApi api = new RelationshipsApi(getApiClient());
  return api.findRelationships(
          branch,
          /* active */ true,
          /* module */ null,
          /* effectiveTime */ null,
          /* source */ null,
          /* type */ null,
          /* destination */ null,
          /* characteristicType */ NON_DEFINING_CHARACTERISTIC_TYPE,
          /* group */ null,
          /* offset */ 0,
          /* limit */ 10000,
          languageHeader)
      .map(page -> page.getItems() == null ? List.<SnowstormRelationship>of() : page.getItems())
      .map(
          items ->
              items.stream()
                  .filter(r -> Boolean.FALSE.equals(r.getReleased()))
                  .toList());
}
```

- [ ] **Step 2: Compile.**

Run: `mvn -f /Users/mcm184/Projects/snomio/common/pom.xml compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit.**

```bash
git add common/src/main/java/au/gov/digitalhealth/lingo/service/SnowstormClient.java
git commit -m "feat(common): add getNonDefiningRelationshipsModifiedOnBranch for #1753"
```

---

## Task 4: SnowstormClient — tidy operations (inactivate / delete)

**Files:**
- Modify: `common/src/main/java/au/gov/digitalhealth/lingo/service/SnowstormClient.java`

- [ ] **Step 1: Add inactivate/delete helpers.**

Existing `removeRefsetMembers(branch, members)` already handles deletion. Add:

```java
public void inactivateRefsetMember(String branch, SnowstormReferenceSetMember member) {
  member.setActive(false);
  getRefsetMembersApi()
      .updateMember(branch, member.getMemberId(), /* createIfMissing */ false, member, languageHeader)
      .block();
}

public void deleteRelationship(String branch, String relationshipId) {
  new RelationshipsApi(getApiClient())
      .deleteRelationship(branch, relationshipId)
      .block();
}

public void inactivateRelationship(String branch, SnowstormRelationship relationship) {
  relationship.setActive(false);
  new RelationshipsApi(getApiClient())
      .updateRelationship(branch, relationship.getRelationshipId(), relationship, languageHeader)
      .block();
}
```

If the exact API method names differ in the generated client, adjust by inspecting `RefsetMembersApi` and `RelationshipsApi` in the generated sources.

- [ ] **Step 2: Compile.**

Run: `mvn -f /Users/mcm184/Projects/snomio/common/pom.xml compile -q`
Expected: BUILD SUCCESS. If method names mismatch, fix and recompile until green.

- [ ] **Step 3: Commit.**

```bash
git add common/src/main/java/au/gov/digitalhealth/lingo/service/SnowstormClient.java
git commit -m "feat(common): add inactivate/delete helpers for refset members and relationships"
```

---

## Task 5: DanglingReferenceService — detect (failing test first)

**Files:**
- Create: `api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java`
- Create: `api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java`

- [ ] **Step 1: Write the first failing test — empty branch returns empty summary.**

`DanglingReferenceServiceTest.java`:
```java
package au.gov.digitalhealth.lingo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.promotion.DanglingReferenceSummary;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class DanglingReferenceServiceTest {

  @Mock SnowstormClient snowstormClient;
  @InjectMocks DanglingReferenceService service;

  private static final String BRANCH = "MAIN/SNOMIO-PROJECT/SNOMIO-1";

  @Test
  void detect_returnsEmptySummaryWhenNoModifiedComponents() {
    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.<SnowstormReferenceSetMember>of()));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.<SnowstormRelationship>of()));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).isEmpty();
    assertThat(summary.danglingNonDefiningRelationships()).isEmpty();
    assertThat(summary.hasDanglingReferences()).isFalse();
  }
}
```

- [ ] **Step 2: Run the test to verify it fails to compile.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: compilation error — `DanglingReferenceService` does not exist.

- [ ] **Step 3: Create the minimal service to make the test pass.**

`DanglingReferenceService.java`:
```java
package au.gov.digitalhealth.lingo.service;

import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.promotion.DanglingReferenceSummary;
import java.util.List;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class DanglingReferenceService {

  private final SnowstormClient snowstormClient;

  public DanglingReferenceService(SnowstormClient snowstormClient) {
    this.snowstormClient = snowstormClient;
  }

  public DanglingReferenceSummary detect(String branch) {
    Mono<List<SnowstormReferenceSetMember>> membersMono =
        snowstormClient.getRefsetMembersModifiedOnBranch(branch);
    Mono<List<SnowstormRelationship>> relationshipsMono =
        snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(branch);

    return Mono.zip(membersMono, relationshipsMono)
        .map(
            tuple ->
                new DanglingReferenceSummary(
                    branch,
                    /* danglingRefsetMembers */ List.of(),
                    /* danglingNonDefiningRelationships */ List.of()))
        .block();
  }
}
```

- [ ] **Step 4: Run test, verify pass.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: 1 test passing.

- [ ] **Step 5: Commit.**

```bash
git add api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java
git commit -m "feat(api): scaffold DanglingReferenceService with empty-branch test"
```

---

## Task 6: DanglingReferenceService — detect dangling refset members for retired concept

**Files:**
- Modify: `api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java`
- Modify: `api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java`

- [ ] **Step 1: Add failing test — refset member referencing retired concept is detected.**

Append to `DanglingReferenceServiceTest`:
```java
@Test
void detect_flagsRefsetMemberReferencingRetiredConcept() {
  SnowstormReferenceSetMember member =
      new SnowstormReferenceSetMember()
          .memberId("m1")
          .refsetId("refset-1")
          .referencedComponentId("c-retired")
          .released(true)
          .active(true);

  when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.of(member)));
  when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.<SnowstormRelationship>of()));

  SnowstormConceptMini retired =
      new SnowstormConceptMini().conceptId("c-retired").active(false).pt(new SnowstormTermLangPojo().term("Retired thing"));
  SnowstormConceptMini refset =
      new SnowstormConceptMini().conceptId("refset-1").active(true).pt(new SnowstormTermLangPojo().term("My refset"));
  when(snowstormClient.getConceptsById(eq(BRANCH), any()))
      .thenReturn(List.of(retired, refset));

  DanglingReferenceSummary summary = service.detect(BRANCH);

  assertThat(summary.danglingRefsetMembers()).hasSize(1);
  DanglingRefsetMember d = summary.danglingRefsetMembers().get(0);
  assertThat(d.memberId()).isEqualTo("m1");
  assertThat(d.refsetPt()).isEqualTo("My refset");
  assertThat(d.referencedConceptStatus()).isEqualTo(ConceptStatus.RETIRED);
  assertThat(d.referencedConceptPt()).isEqualTo("Retired thing");
  assertThat(d.released()).isTrue();
}
```

Add imports as needed: `au.csiro.snowstorm_client.model.SnowstormConceptMini`, `SnowstormTermLangPojo`, `static org.mockito.ArgumentMatchers.eq`, `au.gov.digitalhealth.lingo.promotion.*`.

- [ ] **Step 2: Run, expect failure.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: 1 failing — empty summary returned.

- [ ] **Step 3: Implement detection logic.**

Replace `detect` body:
```java
public DanglingReferenceSummary detect(String branch) {
  Mono<List<SnowstormReferenceSetMember>> membersMono =
      snowstormClient.getRefsetMembersModifiedOnBranch(branch);
  Mono<List<SnowstormRelationship>> relationshipsMono =
      snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(branch);

  var tuple = Mono.zip(membersMono, relationshipsMono).block();
  List<SnowstormReferenceSetMember> members = tuple.getT1();
  List<SnowstormRelationship> relationships = tuple.getT2();

  Set<String> conceptIds = new HashSet<>();
  for (SnowstormReferenceSetMember m : members) {
    if (m.getReferencedComponentId() != null) conceptIds.add(m.getReferencedComponentId());
    if (m.getRefsetId() != null) conceptIds.add(m.getRefsetId());
  }
  for (SnowstormRelationship r : relationships) {
    if (r.getSourceId() != null) conceptIds.add(r.getSourceId());
    if (r.getDestinationId() != null) conceptIds.add(r.getDestinationId());
    if (r.getTypeId() != null) conceptIds.add(r.getTypeId());
  }

  Map<String, SnowstormConceptMini> byId = new HashMap<>();
  if (!conceptIds.isEmpty()) {
    List<SnowstormConceptMini> resolved = snowstormClient.getConceptsById(branch, conceptIds);
    for (SnowstormConceptMini c : resolved) {
      byId.put(c.getConceptId(), c);
    }
  }

  List<DanglingRefsetMember> danglingMembers = new ArrayList<>();
  for (SnowstormReferenceSetMember m : members) {
    String refId = m.getReferencedComponentId();
    SnowstormConceptMini ref = byId.get(refId);
    ConceptStatus status = statusOf(refId, ref);
    if (status == ConceptStatus.ACTIVE) continue;
    SnowstormConceptMini refsetConcept = byId.get(m.getRefsetId());
    danglingMembers.add(
        new DanglingRefsetMember(
            m.getMemberId(),
            m.getRefsetId(),
            ptOrNull(refsetConcept),
            refId,
            ptOrNull(ref),
            status,
            Boolean.TRUE.equals(m.getReleased())));
  }

  List<DanglingNonDefiningRelationship> danglingRels = new ArrayList<>();
  for (SnowstormRelationship r : relationships) {
    SnowstormConceptMini src = byId.get(r.getSourceId());
    SnowstormConceptMini dst = byId.get(r.getDestinationId());
    SnowstormConceptMini type = byId.get(r.getTypeId());
    ConceptStatus srcStatus = statusOf(r.getSourceId(), src);
    ConceptStatus dstStatus = statusOf(r.getDestinationId(), dst);
    if (srcStatus == ConceptStatus.ACTIVE && dstStatus == ConceptStatus.ACTIVE) continue;
    danglingRels.add(
        new DanglingNonDefiningRelationship(
            r.getRelationshipId(),
            r.getTypeId(),
            ptOrNull(type),
            r.getSourceId(),
            ptOrNull(src),
            srcStatus,
            r.getDestinationId(),
            ptOrNull(dst),
            dstStatus,
            Boolean.TRUE.equals(r.getReleased())));
  }

  return new DanglingReferenceSummary(branch, danglingMembers, danglingRels);
}

private static ConceptStatus statusOf(String id, SnowstormConceptMini concept) {
  if (id == null) return ConceptStatus.ACTIVE;
  if (concept == null) return ConceptStatus.DELETED;
  if (Boolean.FALSE.equals(concept.getActive())) return ConceptStatus.RETIRED;
  return ConceptStatus.ACTIVE;
}

private static String ptOrNull(SnowstormConceptMini c) {
  return c == null || c.getPt() == null ? null : c.getPt().getTerm();
}
```

Add imports for `java.util.*`, `au.csiro.snowstorm_client.model.SnowstormConceptMini`, `au.gov.digitalhealth.lingo.promotion.*`.

- [ ] **Step 4: Run all tests, expect both passing.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: 2 tests passing.

- [ ] **Step 5: Commit.**

```bash
git add api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java
git commit -m "feat(api): detect refset members referencing retired concepts"
```

---

## Task 7: detect — deleted concept and active concept cases

**Files:**
- Modify: `api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java`

- [ ] **Step 1: Add tests for deleted-concept and active-concept cases.**

```java
@Test
void detect_flagsRefsetMemberReferencingDeletedConcept() {
  SnowstormReferenceSetMember member =
      new SnowstormReferenceSetMember()
          .memberId("m2")
          .refsetId("refset-1")
          .referencedComponentId("c-deleted")
          .released(false)
          .active(true);

  when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.of(member)));
  when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.<SnowstormRelationship>of()));

  SnowstormConceptMini refset =
      new SnowstormConceptMini().conceptId("refset-1").active(true).pt(new SnowstormTermLangPojo().term("My refset"));
  // Note: c-deleted is NOT returned by getConceptsById — simulating deletion.
  when(snowstormClient.getConceptsById(eq(BRANCH), any())).thenReturn(List.of(refset));

  DanglingReferenceSummary summary = service.detect(BRANCH);

  assertThat(summary.danglingRefsetMembers()).hasSize(1);
  DanglingRefsetMember d = summary.danglingRefsetMembers().get(0);
  assertThat(d.referencedConceptStatus()).isEqualTo(ConceptStatus.DELETED);
  assertThat(d.referencedConceptPt()).isNull();
  assertThat(d.refsetPt()).isEqualTo("My refset");
  assertThat(d.released()).isFalse();
}

@Test
void detect_ignoresRefsetMemberWhereReferencedConceptIsActive() {
  SnowstormReferenceSetMember member =
      new SnowstormReferenceSetMember()
          .memberId("m3")
          .refsetId("refset-1")
          .referencedComponentId("c-active")
          .released(true)
          .active(true);

  when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.of(member)));
  when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.<SnowstormRelationship>of()));

  SnowstormConceptMini active = new SnowstormConceptMini().conceptId("c-active").active(true);
  SnowstormConceptMini refset = new SnowstormConceptMini().conceptId("refset-1").active(true);
  when(snowstormClient.getConceptsById(eq(BRANCH), any())).thenReturn(List.of(active, refset));

  DanglingReferenceSummary summary = service.detect(BRANCH);

  assertThat(summary.danglingRefsetMembers()).isEmpty();
}
```

- [ ] **Step 2: Run all tests, expect 4 passing.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: 4 tests passing.

- [ ] **Step 3: Commit.**

```bash
git add api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java
git commit -m "test(api): cover deleted and active concept cases for refset members"
```

---

## Task 8: detect — non-defining relationships (source/destination cases)

**Files:**
- Modify: `api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java`

- [ ] **Step 1: Add tests for inactive source and inactive destination on non-defining relationships.**

```java
@Test
void detect_flagsNonDefiningRelationshipWhenSourceRetired() {
  SnowstormRelationship rel =
      new SnowstormRelationship()
          .relationshipId("r1")
          .sourceId("c-retired")
          .destinationId("c-active")
          .typeId("type-1")
          .released(false)
          .active(true)
          .characteristicType("ADDITIONAL_RELATIONSHIP");

  when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.<SnowstormReferenceSetMember>of()));
  when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.of(rel)));

  SnowstormConceptMini retired =
      new SnowstormConceptMini().conceptId("c-retired").active(false).pt(new SnowstormTermLangPojo().term("Retired source"));
  SnowstormConceptMini active = new SnowstormConceptMini().conceptId("c-active").active(true);
  SnowstormConceptMini type =
      new SnowstormConceptMini().conceptId("type-1").active(true).pt(new SnowstormTermLangPojo().term("My type"));
  when(snowstormClient.getConceptsById(eq(BRANCH), any())).thenReturn(List.of(retired, active, type));

  DanglingReferenceSummary summary = service.detect(BRANCH);

  assertThat(summary.danglingNonDefiningRelationships()).hasSize(1);
  DanglingNonDefiningRelationship d = summary.danglingNonDefiningRelationships().get(0);
  assertThat(d.sourceStatus()).isEqualTo(ConceptStatus.RETIRED);
  assertThat(d.destinationStatus()).isEqualTo(ConceptStatus.ACTIVE);
  assertThat(d.typePt()).isEqualTo("My type");
}

@Test
void detect_flagsNonDefiningRelationshipWhenDestinationDeleted() {
  SnowstormRelationship rel =
      new SnowstormRelationship()
          .relationshipId("r2")
          .sourceId("c-active")
          .destinationId("c-deleted")
          .typeId("type-1")
          .released(false)
          .active(true);

  when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.<SnowstormReferenceSetMember>of()));
  when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.of(rel)));

  SnowstormConceptMini active = new SnowstormConceptMini().conceptId("c-active").active(true);
  SnowstormConceptMini type = new SnowstormConceptMini().conceptId("type-1").active(true);
  when(snowstormClient.getConceptsById(eq(BRANCH), any())).thenReturn(List.of(active, type));

  DanglingReferenceSummary summary = service.detect(BRANCH);

  assertThat(summary.danglingNonDefiningRelationships()).hasSize(1);
  DanglingNonDefiningRelationship d = summary.danglingNonDefiningRelationships().get(0);
  assertThat(d.sourceStatus()).isEqualTo(ConceptStatus.ACTIVE);
  assertThat(d.destinationStatus()).isEqualTo(ConceptStatus.DELETED);
}
```

- [ ] **Step 2: Run all tests, expect 6 passing.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: 6 tests passing.

- [ ] **Step 3: Commit.**

```bash
git add api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java
git commit -m "test(api): cover non-defining relationship source/destination cases"
```

---

## Task 9: tidy — released members inactivate, unreleased delete

**Files:**
- Modify: `api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java`
- Modify: `api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java`

- [ ] **Step 1: Failing test for released → inactivate, unreleased → delete on refset members.**

```java
@Test
void tidy_releasedMember_isInactivated_unreleasedMember_isDeleted() {
  SnowstormReferenceSetMember releasedMember =
      new SnowstormReferenceSetMember()
          .memberId("m-released")
          .refsetId("refset-1")
          .referencedComponentId("c-retired")
          .released(true)
          .active(true);
  SnowstormReferenceSetMember unreleasedMember =
      new SnowstormReferenceSetMember()
          .memberId("m-unreleased")
          .refsetId("refset-1")
          .referencedComponentId("c-deleted")
          .released(false)
          .active(true);

  when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.of(releasedMember, unreleasedMember)));
  when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.<SnowstormRelationship>of()));
  SnowstormConceptMini retired =
      new SnowstormConceptMini().conceptId("c-retired").active(false);
  SnowstormConceptMini refset = new SnowstormConceptMini().conceptId("refset-1").active(true);
  when(snowstormClient.getConceptsById(eq(BRANCH), any())).thenReturn(List.of(retired, refset));

  TidyResult result = service.tidy(BRANCH);

  assertThat(result.failed()).isEmpty();
  assertThat(result.succeeded())
      .extracting(TidySuccess::id, TidySuccess::action)
      .containsExactlyInAnyOrder(
          tuple("m-released", TidyAction.INACTIVATED),
          tuple("m-unreleased", TidyAction.DELETED));

  verify(snowstormClient).inactivateRefsetMember(eq(BRANCH), eq(releasedMember));
  verify(snowstormClient).removeRefsetMembers(eq(BRANCH), eq(Set.of(unreleasedMember)));
}
```

Add imports: `static org.assertj.core.api.Assertions.tuple`, `static org.mockito.Mockito.verify`, `java.util.Set`, the new tidy DTO classes.

- [ ] **Step 2: Run, expect failure (`tidy` doesn't exist).**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: compile error, no `tidy` method.

- [ ] **Step 3: Implement `tidy` for refset members.**

Add to `DanglingReferenceService`:
```java
public TidyResult tidy(String branch) {
  // Re-fetch members and relationships to act on a fresh snapshot.
  var membersMono = snowstormClient.getRefsetMembersModifiedOnBranch(branch);
  var relationshipsMono = snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(branch);
  var tuple = Mono.zip(membersMono, relationshipsMono).block();
  List<SnowstormReferenceSetMember> members = tuple.getT1();
  List<SnowstormRelationship> relationships = tuple.getT2();

  // Resolve all referenced concepts.
  Set<String> conceptIds = new HashSet<>();
  for (SnowstormReferenceSetMember m : members) {
    if (m.getReferencedComponentId() != null) conceptIds.add(m.getReferencedComponentId());
  }
  for (SnowstormRelationship r : relationships) {
    if (r.getSourceId() != null) conceptIds.add(r.getSourceId());
    if (r.getDestinationId() != null) conceptIds.add(r.getDestinationId());
  }
  Map<String, SnowstormConceptMini> byId = new HashMap<>();
  if (!conceptIds.isEmpty()) {
    for (SnowstormConceptMini c : snowstormClient.getConceptsById(branch, conceptIds)) {
      byId.put(c.getConceptId(), c);
    }
  }

  List<TidySuccess> succeeded = new ArrayList<>();
  List<TidyFailure> failed = new ArrayList<>();

  for (SnowstormReferenceSetMember m : members) {
    ConceptStatus status = statusOf(m.getReferencedComponentId(), byId.get(m.getReferencedComponentId()));
    if (status == ConceptStatus.ACTIVE) continue;
    boolean released = Boolean.TRUE.equals(m.getReleased());
    TidyAction action = released ? TidyAction.INACTIVATED : TidyAction.DELETED;
    try {
      if (released) {
        snowstormClient.inactivateRefsetMember(branch, m);
      } else {
        snowstormClient.removeRefsetMembers(branch, Set.of(m));
      }
      succeeded.add(new TidySuccess(TidyKind.REFSET_MEMBER, m.getMemberId(), action));
    } catch (Exception e) {
      failed.add(
          new TidyFailure(TidyKind.REFSET_MEMBER, m.getMemberId(), action, e.getMessage()));
    }
  }

  for (SnowstormRelationship r : relationships) {
    ConceptStatus src = statusOf(r.getSourceId(), byId.get(r.getSourceId()));
    ConceptStatus dst = statusOf(r.getDestinationId(), byId.get(r.getDestinationId()));
    if (src == ConceptStatus.ACTIVE && dst == ConceptStatus.ACTIVE) continue;
    boolean released = Boolean.TRUE.equals(r.getReleased());
    TidyAction action = released ? TidyAction.INACTIVATED : TidyAction.DELETED;
    try {
      if (released) {
        snowstormClient.inactivateRelationship(branch, r);
      } else {
        snowstormClient.deleteRelationship(branch, r.getRelationshipId());
      }
      succeeded.add(new TidySuccess(TidyKind.NON_DEFINING_RELATIONSHIP, r.getRelationshipId(), action));
    } catch (Exception e) {
      failed.add(
          new TidyFailure(
              TidyKind.NON_DEFINING_RELATIONSHIP,
              r.getRelationshipId(),
              action,
              e.getMessage()));
    }
  }

  return new TidyResult(succeeded, failed);
}
```

- [ ] **Step 4: Run, expect pass.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: 7 tests passing.

- [ ] **Step 5: Commit.**

```bash
git add api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java
git commit -m "feat(api): tidy dangling refset members (inactivate/delete)"
```

---

## Task 10: tidy — relationships and partial failure

**Files:**
- Modify: `api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java`

- [ ] **Step 1: Failing tests for relationship tidy and partial failure.**

```java
@Test
void tidy_releasedRelationship_inactivated_unreleased_deleted() {
  SnowstormRelationship released =
      new SnowstormRelationship().relationshipId("r-rel").sourceId("c-retired").destinationId("c-active").typeId("t").released(true).active(true);
  SnowstormRelationship unreleased =
      new SnowstormRelationship().relationshipId("r-unrel").sourceId("c-active").destinationId("c-deleted").typeId("t").released(false).active(true);

  when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.<SnowstormReferenceSetMember>of()));
  when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.of(released, unreleased)));

  SnowstormConceptMini retired =
      new SnowstormConceptMini().conceptId("c-retired").active(false);
  SnowstormConceptMini active = new SnowstormConceptMini().conceptId("c-active").active(true);
  when(snowstormClient.getConceptsById(eq(BRANCH), any())).thenReturn(List.of(retired, active));

  TidyResult result = service.tidy(BRANCH);

  assertThat(result.failed()).isEmpty();
  assertThat(result.succeeded())
      .extracting(TidySuccess::id, TidySuccess::action)
      .containsExactlyInAnyOrder(
          tuple("r-rel", TidyAction.INACTIVATED), tuple("r-unrel", TidyAction.DELETED));

  verify(snowstormClient).inactivateRelationship(eq(BRANCH), eq(released));
  verify(snowstormClient).deleteRelationship(eq(BRANCH), eq("r-unrel"));
}

@Test
void tidy_partialFailure_capturesPerItemError() {
  SnowstormReferenceSetMember m1 =
      new SnowstormReferenceSetMember().memberId("m1").refsetId("r").referencedComponentId("c-deleted").released(false).active(true);
  SnowstormReferenceSetMember m2 =
      new SnowstormReferenceSetMember().memberId("m2").refsetId("r").referencedComponentId("c-deleted").released(false).active(true);

  when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.of(m1, m2)));
  when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
      .thenReturn(Mono.just(List.<SnowstormRelationship>of()));
  when(snowstormClient.getConceptsById(eq(BRANCH), any())).thenReturn(List.of());

  doNothing().when(snowstormClient).removeRefsetMembers(eq(BRANCH), eq(Set.of(m1)));
  doThrow(new RuntimeException("snowstorm exploded"))
      .when(snowstormClient)
      .removeRefsetMembers(eq(BRANCH), eq(Set.of(m2)));

  TidyResult result = service.tidy(BRANCH);

  assertThat(result.succeeded())
      .extracting(TidySuccess::id)
      .containsExactly("m1");
  assertThat(result.failed())
      .extracting(TidyFailure::id, TidyFailure::attemptedAction, TidyFailure::errorMessage)
      .containsExactly(tuple("m2", TidyAction.DELETED, "snowstorm exploded"));
}
```

Add `static org.mockito.Mockito.doNothing`, `doThrow`.

- [ ] **Step 2: Run, expect pass (logic was already in place from Task 9).**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: 9 tests passing.

- [ ] **Step 3: Commit.**

```bash
git add api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java
git commit -m "test(api): cover relationship tidy and partial failure"
```

---

## Task 11: Controller endpoints

**Files:**
- Modify: `api/src/main/java/au/gov/digitalhealth/lingo/controllers/TasksController.java`

- [ ] **Step 1: Inject `DanglingReferenceService` and add the two endpoints.**

Patch `TasksController` constructor signature and class fields:

```java
private final TaskManagerClient taskManagerClient;
private final DanglingReferenceService danglingReferenceService;
private final TaskManagerService taskManagerService;

public TasksController(
    TaskManagerClient taskManagerClient,
    DanglingReferenceService danglingReferenceService,
    TaskManagerService taskManagerService) {
  this.taskManagerClient = taskManagerClient;
  this.danglingReferenceService = danglingReferenceService;
  this.taskManagerService = taskManagerService;
}
```

Add endpoints:
```java
@GetMapping("/{projectKey}/{taskKey}/dangling-references")
public DanglingReferenceSummary getDanglingReferences(
    @PathVariable String projectKey, @PathVariable String taskKey) {
  String branch = taskManagerService.resolveBranch(projectKey, taskKey);
  return danglingReferenceService.detect(branch);
}

@PostMapping("/{projectKey}/{taskKey}/dangling-references/tidy")
public TidyResult tidyDanglingReferences(
    @PathVariable String projectKey, @PathVariable String taskKey) {
  String branch = taskManagerService.resolveBranch(projectKey, taskKey);
  return danglingReferenceService.tidy(branch);
}
```

If `TaskManagerService` does not already expose `resolveBranch(projectKey, taskKey)`, add a method that returns `taskManagerClient.getTaskByKey(projectKey, taskKey).getBranchPath()` (or the equivalent existing accessor — inspect `Task.java` and pick the right field).

Add imports: `au.gov.digitalhealth.lingo.promotion.*`, `au.gov.digitalhealth.lingo.service.DanglingReferenceService`, `au.gov.digitalhealth.lingo.service.TaskManagerService`, Spring's `@PathVariable`.

- [ ] **Step 2: Compile.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml -pl api -am compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit.**

```bash
git add api/src/main/java/au/gov/digitalhealth/lingo/controllers/TasksController.java api/src/main/java/au/gov/digitalhealth/lingo/service/TaskManagerService.java
git commit -m "feat(api): expose dangling-references detect and tidy endpoints"
```

---

## Task 12: Frontend — type definitions

**Files:**
- Create: `ui/src/types/danglingReferences.ts`

- [ ] **Step 1: Add the TS types mirroring the backend DTOs.**

```ts
export type ConceptStatus = 'ACTIVE' | 'RETIRED' | 'DELETED';
export type TidyKind = 'REFSET_MEMBER' | 'NON_DEFINING_RELATIONSHIP';
export type TidyAction = 'DELETED' | 'INACTIVATED';

export interface DanglingRefsetMember {
  memberId: string;
  refsetId: string;
  refsetPt: string | null;
  referencedConceptId: string;
  referencedConceptPt: string | null;
  referencedConceptStatus: ConceptStatus;
  released: boolean;
}

export interface DanglingNonDefiningRelationship {
  relationshipId: string;
  typeId: string;
  typePt: string | null;
  sourceId: string;
  sourcePt: string | null;
  sourceStatus: ConceptStatus;
  destinationId: string;
  destinationPt: string | null;
  destinationStatus: ConceptStatus;
  released: boolean;
}

export interface DanglingReferenceSummary {
  branch: string;
  danglingRefsetMembers: DanglingRefsetMember[];
  danglingNonDefiningRelationships: DanglingNonDefiningRelationship[];
}

export interface TidySuccess {
  kind: TidyKind;
  id: string;
  action: TidyAction;
}

export interface TidyFailure {
  kind: TidyKind;
  id: string;
  attemptedAction: TidyAction;
  errorMessage: string;
}

export interface TidyResult {
  succeeded: TidySuccess[];
  failed: TidyFailure[];
}
```

- [ ] **Step 2: Type-check.**

Run: `cd /Users/mcm184/Projects/snomio/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit.**

```bash
git add ui/src/types/danglingReferences.ts
git commit -m "feat(ui): add dangling-reference type definitions"
```

---

## Task 13: Frontend — TasksService methods

**Files:**
- Modify: `ui/src/api/TasksService.ts`

- [ ] **Step 1: Add two methods near the existing `autoPromote` (around line 149).**

```ts
import {
  DanglingReferenceSummary,
  TidyResult,
} from '../types/danglingReferences';

// ...inside the TasksService object:
async getDanglingReferences(
  projectKey: string,
  taskKey: string,
): Promise<DanglingReferenceSummary> {
  const response = await api.get<DanglingReferenceSummary>(
    `/api/tasks/${projectKey}/${taskKey}/dangling-references`,
  );
  if (response.status !== 200) {
    this.handleErrors();
  }
  return response.data;
},

async tidyDanglingReferences(
  projectKey: string,
  taskKey: string,
): Promise<TidyResult> {
  const response = await api.post<TidyResult>(
    `/api/tasks/${projectKey}/${taskKey}/dangling-references/tidy`,
  );
  if (response.status !== 200) {
    this.handleErrors();
  }
  return response.data;
},
```

(Adjust the import location to match the file — TasksService imports api from `./api`. Mirror existing code style for HTTP error handling.)

- [ ] **Step 2: Type-check.**

Run: `cd /Users/mcm184/Projects/snomio/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit.**

```bash
git add ui/src/api/TasksService.ts
git commit -m "feat(ui): TasksService methods for dangling-reference detect/tidy"
```

---

## Task 14: Frontend — useDanglingReferences hook

**Files:**
- Create: `ui/src/hooks/api/task/useDanglingReferences.tsx`

- [ ] **Step 1: Implement the query hook.**

```tsx
import { useQuery } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';
import { DanglingReferenceSummary } from '../../../types/danglingReferences';

interface Params {
  projectKey: string | undefined;
  taskKey: string | undefined;
  enabled?: boolean;
}

export function useDanglingReferences({ projectKey, taskKey, enabled = true }: Params) {
  return useQuery<DanglingReferenceSummary>({
    queryKey: ['dangling-references', projectKey, taskKey],
    queryFn: () => TasksServices.getDanglingReferences(projectKey!, taskKey!),
    enabled: enabled && Boolean(projectKey) && Boolean(taskKey),
  });
}
```

- [ ] **Step 2: Type-check.**

Run: `cd /Users/mcm184/Projects/snomio/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit.**

```bash
git add ui/src/hooks/api/task/useDanglingReferences.tsx
git commit -m "feat(ui): useDanglingReferences hook"
```

---

## Task 15: Frontend — useTidyDanglingReferences hook

**Files:**
- Create: `ui/src/hooks/api/task/useTidyDanglingReferences.tsx`

- [ ] **Step 1: Implement the mutation hook.**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';
import { TidyResult } from '../../../types/danglingReferences';

interface Params {
  projectKey: string;
  taskKey: string;
}

export function useTidyDanglingReferences() {
  const queryClient = useQueryClient();
  return useMutation<TidyResult, Error, Params>({
    mutationFn: ({ projectKey, taskKey }) =>
      TasksServices.tidyDanglingReferences(projectKey, taskKey),
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['dangling-references', variables.projectKey, variables.taskKey],
      });
    },
  });
}
```

- [ ] **Step 2: Type-check.**

Run: `cd /Users/mcm184/Projects/snomio/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit.**

```bash
git add ui/src/hooks/api/task/useTidyDanglingReferences.tsx
git commit -m "feat(ui): useTidyDanglingReferences mutation hook"
```

---

## Task 16: Frontend — wire detection into PromoteTaskModal

**Files:**
- Modify: `ui/src/pages/tasks/components/PromoteTaskModal.tsx`

- [ ] **Step 1: Use the detection hook and render the dangling section above the existing footer note.**

Add imports:
```tsx
import { useDanglingReferences } from '../../../hooks/api/task/useDanglingReferences';
import { useTidyDanglingReferences } from '../../../hooks/api/task/useTidyDanglingReferences';
import {
  DanglingReferenceSummary,
  TidyFailure,
} from '../../../types/danglingReferences';
```

Inside the component:
```tsx
const danglingQuery = useDanglingReferences({
  projectKey: task?.projectKey,
  taskKey: task?.key,
  enabled: modalOpen && Boolean(task),
});
const dangling = danglingQuery.data;
const danglingError = danglingQuery.isError;
const hasDangling =
  Boolean(dangling) &&
  (dangling!.danglingRefsetMembers.length > 0 ||
    dangling!.danglingNonDefiningRelationships.length > 0);

const tidyMutation = useTidyDanglingReferences();
const [tidyFailures, setTidyFailures] = React.useState<TidyFailure[] | null>(null);
```

Replace `handleConfirmPromotion`:
```tsx
const handleConfirmPromotion = async () => {
  if (!task) return;
  setTidyFailures(null);
  try {
    if (hasDangling) {
      const result = await tidyMutation.mutateAsync({
        projectKey: task.projectKey,
        taskKey: task.key,
      });
      if (result.failed.length > 0) {
        setTidyFailures(result.failed);
        return;
      }
    }
    await autoPromoteMutation.mutateAsync({
      projectKey: task.projectKey,
      taskKey: task.key,
    });
    setModalOpen(false);
  } catch (error) {
    enqueueSnackbar(
      'Error promoting task. Please attempt in the authoring platform.',
      { variant: 'error' },
    );
  }
};
```

Adjust the `canProceed` calculation:
```tsx
const canProceed =
  blockingIssues.length === 0 &&
  !autoPromoteMutation.isPending &&
  !tidyMutation.isPending &&
  !danglingError &&
  !danglingQuery.isFetching;
```

Add a render block for the dangling section right above the "Additional info for warnings" block:
```tsx
{danglingError && (
  <Alert severity="error">
    <AlertTitle>Could not check for dangling references</AlertTitle>
    Detection failed. Please retry before promoting.
    <Button
      size="small"
      sx={{ mt: 1 }}
      onClick={() => danglingQuery.refetch()}
    >
      Retry
    </Button>
  </Alert>
)}
{hasDangling && dangling && (
  <Alert severity="warning" icon={<Warning />}>
    <AlertTitle>
      {dangling.danglingRefsetMembers.length} dangling refset member
      {dangling.danglingRefsetMembers.length === 1 ? '' : 's'},{' '}
      {dangling.danglingNonDefiningRelationships.length} dangling non-defining relationship
      {dangling.danglingNonDefiningRelationships.length === 1 ? '' : 's'}
    </AlertTitle>
    <Typography variant="body2" sx={{ mb: 1 }}>
      These were left behind by retire/delete actions in the Authoring Platform. On
      promote, Lingo will tidy them: released components are inactivated, unreleased
      components are deleted.
    </Typography>
    {dangling.danglingRefsetMembers.length > 0 && (
      <>
        <Typography variant="subtitle2">Refset members</Typography>
        <ul>
          {dangling.danglingRefsetMembers.map(m => (
            <li key={m.memberId}>
              {m.refsetPt ?? m.refsetId} →{' '}
              {m.referencedConceptPt
                ? `${m.referencedConceptPt} (${m.referencedConceptStatus.toLowerCase()})`
                : `concept ${m.referencedConceptId} (deleted)`}
              {m.released ? ' — will be inactivated' : ' — will be deleted'}
            </li>
          ))}
        </ul>
      </>
    )}
    {dangling.danglingNonDefiningRelationships.length > 0 && (
      <>
        <Typography variant="subtitle2">Non-defining relationships</Typography>
        <ul>
          {dangling.danglingNonDefiningRelationships.map(r => (
            <li key={r.relationshipId}>
              {r.typePt ?? r.typeId}: {r.sourcePt ?? r.sourceId} ({r.sourceStatus.toLowerCase()}) →{' '}
              {r.destinationPt ?? r.destinationId} ({r.destinationStatus.toLowerCase()})
              {r.released ? ' — will be inactivated' : ' — will be deleted'}
            </li>
          ))}
        </ul>
      </>
    )}
  </Alert>
)}
{tidyFailures && tidyFailures.length > 0 && (
  <Alert severity="error">
    <AlertTitle>Tidy failed for {tidyFailures.length} item{tidyFailures.length === 1 ? '' : 's'}</AlertTitle>
    <Typography variant="body2" sx={{ mb: 1 }}>
      Promotion has been blocked. Please contact support and quote the following details:
    </Typography>
    <ul>
      {tidyFailures.map(f => (
        <li key={`${f.kind}-${f.id}`}>
          {f.kind} <code>{f.id}</code> — attempted {f.attemptedAction.toLowerCase()}: {f.errorMessage}
        </li>
      ))}
    </ul>
  </Alert>
)}
```

Update the Promote button label to handle the dangling case:
```tsx
{blockingIssues.length > 0
  ? 'Cannot Promote'
  : hasDangling
    ? 'Tidy & Promote'
    : warnings.length > 0
      ? 'Promote Anyway'
      : 'Promote Task'}
```

Update the loading flag:
```tsx
loading={isPromoting || tidyMutation.isPending}
```

Add `import React from 'react';` if not already present (or use a hook-style import for `useState`).

- [ ] **Step 2: Type-check.**

Run: `cd /Users/mcm184/Projects/snomio/ui && npx tsc --noEmit`
Expected: no errors. Fix any reported type issues until green.

- [ ] **Step 3: Build.**

Run: `cd /Users/mcm184/Projects/snomio/ui && npm run build`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit.**

```bash
git add ui/src/pages/tasks/components/PromoteTaskModal.tsx
git commit -m "feat(ui): show dangling reference summary and tidy on promote (#1753)"
```

---

## Task 17: End-to-end verification

- [ ] **Step 1: Backend full test run.**

Run: `mvn -f /Users/mcm184/Projects/snomio/api/pom.xml test -Dtest=DanglingReferenceServiceTest -q`
Expected: all 9 tests passing.

- [ ] **Step 2: Frontend type-check + build.**

Run: `cd /Users/mcm184/Projects/snomio/ui && npx tsc --noEmit && npm run build`
Expected: clean.

- [ ] **Step 3: Manual smoke test (if dev environment available).**

Start the backend and UI locally and exercise:
- A task with no AP retire/delete → modal opens, no dangling section, Promote behaves as today.
- A task with a retired published concept that has refset members modified on the branch → dangling section lists them; clicking "Tidy & Promote" inactivates them and proceeds with auto-promote.
- A task with deleted unpublished concept and unreleased refset members → dangling section lists them as "will be deleted"; clicking "Tidy & Promote" deletes them and proceeds.
- Inject a tidy failure (e.g. break the underlying refset member id) → tidy failure block shown; auto-promote not called.

If a dev environment is unavailable, document this gap honestly when reporting completion (per the project CLAUDE.md guidance) — do NOT claim manual testing happened when it didn't.

---

## Self-review checklist

Run this against the spec at `docs/superpowers/specs/2026-04-30-tidy-refsets-and-non-defining-rels-on-promote-design.md`:

- [x] Detection endpoint (GET) — Task 11.
- [x] Tidy endpoint (POST) — Task 11.
- [x] Strategy 2 detection (refset members modified on branch + non-defining rels modified on branch, characteristic type `900000000000227009`) — Tasks 2, 3.
- [x] Concept status classification ACTIVE/RETIRED/DELETED — Task 6 helper `statusOf`.
- [x] Tidy released → inactivate, unreleased → delete — Tasks 9, 10.
- [x] Best-effort tidy with per-item failure capture — Task 10.
- [x] Eager detection on modal open — Task 16.
- [x] Promote-button label flips when dangling refs present — Task 16.
- [x] Detection error → Retry button, Promote disabled — Task 16.
- [x] Tidy failure → error block, promote not called — Task 16.
- [x] No dangling refs → existing flow unchanged — Task 16 (`hasDangling=false` skips tidy).
- [x] All five issue scenarios covered by tests in Tasks 6, 7, 8, 9, 10 + manual verification in Task 17.

---

**End of plan.** Total: 17 tasks. Each task ends with a green compile/test/build and a commit. Total commits: 17.
