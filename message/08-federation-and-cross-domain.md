# ANP Profile 8: Federation and Cross-Domain (Final Consolidated Draft)

- Document ID: ANP-P8
- Title: Federation and Cross-Domain
- Status: Draft
- Version: 0.4.0 (Final Consolidated Draft)
- Language: English
- Applicability: This Profile applies to ANP's cross-domain service discovery, service-to-service invocation, group event distribution, and cross-domain invocation of object control plane.

---

## 1. Purpose

This Profile only explains how to establish connections between different services in the **TERM_14__ scenario, how to call them, and what principles should be followed**.

The focus of this Profile is:

1. How one domain sends requests for remote Agents to the ANP service endpoint exposed by the other domain;
2. How a domain sends operations for remote groups to the domain where the group Host is located;
3. How does the Group Host distribute the sorted group events to the domain where the members are located;
4. How to call cross-domain for object control plane (not object byte stream);
5. How to implement the cross-domain call of `attachment.get_download_ticket`;
6. cross-domain Which DID should be used in outer HTTP authentication when calling the service;
7. cross-domain Safety, idempotence, retry and success semantics of service calls.

This Profile **does not** repeatedly define the following contents, they are subject to other Profiles:

- `direct.send`, `group.send`, `group.add`, `group.remove` and other business methods themselves;
- E2EE payload structure and cryptographic semantics;
- Attachment object structure, ticket format and object verification rules;
- Service types and discovery basic rules in DID documents;
- Intra-domain routing implementation, history synchronization, read receipt, Presence;
- Internal implementation of object byte stream relay, CDN or object storage.

---

## 2. Terminology and normative conventions

### 2.1 Normative keywords

In this document, **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, **OPTIONAL** are interpreted as normative requirements according to their capitalized form.

### 2.2 Terminology

- **Sender domain service**: The service in the sender's domain that accepts local requests and is responsible for initiating cross-domain service invocations, usually the external `ANPMessageService` of this domain.
- **Target Domain Service**: The service endpoint exposed by the target DID that is responsible for receiving this cross-domain request.
- **Federated Service DID**: The DID used by a domain in cross-domain service-to-service HTTP authentication. It is usually declared by the `serviceDid` field of the sender's `ANPMessageService` entry and identifies the identity of the service that initiated the cross-domain call, rather than the original business sender. For `did:web` and `did:wba`, it is recommended to use naked domain name DID.
- **Group Host Service**: A service that has sorting rights and group status promotion responsibilities for a certain `group_did`.
- **Object Service**: A service responsible for uploading, downloading, ticket issuance and access control of attachment objects.
- **Ordered Group Event**: A group event of `group_event_seq` has been accepted and assigned by the Group Host.
- **Final Acceptance**: A cross-domain operation reaches its final protocol responsibility endpoint and is accepted.

---

## 3. Design principles

### 3.1 Directly use the original method cross-domain

In the cross-domain scenario, the sender domain service **SHOULD** directly uses the original business method or control method to interact with the target domain service, instead of including an additional layer of independent Relay JSON-RPC methods. That is to say:

- direct messagingcross-domain uses `direct.send` directly;
- Group Base cross-domain directly uses `group.create`, `group.join`, `group.add`, `group.remove`, `group.leave`, `group.update_profile`, `group.update_policy`, `group.send`;
- Group E2EE cross-domain directly uses `group.e2ee.create`, `group.e2ee.add`, `group.e2ee.remove`, `group.e2ee.send`;
- Object control planecross-domain directly uses `attachment.create_slot`, `attachment.commit_object`, `attachment.abort_object`, `attachment.get_download_ticket`.

### 3.2 First discover the target service, and then create the cross-domain call

Before calling cross-domain, the sender domain service **MUST** first determines the target service location based on the DID document or equivalent cache result, and then initiates a service-to-service call. Specific DID document interpretation and service discovery rules are defined by P2 and are not defined repeatedly in this Profile.

### 3.3 Group ranking is based on Group Host

Operations that will change the group status or group event sequence on the same `group_did` **MUST** be finalized linearly by the corresponding Group Host Service. The cross-domain call can only send the request to the Group Host; it cannot bypass the Group Host to decide `group_event_seq` or `group_state_version`.

### 3.4 The object byte stream does not go through the cross-domain service invocation link

The object content itself **MUST NOT** passes the ANP's cross-domain service invocation link as a regular forwarding channel. That is to say:

- Service-to-service calls are **not allowed** to forward file bytes, image bytes, audio and video bytes;
- The object ontology **MUST** be downloaded directly from the Object Service through an independent HTTP(S) channel;
- cross-domainThe service call layer is involved in control plane at most of "how to get the object", but not data plane of "transporting the object itself".

### 3.5 E2EE payload is transparent to intermediate services

When a cross-domain call carries a `direct-e2ee` or `group-e2ee` business message, the intermediate service or domain gateway MUST treat its payload as opaque bytes or opaque objects; MUST NOT modify it except for outer metadata explicitly required by this Profile for routing, idempotence, or destination verification.

### 3.6 Separation of outer service identity and business subject identity

cross-domain Outer-layer HTTP authentication for service-to-service calls, **MUST** use the sending domain service's own federated service DID, rather than the `meta.sender_did`, `group_did`, or other application layer principal DID in the original business message.

In other words:

- Outer HTTP authentication answers "Which domain service is calling me";
- `meta.sender_did`, `auth.sender_proof`, `auth.actor_proof` answer "**Which business entity initiated this action**";
- Two levels of identity can be related, but semantically **MUST NOT** confused.

---

## 4. Profile identification and dependencies

### 4.1 Profile name

The standard name of this Profile is:

`anp.federation.relay.v1`

> Note: In order to maintain compatibility with existing documents and implementations, this revision retains the original Profile name; however, the focus of this Profile has been adjusted to "Federation and cross-domain Service Invocation Principles" rather than defining an independent Relay packaging protocol.

### 4.2 Dependencies

This Profile **MUST** depends on the following Profiles:

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`
- `anp.direct.base.v1`
- `anp.group.base.v1`

This Profile **MAY** is used with the following overlays/extensions:

- `anp.direct.e2ee.v1`
- `anp.group.e2ee.v1`
- `anp.attachment.v1`

### 4.3 Safe Mode

cross-domain Service-to-service calls **MUST** run in `transport-protected` mode.

The `meta.security_profile` **MAY** of the directly sent business request is:

- `transport-protected`
- `direct-e2ee`
- `group-e2ee`

cross-domainThe caller **MUST NOT** changed `meta.security_profile` in the original business request without authorization.

---

## 5. cross-domain connection method

### 5.1 Agent to Agent

When `meta.target.kind = "agent"`, the sender domain service **MUST**:

1. Parse target `agent_did`;
2. Select target `ANPMessageService` based on DID document or capability negotiation;
3. Send the original `direct.send` directly to the target service.

In other words, at cross-domaindirect messaging, the sender domain service acts as an "outbound service caller" instead of defining an additional layer of new relay protocol.

### 5.2 For Group DID

When `meta.target.kind = "group"`, the sender domain service **MUST**:

1. Parse target `group_did`;
2. Determine the `ANPMessageService` corresponding to the Group Host Service based on the Group DID document or cached group status reference;
3. Send the original group operation request directly to the Group Host Service.

Applicable methods include but are not limited to:

- `group.get_info`
- `group.join`
- `group.add`
- `group.remove`
- `group.leave`
- `group.update_profile`
- `group.update_policy`
- `group.send`
- `group.e2ee.add`
- `group.e2ee.remove`
- `group.e2ee.send`

For `group.join` and `group.add` in the current P4 v1 core, the success semantics of cross-domain are based on the business results returned by the Group Host; under the current v1 mainline, success means that the corresponding business member status has been established. If the deployer introduces additional out-of-band credentials, approval flows, or other governance intermediate states, it belongs to the expansion path and does not belong to the v1 core success semantics of this Profile.

### 5.3 For Object Service

When cross-domain object control plane, the caller **MUST** directly uses the original object control plane method to interact with the target Object Service. Applicable methods include:

- `attachment.create_slot`
- `attachment.commit_object`
- `attachment.abort_object`
- `attachment.get_download_ticket`


### 5.3.1 cross-domain routing for E2EE material methods

When implemented in combination with P5/P6, the following service-scoped getter/material methods in cross-domain MUST be routed directly to the final exposed `ANPMessageService` instead of wrapping a layer of the new protocol through a private relay:

- `direct.e2ee.get_prekey_bundle`
  1. Parse `body.target_did`
  2. Find the `ANPMessageService` public by the target Agent
  3. Call the service directly

- `group.e2ee.get_key_package`
  1. Parse `body.target_did`
  2. Find the `ANPMessageService` public by the target Agent
  3. Call the service directly

These methods in v1 minimal interoperability do not assume anonymous access; caller identity, throttling, and anti-abuse controls MUST be guaranteed by hop/service level authentication.

Cryptographic results such as `welcome` / `ratchet_tree` required for group E2EE onboarding are delivered by `group.e2ee.notice`; v1 does not define a separate `group.e2ee.get_join_info` standard cross-domain route.

### 5.4 Group event distribution

When the Group Host needs to actively distribute sorted group events to member domains, **SHOULD** directly uses the existing group Notification method, or adopts a semantically equivalent deployment mechanism instead of adding an independent Relay packaging method:

- For group messages distribution, **SHOULD** uses `group.incoming`;
- For group status change distribution, **SHOULD** uses `group.state_changed`;
- For distribution of cryptographic results to group E2EE, **SHOULD** uses `group.e2ee.notice`;
- If the deployer adopts an equivalent mechanism, the mechanism **MUST** retains the original group semantics and carries at least `group_did`, `group_event_seq`, `group_state_version` and the corresponding event payload.

`group.e2ee.notice` can be directed to deliver `welcome-delivery` to target Agents that have not completed MLS bootstrap, or `commit-delivery` can be delivered to existing members; this belongs to P6's cryptographic result distribution, not P4's group member broadcast. Out-of-band invitation credentials or other non-member governance messages, if present, are deployment extensions and do not constitute the v1 standard cross-domain path.

---

## 6. Service-to-service security requirements

### 6.1 Secure Channel

All service-to-service calls **MUST** run over a secure channel that is mutually authenticated or equivalently authenticated by the peer.

### 6.2 Source identifiable

Each service-to-service call **MUST** be identified by the recipient as the originating service. For DID-based deployments, the origin service identity **MUST** be expressed through the `Signature-Input` / `keyid` parameters of the outer HTTP Message Signatures, and the `keyid` belongs to a DID **MUST** consistent with the sender's `ANPMessageService.serviceDid`.

#### 6.2.1 Selection rules for federated service DIDs

In cross-domain service-to-service HTTP request:

1. The sender's `ANPMessageService` entry for the cross-domain call **MUST** declares `serviceDid`;
2. If the sender domain uses `did:web`, then the `serviceDid` **SHOULD** uses a naked domain name DID, such as `did:web:alice.com`;
3. If the sender domain uses `did:wba`, then the `serviceDid` **SHOULD** uses a naked domain name DID, such as `did:wba:alice.com`;
4. `keyid` **MUST** in `Signature-Input` is a complete DID URL and points to a verification method authorized by the `authentication` relationship in the `serviceDid` document;
5. The receiver **MUST** completes DID parsing, verification method existence check, `authentication` relationship check and HTTP Message Signatures verification according to the corresponding DID method specification.

For example, for `alice.com`, the following DID would serve as a domain-level federated service DID:

- `did:web:alice.com`
- `did:wba:alice.com`

Among them, `did:wba:alice.com:agents:relay:e1_<fingerprint-a>` is a path-type DID; it can be a common Agent or a sub-identity DID, but it SHOULD NOT be used as the domain-level federal service DID specified by this Profile by default.

#### 6.2.2 Verification process based on `serviceDid`

When did A's service sends a cross-domain request to did B's service, B-side service **MUST** first determines the "business anchor (caller anchor) used to derive caller `serviceDid`" according to the method type, and then performs service identity verification.

The caller anchor rules are as follows:

- For normal cross-domain requests, including:
  - `direct.send`
  - `group.create`
  - `group.get_info`
  - `group.join`
  - `group.add`
  - `group.remove`
  - `group.leave`
  - `group.update_profile`
  - `group.update_policy`
  - `group.send`
  - `direct.e2ee.*`
  - `group.e2ee.publish_key_package`
  - `group.e2ee.get_key_package`
  - `group.e2ee.create`
  - `group.e2ee.add`
  - `group.e2ee.remove`
  - `group.e2ee.send`
  - `attachment.*`

caller anchor **MUST** takes `meta.sender_did`

- For `group.incoming`, `group.state_changed` and `group.e2ee.notice`:

caller anchor **MUST** takes `body.group_did`

Subsequently, the receiver **MUST** verifies the identity of the sender's service in the following order:

1. Determine the caller anchor according to the above rules;
2. Parse the DID document of the caller anchor;
3. According to the service selection rules of P2, select the public `ANPMessageService` corresponding to the DID;
4. Read the `serviceDid` of the service endpoint;
5. Extract `keyid` from the outer HTTP `Signature-Input` and obtain the DID it belongs to;
6. Verify that the DID to which `keyid` belongs is completely consistent with `serviceDid` in step 4;
7. Parse the DID document corresponding to the `serviceDid`;
8. Verify the outer HTTP request signature using the public key authorized by the `authentication` relationship in the `serviceDid` document.

If the `ANPMessageService` selected in step 3 does not declare `serviceDid`, or the comparison in step 6 is inconsistent, the receiver **MUST** treats the cross-domain service identity authentication as failed.

The receiver **MUST NOT** always deduce caller `serviceDid` from `meta.sender_did`; for group notifications, this will mistake the "original business sender" for the "current cross-domain caller".


#### 6.2.3 Usage Convention of Naked Domain Name DID

If a domain uses `did:wba` for cross-domain service identity authentication, the deployer **SHOULD** uses its naked domain name DID as the domain-level federated service DID, and **SHOULD NOT** uses a normal Agent DID, Group DID, or other path-type DID to replace the domain-level identity.

The implementer **MAY** maintains multiple verification methods that can be used for `authentication` in the same naked domain name DID document to support different service instances, different key generations or smooth rotation; the specific selection of which verification method participates in a certain service-to-service authentication is determined by the deployment strategy.

### 6.3 Keep original business objects

When making service-to-service calls, the `method`, `params.meta`, and `params.body` **SHOULD** of the original business request remain equivalent to the business request received by the local domain. If an implementation must re-encode JSON for serialization or gateway conversion, object semantics **MUST** remain unchanged.

### 6.4 Keep the original certificate of origin

If the original business request carries:

- `auth.sender_proof`; or
- `auth.actor_proof`;

Then the cross-domain sender **MUST** leaves the proof object unchanged and sends it with the request. The target domain service **MUST** independently verifies this certificate as required by each business profile.

HTTP authentication for the outer federated service DID MUST NOT** replace these originator certificates; the sending domain service also MUST NOT** rewrite `auth.sender_proof` or `auth.actor_proof` to its own federated service DID.

### 6.5 Minimum visibility of outer layer

For business requests sent by cross-domain, fields visible to the intermediate service and allowed for routing/idempotence are limited to:

- `meta.profile`
- `meta.security_profile`
- `meta.sender_did`
- `meta.target`
- `meta.operation_id`
- `meta.message_id` (if present)
- `meta.content_type`

Any other fields, especially E2EE-protected business content, that the intermediary service **MUST NOT** rely on, modify, or rewrite without authorization.

### 6.6 Disable silent downgrade

cross-domain Any party in the calling chain **MUST NOT** silently downgrades the original request from a higher security mode to a lower security mode without explicit negotiation.

---

## 7. Idempotence and retry

### 7.1 Business idempotent priority

cross-domain Service calls **MUST** reuse the idempotent semantics defined by the original business method. That is to say:

- `direct.send` continues to use its original `sender_did + target.did + method + operation_id` rules;
- `group.*` continues to use the idempotence and deduplication rules defined by the group methods respectively;
- `attachment.*` continues to use the idempotence and deduplication rules defined by the object control plane methods respectively.

### 7.2 Retry requirements

When a network failure, timeout, or indeterminate result occurs, the sending domain service **MAY** retries; but when it retries:

- **MUST** Leave original `operation_id` unchanged;
- If message semantics exist, **MUST** keep the original `message_id` unchanged;
- If called for object control, **SHOULD** keeps the original `attachment_id` and related context unchanged;
- **MUST** Keep business loads semantically equivalent.

### 7.3 Implement internal tracking fields

The deployer **MAY** maintains fields such as trace id, attempt number, route hint, etc. within the implementation, but these fields do not belong to the standard cross-domain request object defined by this Profile. **MUST NOT** replaces the idempotent key of the original business Profile.

### 7.4 Idempotent response

If the receiver identifies an original business request that has been successfully processed, **SHOULD** returns a response equivalent to the first successful processing, rather than repeating the business request.

---

## 8. cross-domain Success semantics

### 8.1 `direct.send`

For cross-domain `direct.send`:

- When the final target domain service accepts the message, the sender domain service **MAY** returns success to the local caller;
- How subsequent processing, queuing, and routing within the target Agent domain does not fall within the scope of the success semantics of this Profile.

### 8.2 P4 Group Control Operation

For P4 control operations such as `group.join`, `group.add`, `group.remove`, `group.update_profile`, `group.update_policy`:

- When the final Group Host Service accepts and sorts, the sender domain service **MAY** returns success to the local caller;
- For the current P4 v1 core, the success of `group.join` / `group.add` means that the corresponding business member status has been established;
- Member domain synchronization and cryptographic implementation with P6 are subsequent asynchronous stages.

### 8.3 P6 cryptography control operations

For `group.e2ee.create`, `group.e2ee.add`, `group.e2ee.remove`:

- When the final Group Host Service accepts the cryptographic control action and returns a successful result, the sender domain service **MAY** returns success to the local caller;
- This success indicates that the relevant MLS control results have been accepted by the target Host and anchored with the existing business status;
- It **MUST NOT** be interpreted as creating a new P4 business member state separately.

### 8.4 `group.send`

For cross-domain `group.send`:

- When the Group Host Service accepts and assigns `group_event_seq` to it, it can be regarded as cross-domain success;
- When the member domain receives the event is determined by the subsequent event distribution mechanism.

### 8.5 `group.e2ee.send`

For cross-domain `group.e2ee.send`:

- When the Group Host Service accepts and sorts the MLS ciphertext object and returns the corresponding `group_event_seq`, `group_state_version`, and `group_receipt`, it can be regarded as cross-domain being successful;
- This success indicates that the Host has accepted and sequenced a group E2EE ciphertext;
- When each member receives it and whether it can be decrypted successfully depends on subsequent distribution and local MLS status, and does not belong to cross-domain success semantics.

### 8.6 `attachment.get_download_ticket`

For cross-domain `attachment.get_download_ticket`:

- When the final Object Service returns success ticket or explicitly rejects it, it can be regarded as cross-domain success;
- Return ticket **Not equal to** Download successful;
- Object download and digest verification are still subsequent independent HTTPS data plane steps.

---

## 9. Attachment and Download ticket’s cross-domain Points

### 9.1 Final processing endpoint

The protocol-level final target for `attachment.get_download_ticket` **MUST** be the public `ANPMessageService` exposed by the original sender DID of the message carrying the attachment manifest. That public service endpoint can be internally rerouted to the Object Service that actually handles the object control logic, but this is an implementation detail.

Therefore, the "final processing endpoint" in standard interoperability semantics is:

- Protocol level: the public `ANPMessageService` corresponding to the original sender DID of the attachment message
- Implementation level: the internal Object Service behind the service (optional)

The caller **MUST NOT** guesses the control plane service based only on the URL domain name of `object_uri`.


### 9.2 Who initiates ticket request

v1 standard interworking path **MUST** takes "domain service proxy mode" as the main line:

#### Mode A: Domain service proxy mode (v1 standard path)

The requesting agent submits `attachment.get_download_ticket` to the local `ANPMessageService` or equivalent domain service, which acts as an outbound proxy to initiate the cross-domain request.

This mode is suitable for:

- Need to unify domain-level auditing;
- Requires unified service-to-service identity authentication;
- The Agent itself does not directly handle all cross-domain service invocation details.

In this mode, the local domain service **MUST** resolve the public `ANPMessageService` from the original sender DID of the attachment message, and send `attachment.get_download_ticket` to that service.

#### Mode B: Agent direct mode (deployment extension)

The requesting agent directly resolves the original sender DID of the attachment message and calls its public `ANPMessageService`.

This mode **is not part of v1 MTI**; if enabled by deployment, you must resolve it yourself:

- How the Agent obtains and verifies the target `serviceDid` based on the original sender DID of the attachment message
- How the client performs outer service authentication
- How the client handles rate limiting, retrying and auditing strategies in a unified manner


### 9.3 Download action

After getting ticket, the requester **MUST** use an independent HTTPS channel to initiate a download to the Object Service:

- ticket **SHOULD** is placed in the `Authorization` header or specifies a custom header;
- ticket **SHOULD NOT** is placed in the URL query parameter;
- After the download is successful, the requester **MUST** press P7 to verify the object digest;
- If the object uses `object-e2ee`, object-level decryption and post-decryption verification are also **MUST** performed.

When the Object control service issues ticket, under the standard path **MUST** makes authorization judgment based on the following two levels of context:

1. The outer caller `serviceDid` has passed HTTP Message Signatures verification;
2. The contexts such as `requester_did`, `security_profile`, `target_did` / `group_did`, `message_id` in the request body satisfy the object service policy.

By default, the Object control service does not require** to directly verify the independent business proof of the end user.


## 10. Minimum interoperability requirements

An implementation conforming to this Profile MUST support at least:

1. Perform service discovery on `agent_did` and `group_did`;
2. Directly use the original business method to interact with the target service when cross-domain;
3. Keep the original `security_profile`, `operation_id` and the relevant original certificates unchanged;
4. Send operations that will change the group status or group event sequence to the final Group Host Service;
5. Support routing `group.join`, `group.add`, `group.remove`, `group.leave`, `group.update_profile`, `group.update_policy` and `group.send` directly to the final Group Host Service;
6. When used in combination with P6, supports the correct cross-domain landing point of `group.e2ee.create`, `group.e2ee.add`, `group.e2ee.remove`, `group.e2ee.send`;
7. When used in combination with P5/P6, supports cross-domain routing of `direct.e2ee.get_prekey_bundle` and `group.e2ee.get_key_package`;
8. Send `attachment.get_download_ticket` to the public `ANPMessageService` exposed by the original sender DID of the attachment message;
9. Explicitly prohibit regular forwarding of object bytes through the cross-domain service invocation link;
10. Support at least one mechanism for distributing sorted group events to member domains; when used in combination with P6, **MUST** supports cross-domain distribution of `group.e2ee.notice`;
11. Declare `serviceDid` for the `ANPMessageService` that participates in the cross-domain call, and verify the outer HTTP Message Signatures according to the method level caller anchor;
12. For `did:wba` deployment, support using naked domain name DID as domain-level federated service DID.


## 11. Reference implementation description (non-normative)

When implementing this Profile, the implementer should regard it as:

- 01～07 Supplementary connection principles for each business profile in the cross-domain scenario;
- Constraint layer for direct service-to-service calls;
- Selection rules for service-to-service outer DID authentication;
- Description of the principles of Group Host sorting and asynchronous distribution of group events;
- Description of the object control planecross-domain drop point and download responsibility boundaries.

In other words, this Profile solves "how to connect, how to send, and how to determine success when **cross-domain", rather than redefining a set of independent business protocols.
