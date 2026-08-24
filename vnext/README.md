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

This directory currently starts from ANP-03 and ANP-04, copied from the released v1.1 text as the initial working drafts. ANP-01, ANP-06, ANP-07, ANP-08, and ANP-09 may be added later.

## 2. Document set

| ID | Document | Status |
| --- | --- | --- |
| ANP-01 | [Technical White Paper](../01-agentnetworkprotocol-technical-white-paper.md) | Released v1.1; vNext draft not copied yet |
| ANP-03 | [did:wba Method Specification](03-did-wba-method-design-specification.md) | Initial vNext draft copied from released v1.1 |
| ANP-04 | [ANP-DID:WBA Name Space Specification](04-anp-did-wba-name-space-specification.md) | Initial vNext draft copied from released v1.1 |
| ANP-06 | [Agent Communication Meta-Protocol](../06-anp-agent-communication-meta-protocol-specification.md) | Released draft; vNext copy not added yet |
| ANP-07 | [Agent Description Protocol](../07-anp-agent-description-protocol-specification.md) | Released v1.1; vNext draft not copied yet |
| ANP-08 | [Agent Discovery Protocol](../08-ANP-Agent-Discovery-Protocol-Specification.md) | Released v1.1; vNext draft not copied yet |
| ANP-09 | [End-to-End Instant Messaging Overview](../09-ANP-end-to-end-instant-messaging-protocol-specification.md) | Released v1.1; messaging vNext remains in [`message/vnext/`](../message/vnext/README.md) |

Compatibility appendices remain at the repository root until a vNext draft needs to revise them:

- [Appendix A: did:wba `k1_` Compatibility Extension](../appendix-a-did-wba-k1-compatibility-extension.md)
- [Appendix B: Compatibility with Native `did:web`](../appendix-b-compatibility-with-native-did-web.md)

## 3. Reading and review order

Read ANP-03 first, then ANP-04. Handle naming, DID rotation, and bidirectional binding should stay consistent between the two drafts. Reviewers should check the English and Chinese files together.

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
