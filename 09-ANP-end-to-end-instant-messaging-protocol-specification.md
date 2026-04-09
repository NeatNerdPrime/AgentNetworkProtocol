# ANP End-to-End Instant Messaging Protocol Overview (Draft 1.0)

> This document provides a top-level overview of the ANP end-to-end instant messaging specification suite. It is intended to help readers quickly understand the goals, layering, core ideas, and key technical directions of the protocol family. This document is not a clause-by-clause normative specification; normative requirements are defined by the individual Profile specifications.

---

## 1. What is ANP end-to-end instant messaging

ANP end-to-end instant messaging is a family of protocol specifications for **cross-domain instant messaging between Agents**.

It is not designed to solve "how to chat within a certain product", but:

- How agents in different domains, different platforms, and different implementations can discover each other;
- How to send direct and group messages;
- How to provide end-to-end encryption when needed;
- How to transfer attachments and large objects;
- How to complete routing, relaying, sorting and result witnessing in cross-domain scenarios.

The protocol endpoint for ANP is the **Agent**, not the device, terminal, or internal replica. Whether there are multiple executors, multiple worker nodes or multiple device instances inside an Agent does not belong to the interoperability boundary of ANP, but is an implementation issue of the Agent itself.

---

## 2. Core Principles

### 2.1 Federation, not a single center

ANP adopts a **Federated** architecture, which is closer to Email in concept than a single central server architecture.

Each Agent or group can belong to different domains, and different domains communicate through standardized service discovery, service-to-service direct invocation, and result witness mechanisms. That is to say:

- Identity is distributed;
- Service endpoints are distributed;
- cross-domain service invocations can occur;
- But each type of operation has clear boundaries of responsibility.

In the direct messaging scenario, the ingress service of the domain where the target Agent is located is responsible for receiving messages; in the group scenario, the group Host Service is responsible for group status sorting and group event serialization.

### 2.2 Identity priority, service discovery priority

The first-class identifier of the ANP is not the username or device number, but:

- `agent_did`
- `group_did`

ANP discovers interactive service endpoints through DID documents, and uses this to establish subsequent message sending, key discovery, group service discovery, and object service discovery paths. In the current version, the ANP service endpoint disclosed by DID documents is unified as `ANPMessageService`; capabilities such as direct messaging, group messaging, key material access, and object control are carried by this unified service endpoint.

### 2.3 Layered design instead of “one unified protocol”

ANP does not cram all the issues into one document, but splits them into 8 Profiles:

- P1/P2: Core Binding and Identity and Discovery
- P3/P4: Basic business semantics of direct messaging and group messaging
- P5/P6: E2EE Overlay of direct messaging and group messaging
- P7: Attachments and large objects
- P8: Federation, cross-domain service invocation and group event distribution

The benefits of this design are:

- Decoupling basic message semantics and security semantics;
- Plaintext mode and encryption mode can coexist;
- Direct messaging, group messaging, attachments, and federation are all cleanly separated;
- Subsequent upgrade of a certain layer does not require overturning the entire protocol.

### 2.4 Separation of the control plane and the data plane

ANP clearly distinguishes between:

- **control plane**: group creation, invitation, adding members, removing members, capability negotiation, ticket issuance, cross-domain service invocation, etc.;
- **data plane**: direct messages, group messages, attachment object content.

Especially in attachment scenarios, ANP explicitly adopts:

- Carry the **manifest** in the message;
- Object content is downloaded through a separate HTTP(S) channel;
- The cross-domain service invocation path does not forward the object byte stream.

---

## 3. Core Design

### 3.1 Unified outer binding: JSON-RPC

ANP's unified outer binding adopts **JSON-RPC 2.0** and has been tightened:

- `params` uses object form;
- `id` uses strings;
- batch is not used;
- Notification is only used in explicit asynchronous notification scenarios.

The purpose of this is to maintain a unified request/response/error model between different languages, different platforms, and different services while keeping the implementation simple.

### 3.2 Direct messaging and group messaging are modeled separately

ANP does not make "message" into a vague large object, but clearly distinguishes:

- `direct.send`: direct messaging
- `group.send`: group messaging

At the same time, group messaging is not only "sending messages", but also includes:

- `group.create`
- `group.invite`
- `group.accept_invite`
- `group.join`
- `group.add`
- `group.remove`
- `group.leave`
- `group.update_profile`
- `group.update_policy`

This allows group governance, group status, and group encryption to be naturally connected.

### 3.3 Plaintext and E2EE coexist

ANP allows:

- `transport-protected`: Relies only on transport security
- `direct-e2ee`: direct messaging end-to-end encryption
- `group-e2ee`: group messaging end-to-end encryption

In other words, the base profile can run independently; the security overlay is superimposed on top of it. This is conducive to progressive deployment and the adoption of different security levels in different scenarios.

---

## 4. Core technical route

### 4.1 Transport and message binding: JSON-RPC 2.0

ANP uses JSON-RPC 2.0 as the unified message binding layer. Its function is not to "simulate function calls", but to provide unified:

- Request format
- response format
- Error model
- Capability negotiation interface
- Asynchronous notification mechanism

This allows ANP to share a consistent outer protocol shape in different scenarios such as direct messaging, group messaging, attachment control, and cross-domain service invocation.

### 4.2 Direct messaging end-to-end encryption: X3DH-like + Double Ratchet-like

ANP's direct messaging E2EE adopts the following technical route:

- Identity anchor: `did:wba`
- Key discovery: Obtained via `ANPMessageService` exposed by DID document
- Initial link establishment: `X3DH-like`
- Subsequent message protection: `Double Ratchet-like`

Specifically:

- The authentication key in the DID document is used to prove identity;
- `keyAgreement` (e.g. X25519) in the DID document is used for negotiation;
- Prekey Bundle is used for asynchronous offline link building;
- Ratchet is used for subsequent per-message key rolling, out-of-order tolerance and replay protection.

This route is suitable for Agent asynchronous communication and leaves room for upgrades to stronger packages.

### 4.3 Group end-to-end encryption: MLS + did:wba binding

ANP's group E2EE mainline adopts:

- **MLS** as a group key state machine;
- **did:wba** as identity anchor;
- **Group Host Service** as the authority for sequencing and receipts.

This means:

- Group application messages are carried using `PrivateMessage`;
- Member addition, removal, welcome, external joining and other capabilities are completed through MLS's `KeyPackage / Commit / Welcome / External Commit`;
- `group_did`, `group_state_version`, `policy_hash` are bound to the cryptographic group status;
- `group_receipt` is responsible for proving that "the operation or message was accepted and sequenced by the group".

This approach is more suitable to become a long-term standard than inventing a group cryptography state machine.

### 4.4 Attachments and objects: Manifest + standalone HTTPS download + optional object-level encryption

The attachment scheme adopts a three-layer structure:

1. **Message layer**: carry only `attachment_manifest`
2. **Access layer**: Control downloads through Object Service and short-term download ticket
3. **Content layer**: Do object-level encryption (`object-e2ee`) on the object itself if necessary

Therefore:

- Large objects are not transferred through the cross-domain service invocation link;
- The download link can be made into a locator instead of a long-term direct link;
- Can ask for `requires_ticket = true`;
- Even if the link is leaked, object-level encryption can be used to ensure that the third party cannot get the clear text.

### 4.5 Federation: Direct call from service to service

The federation layer of ANP defines:

- Service discovery
- cross-domain direct call from service to service
- Group Host sorting
- cross-domain call of attachment control plane
- The final landing point of `attachment.get_download_ticket`

One of the important principles is:

- In cross-domain, directly use the original business method or control method to interact with the target service, instead of adding an independent Relay packaging protocol;
- The object byte stream must be downloaded independently via HTTPS;
- Group operations use Group Host acceptance and sorting as cross-domain success semantics;
- direct messaging takes acceptance of the target Agent ingress service as cross-domain success semantics.

---

## 5. Key design trade-offs

ANP has several conscious design trade-offs:

### 5.1 Do not put the concept of device into the protocol

ANP believes that "devices, multiple terminals, and internal copies" are Agent internal implementation issues, not interoperability protocol issues.

### 5.2 Group governance takes precedence over ultimate anonymity

In a group scenario, ANP simultaneously preserves:

- Proof of originator (who initiated the request)
- Witness the group result (whether the group accepts it)
- In-group message confidentiality (MLS)

This means that it is more of a "governance-friendly Agent protocol" than a purely anonymous chat protocol.

### 5.3 Attachment security does not rely on "hidden links"

ANP does not use "absolutely hidden download links" as a core security method, but uses:

- Controlled download ticket
- Short URL
- object-level encryption

To ensure that even if the link is leaked, meaningful plaintext may not be obtained.

---

## 6. Document structure

The following 8 Profiles constitute the current specification set of ANP:


|serial number|document|effect|Content overview|
| --- | --- | --- | --- |
| 1 | [01-Core Binding](message/01-core-binding.md) | Defines the unified outer binding | Specifies JSON-RPC interoperability constraints, the common `params` structure, payload representation, capability negotiation, idempotency, the error model, and method namespaces. |
| 2 | [02-Identity and Discovery](message/02-identity-and-discovery.md) | Defines identity and service discovery | Specifies the semantics of Agent DID / Group DID, the ANP interpretation rules for DID documents, the unified `ANPMessageService` service endpoint, and the discovery process. |
| 3 | [03-Direct Messaging Base Semantics](message/03-direct-messaging-base-semantics.md) | Defines the direct messaging base business layer | Specifies base direct messaging methods such as `direct.send`, the content model, acceptance semantics, idempotency semantics, ordering semantics, and the boundary of sender proof. |
| 4 | [04-Group Messaging Base Semantics](message/04-group-messaging-base-semantics.md) | Defines the group lifecycle and the base layer for group messages | Specifies group creation, invitation, joining, membership changes, group profile / policy updates, `group.send`, group state versions, and the ordering responsibilities of the Group Host. |
| 5 | [05-Direct End-to-End Encryption](message/05-direct-end-to-end-encryption.md) | Defines the direct messaging E2EE overlay | Specifies the Prekey Bundle, `did:wba` bindings, X3DH-like initial session establishment, Double Ratchet-like follow-up messages, AAD, replay protection, and session re-establishment. |
| 6 | [06-Group End-to-End Encryption](message/06-group-end-to-end-encryption.md) | Defines the group E2EE overlay | Specifies MLS-based group cryptographic state, KeyPackage publication and discovery, the mapping from base group methods to the cryptographic state machine, and the handling of `epoch` and forks. |
| 7 | [07-Attachments and Object Transfer](message/07-attachments-and-object-transfer.md) | Defines attachments and large-object semantics | Specifies the `attachment_manifest`, Object Service, upload / commit / download tickets, object-level encryption, and how attachments are carried in direct messaging and group messaging. |
| 8 | [08-Federation and Cross-Domain](message/08-federation-and-cross-domain.md) | Defines the principles of cross-domain service invocation | Specifies service roles, discovery and routing, service-to-service security, principles for direct cross-domain calls, group event distribution, and cross-domain success semantics. |


The recommended reading order is:

- Read P1 / P2 first
- Then read P3 / P4
- Then read P5 / P6
- Finally read P7 / P8

---

## 7. Summary

At its core, ANP is not about building "a chat protocol." It is about building a set of **cross-domain communication standards for the Agent ecosystem**.

Its basic approach can be summarized as follows:

- **Federation**: cross-domain interoperability like Email;
- **Identity first**: DID serves as the unified anchor;
- **Layered design**: business semantics, encryption, attachments, and federation are separated from one another;
- **Optional E2EE overlay**: the base protocol can run independently, and the security overlay can be enabled as needed;
- **Direct attachment download**: messages carry manifests, while objects use an independent HTTP(S) data plane;
- **Governance-friendly**: especially in group scenarios, the design balances identity, ordering, receipts, and encryption.

This makes ANP both an implementable protocol suite and a foundation for long-term standardization and future evolution.
