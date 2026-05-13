#!/usr/bin/env bash
# End-to-end smoke test for the deployed voter-registry + polls contracts.
#
# Exercises the full user flow against whatever endpoint is configured:
#   1. polls.registry() returns the expected voter-registry address
#   2. voter-registry.register() succeeds and isRegistered() flips to true
#   3. polls.createPoll() succeeds and pollCount() increments
#   4. polls.vote() succeeds and getResults() reflects the new vote
#
# Usage:
#   scripts/smoke.sh                 # uses apps/frontend/.env.local for addresses
#   scripts/smoke.sh <reg> <polls>   # override addresses explicitly
#
# Environment:
#   RPC_URL      RPC endpoint (default: http://localhost:8547)
#   PRIVATE_KEY  Signer key   (default: nitro-devnode pre-funded key)

set -Eeuo pipefail

RPC_URL="${RPC_URL:-http://localhost:8547}"
PRIVATE_KEY="${PRIVATE_KEY:-0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/apps/frontend/.env.local"

# ---------------------------------------------------------------------------
# tool preflight
# ---------------------------------------------------------------------------
for tool in cast jq; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    if [ "$tool" = "jq" ]; then
      # jq is only used for nicer error output; not strictly required.
      continue
    fi
    echo "ERROR: required tool '$tool' is not installed or not on PATH" >&2
    exit 1
  fi
done

# ---------------------------------------------------------------------------
# resolve addresses
# ---------------------------------------------------------------------------
VOTER_REGISTRY_ADDRESS="${1:-}"
POLLS_ADDRESS="${2:-}"

if [ -z "$VOTER_REGISTRY_ADDRESS" ] || [ -z "$POLLS_ADDRESS" ]; then
  if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found. Run 'pnpm deploy:local' first or pass addresses as args." >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
  VOTER_REGISTRY_ADDRESS="${VOTER_REGISTRY_ADDRESS:-${NEXT_PUBLIC_VOTER_REGISTRY_ADDRESS:-}}"
  POLLS_ADDRESS="${POLLS_ADDRESS:-${NEXT_PUBLIC_POLLS_ADDRESS:-}}"
fi

if [ -z "$VOTER_REGISTRY_ADDRESS" ] || [ -z "$POLLS_ADDRESS" ]; then
  echo "ERROR: could not resolve VOTER_REGISTRY_ADDRESS / POLLS_ADDRESS" >&2
  exit 1
fi

SIGNER="$(cast wallet address "$PRIVATE_KEY")"

echo "=== smoke test ==="
echo "  RPC:           $RPC_URL"
echo "  signer:        $SIGNER"
echo "  voterRegistry: $VOTER_REGISTRY_ADDRESS"
echo "  polls:         $POLLS_ADDRESS"
echo ""

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
assert_eq_ci() {
  # Case-insensitive equality assertion (for addresses).
  local label="$1"; local actual="$2"; local expected="$3"
  if [ "$(printf '%s' "$actual" | tr '[:upper:]' '[:lower:]')" != \
       "$(printf '%s' "$expected" | tr '[:upper:]' '[:lower:]')" ]; then
    echo "FAIL [${label}]: expected ${expected}, got ${actual}" >&2
    exit 1
  fi
  echo "  ok  [${label}] ${actual}"
}

assert_eq() {
  local label="$1"; local actual="$2"; local expected="$3"
  if [ "$actual" != "$expected" ]; then
    echo "FAIL [${label}]: expected '${expected}', got '${actual}'" >&2
    exit 1
  fi
  echo "  ok  [${label}] ${actual}"
}

# ---------------------------------------------------------------------------
# 1. linking sanity
# ---------------------------------------------------------------------------
echo "--- 1) linking sanity ---"
LINKED=$(cast call "$POLLS_ADDRESS" "registry()(address)" --rpc-url "$RPC_URL")
assert_eq_ci "polls.registry()" "$LINKED" "$VOTER_REGISTRY_ADDRESS"

# ---------------------------------------------------------------------------
# 2. registration (idempotent: only register if not already registered)
# ---------------------------------------------------------------------------
echo "--- 2) registration ---"
ALREADY=$(cast call "$VOTER_REGISTRY_ADDRESS" "isRegistered(address)(bool)" "$SIGNER" --rpc-url "$RPC_URL")
if [ "$ALREADY" = "false" ]; then
  cast send "$VOTER_REGISTRY_ADDRESS" "register()" \
    --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" >/dev/null
fi
NOW_REGISTERED=$(cast call "$VOTER_REGISTRY_ADDRESS" "isRegistered(address)(bool)" "$SIGNER" --rpc-url "$RPC_URL")
assert_eq "isRegistered(signer)" "$NOW_REGISTERED" "true"

VOTER_COUNT=$(cast call "$VOTER_REGISTRY_ADDRESS" "voterCount()(uint256)" --rpc-url "$RPC_URL")
echo "  voterCount = $VOTER_COUNT"

# ---------------------------------------------------------------------------
# 3. create poll
# ---------------------------------------------------------------------------
echo "--- 3) create poll ---"
POLL_COUNT_BEFORE=$(cast call "$POLLS_ADDRESS" "pollCount()(uint256)" --rpc-url "$RPC_URL")
TITLE="smoke-test poll $(date -u +%s)"
cast send "$POLLS_ADDRESS" "createPoll(string)" "$TITLE" \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" >/dev/null

POLL_COUNT_AFTER=$(cast call "$POLLS_ADDRESS" "pollCount()(uint256)" --rpc-url "$RPC_URL")
NEW_POLL_ID=$((POLL_COUNT_AFTER - 1))
EXPECTED_AFTER=$((POLL_COUNT_BEFORE + 1))
assert_eq "pollCount increment" "$POLL_COUNT_AFTER" "$EXPECTED_AFTER"

# strip surrounding quotes that cast wraps strings in
RETRIEVED_TITLE=$(cast call "$POLLS_ADDRESS" "getTitle(uint256)(string)" "$NEW_POLL_ID" --rpc-url "$RPC_URL" | sed 's/^"//;s/"$//')
assert_eq "getTitle(new)" "$RETRIEVED_TITLE" "$TITLE"

# ---------------------------------------------------------------------------
# 4. vote yes and read results
# ---------------------------------------------------------------------------
echo "--- 4) vote + read ---"
cast send "$POLLS_ADDRESS" "vote(uint256,bool)" "$NEW_POLL_ID" true \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" >/dev/null

HAS_VOTED=$(cast call "$POLLS_ADDRESS" "hasVoted(uint256,address)(bool)" "$NEW_POLL_ID" "$SIGNER" --rpc-url "$RPC_URL")
assert_eq "hasVoted(new, signer)" "$HAS_VOTED" "true"

# getResults returns (uint256, uint256) -> two lines
RESULTS=$(cast call "$POLLS_ADDRESS" "getResults(uint256)(uint256,uint256)" "$NEW_POLL_ID" --rpc-url "$RPC_URL")
YES=$(echo "$RESULTS" | sed -n '1p')
NO=$(echo "$RESULTS" | sed -n '2p')
assert_eq "getResults yes" "$YES" "1"
assert_eq "getResults no"  "$NO"  "0"

echo ""
echo "=== smoke test passed ==="
