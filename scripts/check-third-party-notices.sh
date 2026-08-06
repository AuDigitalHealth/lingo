#!/usr/bin/env bash
# Reproduces the CI "Check third-party notices are up to date" step locally.
# Usage: ./scripts/check-third-party-notices.sh
set -euo pipefail

mvn process-resources -U -Dims-username=x -Dims-password=x

fail=0
if ! diff <(git show "HEAD:LICENSE" | sed '/# NPM Dependencies and Licenses/,$d') \
          <(sed '/# NPM Dependencies and Licenses/,$d' LICENSE); then fail=1; fi
if ! diff <(git show "HEAD:THIRD_PARTY_NOTICES.md" | sed '/## Licence summary - Frontend (npm)/,$d') \
          <(sed '/## Licence summary - Frontend (npm)/,$d' THIRD_PARTY_NOTICES.md); then fail=1; fi
if ! git diff --exit-code -- NOTICE; then fail=1; fi

if [ "$fail" -ne 0 ]; then
  echo "STALE: run 'mvn process-resources' and commit LICENSE, NOTICE and THIRD_PARTY_NOTICES.md."
  exit 1
fi
echo "Backend third-party notices are up to date."
