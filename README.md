# EquiBlock Liquidation Manager

Automated on-chain liquidations for EquiBlock. This monorepo runs a backend worker that monitors vault health and, when a position becomes liquidatable, safely executes approvals and liquidation transactions via a Vincent Ability using PKP signing.

### Links

- 🎥 Check out the demo in action: https://x.com/_Adithya_n_g/status/1982858959867523381
- Live here: https://frontend-production-aabf.up.railway.app/
- Repo: https://github.com/Adithya2310/VincentLiquidationManager
- Ability Link: https://www.npmjs.com/package/@equiblock/vincent-liquidity-manager

## What is this?

EquiBlock Liquidation Manager is an execution service that protects EquiBlock’s solvency by:

- Continuously checking user positions (e.g., `vault.isLiquidatable(user)`)
- Running a precheck to confirm the liquidation will succeed and the agent wallet has sufficient PYUSD
- Executing the liquidation flow with PKP signing:
  - Approve PYUSD to the vault if allowance is insufficient
  - Call `vault.liquidate(user)`

All execution is encapsulated in a versioned Vincent Ability so EquiBlock gets:

- Clear user permissioning via Vincent App connections
- Reproducible and auditable execution (precheck + execute)
- Safer on-chain ops using the Lit network (PKP signing) and optional policy controls

## How this assists EquiBlock

- Protects protocol solvency by automating liquidations across monitored users
- Enforces checks before spending funds with a strict `precheck` phase
- Reduces operational overhead; liquidation logic ships as an Ability and upgrades via standard versioning
- Fully compatible with the broader EquiPool stack and can be invoked from scheduled jobs

## Architecture

- Frontend: a lightweight dashboard (live link above) for visibility
- Backend (Node.js on Railway):
  - Express API + Agenda worker
  - Job `executeLiquidation` scans users, calls the Vincent Ability to precheck/execute
- Vincent Ability: `@equiblock/vincent-liquidity-manager`
  - Precheck reads vault + oracle state, computes required PYUSD, and validates balances
  - Execute approves PYUSD (if needed) and calls `vault.liquidate(user)` on Sepolia

## Packages in this monorepo

| Package               | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| packages/dca-frontend | Frontend dashboard (status/visibility)                 |
| packages/dca-backend  | API + worker (Agenda) invoking the liquidation Ability |

## Quick Start

Install deps and build all packages:

```zsh
pnpm install && pnpm build
```

Then start services (ensure required environment variables are provided through your platform’s secret manager):

```zsh
pnpm start
```

Notes:

- The backend job `executeLiquidation` uses the Sepolia RPC defined in your environment and the Vincent App that users have connected to.
- Abilities are versioned. If you publish a new Ability version, users must approve the new version before execution.

## How the liquidation flow works

1. Monitor: check `vault.isLiquidatable(user)` per configured users
2. Precheck (Ability):
   - Reads vault: debt, oracle price, PYUSD token
   - Computes required PYUSD amount and validates agent wallet balance
3. Execute (Ability):
   - Approves PYUSD to vault when allowance < required amount
   - Calls `vault.liquidate(user)` via PKP signing
4. Logs tx hashes for auditability

## Ability details

- NPM: `@equiblock/vincent-liquidity-manager`
- Precheck: ensures user is liquidatable and agent wallet has sufficient PYUSD
- Execute: approves and liquidates on Sepolia (chainId 11155111)

## Disclaimers

- This is a demo/POC and not production-ready without further hardening.
- Use at your own risk. Ensure compliance with your jurisdiction’s regulations.
