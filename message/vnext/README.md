# ANP Messaging vNext Draft Profile Index

- Status: Draft / not released
- Scope: DID-addressed Base messaging with multi-device cryptographic overlays under one Agent DID
- Released baseline: [ANP Messaging v1.1](../01-core-binding.md)
- Chinese mirror: [ANP 消息 vNext 草案索引](../../chinese/message/vnext/README.md)

## 1. Version boundary

The documents in this directory are separately versioned drafts. They do not modify or reinterpret the released files in `message/`.

- v1.1 treats devices as an Agent-internal implementation detail.
- vNext retains the Agent DID as the business identity and introduces `device_id` only for a Profile that requires a cryptographic device endpoint under that DID.
- Ordinary non-E2EE Direct, Group, Mention, and Attachment operations remain DID-addressed and do not require or carry device selectors. Device fan-out for those operations is local to the receiving DID's domain.
- A device-addressed security operation requires the complete dependency set declared by its Profile and a valid current `deviceManifest`, even when the DID has one device. Base operations do not require a Manifest or synthesize a device.
- An implementation **MUST NOT** infer v2 support from v1, synthesize a device for a v1 peer, or silently downgrade a v2 request or session to v1.

Draft presence does not indicate SDK, service, or product implementation support, and does not authorize public capability advertisement.

## 2. Profile set

| Profile | Identifier | Document | Main vNext responsibility |
| --- | --- | --- | --- |
| P1 | `anp.core.binding.v2` | [Core Binding](01-core-binding.md) | Common DID metadata plus conditional device selectors, signed binding, capability negotiation, idempotence, and shared errors |
| P2 | `anp.identity.discovery.v2` | [Identity and Discovery](02-identity-and-discovery.md) | Root-protected `deviceManifest`, key references, eligibility, and discovery for device-addressed security Profiles |
| P3 | `anp.direct.base.v2` | [Direct Messaging Base](03-direct-messaging-base-semantics.md) | One DID-to-DID ordinary delivery, DID-level acceptance, and message correlation |
| P4 | `anp.group.base.v2` | [Group Messaging Base](04-group-messaging-base-semantics.md) | DID-scoped membership, governance, sends, and DID-addressed notifications |
| P5 | `anp.direct.e2ee.v2` | [Direct E2EE](05-direct-end-to-end-encryption.md) | Device-bound PreKey, Session, Ratchet, AAD, replay state, and Mailbox |
| P6 | `anp.group.e2ee.v2` | [Group E2EE](06-group-end-to-end-encryption.md) | Multiple independent device leaves for one member DID |
| P7 | `anp.attachment.v2` | [Attachments and Object Transfer](07-attachments-and-object-transfer.md) | DID-addressed manifest, object-control, and Bearer Ticket flows; encrypted object-key distribution is inherited from P5/P6 |
| P8 | `anp.federation.relay.v2` | [Federation and Cross-Domain](08-federation-and-cross-domain.md) | Preserve selectors and validate eligibility only when the enclosing Profile declares device addressing |
| P9 | vNext binding extension | [Message Mentions](09-message-mentions.md) | Bind unchanged mention payload semantics to P1/P4/P6 v2 |

## 3. Shared decisions

All vNext Profiles use the following interpretation:

1. The Agent DID is the wire identity and address for Base messaging. `device_id` is an optional, Profile-owned cryptographic endpoint selector; when present, it is opaque, unique in its owner DID's device namespace, and never a Device DID, business member, role, hardware identifier, or `target.kind`.
2. `deviceManifest` is the complete current public device set for DIDs that advertise device-addressed security Profiles, embedded in the root-protected DID Document. It has no separate endpoint, proof, epoch, hash, or CAS protocol. Base-only discovery does not require it.
3. A Manifest entry contains only `device_id`, `signing_key_id`, `e2ee_key_id`, and `profiles[]`. Product-local roles, tokens, registry state, recovery state, and private keys are prohibited.
4. P3, P4, P7 ordinary flows, and P9 payload semantics use only business DIDs or Group DIDs and **MUST NOT** require or carry `sender_device_id`, `recipient_device_id`, or `requester_device_id`. P5/P6 own the device selectors required by E2EE, and the business target remains in `meta.target.did`.
5. The existing `anp-rfc9421-origin-proof-v1` and Data Integrity proof schemes remain in use; a `.v2` Profile ID does not create a new proof scheme. Base Profiles authenticate the sender DID. P5/P6 device fields **MUST** be covered by the authenticated context defined by the owning Overlay: when that operation uses `auth.origin_proof`, its proof key must match the selected Manifest entry; P5 MTI ciphertext sends instead bind the selectors through the device-pair Session and authenticated AAD.
6. ANP does not expose deployment-private `document_version`, `document_hash`, or checkpoint fields. When eligibility may have changed, the caller re-resolves the current root-protected DID Document.
7. In device-addressed security Profiles, each device owns separate signing/E2EE private keys, PreKeys, Direct Ratchet state, MLS private state, and replay state. These are never copied between devices.
8. A removed device cannot be restored with its former `device_id` or device keys. Re-enrollment uses a new ID and new keys.
9. P6 Draft uses provisional private-use MLS ExtensionType `0xF0A1` for the mandatory LeafNode device binding. This is not an IANA assignment; a stable registered code point is a release gate.

## 4. Reading and review order

Read P1 and P2 first, then P3/P5 for Direct, P4/P6 for Group, and finally P7/P8/P9. Reviewers should verify the English and Chinese files together and treat any field, dependency, error-name, or example mismatch as a draft defect.

Multi-device examples are collected in [examples/message-vnext](../../examples/message-vnext/README.md).

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](../../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
