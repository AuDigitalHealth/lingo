#!/usr/bin/env bash
###############################################################################
# remock.sh — Refresh Cypress mock fixtures from a live deployed environment
#
# Usage:
#   ./scripts/remock.sh
#
# Required environment variables:
#   VITE_SNOMIO_UI_URL   — URL of deployed Lingo frontend (e.g. https://dev-snomio.ihtsdotools.org)
#   IMS_USERNAME         — IMS login username
#   IMS_PASSWORD         — IMS login password
#   VITE_IMS_URL         — IMS base URL
#   VITE_AP_URL          — Authoring Platform base URL
#   VITE_SNOWSTORM_URL   — Snowstorm base URL
#   IHTSDO_PROJECT_KEY   — Project key (e.g. AUAMT)
#
# Optional:
#   REMOCK_SPEC          — Comma-separated spec file patterns to run (default: all)
#   REMOCK_OUTPUT_DIR    — Output directory for captured fixtures (default: cypress/fixtures/api)
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "═══════════════════════════════════════════════════════════════"
echo "  Lingo remock — Refresh mock fixtures from deployed environment"
echo "═══════════════════════════════════════════════════════════════"

# ── Validate required env vars ─────────────────────────────────────────────

required_vars=(VITE_SNOMIO_UI_URL IMS_USERNAME IMS_PASSWORD)
missing=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "ERROR: The following required environment variables are missing:"
  for var in "${missing[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "See cypress/TESTING.md for setup instructions."
  exit 1
fi

echo "Target environment: ${VITE_SNOMIO_UI_URL}"
echo "Username: ${IMS_USERNAME}"
echo ""

# ── Run Cypress in live mode with traffic capture ──────────────────────────

REMOCK_SPEC="${REMOCK_SPEC:-cypress/e2e}"
REMOCK_OUTPUT_DIR="${REMOCK_OUTPUT_DIR:-${UI_DIR}/cypress/fixtures/api}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REMOCK_LOG="${UI_DIR}/cypress/remock-logs/remock_${TIMESTAMP}.log"

mkdir -p "${UI_DIR}/cypress/remock-logs"
mkdir -p "${REMOCK_OUTPUT_DIR}"

echo "Running live tests to capture traffic..."
echo "Spec: ${REMOCK_SPEC}"
echo "Output: ${REMOCK_OUTPUT_DIR}"
echo "Log: ${REMOCK_LOG}"
echo ""

cd "${UI_DIR}"

# Run Cypress in live mode (MOCK_MODE=false) against the deployed environment
CYPRESS_MOCK_MODE=false \
CYPRESS_CAPTURE_TRAFFIC=true \
CYPRESS_REMOCK_OUTPUT="${REMOCK_OUTPUT_DIR}" \
  npx cypress run \
    --spec "${REMOCK_SPEC}" \
    --reporter spec \
    2>&1 | tee "${REMOCK_LOG}"

EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "═══════════════════════════════════════════════════════════════"

if [ $EXIT_CODE -eq 0 ]; then
  echo "  remock COMPLETED successfully"
  echo "  Updated fixtures in: ${REMOCK_OUTPUT_DIR}"
  echo "  Log saved to: ${REMOCK_LOG}"
else
  echo "  remock FAILED (exit code: ${EXIT_CODE})"
  echo "  Check log: ${REMOCK_LOG}"
  echo ""
  echo "  Common causes:"
  echo "  - Deployed environment is unreachable"
  echo "  - Credentials are invalid or expired"
  echo "  - Test failures in live mode"
fi

echo "═══════════════════════════════════════════════════════════════"

exit $EXIT_CODE
