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

## Craftsmanship & Licensing Enforcement

- **Strict BSL & DMCA Enforcement**: The OurEconomy server engine is licensed under the [Business Source License 1.1](./LICENSE.md). Any unauthorized production deployments exceeding the Additional Use Grant (25 registered users), unlicensed redistribution, or license violations will be met with immediate DMCA takedown notices and copyright enforcement.
- **Architectural Quality**: While 80–90% of this codebase was authored with AI pair-programming assistance, this codebase is engineered with strict human oversight, deterministic relational database modeling, exhaustive unit/integration testing, clean modularity, and strict TypeScript typing. It is as far from "AI slop" as possible.


