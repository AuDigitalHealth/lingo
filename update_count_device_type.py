#!/usr/bin/env python3
import os
import re
import time
import requests

# ---------------------------
# Config (via environment)
# ---------------------------
BASE   = os.environ.get("SNOWSTORM_BASE", "https://your-snowstorm/snowstorm/snomed-ct")
BRANCH = os.environ.get("SNOWSTORM_BRANCH", "MAIN/PROJECT/TASK")

# Cookie-based auth
COOKIE_NAME  = os.environ.get("SNOWSTORM_COOKIE_NAME", "JSESSIONID")
COOKIE_VALUE = os.environ.get("SNOWSTORM_COOKIE_VALUE", "")

# Target selection (ECL)
ECL = "(<<(^ 929360081000036101)) : ([0..0] 1142143009 = *, 774160008 = *)"

# Attribute/type constants
TYPE_CONTAINS_CD       = "774160008"   # Contains clinical drug
TYPE_COUNT_OF_CD_TYPE  = "1142143009"  # Count of clinical drug type
TYPE_IS_A              = "116680003"
DEST_MPP               = "781405001"   # Medicinal product package

# Batch sizes and behaviour
BATCH_SIZE_LOAD = int(os.environ.get("BATCH_SIZE_LOAD", "1000"))   # bulk-load size
BATCH_SIZE_BULK = int(os.environ.get("BATCH_SIZE_BULK", "500"))    # bulk-update size
TIMEOUT         = int(os.environ.get("TIMEOUT", "90"))
POLL_INTERVAL_S = float(os.environ.get("POLL_INTERVAL_S", "1.5"))
DRY_RUN         = os.environ.get("DRY_RUN", "true").lower() != "false"

# Validation controls
VALIDATE_BEFORE = os.environ.get("VALIDATE", "true").lower() != "false"
# IGNORE_VALIDATION_LEVEL: "none" (stop on any issues), "warnings" (ignore warnings), or "all" (ignore everything)
IGNORE_VALIDATION_LEVEL = os.environ.get("IGNORE_VALIDATION_LEVEL", "warnings").lower()

# ---------------------------
# HTTP session
# ---------------------------
session = requests.Session()
if not COOKIE_VALUE:
    raise RuntimeError("Set SNOWSTORM_COOKIE_VALUE for cookie auth.")
session.cookies.set(COOKIE_NAME, COOKIE_VALUE)
session.headers["Accept-Language"] = "en-X-900000000000509007,en-X-900000000000508004,en"
session.headers["Content-Type"] = "application/json"

# ---------------------------
# Helpers
# ---------------------------
def chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i+n]

def get_ids_by_ecl():
    """Fetch concept IDs via GET /{branch}/concepts with ECL and returnIdOnly=true."""
    ids = []
    limit = 10000
    offset = 0
    while True:
        url = f"{BASE}/{BRANCH}/concepts"
        params = {"ecl": ECL, "returnIdOnly": "true", "offset": offset, "limit": limit}
        r = session.get(url, params=params, timeout=TIMEOUT)
        r.raise_for_status()
        page = r.json()
        items = page.get("items", [])
        if not items:
            break
        ids.extend([str(x) for x in items])  # items are strings with returnIdOnly=true
        offset += len(items)
        total = page.get("total", offset)
        if offset >= total:
            break
    return ids

def bulk_load_concepts(id_batch):
    """POST /browser/{branch}/concepts/bulk-load -> list of ConceptView JSONs."""
    url = f"{BASE}/browser/{BRANCH}/concepts/bulk-load"
    body = {"conceptIds": id_batch}
    r = session.post(url, json=body, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    # Some builds return {"items":[...]} – handle both
    if isinstance(data, dict) and "items" in data:
        return data["items"]
    return data

def iter_stated_rels(concept):
    for ax in concept.get("classAxioms", []):
        for rel in ax.get("relationships", []):
            if rel.get("characteristicType") == "STATED_RELATIONSHIP":
                yield ax, rel

def count_stated_contains_cd(concept):
    return sum(1 for _ax, rel in iter_stated_rels(concept)
               if rel.get("active", True) and str(rel.get("typeId")) == TYPE_CONTAINS_CD)

def find_module_id_for_stated(concept):
    for _ax, rel in iter_stated_rels(concept):
        mid = rel.get("moduleId")
        if mid:
            return mid
    return concept.get("moduleId") or "900000000000207008"

def get_or_create_primary_axiom(concept):
    # Prefer axiom with stated 'is a' -> MPP
    for ax in concept.get("classAxioms", []):
        for rel in ax.get("relationships", []):
            if (rel.get("characteristicType") == "STATED_RELATIONSHIP"
                and str(rel.get("typeId")) == TYPE_IS_A
                and str(rel.get("destinationId")) == DEST_MPP):
                return ax
    # fallback to first or create new
    ax_list = concept.get("classAxioms", [])
    if ax_list:
        return ax_list[0]
    new_ax = {
        "active": True,
        "released": False,
        "definitionStatusId": concept.get("definitionStatusId", "900000000000073002"),
        "relationships": []
    }
    concept.setdefault("classAxioms", []).append(new_ax)
    return new_ax

def ensure_count_of_cd_type(concept, count_value):
    """
    Ensure a stated INTEGER concrete rel typeId=1142143009 exists in group 0 with correct value.
    Returns True if the concept was modified.
    """
    ax = get_or_create_primary_axiom(concept)
    desired = str(int(count_value))
    module_id = find_module_id_for_stated(concept)
    source_id = concept.get("conceptId")

    # Find existing target rel
    target_rel = None
    for rel in ax.get("relationships", []):
        if (rel.get("characteristicType") == "STATED_RELATIONSHIP"
            and str(rel.get("typeId")) == TYPE_COUNT_OF_CD_TYPE
            and rel.get("groupId", 0) == 0
            and rel.get("active", True)):
            target_rel = rel
            break

    if target_rel:
        cv = target_rel.get("concreteValue", {})
        if (cv.get("dataType") != "INTEGER"
            or cv.get("value") != desired
            or cv.get("valueWithPrefix") != f"#{desired}"):
            target_rel["concreteValue"] = {
                "dataType": "INTEGER",
                "value": desired,
                "valueWithPrefix": f"#{desired}"
            }
            target_rel.pop("destinationId", None)
            target_rel["moduleId"] = module_id
            target_rel["sourceId"] = source_id
            target_rel["released"] = False
            target_rel["modifier"] = "EXISTENTIAL"
            return True
        return False
    else:
        ax.setdefault("relationships", []).append({
            "active": True,
            "moduleId": module_id,
            "released": False,
            "sourceId": source_id,
            "concreteValue": {
                "dataType": "INTEGER",
                "value": desired,
                "valueWithPrefix": f"#{desired}"
            },
            "typeId": TYPE_COUNT_OF_CD_TYPE,
            "type": {"conceptId": TYPE_COUNT_OF_CD_TYPE},
            "characteristicType": "STATED_RELATIONSHIP",
            "groupId": 0,
            "modifier": "EXISTENTIAL"
        })
        return True

def bulk_validate(concepts):
    """POST /browser/{branch}/validate/concepts."""
    url = f"{BASE}/browser/{BRANCH}/validate/concepts"
    r = session.post(url, json=concepts, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()

def categorize_validation(results):
    """
    Split validation results into fatal and nonfatal.
    Fatal if severity in ERROR/CRITICAL/FAIL; everything else nonfatal.
    """
    if not results:
        return [], []
    if isinstance(results, dict):
        items = results.get("items", []) or results.get("results", []) or []
    else:
        items = results

    fatals, nonfatals = [], []
    for r in items:
        sev = str(r.get("severity", "")).upper()
        if sev in ("ERROR", "CRITICAL", "FAIL"):
            fatals.append(r)
        else:
            nonfatals.append(r)
    return fatals, nonfatals

def should_abort_on_validation(fatals, nonfatals):
    """
    Decide whether to abort based on IGNORE_VALIDATION_LEVEL:
      - "all": never abort
      - "warnings": abort only if fatals exist
      - "none": abort if any issues (fatal or nonfatal)
    """
    lvl = IGNORE_VALIDATION_LEVEL
    if lvl == "all":
        return False
    if lvl == "warnings":
        return len(fatals) > 0
    # lvl == "none"
    return (len(fatals) + len(nonfatals)) > 0

def bulk_update(concepts):
    """
    POST /browser/{branch}/concepts/bulk
    Returns bulkChangeId, preferring the Location header (common Snowstorm behaviour).
    """
    url = f"{BASE}/browser/{BRANCH}/concepts/bulk"
    r = session.post(url, json=concepts, timeout=TIMEOUT)

    # Retry once for transient gateway issues
    if r.status_code in (502, 503, 504):
        time.sleep(1.0)
        r = session.post(url, json=concepts, timeout=TIMEOUT)

    # Raise for 4xx/5xx so we can see details
    try:
        r.raise_for_status()
    except requests.HTTPError as e:
        snippet = (r.text or "")[:300]
        raise RuntimeError(f"Bulk update HTTP {r.status_code}. Body: {snippet}") from e

    # Primary path: Location header contains .../bulk/{bulkChangeId}
    loc = r.headers.get("Location") or r.headers.get("location")
    if loc:
        m = re.search(r"/bulk/([^/?#]+)/?$", loc.strip())
        if m:
            return m.group(1)

    # Fallback: some builds return JSON { "bulkChangeId": "..." }
    try:
        data = r.json()
        if isinstance(data, dict) and "bulkChangeId" in data:
            return data["bulkChangeId"]
    except ValueError:
        pass  # non-JSON body

    # If we got here, we couldn't find the id
    ctype = r.headers.get("Content-Type", "")
    preview = (r.text or "")[:300]
    raise RuntimeError(
        f"No bulkChangeId found. status={r.status_code}, Content-Type={ctype}, "
        f"Location={loc}, Body preview={preview}"
    )

def poll_bulk(bulk_id):
    """GET /browser/{branch}/concepts/bulk/{bulkChangeId} until terminal."""
    url = f"{BASE}/browser/{BRANCH}/concepts/bulk/{bulk_id}"
    while True:
        r = session.get(url, timeout=TIMEOUT)
        r.raise_for_status()
        info = r.json()
        status = str(info.get("status", "UNKNOWN")).upper()
        total   = info.get("total", "")
        success = info.get("success", "")
        failed  = info.get("failed", "")
        print(f"Bulk {bulk_id}: {status} {success}/{total} ok, {failed} failed")
        if status in ("COMPLETED", "FAILED", "CANCELLED"):
            return info
        time.sleep(POLL_INTERVAL_S)

# ---------------------------
# Main
# ---------------------------
def main():
    ids = get_ids_by_ecl()
    print(f"Found {len(ids)} concept IDs")

    # Bulk-load all concepts (in chunks)
    concepts = []
    for batch in chunks(ids, BATCH_SIZE_LOAD):
        loaded = bulk_load_concepts(batch)
        concepts.extend(loaded)
        print(f"Loaded {len(loaded)} concepts (total {len(concepts)})")

    # Transform: ensure 1142143009 equals count of stated 774160008
    to_update = []
    for c in concepts:
        count = count_stated_contains_cd(c)
        if ensure_count_of_cd_type(c, count):
            to_update.append(c)

    print(f"{len(to_update)} concept(s) need update")

    if not to_update:
        print("Nothing to do.")
        return

    if DRY_RUN:
        print(f"[DRY RUN] Would update {len(to_update)} concept(s). Example IDs: {[x.get('conceptId') for x in to_update[:5]]}")
        return

    # Validate in batches (optional)
    if VALIDATE_BEFORE:
        print(f"Validating {len(to_update)} concept(s) in batches of {BATCH_SIZE_BULK} "
              f"(policy IGNORE_VALIDATION_LEVEL={IGNORE_VALIDATION_LEVEL})")
        for vbatch in chunks(to_update, BATCH_SIZE_BULK):
            results = bulk_validate(vbatch)
            fatals, nonfatals = categorize_validation(results)

            if nonfatals:
                print(f"  Non-fatal validation issues: {len(nonfatals)} (ignored per policy)")
                for r in nonfatals[:2]:
                    print("   -", r.get("severity"), r.get("message"), "concept:", r.get("conceptId"))

            if fatals:
                print(f"  Fatal validation issues: {len(fatals)}")
                for r in fatals[:3]:
                    print("   -", r.get("severity"), r.get("message"), "concept:", r.get("conceptId"))

            if should_abort_on_validation(fatals, nonfatals):
                print("Aborting due to validation policy.",
                      f"(fatals={len(fatals)}, nonfatals={len(nonfatals)}, policy={IGNORE_VALIDATION_LEVEL})")
                return

    # Submit updates in batches and poll each bulk job
    for ubatch in chunks(to_update, BATCH_SIZE_BULK):
        print(f"Submitting bulk update for {len(ubatch)} concept(s)...")
        bulk_id = bulk_update(ubatch)
        result = poll_bulk(bulk_id)
        status = str(result.get("status", "UNKNOWN")).upper()
        if status != "COMPLETED":
            print("Bulk update did not complete successfully. Details:", result)
            return

    print("All bulk updates completed successfully.")

if __name__ == "__main__":
    main()
