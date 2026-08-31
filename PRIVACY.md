# OurEconomy Public API Privacy Policy

Last Updated: August 2026

This Privacy Policy explains how the **OurEconomy** backend server ("Server", "we", "our") collects, processes, and protects information when clients, frontends, and developers interact with our public game API.

---

## 1. Information We Collect

1. **Account Credentials**: We store basic account identifiers (username/handle, optional contact email, and securely hashed authentication secrets) to authenticate player sessions. We do not sell, rent, or monetize user data.
2. **In-Game Messages & Communications**: Text messages transmitted between users via the `/message/*` API endpoints are stored in the server database (including sender ID, recipient ID, subject line, message body content, and message IDs).
3. **Company Records & Transaction Logs**: Internal company operations—including facility construction, decommissioning refunds, WebStore retail sales to players and NPC consumers, and market trade settlements—are recorded within company transaction logs (`data.logs`).
4. **Server Logs & Telemetry**: HTTP requests are processed by our backend engine (Bun / RocksDB / reverse proxies), which automatically logs technical request metadata (IP addresses, HTTP request headers, User-Agent, and timestamps) for routing, diagnostic monitoring, rate limiting, and abuse prevention.
5. **Public Simulation Ledger**: In-game economic state—including company founding, stock holdings, trade executions, orderbook offers, set wages, dividends, and public store pricing/inventory—are recorded openly as part of the public shared game ledger.

---

## 2. Access Controls & Private vs. Public Data

1. **Public Information**:
   - Company public profiles (name, founder, CEO, type, total shares outstanding, set wage rate).
   - WebStore catalog pricing, food pricing, and available retail inventory (`/store`, `/company`).
   - Market orderbook buy orders and sell offers.
   - Company shareholder rosters and ownership percentages.

2. **Private User Data & Permissions**:
   - Personal cash balances, personal inventory, email addresses, and daily work quota status are private.
   - Private user data is accessible only by the account owner and the Root Administrator (`UID 0`) for system maintenance, dispute resolution, and administrative oversight.

3. **Private Company Data**:
   - Company facility rosters, detailed manufacturing inventories, and internal transaction logs (`data.logs`) are private.
   - Private company data is accessible only by the company's designated CEO and the Root Administrator (`UID 0`).

4. **In-Game Messaging Privacy**:
   - Message contents and inboxes are private.
   - Messages are accessible only by the sender, the intended recipient, and the Root Administrator (`UID 0`) for safety, abuse prevention, and platform moderation.

---

## 3. Token Storage & Client Responsibility

1. **Authentication Tokens**: The API issues temporary cryptographic session tokens (`random`) upon login or signup.
2. **Client-Side Storage**: Client applications and third-party frontends storing tokens in `localStorage` or memory must implement appropriate safeguards to avoid leaking session tokens. We do not use tracking cookies or third-party behavioral trackers.

---

## 4. Account Deletion & Right to Erasure

1. **Direct Account Deletion**: Users may delete their account and associated data directly at any time via `POST /user/delete`.
2. **Message Deletion**: Users may delete specific in-game messages at any time via `POST /message/delete` (or `?message_id=`).
3. **Cascading Cleanup**: Deleting an account immediately purges:
   - User record and profile data from the database.
   - All active authentication sessions.
   - All owned company shares and open orderbook orders.
   - Orphaned companies where the user is both founder and sole CEO.
4. **Infrastructure Log Retention**: Note that technical transit logs retained by hosting networks or external proxies for security monitoring are rotated according to standard operational retention schedules and cannot be retroactively modified.

---

## 5. Age Policy (13+)

The OurEconomy API and game simulation are strictly intended for users aged **13 and older**. In compliance with COPPA, GDPR, and applicable privacy regulations, we do not knowingly collect or maintain personal data from children under 13. Accounts discovered to belong to users under 13 will be terminated.

---

## 6. Contact Information

For privacy questions, data inquiries, or notices regarding the API, contact the project owner at **napp9.com** or **xillion@napp9.com**.

> **Note on Email Communications**: `xillion@napp9.com` is an inbound-only receiving address that does not send outgoing emails. All inquiries should provide alternate return contact information and expect any replies to originate from a different administrative address.

---

## 7. Project Abandonment & Democratic Data Transfer Policy

In the event that the project maintainer permanently ceases active maintenance or steps down from operating the primary OurEconomy network:
1. **Spontaneous Apache 2.0 Open Source Conversion**: The codebase will immediately and spontaneously be licensed under Apache License, Version 2.0.
2. **Democratic Successor Transfer**: The operational player database (including user accounts, company registries, in-game communications, and ledger state) will **never be sold**. The database may only be transferred to a designated successor administrator if at least **sixty percent (60%) of active players** vote in favor of the transfer. If the 60% approval threshold is not met, user authentication credentials, personal records, and private communications will be permanently purged to protect player privacy.

---

## 8. Supporting & Funding the Project

OurEconomy is an independent project. The maintainer pays for domain names (`napp9.com`) out of pocket and operates the simulation on self-purchased dedicated server hardware. Community contributions and funding will be gratefully accepted via GitHub Sponsors / GitHub Funding and Patreon (as soon as setups are completed).

---

## 9. Policy Revisions

We may update this Privacy Policy periodically. Any revisions will be published directly to this file in the server repository and reflected in API documentation.
