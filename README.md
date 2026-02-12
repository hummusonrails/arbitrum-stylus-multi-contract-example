<p align="center">
  <img src=".github/banner.svg" alt="stylus-multi-contract-voting" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/rust-1.88.0-F74C00?style=flat-square&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/stylus--sdk-0.10.0-12AAFF?style=flat-square" alt="Stylus SDK">
  <img src="https://img.shields.io/badge/next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js">
  <a href="https://github.com/hummusonrails/stylus-multi-contract-example/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"></a>
</p>

<p align="center">
  <strong>Onchain voting system demonstrating multi-contract workspaces and type-safe cross-contract calls on Arbitrum.</strong>
  <br>
  <a href="#quick-start">Quick Start</a> · <a href="#local-development">Local Development</a> · <a href="https://github.com/hummusonrails/stylus-multi-contract-example/issues">Report a Bug</a>
</p>

## What It Does

- **Registers voters** through a dedicated voter-registry contract that manages eligibility onchain
- **Creates polls and tallies votes** via a polls contract that verifies voters through cross-contract calls
- **Generates type-safe clients** using Stylus SDK's `contract-client-gen` feature for compile-time verified inter-contract communication
- **Serves a full-stack dApp** with a Next.js frontend wired to both contracts via wagmi hooks
- **Runs locally** against a Nitro devnode with pre-funded test accounts and one-command setup

## Quick Start

```bash
pnpm install        # install all workspace dependencies
pnpm devnode        # start local Arbitrum devnode (requires Docker)
pnpm fund           # fund test accounts with 1 ETH each
pnpm deploy:all     # deploy both contracts
pnpm dev            # start frontend on :3000
```

## Stack

| Layer | Tool | Notes |
|:------|:-----|:------|
| Smart contracts | Rust + Stylus SDK 0.10 | Two contracts in a Cargo workspace |
| Cross-contract calls | `contract-client-gen` | Auto-generated type-safe client |
| Frontend | Next.js 16 + wagmi + shadcn | App Router with wallet integration |
| Local chain | Nitro devnode | Docker-based Arbitrum L2 (chain ID 412346) |
| Monorepo | pnpm workspaces | Orchestrates contracts, frontend, and scripts |
| Deploy tooling | cargo-stylus + Foundry | `cargo stylus deploy` and `cast` for interactions |

<details>
<summary><strong>Prerequisites</strong></summary>

- [Rust](https://rustup.rs/) (stable 1.88.0 — pinned in `rust-toolchain.toml`)
- [cargo-stylus](https://github.com/OffchainLabs/cargo-stylus) for deploying to Arbitrum
- [pnpm](https://pnpm.io/) 10+
- [Node.js](https://nodejs.org/) 18+
- [Docker](https://docs.docker.com/get-docker/) for the local Nitro devnode
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`cast` CLI for contract interaction and funding)

</details>

## Local Development

The fastest way to develop is against a local Arbitrum Nitro devnode. Instant transactions, pre-funded accounts, no faucet needed.

### 1. Start the devnode

```bash
pnpm devnode
```

This pulls the Nitro Docker image and starts the node. The node runs on **chain ID 412346** at `http://localhost:8547`.

To build a custom image with Rust + Foundry pre-installed (useful in CI):

```bash
pnpm devnode:stylus
```

### 2. Fund test accounts

```bash
pnpm fund
```

### 3. Add the network to MetaMask

| Setting | Value |
|:--------|:------|
| Network name | Localhost-Nitro |
| RPC URL | `http://localhost:8547` |
| Chain ID | 412346 |
| Currency symbol | ETH |

### Deployer account

Pre-funded on the devnode. Used by deploy and fund scripts.

| | |
|:--|:--|
| Address | `0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E` |
| Private Key | `0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659` |

### Test user accounts

Import any into MetaMask to interact with the dApp locally.

| # | Address | Private Key |
|:--|:--------|:------------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |
| 5 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |
| 6 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e` |
| 7 | `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955` | `0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356` |
| 8 | `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` | `0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97` |
| 9 | `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` | `0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6` |

### Full local workflow

```bash
pnpm devnode                          # terminal 1: start devnode
pnpm fund                             # terminal 2: fund test accounts
pnpm deploy:all                       # deploy, link, write .env.local, export ABIs
pnpm dev                              # start frontend
```

## Usage

### Build

```bash
pnpm build              # contracts + frontend
pnpm build:contracts    # cargo build --release --target wasm32-unknown-unknown
pnpm build:frontend     # next build
```

### Test

```bash
pnpm test               # all contract tests + frontend lint
pnpm test:contracts     # cargo test
pnpm test:frontend      # eslint
```

Target a single contract:

```bash
pnpm --filter voter-registry test
pnpm --filter polls test
```

### Deploy

```bash
pnpm deploy:all
```

This single command deploys both contracts, links them via `set_registry`, writes the contract addresses to `apps/frontend/.env.local`, and exports Solidity ABIs. Defaults to the local devnode and pre-funded deployer key.

To deploy to a different network:

```bash
export RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
export PRIVATE_KEY=0xyour_key
pnpm deploy:all
```

To deploy a single contract without the full workflow:

```bash
pnpm deploy:voter-registry
pnpm deploy:polls
```

### Frontend

```
NEXT_PUBLIC_VOTER_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_POLLS_ADDRESS=0x...
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Supports Arbitrum Sepolia and local devnode (chain ID 412346).

## Project Structure

```
stylus-multi-contract-example/
├── Cargo.toml                          # Workspace root
├── Stylus.toml                         # Workspace-level Stylus config (required by v0.10)
├── rust-toolchain.toml                 
├── package.json                        # pnpm monorepo orchestration scripts
├── pnpm-workspace.yaml                 # Workspace: apps/*, contracts/*, scripts
├── contracts/
│   ├── voter-registry/
│   │   ├── Cargo.toml                  # Declares contract-client-gen feature
│   │   ├── Stylus.toml                 # Per-contract Stylus config
│   │   └── src/
│   │       ├── lib.rs                  # Registration logic + IVoterRegistry trait
│   │       └── main.rs                 # ABI export binary entrypoint
│   └── polls/
│       ├── Cargo.toml                  # Depends on voter-registry with contract-client-gen
│       ├── Stylus.toml                 # Per-contract Stylus config
│       └── src/
│           ├── lib.rs                  # Poll CRUD + cross-contract voter verification
│           └── main.rs                 # ABI export binary entrypoint
├── apps/
│   └── frontend/                       # Next.js frontend (App Router + wagmi + shadcn)
│       ├── src/abi/                    # Contract ABIs
│       ├── src/hooks/                  # Custom hooks for contract interaction
│       ├── src/components/             # UI components
│       └── src/config/                 # Chain + contract address config
├── nitro-devnode/
│   ├── run-dev-node.sh                 # Start local Arbitrum devnode via Docker
│   ├── stylus-deployer-bytecode.txt    
│   └── stylus-dev/
│       └── Dockerfile                  # Nitro image with Rust + Foundry for Stylus
└── scripts/
    ├── deploy.sh                       # Deploy, link, write .env.local, export ABIs
    └── funds.sh                        # Fund test accounts on local devnode
```

## Contract APIs

### Voter Registry

| Function | Access | Description |
|:---------|:-------|:------------|
| `register()` | Public | Register the caller as a voter |
| `deregister()` | Public | Remove the caller from the voter roll |
| `is_registered(voter)` | View | Check if an address is registered |
| `voter_count()` | View | Total number of registered voters |
| `owner()` | View | Contract owner address |

### Polls

| Function | Access | Description |
|:---------|:-------|:------------|
| `set_registry(address)` | Owner | Set the voter-registry contract address |
| `create_poll()` | Public | Create a new poll, returns poll ID |
| `vote(poll_id, support)` | Registered voters | Cast a yes/no vote (cross-contract check) |
| `close_poll(poll_id)` | Owner | Close a poll |
| `get_results(poll_id)` | View | Returns `(yes_votes, no_votes)` |
| `has_voted(poll_id, voter)` | View | Check if an address voted on a poll |
| `is_active(poll_id)` | View | Check if a poll is still accepting votes |
| `poll_count()` | View | Total number of polls created |

## SDK v0.10 Features Demonstrated

<details>
<summary><strong>Stylus.toml workspace configuration</strong></summary>

v0.10 requires a `Stylus.toml` at the workspace root with `[workspace]` and `[workspace.networks]` sections. Each contract also has its own `Stylus.toml` with a `[contract]` section.

</details>

<details>
<summary><strong>Trait-based cross-contract interface</strong></summary>

Define a `#[public] pub trait` on the callee to declare the cross-contract API:

```rust
#[public]
pub trait IVoterRegistry {
    fn is_registered(&self, voter: Address) -> bool;
    fn voter_count(&self) -> U256;
}
```

Then implement it with `#[implements]`:

```rust
#[public]
#[implements(IVoterRegistry)]
impl VoterRegistry { /* ... */ }

#[public]
impl IVoterRegistry for VoterRegistry { /* ... */ }
```

</details>

<details>
<summary><strong><code>contract-client-gen</code> for type-safe cross-contract calls</strong></summary>

The `polls` crate depends on `voter-registry` with the `contract-client-gen` feature enabled:

```toml
voter-registry = { path = "../voter-registry", features = ["contract-client-gen"] }
```

This auto-generates a client type so the caller can invoke the callee with full type safety:

```rust
use voter_registry::{VoterRegistry, IVoterRegistry};

let registry = VoterRegistry::new(registry_addr);
let is_registered: bool = registry
    .is_registered(self.vm(), Call::new(), voter)
    .expect("Cross-contract call failed");
```

</details>

## Script Reference

| Script | What it does |
|:-------|:-------------|
| `dev` | Start frontend dev server |
| `build` | Build contracts + frontend |
| `build:contracts` | `cargo build --release --target wasm32-unknown-unknown` |
| `build:frontend` | Next.js build |
| `test` | Run all contract tests + frontend lint |
| `test:contracts` | Both cargo test commands |
| `test:frontend` | ESLint |
| `deploy:voter-registry` | Deploy voter-registry via cargo stylus |
| `deploy:polls` | Deploy polls via cargo stylus |
| `deploy:all` | Deploy both, link, write `.env.local`, export ABIs |
| `check:voter-registry` | Stylus check voter-registry |
| `check:polls` | Stylus check polls |
| `check` | Check both |
| `export-abi` | Export ABIs for both contracts |
| `devnode` | Start local Nitro devnode via Docker |
| `devnode:stylus` | Start devnode with Rust + Foundry pre-installed |
| `fund` | Fund 10 test accounts with 1 ETH each |
| `lint` | Frontend lint |
| `clean` | Remove `target/` and `.next/` |

## Contributing

Contributions are welcome. Please open an [issue](https://github.com/hummusonrails/stylus-multi-contract-example/issues) or submit a [pull request](https://github.com/hummusonrails/stylus-multi-contract-example/pulls).

## License

[MIT](LICENSE)
