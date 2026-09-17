#!/usr/bin/env bash
#
# Loads a seed file from scripts/seed/ into a local Snomio database.
#
# Pass the seed file as the first argument, by name or by path. With no argument it lists what is
# available rather than guessing, because which seed you want depends on the branch you are testing:
#
#   ./scripts/seed/seed-local-db.sh release-window-due-date-seed.sql
#   ./scripts/seed/seed-local-db.sh backlog-report-seed.sql
#
# Uses psql if it is on PATH, otherwise runs psql inside the postgres container. Override any of
# the settings with environment variables:
#
#   PGHOST=localhost PGPORT=5431 PGUSER=postgres PGDATABASE=snomio ./scripts/seed/seed-local-db.sh <file>
#   SNOMIO_DB_CONTAINER=docker-db-1 ./scripts/seed/seed-local-db.sh <file>
#
# Every seed here is re-runnable: each clears its own rows (id >= 9000) before inserting, so rows
# created through the app are never touched.

set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5431}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-snomio}"
SNOMIO_DB_CONTAINER="${SNOMIO_DB_CONTAINER:-docker-db-1}"

SEED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: $(basename "${BASH_SOURCE[0]}") <seed-file>" >&2
  echo >&2
  echo "Available seeds:" >&2
  for candidate in "$SEED_DIR"/*.sql; do
    [[ -e "$candidate" ]] && echo "  $(basename "$candidate")" >&2
  done
  exit 1
fi

# Accept a bare name or a path, so both tab-completion from the repo root and a plain file name work.
if [[ -f "$1" ]]; then
  SEED_FILE="$1"
else
  SEED_FILE="$SEED_DIR/$1"
fi

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Seed file not found: $SEED_FILE" >&2
  exit 1
fi

if command -v psql >/dev/null 2>&1; then
  echo "Seeding $PGDATABASE on $PGHOST:$PGPORT as $PGUSER from $(basename "$SEED_FILE") (local psql)"
  PGHOST="$PGHOST" PGPORT="$PGPORT" PGUSER="$PGUSER" PGDATABASE="$PGDATABASE" \
    psql -v ON_ERROR_STOP=1 -q -f "$SEED_FILE"
elif command -v docker >/dev/null 2>&1; then
  # The container talks to its own postgres on 5432, whatever port the host publishes it on.
  echo "Seeding $PGDATABASE inside container $SNOMIO_DB_CONTAINER from $(basename "$SEED_FILE") (no local psql)"
  docker exec -i "$SNOMIO_DB_CONTAINER" \
    psql -v ON_ERROR_STOP=1 -q -U "$PGUSER" -d "$PGDATABASE" < "$SEED_FILE"
else
  echo "Neither psql nor docker is available." >&2
  exit 1
fi

echo "Seed loaded."
