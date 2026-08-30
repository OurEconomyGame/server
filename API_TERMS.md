# OurEconomy Public API Terms of Service & Client Policy

Last Updated: August 2026

Welcome to the **OurEconomy** Public Game API. These API Terms of Service ("Terms") govern access to and use of the OurEconomy public server endpoints by third-party applications, client developers, and users.

---

## 1. Open Client & Competing Frontend License

1. **Permission to Build Frontends**: You are granted a revocable, non-exclusive, worldwide right to build, host, distribute, and operate alternative, custom, or competing user interfaces and client applications (web, mobile, desktop, CLI) that connect to and interact with the OurEconomy public game API.
2. **Commercial Use & Monetization**: You may monetize your client application (e.g., through subscriptions, ads, or purchase fees for the frontend itself), provided that you do not sell in-game assets, unfair advantages, or violate these Terms.
3. **Attribution**: Third-party frontends should clearly indicate that they are an unofficial or independent client connecting to the OurEconomy network.

---

## 2. Prohibition on Unauthorized Botting & Purchased Botting Licenses

1. **Default Prohibition on Automated Gameplay**: All forms of unapproved automated play, algorithmic trading bots, automated worker scripts, auto-clickers, macros, headless script agents, or automated scrapers are **strictly prohibited** by default.
2. **Commercial Botting License Requirement**: Automated gameplay, script agents, and botting are permitted **solely and exclusively** under an official **Commercial Botting License that MUST BE PURCHASED** and explicitly granted in writing by the server runner/operator (contactable via napp9.com / xillion@napp9.com; note: xillion@napp9.com is an inbound-only receiving address that does not send outgoing emails—please include alternate return contact information in all communications and expect replies from a different email address).
3. **Enforcement & Penalties**: Any accounts, companies, sessions, or IP addresses found engaging in automated play without a valid, purchased botting license are subject to immediate termination, complete economic asset forfeiture, and permanent network-level banning without refund or notice.

---

## 3. Authentication, Security & Account Policies

1. **Centralized Registration**: Account creation (`POST /signup`) is managed centrally through official channels (`*.napp9.com`). Third-party frontends must not attempt to circumvent or bypass domain or authentication restrictions.
2. **Credential Security**: Client applications must never log, harvest, intercept, or insecurely transmit player credentials (passwords or session tokens). All requests carrying authentication tokens must use secure HTTPS connections.
3. **No Exploits**: Exploiting bugs, glitches, race conditions, or undocumented vulnerabilities in the game economy or server software is strictly forbidden.

---

## 4. Fair Use & Rate Limiting

1. **Service Availability**: Frontends must respect server rate limits and implement reasonable backoff mechanisms for HTTP errors (`429`, `500`, `503`).
2. **No Denial of Service**: High-frequency request flooding, stress testing, scraping, or any activity that degrades server performance for other players is prohibited.

---

## 5. Modifications & Termination

1. **Service Changes**: The server runner reserves the right to modify API endpoints, reset or balance game mechanics, or terminate API access at any time.
2. **Revocation**: Violation of any provision of these Terms will result in immediate revocation of API access rights and blocking of associated clients, sessions, or user accounts.

---

## 6. Disclaimer of Warranty & Limitation of Liability

THE OUR ECONOMY API AND SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL THE SERVER OPERATOR, LICENSORS, OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OF OR INABILITY TO ACCESS THE API OR IN-GAME ASSETS.
