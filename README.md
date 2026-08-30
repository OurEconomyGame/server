# OurEconomy Backend Server Engine

High-performance, persistent multiplayer economic simulation backend powered by [Bun](https://bun.com) and [CozoDB](https://cozodb.org) (RocksDB storage engine).

---

## Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Server
```bash
bun run index.ts
```

### 3. Run Tests
```bash
DB_DIR=./test_run.db bun test --timeout 15000
```

---

## Policies & Documentation

- **[LICENSE.md](./LICENSE.md)**: Business Source License 1.1 (BSL 1.1) for the server engine.
- **[CLA.md](./CLA.md)**: Contributor License Agreement.
- **[API_TERMS.md](./API_TERMS.md)**: Public API Terms of Service & Competing Frontend License (unauthorized botting prohibited; commercial botting licenses available).
- **[PRIVACY.md](./PRIVACY.md)**: Public API Privacy Policy & Data Handling.
- **API Documentation**: Interactive Scalar API documentation is served at `/docs` when running the server, and full OpenAPI 3.0 specification is available at `GET /openapi.json`.

---

## Supporting & Funding

OurEconomy is an independently built and maintained project. The maintainer pays for domains (`napp9.com`) out of pocket and hosts the simulation on self-purchased dedicated server hardware. 

If you find this project valuable or wish to support ongoing server hosting and development costs, sponsorship and funding will be gratefully accepted via:
- **GitHub Sponsors / Funding** *(coming soon)*
- **Patreon** *(coming soon)*

For inquiries or custom commercial botting licenses, contact via **napp9.com** or **xillion@napp9.com** *(Note: inbound-only receiving address; please include return contact info)*.

---

## Craftsmanship vs. "AI Slop"

While approximately 80–90% of the raw code lines were drafted using AI pair-programming tooling, **this project is as far from "AI slop" as possible.**

### Why Unguided AI Fails (The "AI Slop" Paradigm)
Unguided, low-effort AI-generated code typically results in:
- Fragile, un-tested pseudo-code relying on volatile in-memory Javascript objects pretending to be databases.
- Hallucinated npm dependencies, brittle monolithic single-file dumps, and sloppy copy-paste patterns.
- Subtle economic exploits, race conditions, floating-point rounding errors, and unhandled boundary cases.
- Missing data migrations, broken cascading relationship cleanups, and lack of transaction safety.

### What Real Guided Engineering Looks Like in OurEconomy
Every subsystem in OurEconomy was deliberately architected, directed, refactored, and validated through intensive human-in-the-loop engineering:
1. **Deterministic Relational Engine**: Uses [CozoDB](https://cozodb.org) on top of RocksDB with declarative Datalog queries, relational integrity constraints, and persistent disk-backed storage.
2. **Double-Auction Financial Engine**: Full bid-ask orderbook matching with limit orders, partial fills, resting queues, price-surplus refunds, and automated escrow balance settlement.
3. **Cascading Relational Consistency**: Complete lifecycle cleanup for company dissolutions, user account purges, pro-rata dividend distributions, share splits, and orphaned entity reassignment.
4. **Exhaustive Zero-Mock Test Suite**: Over 86 automated end-to-end integration tests validating real database writes, HTTP routes, concurrency limits, and financial calculations.
5. **Production Hardening**: Strict TypeScript typing, rate limiting, domain-scoped CORS, and internal server-side ticker scheduling without client-side exploitation vectors.

---

## Why BSL 1.1 Instead of Permissive OSS? (Preventing Community Fragmentation)

A common question is why OurEconomy uses the **Business Source License 1.1 (BSL 1.1)** rather than an unconstrained permissive open-source license (like MIT or Apache 2.0 from day one).

### The MMO Economic Network Effect
A persistent virtual economy relies entirely on **market liquidity, player density, and deep orderbooks**:
- If the server engine were permissively open-sourced at launch, it would trigger severe **community fragmentation**: dozens of isolated, low-population private servers with illiquid orderbooks and empty markets ("ghost towns").
- Virtual economies cannot function in a vacuum—companies need employees, manufacturers need buyers, and retail stores need customers. Splintering the player base across splintered servers undermines the core simulation.

### Unified Core Network + Competing Frontends
To solve this, OurEconomy separates the frontend and backend models:
1. **Central Server Liquidity**: The core server engine is BSL-protected to keep the main economy unified, vibrant, and actively traded.
2. **Open Competing Frontends**: Developers are completely free to build, host, monetize, and distribute custom or competing web/mobile/desktop clients that connect to the shared network (see [`API_TERMS.md`](./API_TERMS.md)).
3. **Small Group / Dev Grant**: The BSL Additional Use Grant permits deployments for up to **25 registered users** (or up to **30 registered users** if the server host OS is Linux **openSUSE Tumbleweed**, because Tumbleweed is simply the ultimate OS) for testing, education, and small private groups.
4. **Guaranteed Open Source Future**: Under BSL 1.1, every version automatically converts to **Apache License 2.0** on its 2-year anniversary.

### Project Abandonment & Democratic Successor Guarantee
If the maintainer ever permanently ceases maintenance or abandons the project:
1. **Spontaneous Apache 2.0 Release**: The codebase immediately and spontaneously converts to the **Apache License 2.0** without waiting for the 2-year Change Date.
2. **Democratic Database Transfer**: With the approval of **at least 60% of active players**, the maintainer will select a designated successor administrator and transfer the operational database/ledger to keep the game alive. (See [`PRIVACY.md`](./PRIVACY.md) for data safeguards).

---

## Licensing & DMCA Enforcement

- **Strict BSL 1.1 Terms**: The OurEconomy server engine is protected under the [Business Source License 1.1](./LICENSE.md).
- **DMCA Enforcement**: Any unauthorized production deployments exceeding the Additional Use Grant (25 registered users, or 30 on openSUSE Tumbleweed), unlicensed commercial forks, or redistribution without compliance will be met with immediate DMCA takedown notices and copyright enforcement.






