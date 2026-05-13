#!/usr/bin/env bash
# Deploy voter-registry and polls to an Arbitrum (or local devnode) endpoint,
# link them via setRegistry, write the addresses to apps/frontend/.env.local,
# and export Solidity ABIs.
#
# Usage:
#   scripts/deploy.sh                # deploy
#   scripts/deploy.sh --cache        # deploy + place a 0-wei cache bid for each contract
#
# Environment:
#   RPC_URL                  RPC endpoint (default: http://localhost:8547)
#   PRIVATE_KEY              Deployer private key (default: nitro-devnode pre-funded key)
#   REQUIRED_STYLUS_VERSION  Expected `cargo stylus --version` (default: 0.10.5)

set -Eeuo pipefail

# ---------------------------------------------------------------------------
# args
# ---------------------------------------------------------------------------
CACHE_BIDS=0
for arg in "$@"; do
  case "$arg" in
    --cache)
      CACHE_BIDS=1
      ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------------
# config
# ---------------------------------------------------------------------------
RPC_URL="${RPC_URL:-http://localhost:8547}"
PRIVATE_KEY="${PRIVATE_KEY:-0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659}"
REQUIRED_STYLUS_VERSION="${REQUIRED_STYLUS_VERSION:-0.10.5}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/apps/frontend/.env.local"
ABI_DIR="$ROOT_DIR/apps/frontend/src/abi"
WASM_DIR="$ROOT_DIR/target/wasm32-unknown-unknown/release"

# ---------------------------------------------------------------------------
# preflight: tool versions
# ---------------------------------------------------------------------------
for tool in cargo cast; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "ERROR: required tool '$tool' is not installed or not on PATH" >&2
    exit 1
  fi
done

if ! command -v cargo-stylus >/dev/null 2>&1; then
  echo "ERROR: cargo-stylus is not installed." >&2
  echo "       Install with: cargo install --locked cargo-stylus@${REQUIRED_STYLUS_VERSION}" >&2
  exit 1
fi

STYLUS_VERSION="$(cargo stylus --version | awk '{print $2}')"
if [ "$STYLUS_VERSION" != "$REQUIRED_STYLUS_VERSION" ]; then
  echo "ERROR: cargo-stylus ${STYLUS_VERSION} does not match required ${REQUIRED_STYLUS_VERSION}." >&2
  echo "       Reinstall with: cargo install --locked cargo-stylus@${REQUIRED_STYLUS_VERSION}" >&2
  echo "       (To override, set REQUIRED_STYLUS_VERSION=${STYLUS_VERSION} — but you've been warned.)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# preflight: rpc reachable
# ---------------------------------------------------------------------------
if ! cast chain-id --rpc-url "$RPC_URL" >/dev/null 2>&1; then
  echo "ERROR: cannot reach RPC at $RPC_URL" >&2
  echo "       Did you forget to start the devnode? (pnpm devnode)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# build contracts (one per crate — see Cargo.toml note about feature unification)
# ---------------------------------------------------------------------------
echo "Building contracts..."
cd "$ROOT_DIR"
rm -f "$WASM_DIR/voter_registry.wasm" "$WASM_DIR/polls.wasm"

cargo build --release --target wasm32-unknown-unknown --lib -p voter-registry
cargo build --release --target wasm32-unknown-unknown --lib -p polls

for wasm in voter_registry.wasm polls.wasm; do
  if [ ! -f "$WASM_DIR/$wasm" ]; then
    echo "ERROR: $wasm was not produced by the build" >&2
    exit 1
  fi
  size=$(wc -c < "$WASM_DIR/$wasm")
  if [ "$size" -lt 1000 ]; then
    echo "ERROR: $wasm is only $size bytes — feature-unification stub? Build each crate with -p." >&2
    exit 1
  fi
  echo "  $wasm: $size bytes"
done

# ---------------------------------------------------------------------------
# deploy helper
# ---------------------------------------------------------------------------
# Note: all informational output inside deploy_contract goes to stderr so
# that capturing stdout via $() gives us *just* the deployed address.
deploy_contract() {
  local name="$1"
  local wasm_file="$2"
  local crate_dir="$3"

  echo "" >&2
  echo "Deploying ${name}..." >&2

  local output
  if ! output=$(cd "$crate_dir" && cargo stylus deploy \
      --wasm-file="$wasm_file" \
      --endpoint="$RPC_URL" \
      --private-key="$PRIVATE_KEY" \
      --no-verify 2>&1); then
    echo "$output" >&2
    echo "ERROR: cargo stylus deploy failed for ${name}" >&2
    exit 1
  fi
  echo "$output" >&2

  local addr
  addr=$(echo "$output" | grep "deployed code at address" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
  if [ -z "$addr" ]; then
    echo "ERROR: could not extract deployed address for ${name} from cargo stylus output" >&2
    exit 1
  fi
  printf '%s' "$addr"
}

VOTER_REGISTRY_ADDRESS=$(deploy_contract \
  "voter-registry" \
  "$WASM_DIR/voter_registry.wasm" \
  "$ROOT_DIR/contracts/voter-registry")
echo ""
echo "voter-registry: $VOTER_REGISTRY_ADDRESS"

POLLS_ADDRESS=$(deploy_contract \
  "polls" \
  "$WASM_DIR/polls.wasm" \
  "$ROOT_DIR/contracts/polls")
echo ""
echo "polls: $POLLS_ADDRESS"

# ---------------------------------------------------------------------------
# link contracts (polls.setRegistry(voter_registry))
# ---------------------------------------------------------------------------
echo ""
echo "Linking contracts (setRegistry)..."
if ! cast send "$POLLS_ADDRESS" "setRegistry(address)" "$VOTER_REGISTRY_ADDRESS" \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY"; then
  echo "ERROR: setRegistry call failed" >&2
  exit 1
fi

# read-back assertion: polls.registry() must equal the deployed voter-registry addr
LINKED_REGISTRY="$(cast call "$POLLS_ADDRESS" "registry()(address)" --rpc-url "$RPC_URL")"
# normalize for case-insensitive compare
if [ "$(printf '%s' "$LINKED_REGISTRY" | tr '[:upper:]' '[:lower:]')" != \
     "$(printf '%s' "$VOTER_REGISTRY_ADDRESS" | tr '[:upper:]' '[:lower:]')" ]; then
  echo "ERROR: post-link assertion failed. polls.registry()=${LINKED_REGISTRY}, expected ${VOTER_REGISTRY_ADDRESS}" >&2
  exit 1
fi
echo "  linked: polls.registry() == ${LINKED_REGISTRY}"

# ---------------------------------------------------------------------------
# write .env.local
# ---------------------------------------------------------------------------
echo ""
echo "Writing addresses to $ENV_FILE..."
mkdir -p "$(dirname "$ENV_FILE")"
cat > "$ENV_FILE" << EOF
# deployed contract addresses (auto-generated by scripts/deploy.sh)
NEXT_PUBLIC_VOTER_REGISTRY_ADDRESS=$VOTER_REGISTRY_ADDRESS
NEXT_PUBLIC_POLLS_ADDRESS=$POLLS_ADDRESS

# local devnode rpc
DEVNODE_RPC_URL=$RPC_URL
EOF

# ---------------------------------------------------------------------------
# export ABIs
# ---------------------------------------------------------------------------
echo ""
echo "Exporting ABIs..."
mkdir -p "$ABI_DIR"
cd "$ROOT_DIR/contracts/voter-registry"
cargo stylus export-abi --output "$ABI_DIR/VoterRegistry.sol"
echo "  wrote apps/frontend/src/abi/VoterRegistry.sol"

cd "$ROOT_DIR/contracts/polls"
cargo stylus export-abi --output "$ABI_DIR/Polls.sol"
echo "  wrote apps/frontend/src/abi/Polls.sol"

# ---------------------------------------------------------------------------
# optional: cache bids
# ---------------------------------------------------------------------------
if [ "$CACHE_BIDS" -eq 1 ]; then
  echo ""
  echo "Placing 0-wei cache bids..."
  for pair in "voter-registry:$VOTER_REGISTRY_ADDRESS" "polls:$POLLS_ADDRESS"; do
    name="${pair%%:*}"
    addr="${pair#*:}"
    echo "  bidding for ${name} (${addr})..."
    # cache bid takes the bare address (no 0x prefix in the example, but cargo
    # stylus accepts either form). Pass the endpoint + key explicitly so the
    # command works against any RPC.
    if ! cargo stylus cache bid "$addr" 0 \
        --endpoint "$RPC_URL" \
        --private-key "$PRIVATE_KEY" 2>&1; then
      echo "  WARNING: cache bid for ${name} failed (this is non-fatal — caching is optional)" >&2
    fi
  done
fi

# ---------------------------------------------------------------------------
# done
# ---------------------------------------------------------------------------
echo ""
echo "Done!"
echo "  VOTER_REGISTRY: $VOTER_REGISTRY_ADDRESS"
echo "  POLLS:          $POLLS_ADDRESS"
echo "  Frontend .env.local updated"
echo "  ABIs exported to apps/frontend/src/abi/"
if [ "$CACHE_BIDS" -eq 1 ]; then
  echo "  Cache bids submitted"
fi
