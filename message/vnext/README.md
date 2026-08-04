# ANP Messaging 1.2 Draft Profile Index

- Status: Draft / not released
- Specification set: ANP Messaging 1.2
- Scope: DID-addressed Base messaging with multi-device cryptographic overlays under one Agent DID
- Released baseline: [ANP Messaging v1.1](../01-core-binding.md)
- Chinese mirror: [ANP Messaging 1.2 草案索引](../../chinese/message/vnext/README.md)

## 1. Version boundary

The documents in this directory form the candidate ANP Messaging 1.2 specification set. They do not modify the released files in `message/` until this draft is published.

- A **Profile major version** identifies one independently negotiated wire contract, such as `anp.direct.base.v1` or `anp.direct.e2ee.v2`.
- The **Messaging specification-set version** identifies a coordinated documentation and catalog release. ANP Messaging 1.2 intentionally contains both v1 and v2 Profile identifiers.
- Profiles have independent lifecycles. A dependency on a new Profile does not require lockstep major-version changes in the rest of its dependency chain.
- P1, P2, P3, P4, P7, P8, and the P9 Mention binding retain their v1 contracts. Their 1.2 changes clarify device boundaries or define additive registered extensions.
- P5 Direct E2EE and P6 Group E2EE use v2 because their multi-device wire contracts and cryptographic state machines are not compatible with v1.
- The Agent DID remains the business identity. Messaging 1.2 introduces `device_id` only for a Profile that requires a cryptographic device endpoint under that DID.
- Ordinary non-E2EE Direct, Group, Mention, and Attachment operations remain DID-addressed and do not require or carry device selectors. Device fan-out for those operations is local to the receiving DID's domain.
- A device-addressed security operation requires the complete dependency set declared by its Profile and a valid current `deviceManifest`, even when the DID has one device. Base operations do not require a Manifest or synthesize a device.
- `meta.profile` is the sole source of truth for request interpretation and capability negotiation. Deprecated `meta.anp_version` does not select or imply any Profile set.
- An implementation **MUST NOT** infer P5/P6 v2 support from a v1 dependency, synthesize a device for a v1 peer, or silently downgrade a v2 E2EE request or session to v1.

Draft presence does not indicate SDK, service, or product implementation support, and does not authorize public capability advertisement.

## 2. Profile set

| Profile | Identifier | Document | Messaging 1.2 responsibility |
| --- | --- | --- | --- |
| P1 | `anp.core.binding.v1` | [Core Binding](01-core-binding.md) | Common DID metadata plus conditional device selectors, signed binding, capability negotiation, idempotence, and shared errors |
| P2 | `anp.identity.discovery.v1` | [Identity and Discovery](02-identity-and-discovery.md) | Root-protected `deviceManifest`, key references, eligibility, and discovery for device-addressed security Profiles |
| P3 | `anp.direct.base.v1` | [Direct Messaging Base](03-direct-messaging-base-semantics.md) | One DID-to-DID ordinary delivery, DID-level acceptance, and message correlation |
| P4 | `anp.group.base.v1` | [Group Messaging Base](04-group-messaging-base-semantics.md) | DID-scoped membership, governance, sends, and DID-addressed notifications |
| P5 | `anp.direct.e2ee.v2` | [Direct E2EE](05-direct-end-to-end-encryption.md) | Device-bound PreKey, Session, Ratchet, AAD, replay state, and Mailbox |
| P6 | `anp.group.e2ee.v2` | [Group E2EE](06-group-end-to-end-encryption.md) | Multiple independent device leaves for one member DID |
| P7 | `anp.attachment.v1` | [Attachments and Object Transfer](07-attachments-and-object-transfer.md) | DID-addressed manifest, object-control, and Bearer Ticket flows; encrypted object-key distribution is inherited from P5/P6 |
| P8 | `anp.federation.relay.v1` | [Federation and Cross-Domain](08-federation-and-cross-domain.md) | Preserve selectors and validate eligibility only when the enclosing Profile declares device addressing |
| P9 | v1 binding extension | [Message Mentions](09-message-mentions.md) | Keep mention targets DID/group-selector scoped and compose the unchanged payload with P4 v1 or P6 v2 |

The v2 E2EE dependency chains are deliberately mixed-version:

```text
anp.direct.e2ee.v2
  -> anp.core.binding.v1
  -> anp.identity.discovery.v1
  -> anp.direct.base.v1

anp.group.e2ee.v2
  -> anp.core.binding.v1
  -> anp.identity.discovery.v1
  -> anp.group.base.v1
```

## 3. Mixed-version capability declaration

A service that supports ordinary v1 messaging and multi-device E2EE v2 can declare:

```json
{
  "supported_profiles": [
    "anp.core.binding.v1",
    "anp.identity.discovery.v1",
    "anp.direct.base.v1",
    "anp.group.base.v1",
    "anp.attachment.v1",
    "anp.federation.relay.v1",
    "anp.direct.e2ee.v2",
    "anp.group.e2ee.v2"
  ]
}
```

This is one valid capability set; it does not require Base, Attachment, or Federation v2 identifiers. Each concrete request still selects exactly one Profile: Direct Base v1 for ordinary direct messaging, Direct E2EE v2 for encrypted direct messaging, Group Base v1 for ordinary group messaging, or Group E2EE v2 for encrypted group messaging.

## 4. Profile versioning rules

A Profile major version changes only when an older implementation cannot safely process the new contract, including a new required wire field; field removal or renaming; changed field meaning; changed signature or AAD coverage; changed idempotency key or state machine; or changed security-mode semantics.

Clarifications, prohibitions that make existing semantics explicit, corrected examples, composition guidance for a new Overlay, optional backward-compatible extensions, and fixes for internal documentation inconsistencies do not change the Profile major version.

Profile wire identifiers use major versions only, such as `.v1` and `.v2`. Minor versions such as 1.1 or 1.2 belong to the Messaging specification set and **MUST NOT** appear in a Profile wire identifier.

## 5. Shared decisions

All vNext Profiles use the following interpretation:

1. The Agent DID is the wire identity and address for Base messaging. `device_id` is an optional, Profile-owned cryptographic endpoint selector; when present, it is opaque, unique in its owner DID's device namespace, and never a Device DID, business member, role, hardware identifier, or `target.kind`.
2. `deviceManifest` is the complete current public device set for DIDs that advertise device-addressed security Profiles, embedded in the root-protected DID Document. It has no separate endpoint, proof, epoch, hash, or CAS protocol. Base-only discovery does not require it.
3. A Manifest entry contains only `device_id`, `signing_key_id`, `e2ee_key_id`, and `profiles[]`. Product-local roles, tokens, registry state, recovery state, and private keys are prohibited.
4. P3, P4, P7 ordinary flows, and P9 payload semantics use only business DIDs or Group DIDs and **MUST NOT** require or carry `sender_device_id`, `recipient_device_id`, or `requester_device_id`. P5/P6 own the device selectors required by E2EE, and the business target remains in `meta.target.did`.
5. The existing `anp-rfc9421-origin-proof-v1` and Data Integrity proof schemes remain in use; the P5/P6 `.v2` Profile IDs do not create a new proof scheme. Base Profiles authenticate the sender DID. P5/P6 device fields **MUST** be covered by the authenticated context defined by the owning Overlay: when that operation uses `auth.origin_proof`, its proof key must match the selected Manifest entry; P5 MTI ciphertext sends instead bind the selectors through the device-pair Session and authenticated AAD.
6. ANP does not expose deployment-private `document_version`, `document_hash`, or checkpoint fields. When eligibility may have changed, the caller re-resolves the current root-protected DID Document.
7. In device-addressed security Profiles, each device owns separate signing/E2EE private keys, PreKeys, Direct Ratchet state, MLS private state, and replay state. These are never copied between devices.
8. A removed device cannot be restored with its former `device_id` or device keys. Re-enrollment uses a new ID and new keys.
9. P6 Draft uses provisional private-use MLS ExtensionType `0xF0A1` for the mandatory LeafNode device binding. This is not an IANA assignment; a stable registered code point is a release gate.
10. New requests omit deprecated `meta.anp_version`. A receiver may retain it only for compatibility or diagnostics and **MUST NOT** use it to select a Profile or infer support for a Profile set.

## 6. Reading and review order

Read P1 and P2 first, then P3/P5 for Direct, P4/P6 for Group, and finally P7/P8/P9. Reviewers should verify the English and Chinese files together and treat any field, dependency, error-name, or example mismatch as a draft defect.

Multi-device examples are collected in [examples/message-vnext](../../examples/message-vnext/README.md).

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](../../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
