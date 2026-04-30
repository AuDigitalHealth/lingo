# Tidy refsets and non-defining relationships on promote

**Issue:** [#1753](https://github.com/aehrc/snomio/issues/1753)
**Date:** 2026-04-30
**Status:** Approved (brainstorming)

## Problem

When terminology authors retire or delete concepts in the Authoring Platform (AP), the AP does not clean up reference set members or non-defining relationships that point to those concepts. The leftover artefacts are "dangling": active members/relationships referencing concepts that no longer exist or are now inactive. Today these dangling references can pass through promotion and require manual cleanup (Snodine for refset members, Dedalus API calls for non-defining relationships).

Lingo is the right place to detect and clean these up before promotion, since it already fronts the promote action and has Snowstorm access.

## Goal

On task promotion in Lingo, detect dangling reference set members and dangling non-defining relationships caused by AP-side retirement/deletion of concepts on the task, present a summary to the user, and — on user confirmation — tidy them (delete if unreleased, retire if released) before promoting.

## Scope

In scope:

- Reference set members where `referencedComponentId` points to a concept that became inactive or was deleted on this task branch (Strategy A scoped to changes on this task branch — strategy "C").
- Non-defining relationships (characteristic type `900000000000227009 | Additional relationship`) where `sourceId` **or** `destinationId` points to a concept that became inactive or was deleted on this task branch.
- Detection scoped to refset members and non-defining relationships **modified on this branch only** — never the global active set.
- Tidy behaviour:
  - Released components → inactivate (`active = false`).
  - Unreleased components → delete.
- Best-effort tidy: continue on per-item failure; surface a per-item failure list with instructions to contact support; promotion does not proceed if any tidy item fails.

Out of scope:

- Cleaning dangling references for concepts retired/deleted **before** this task (pre-existing inactive content unrelated to this task's edits).
- Refset members/non-defining rels referencing concepts that are still active (no tidy action needed).
- Historical-association handling beyond the existing Snowstorm defaults.
- Changes to the underlying `auto-promote` Authoring Services passthrough.

## Acceptance criteria (from issue)

1. On pressing the promote button in Lingo, dangling references are detected and a warning dialogue is shown to the user.
2. The dialogue shows a summary of the dangling references and an indication of why they might exist (AP retirement/deletion).
3. The user is presented two options: continue (Lingo tidies and promotes) or cancel (cancels the promotion entirely).
4. If no dangling references are detected, promotion continues as it does today.

## Architecture

Two new server-side capabilities, plus integration into the existing `PromoteTaskModal`:

- `GET /api/tasks/{projectKey}/{taskKey}/dangling-references` — read-only detection endpoint returning a `DanglingReferenceSummary`. Idempotent; safe to call eagerly when the modal opens.
- `POST /api/tasks/{projectKey}/{taskKey}/dangling-references/tidy` — performs the cleanup and returns a `TidyResult` with per-item `succeeded`/`failed` lists. Internally re-runs detection so it operates on a fresh server-side snapshot rather than UI state.
- Front-end: existing `PromoteTaskModal` calls detection on open in parallel with `useCanPromoteTask`, renders a dedicated dangling-references section, and on confirm chains `tidy → auto-promote`.

## Backend components

### `DanglingReferenceService` (new)

Location: `api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java`

Two public methods:

- `DanglingReferenceSummary detect(String branch)`
- `TidyResult tidy(String branch)` — calls `detect` internally, then performs the cleanup actions.

#### Detection algorithm (Strategy 2, reference-driven)

Steps 1 and 2 dispatched in parallel:

1. Pull active reference set members **modified on this branch** via a `SnowstormClient` helper.
2. Pull active non-defining relationships **modified on this branch** filtered to characteristic type `900000000000227009`.
3. Collect referenced concept IDs: `referencedComponentId` from each member, `sourceId` and `destinationId` from each relationship. Deduplicate.
4. Resolve all referenced concept IDs in a single batch via `SnowstormClient.getConceptsById`. A concept missing from the response is **deleted**; one returned with `active = false` is **retired**.
5. For each component whose referenced concept is missing or inactive, build a `DanglingReference` carrying: kind, the member/relationship id, refset/type id and PT, the dangling concept id and (when available) PT, the dangling concept status (`RETIRED` / `DELETED`), and the component's `released` flag.

For non-defining relationships, both endpoints (`source` and `destination`) are reported with their statuses so the user can see why a relationship was flagged.

#### Tidy

For each `DanglingReference` returned by `detect`:

| Kind | Released | Action |
| --- | --- | --- |
| Refset member | true | Update with `active = false` |
| Refset member | false | Delete |
| Non-defining relationship | true | Update with `active = false` |
| Non-defining relationship | false | Delete |

Behaviour:

- Continue past per-item failures.
- Build a `TidyResult` with two lists: `succeeded` (kind + id + action) and `failed` (kind + id + attemptedAction + errorMessage).
- An item that is already inactive/missing on the branch by the time tidy runs is silently skipped (omitted from both lists).

### Endpoints

A thin controller delegating to `DanglingReferenceService`. Reuses existing auth/branch resolution from the surrounding tasks controller.

### DTOs

New plain Java records under `au.gov.digitalhealth.lingo.promotion`:

```text
DanglingReferenceSummary {
  String branch;
  boolean hasDanglingReferences;
  List<DanglingRefsetMember> danglingRefsetMembers;
  List<DanglingNonDefiningRelationship> danglingNonDefiningRelationships;
}

DanglingRefsetMember {
  String memberId;
  String refsetId;
  String refsetPt;
  String referencedConceptId;
  String referencedConceptPt;          // null if deleted
  ConceptStatus referencedConceptStatus; // RETIRED | DELETED
  boolean released;
}

DanglingNonDefiningRelationship {
  String relationshipId;
  String typeId;
  String typePt;
  String sourceId;
  String sourcePt;          // null if deleted
  ConceptStatus sourceStatus;     // RETIRED | DELETED | ACTIVE
  String destinationId;
  String destinationPt;     // null if deleted
  ConceptStatus destinationStatus; // RETIRED | DELETED | ACTIVE
  boolean released;
}

TidyResult {
  List<TidySuccess> succeeded;
  List<TidyFailure> failed;
}

TidySuccess { Kind kind; String id; Action action; }   // Action = DELETED | INACTIVATED
TidyFailure { Kind kind; String id; Action attemptedAction; String errorMessage; }
```

### `SnowstormClient` additions

- Helper to fetch active reference set members modified on a given branch (uses the existing Members API with a branch-scoped query). The closest existing method is `getAllRefsetMembers`/`getRefsetMembers`; we add a thin wrapper or new method for "modified on branch".
- Helper to fetch active non-defining relationships modified on a given branch, filtered by characteristic type `900000000000227009`.
- A relationship update/delete helper if the existing client does not already cover update with `active = false` and unreleased delete for non-defining relationships. Existing `removeRefsetMembers` is reused; add a refset-member-update path if not already available.

## Front-end integration

### Detection hook

New `useDanglingReferences(task)` hook (sibling of `useCanPromoteTask`) backed by the new GET endpoint. Fires on modal open in parallel with the existing checks.

### `PromoteTaskModal` changes

- New section between warnings and the existing footer:
  - Severity `warning`, title with counts (e.g. "3 dangling refset members, 1 dangling non-defining relationship").
  - Body lists each dangling refset member (refset PT, dangling concept PT or "deleted concept <id>", released-or-not) and each non-defining relationship (type PT, source/destination PTs and statuses, released-or-not).
  - Explanatory note pointing at the AP retire/delete origin so the user understands why this list exists.
- Promote button label flips to **"Tidy & Promote"** when dangling references are present and there are no other blocking issues.
- Detection-error state: a non-blocking error alert with a Retry button. Promote button disabled while detection is errored.

### New mutation: `useTidyDanglingReferences(task)`

Calls the POST endpoint, returns a `TidyResult`.

### Promote click handler

```text
1. If detection errored → block (Retry button only).
2. If no dangling refs → call autoPromoteMutation directly (existing behaviour).
3. Else
   a. Call tidyMutation.
   b. If response.failed.length === 0 → call autoPromoteMutation.
   c. Else → render an error block listing each failed item (kind, id, attempted action, error)
            with a "Contact support with these details" message; promote does NOT run.
```

Existing Cancel button retains its current behaviour (closes the modal without action).

## Error handling and edge cases

- **Detection endpoint failure.** Modal shows a non-blocking error with Retry; Promote disabled while errored. Failing open would defeat the purpose.
- **Tidy partial or full failure.** UI blocks promotion, surfaces the per-item failure list, instructs the user to contact support. Already-succeeded items are not undone; the user can retry detection later and any remaining items will reappear.
- **Stale UI state.** `tidy` re-runs `detect` server-side. Items the UI saw but that are already cleaned up by the time tidy runs are silently skipped.
- **Branch is not a task branch.** `detect` short-circuits and returns an empty summary; promotion only runs from task branches in any case.
- **`UP_TO_DATE` task with no changes.** Existing checks already block promotion; detection still runs and returns empty.
- **Retired concept with a historical association.** Out of scope here — we tidy the dangling refset member/relationship regardless of historical association.
- **Performance.** Volumes are bounded by what changed on a single task (typically tens of items). Concept-existence resolution is one batched call.
- **Concurrency.** Mutation hooks prevent double-firing in the UI. Tidy is idempotent — items already cleaned up on the branch are no-ops server-side.

## Testing

### Backend

`DanglingReferenceServiceTest` unit tests with a mocked `SnowstormClient`:

- Retired concept on task → its modified refset members and non-defining relationships are reported as dangling.
- Deleted concept on task → its modified refset members and non-defining relationships are reported with null referenced PTs but populated refset/type PTs.
- Mixed retired + deleted in one branch.
- Active referenced concept → not flagged.
- Non-defining filter only matches characteristic type `900000000000227009`.
- Tidy on released item → inactivated.
- Tidy on unreleased item → deleted.
- Tidy partial failure → `succeeded` and `failed` lists populated correctly; `failed` items carry attempted action and error.

Integration test using the recorded Snowstorm fixtures (`AmtV4SnowstormExtension`) where feasible, mirroring the issue's five test scenarios.

### Frontend

Component tests / Cypress where existing patterns are present:

- Modal renders the dangling-reference alert with correct counts and PTs.
- Promote button label flips to "Tidy & Promote" when dangling refs are present.
- Tidy success → `auto-promote` mutation invoked.
- Tidy failure → error block shown, `auto-promote` not called.
- Detection error → Retry visible, Promote disabled.
- No dangling refs → existing behaviour unchanged (regression).

### Issue-listed scenarios mapped

| # | Scenario | Coverage |
| --- | --- | --- |
| 1 | Normal promotion, no AP deletions | "No dangling refs" path |
| 2 | AP retirement of a published concept with refset members + non-defining rels | Released → INACTIVATED |
| 3 | AP deletion of an unpublished concept with refset members + non-defining rels | Unreleased → DELETED |
| 4 | Mixed published + unpublished retire/delete | Combined released and unreleased tidy |
| 5 | Mixed retire/delete with user choosing Cancel | Cancel button leaves task untouched |

## Files

To create:

- `api/src/main/java/au/gov/digitalhealth/lingo/service/DanglingReferenceService.java`
- `api/src/main/java/au/gov/digitalhealth/lingo/promotion/DanglingReferenceSummary.java` (and sibling DTOs)
- `api/src/main/java/au/gov/digitalhealth/lingo/controllers/DanglingReferenceController.java` (or extend an existing tasks controller — to be chosen at impl)
- `api/src/test/java/au/gov/digitalhealth/lingo/service/DanglingReferenceServiceTest.java`
- `ui/src/hooks/api/task/useDanglingReferences.tsx`
- `ui/src/hooks/api/task/useTidyDanglingReferences.tsx`
- `ui/src/types/danglingReferences.ts`

To modify:

- `common/src/main/java/au/gov/digitalhealth/lingo/service/SnowstormClient.java` — add new branch-scoped fetchers and any missing relationship/refset-member update helpers.
- `ui/src/api/TasksService.ts` — add `getDanglingReferences` and `tidyDanglingReferences` calls.
- `ui/src/pages/tasks/components/PromoteTaskModal.tsx` — render new section, change button label, wire tidy → auto-promote chain, surface detection/tidy error states.
