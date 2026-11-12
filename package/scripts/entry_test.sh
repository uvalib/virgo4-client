#!/usr/bin/env bash
# Runs entry.sh against a stub v4srv and checks the arguments it would start the server with.
# usage: bash package/scripts/entry_test.sh
set -euo pipefail
ENTRY="$(cd "$(dirname "$0")" && pwd)/entry.sh"

run_entry() { # runs entry.sh in a temp dir; prints the stub's argv one per line
  local work; work="$(mktemp -d)"
  mkdir -p "$work/bin"
  printf '#!/usr/bin/env bash\nprintf "%%s\\n" "$@" > "$ARGS_OUT"\n' > "$work/bin/v4srv"
  chmod +x "$work/bin/v4srv"
  export ARGS_OUT="$work/args"
  (cd "$work" && bash "$ENTRY") >/dev/null
  cat "$ARGS_OUT"
  rm -rf "$work"
}

set_required_env() {
  for v in V4_URL V4_CITATIONS V4_COLLECTIONS V4_SEARCH_API V4_CATALOG_POOL_URL V4_ILS_API V4_SMPT_HOST V4_SMPT_PORT \
           V4_SMPT_SENDER V4_FEEDBACK_EMAIL DBHOST DBPORT DBNAME DBUSER DBPASS V4_ILLIAD_API V4_ILLIAD_KEY V4_JWT_KEY \
           V4_HSL_ILLIAD_URL V4_SHELF_BROWSE V4_SUGGESTIONS; do
    export "$v=value-of-$v"
  done
  unset V4_SMPT_USER V4_SMPT_PASS V4_ALERTS_URL
}

fail() { echo "FAIL: $*" >&2; exit 1; }

starts_without_V4_ALERTS_URL() {
  set_required_env
  local args; args="$(run_entry)"
  ! grep -qx -- "-alertsurl" <<<"$args" || fail "-alertsurl passed although V4_ALERTS_URL is unset"
  ! grep -q -- "^-fb" <<<"$args" || fail "Firebase flags must be gone"
  # every flag must be followed by a value, never by another flag
  local prev=""
  while IFS= read -r a; do
    if [[ "$prev" == -* && "$a" == -* ]]; then fail "flag $prev was given no value (next token $a)"; fi
    prev="$a"
  done <<<"$args"
  [[ "$prev" != -* ]] || fail "last flag $prev has no value"
}

passes_V4_ALERTS_URL_when_set() {
  set_required_env
  export V4_ALERTS_URL="https://alerts.test/"
  local args; args="$(run_entry)"
  grep -A1 -x -- "-alertsurl" <<<"$args" | tail -1 | grep -qx "https://alerts.test/" \
    || fail "-alertsurl https://alerts.test/ not passed: $(tr '\n' ' ' <<<"$args")"
}

starts_without_V4_ALERTS_URL && echo "ok - starts without V4_ALERTS_URL"
passes_V4_ALERTS_URL_when_set && echo "ok - passes V4_ALERTS_URL when set"
