# ANP Core Protocol vNext Draft Index

- Status: Draft / not released
- Scope: Candidate revisions to ANP-01 through ANP-09
- Released baseline: [ANP 1.1 core specifications](../README.md)
- Chinese mirror: [ANP 核心协议 vNext 草案索引](../chinese/vnext/README.md)

## 1. Version boundary

The documents in this directory are candidate drafts for the core ANP protocol suite. They do not modify the released files at the repository root until this draft is published.

- A **released specification** remains the interoperability contract until a vNext draft is reviewed and published in its place.
- Draft presence does not indicate SDK, service, or product implementation support, and does not authorize public capability advertisement.
- Reviewers should treat any field, flow, error-name, or example mismatch between the English and Chinese drafts as a draft defect.

This directory adds independent ANP-02 DID authentication and refactors ANP-03 into WBA method rules and ANP-04 to preserve existing WNS and Web compatibility rules. Number 02 is reassigned from the deprecated did:all specification; historical files and links remain. ANP-01, ANP-06, ANP-07, ANP-08, and ANP-09 may be added later.

## 2. Document set

| ID | Document | Status |
| --- | --- | --- |
| ANP-01 | [Technical White Paper](../01-agentnetworkprotocol-technical-white-paper.md) | Released v1.1; vNext draft not copied yet |
| ANP-02 | [DID Authentication Protocol](02-anp-did-authentication-protocol-specification.md) | New draft; DID-method-independent HTTP/JSON authentication with WBA/Web support, informative WebVH/other-method directions |
| ANP-03 | [did:wba Method Specification](03-did-wba-method-design-specification.md) | Candidate revision; common authentication extracted to ANP-02 |
| ANP-04 | [ANP DID Namespace Specification (WNS)](04-anp-did-wba-name-space-specification.md) | Candidate revision; original WBA binding behavior and existing Web domain compatibility |
| ANP-06 | [Agent Communication Meta-Protocol](../06-anp-agent-communication-meta-protocol-specification.md) | Released draft; vNext copy not added yet |
| ANP-07 | [Agent Description Protocol](../07-anp-agent-description-protocol-specification.md) | Released v1.1; vNext draft not copied yet |
| ANP-08 | [Agent Discovery Protocol](../08-ANP-Agent-Discovery-Protocol-Specification.md) | Released v1.1; vNext draft not copied yet |
| ANP-09 | [End-to-End Instant Messaging Overview](../09-ANP-end-to-end-instant-messaging-protocol-specification.md) | Released v1.1; messaging vNext remains in [`message/vnext/`](../message/vnext/README.md) |

Historical appendices remain available; this directory adds a candidate Web integration appendix:

- [Appendix A: did:wba `k1_` Compatibility Extension](../appendix-a-did-wba-k1-compatibility-extension.md)
- [Appendix B: Native `did:web` integration candidate](appendix-b-compatibility-with-native-did-web.md); the [released compatibility text](../appendix-b-compatibility-with-native-did-web.md) stays unchanged

## 3. Reading and review order

Read ANP-02 common authentication and method bindings, then ANP-03 method rules, ANP-04 WNS, and Messaging P1/P2. Normative dependencies run from ordinary APIs to ANP-02 to applicable method rules, and from Messaging to P1/P2 to ANP-02 public requirements. ANP-02 does not require Messaging or WNS in reverse. Review both languages, the [vectors](../examples/did-authentication-vnext/README.md).

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
