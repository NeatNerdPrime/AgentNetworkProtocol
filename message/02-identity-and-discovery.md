# ANP Profile 2: Identity and Discovery (Final Revision)

- Document ID: ANP-P2
- Title: Identity and Discovery
- Status: Draft
- Version: 0.2.0 (Final Revision)
- Language: English
- Applicability: This Profile applies to Agent identity, Group identity, service discovery and service endpoint interpretation in ANP.

---

## 1. Purpose

This Profile defines ANP's identity model and discovery model, specifying:

1. How to use DID to represent Agent and Group;
2. Which attributes in the DID document have normative significance for ANP;
3. How the ANP service endpoint is expressed in the DID document;
4. How the caller discovers the interactive ANP service based on the DID document;
5. Which dynamic states must not be put into DID documents.

This Profile does not define:

- The DID method itself;
- The DID resolution protocol itself;
- Device identifiers;
- Internal replica synchronization;
- Specific E2EE algorithm details;
- Specific group state machine details.

---

## 2. Terminology and normative conventions

### 2.1 Normative keywords

In this document, **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, **OPTIONAL** are interpreted as normative requirements according to their capitalized form.

### 2.2 Terminology

- **Agent DID**: Represents the DID of an Agent protocol subject.
- **Group DID**: Represents the DID of a group protocol subject.
- **Controller**: An entity capable of updating DID documents or initiating controlled actions on behalf of DID.
- **ANPMessageService**: The unified ANP service endpoint published through the DID document.
- **Federated Service DID**: The service DID used by the deployer in cross-domain service-to-service HTTP authentication, typically declared by `ANPMessageService.serviceDid`.
- **Discovery**: The process of resolving a DID to its DID document and selecting the appropriate service endpoint for subsequent interactions.

---

## 3. Identity model

### 3.1 Basic principles

ANP adopts the following first-class identifiers:

- **Agent DID**
- **Group DID**

The ANP protocol layer does not define device DIDs, terminal DIDs, session DIDs, or replica DIDs.  
If there are multiple running copies, multiple devices, and multiple executors within an implementation, these entities belong to the internal implementation issues of the Agent and do not belong to the ANP interoperability boundary.

### 3.2 Agent DID

Each Agent that can send or receive messages as an ANP protocol subject **MUST** hold an `agent_did`.

`agent_did` is used for:

1. Identify the sender and receiver of the direct message;
2. Identify the initiator of the control operation;
3. Parse available service endpoints;
4. Obtain public materials required for security overlay;
5. Establish authorization and audit context.

### 3.3 Group DID

Every group that can be discovered across domains, referenced, managed, or sent group messages **MUST** hold a `group_did`.

`group_did` is used for:

1. Serve as the global application-layer identifier of the group;
2. Serve as the anchor point for group discovery and governance;
3. Serve as the common target identifier for group management and group messages;
4. Serve as the discovery entry point for group service endpoints;
5. Serve as the binding target for subsequent group encryption profiles.

### 3.4 Encryption identification separation

If a subsequent security overlay profile defines independent cryptographic internal identifiers, such as `crypto_group_id`, `session_id`, `channel_id`, then:

- They **MAY** differ from `group_did` or `agent_did`;
- But the corresponding Profile **MUST** clearly specify how these internal identifiers are cryptographically bound to the DID;
- This binding **MUST** be verifiable by the receiver.

### 3.5 ANP identity layering

To avoid mixing different levels of identities across documents, ANP distinguishes at least the following three types of DIDs:

1. **Business Origin DID**: Business initiator or business logic sending subject, such as `meta.sender_did` in the request;
2. **Logical Issuer DID**: The issuing subject that certain notifications, receipt or governance objects logically represent, such as `group_did`;
3. **Service DID**: The service identity used when executing hop-level service to service calls, that is, `ANPMessageService.serviceDid`.

The above three categories of identities:

- **MUST NOT** be automatically treated as the same subject;
- **MUST** The corresponding Profile clearly states who is responsible for signing, who is responsible for authorizing, and who is responsible for routing;
- In the cross-domain scenario, `serviceDid` **MUST NOT** replaces the business entity DID;
- `serviceDid` only means "which public service endpoint is executing one-hop service call", **MUST NOT** is directly used to participate in the determination of business roles such as `owner/admin/member` in the group.

---

## 4. ANP interpretation rules for DID documents

### 4.1 General rules

For the ANP, the DID document has the following responsibilities:

1. Provide a stable identity entry point;
2. Declare authentication relationships and trusted key materials;
3. Expose service endpoints;
4. Provide service discovery clues.

DID documents **MUST NOT** be treated as:

- Real-time message status database;
- Real-time storage of group members;
- Online status storage;
- High frequency key rotation log;
- Agent internal replica list.

### 4.2 Minimum requirements for DID documents

For DID documents used by ANP:

- `id` **MUST** exists;
- `service` **MUST** exists for DIDs that are actively discovered and interacted with;
- `service` **MAY** Default for DIDs used only for validation or reference;
- `authentication` **MUST** be present for a DID that would appear in the request as the business originator DID;
- If declarative signature objects are supported, `assertionMethod` **SHOULD** exists;
- If encryption Overlay is supported, `keyAgreement` **SHOULD** exists;
- `capabilityInvocation` is an optional expansion capability, **MAY** exists, but does not fall within the v1 minimum interoperability requirements.

### 4.3 DID document minimization principle

Information in the DID document **SHOULD** remains:

- Low frequency changes;
- low sensitivity;
- Low relevancy;
- Directly related to DID usage.

Any content that does not meet the above requirements is **SHOULD** moved to controlled service endpoints instead of being directly embedded in the DID document.

---

## 5. Agent DID specification

### 5.1 Agent DID document required semantics

An Agent DID document for ANP MUST express at least:

1. `id`
2. At least one `service` available for subsequent interactions

### 5.2 Authentication relationship

If the Agent DID will appear in `meta.sender_did` as a business initiator, or in the `keyid` verification link of any business proof claiming to use `anp-rfc9421-origin-proof-v1`, then the DID document **MUST** provides a `authentication` relationship.

`authentication` **MAY** Defaults if the Agent DID is used only in passive reference, object ownership, or offline verification contexts and does not participate in ANP interactions as a request initiator.

If the Agent needs to assert on group management objects, declaration objects, and signature control objects, the DID document **SHOULD** provides the `assertionMethod` relationship.

### 5.3 Key negotiation relationship

If the Agent supports any E2EE Overlay, the DID document **SHOULD** provides the `keyAgreement` relationship.  
The authentication method **MUST** used by `keyAgreement` is used only to represent the public key material that can be used by this DID when negotiating keys or receiving confidential information.

### 5.4 Service endpoint

Agent DID documents that support receiving Direct, Capability, Object control plane, or other ANP capabilities that require active discovery MUST contain at least one `ANPMessageService`.

This unified service portal **MAY** also carries the following capabilities:

- Main entry point for direct messages;
- Negotiation of capabilities;
- Secure Overlay public material access;
- Object control plane was found with the object download entry point.

If the deployer internally splits these capabilities into multiple components, this splitting is an implementation detail; the DID document **SHOULD NOT** exposes multiple independent ANP service types for each of these capabilities.

The externally exposed attachment control plane method **MUST** be still accessed through the unified `ANPMessageService` exposed in the DID document. Whether the deployer internally routes requests to independent Object Service, Key Service or Group Host subcomponents is an implementation detail and does not change the external standard service discovery model.

---

## 6. Group DID specification

### 6.1 Group DID document required semantics

A Group DID document for ANP MUST express at least:

1. `id`
2. `controller`
3. At least one group service endpoint (`ANPMessageService`)

### 6.2 Group control rights

`controller` can be a single DID or multiple DIDs.  
If there are multiple controllers, the internal collaboration mechanism between them is not defined by this Profile, but:

- The legality of DID document updates **MUST** be guaranteed by the DID method;
- The caller **MUST** shall refer to the parsed DID document;
- Group governance Profile **MUST** further defines roles and authorization rules within the group.

### 6.3 Group governance verification relationship

For Group DID documents that support `anp.group.base.v1`:

- `assertionMethod` **MUST** exists;
- `capabilityInvocation` **MAY** exists as an additional governance capability delegation relationship, but does not replace `assertionMethod`.

When group management objects, group policy objects, and group status objects need to be signed for verification, the verifier **MUST** use the verification relationships allowed by the DID document.

### 6.4 Group DID document prohibited content

The following MUST NOT be embedded directly into the Group DID document:

- Dynamic member list;
- Online member list;
- Current message sequence number;
- Current group epoch;
- message-by-message status;
- One-time pre-key list;
- MLS KeyPackage real-time collection;
- Frequently changing out-of-band group entry credentials/governance queue;
- Agent internal replica list.

### 6.5 Group DID document optional content

The following **MAY** exists, but sensitive disclosure must be avoided:

- Group display name;
- Group icon reference;
- Group public description;
- Summary of group public policy;
- Document version information;
- Summary of service capabilities.

If an optional field poses significant privacy or dependency risks, the implementation SHOULD NOT write it into the DID document and should instead provide it from the restricted service endpoint.

---

## 7. ANP service endpoint type

### 7.1 General

ANP performs service discovery based on `service` in the DID document.  
All ANP service endpoint objects **MUST** have:

- `id`
- `type`
- `serviceEndpoint`

The service endpoint object **MAY** carries a small number of static hints, but v1 standard interoperability only requires:

- `profiles`
- `securityProfiles`
- `serviceDid`

In the current version, the ANP standard service type **SHOULD** exposed by the DID document only uses `ANPMessageService`.  
If an implementation internally splits a direct messaging, group, key, object, or cross-domain forwarding capability into multiple components, such splitting is an implementation detail and not separate standards `service type` in the DID document.

To reduce service selection ambiguity when calling cross-domain, each DID document **MUST** exposes only one `ANPMessageService` that can be called by cross-domain.  
If there are multiple service components within the implementation, they **MUST** be converged under the same publicly available cross-domain `ANPMessageService`.

### 7.2 `ANPMessageService`

#### 7.2.1 Semantics

`ANPMessageService` represents the Unified Messaging and Interaction Portal discovered publicly by ANP in DID documents.

#### 7.2.2 Purpose

- Receive `direct.send`
- Receive `group.get_info`, `group.send`, `group.e2ee.send` and group management/group E2EE related actions
- Provides `anp.get_capabilities`
- Provide access to public materials required by Direct/Group E2EE
- Bearer reception or distribution of `group.e2ee.notice` (if deployment supports group E2EE)
- Provides `attachment.create_slot`, `attachment.commit_object`, `attachment.abort_object`, `attachment.get_download_ticket`
- Service anchor discovered as object HTTP(S) download portal (if supported by deployment)

Externally exposed attachment control plane methods **MUST** be still accessible through the unified `ANPMessageService` exposed by this DID. Whether the deployer internally routes requests to independent Object Service, Key Service or Group Host subcomponents is an implementation detail and does not change the external standard service discovery model.

#### 7.2.3 Requirements

- An Agent DID document that can be actively discovered and interacted with **MUST** contain at least one `ANPMessageService`
- A Group DID document **MUST** contain at least one `ANPMessageService`
- If this `ANPMessageService` will participate in a cross-domain service-to-service call, its service endpoint **MUST** declares `serviceDid`
- If there are multiple components within the implementation, the DID document **MUST** only exposes a unified entry and returns finer-grained capability boundaries through runtime capability negotiation.
- Externally exposed service-scoped methods, including key material methods and attachment control plane methods, **MUST** use the `serviceDid` of the unified entry as the target service identity anchor, unless the corresponding Profile is explicitly declared as endpoint-local


### 7.3 Logical role of `ANPMessageService`

This section is only used for **non-normative explanation** of the common capability boundaries behind unified entry; they are not independent standard service types in DID documents, nor are they service selection fields in v1.

#### 7.3.1 Home Role

Home Role represents the main entry capability on the Agent side, which is used to receive `direct.send`, return capability information, and indicate further interaction paths.

#### 7.3.2 Key Role

Key Role represents the ability to publish or discover public materials required by the security overlay, and is used for:

- Discover required disclosure materials for direct messaging E2EE
- Discover the public materials and onboarding/bootstrap related materials required by the group E2EE; materials added by members are discovered through the unified entry point corresponding to the Agent DID, and cryptographic results such as `welcome` / `ratchet_tree` are delivered by subsequent notices
- Discover public objects defined by subsequent security profiles

#### 7.3.3 Group Role

Group Role represents the main entry point or Host capability of the group and is used for:

- Process group management actions after `group.create`
- Receive `group.send` and `group.e2ee.send`
- Expose group policy, group E2EE capabilities or related control entry points
- Serves as the authoritative entry point for sorting group status changes

#### 7.3.4 Join Role

Join Role means joining entry capabilities related to onboarding/bootstrap; if out-of-band invitation credentials exist, they belong to deployment extensions, not v1 core capabilities.

#### 7.3.5 Capability Role

Capability Role represents the capability negotiation entry capability.

#### 7.3.6 Object Role

The Object role represents capabilities such as object upload, object access control, download ticket issuance, and discovery of object download entry points.

#### 7.3.7 cross-domain forwarding function

The deployer **MAY** implements the cross-domain forwarding or domain gateway function behind `ANPMessageService`, but the current version **does not** define a separate DID service type for this function.

If the deployer enables cross-domain service-to-service calls, then when the domain gateway or domain service performs outer HTTP authentication, **SHOULD** uses the federated service DID reserved by the domain name owner instead of the normal Agent DID or Group DID. The corresponding rules are defined by P8.

#### 7.3.8 Transparent directory and audit index

If the deployer supports directory transparency, transparent logging or audit indexing, it MAY be provided as an extension of `ANPMessageService`; the current version does not define a separate DID service type.

---

## 8. ANP service endpoint extension fields

In order to facilitate cross-implementation discovery, this Profile only uses a few fields as v1 static hints; the remaining capability information **SHOULD** is sunk to `anp.get_capabilities`.

### 8.1 `profiles`

- Type: string array
- Semantics: The set of ANP Profiles directly supported by the service endpoint
- Requirements: **SHOULD**
- Note: This field only expresses static, cacheable coarse-grained hints and does not replace runtime capability negotiation.

### 8.2 `securityProfiles`

- Type: string array
- Semantics: The set of security modes supported by the service endpoint
- Requirements: **SHOULD**
- Description: This field indicates the endpoint-level support range and does not guarantee that all methods are available in all security modes.

### 8.3 `acceptedContentTypes`

- Type: string array
- Semantics: The set of message content types acceptable to the service endpoint
- Requirements: **Not as v1 standard DID hint**
- Description:
  - If you need to expose such information, **SHOULD** is returned through `anp.get_capabilities`;
  - If this field appears in a DID document, the recipient **MAY** treats it as an implementation extension.

### 8.4 `acceptedObjectTypes`

- Type: string array
- Semantics: Set of control plane object types acceptable to the service endpoint
- Requirements: **Not as v1 standard DID hint**
- Description: It is recommended to return as a runtime capability rather than statically writing to a DID document.

### 8.5 `priority`

- Type: Integer
- Semantics: endpoint priority
- Requirements: **Not as v1 standard DID hint**
- Description:
  - The v1 specification does not rely on `priority` in the DID document for service selection;
  - If the deployment customizes this field, it should be treated as a private extension.

### 8.6 `authSchemes`

- Type: string array
- Semantics: caller → service caller authentication method supported by this endpoint
- Requirements: **Not as v1 standard DID hint**
- Description:
  - This capability typically changes with the runtime gateway configuration;
  - More suitable for exposure via `anp.get_capabilities`;
  - It also **does** not describe the proof bearer format for the business layer `anp-rfc9421-origin-proof-v1`.

### 8.7 `serviceDid`

- Type: string
- Semantics: The `ANPMessageService` DID used in cross-domain service-to-service HTTP authentication
- Requirement: **MUST** if this endpoint participates in cross-domain service-to-service calls

rule:

1. `serviceDid` **MUST** be a DID string, not a DID URL;
2. The `keyid` **MUST** of the outer HTTP Message Signatures points to a verification method authorized by the `authentication` relationship in the `serviceDid` document;
3. For `did:web` and `did:wba` deployment, `serviceDid` **SHOULD** preferentially uses the naked domain name DID;
4. `serviceDid` expresses "which service identity is executing the cross-domain call", not the business subject identity expressed by `meta.sender_did`;
5. The specific runtime verification process of `serviceDid` is defined by P8;
6. `serviceDid` in the DID document is a discovery hint, and true trust establishment is subject to successful P8 runtime verification;
7. For service-scoped methods, the caller **SHOULD** binds `meta.target.did` to the target public `ANPMessageService.serviceDid`; object control plane, key material methods and group E2EE onboarding / bootstrap related methods all follow this principle, unless the specific Profile is explicitly declared as endpoint-local.

---

## 9. Discovery process

### 9.1 Agent discovery

The discovery process for `agent_did` is as follows:

1. Parse `agent_did` and obtain the DID document;
2. Read the `service` list;
3. Select the only cross-domain `ANPMessageService`;
4. If subsequent cross-domain service-to-service calls are involved, read the `serviceDid` of the service endpoint;
5. Combine `profiles`, `securityProfiles`, runtime capability negotiation results and local policies to determine the specific capabilities available on the unified portal;
6. To explicitly negotiate capabilities, call `anp.get_capabilities` on the same entry.

### 9.2 Group Discovery

The discovery process for `group_did` is as follows:

1. Parse `group_did` and obtain the DID document;
2. Read the unique `ANPMessageService`;
3. If subsequent cross-domain service-to-service calls are involved, read the `serviceDid` of the service endpoint;
4. Combine `profiles`, `securityProfiles`, runtime capability negotiation results and local policies to determine the group management, group messages, join or group E2EE related capabilities available on the unified portal;
5. If group E2EE is enabled, the group-side public materials, cryptographic result delivery capabilities and related control actions bound to the group encryption profile will be discovered through the same entry point; materials added by members will still be discovered through the unified entry point corresponding to the Agent DID.

### 9.3 Service DID discovery

When the target `serviceDid` of a service-scoped method is known to the caller, the discovery process is as follows:

1. Parse the DID document corresponding to `serviceDid`;
2. Select the `ANPMessageService` corresponding to the `serviceDid`;
3. Read its `serviceEndpoint` and static hint;
4. If you need precise capability boundaries, call `anp.get_capabilities` on the same entry;
5. This `serviceDid` can be regarded as a trusted cross-domain service identity only after passing the runtime service identity binding verification specified in P8.

If a business object (such as `access_info.control_service_did` in attachment manifest) explicitly provides control plane `serviceDid`, the caller **MUST** preferentially uses the `serviceDid` as the discovery anchor instead of inferring the control plane service from the URL domain name of `object_uri`.


### 9.4 Service selection

If there are multiple candidate endpoints, the caller **MUST** first selects in the following order:

1. First filter according to the requested `profile`;
2. Then filter according to the requested `security_profile`;
3. Then use the runtime capability negotiation results as authoritative verification;
4. If there are still multiple results, select according to the local policy.

The v1 specification does not rely on `supportedMethods`, `logicalRoles` or `priority` in the DID document for standard service selection.

### 9.5 Caching

The caller **MAY** caches the DID parsing results and service selection results.  
But **SHOULD** is re-parsed in the following situations:

- Signature verification failed;
- Key negotiation failed;
- Service endpoint return capability changes;
- Suspected change of DID control;
- `serviceDid` verification failed;
- endpoint-origin binding failed;
- Static hint conflicts with runtime capability results;
- Local cache expires.

---

## 10. The relationship between DID documents and security overlay

### 10.1 Use of `keyAgreement`

If an Agent DID or Group DID document declares `keyAgreement`, subsequent security Profiles **MUST** only use the methods allowed therein as the basis for receiving confidential information or key negotiation for this DID.

### 10.2 Signature verification relationship

When an object is claimed to be asserted by a DID:

- If the object is an authentication control action, the verifier **SHOULD** checks `authentication`;
- If the object is a declaration or a signature assertion behavior, the verifier **SHOULD** checks `assertionMethod`;
- If the object is a governance capability invocation behavior, the verifier **MAY** checks `capabilityInvocation`, but this is not the minimum interoperability requirement for v1.

### 10.3 Dynamic safety material external placement

The following **SHOULD** is provided through the controlled service endpoint and is not embedded in the DID document:

- High-frequency rotation of public materials;
- One-time addition of materials or onboarding materials;
- Group epoch related materials;
- Dynamic group status summary.

---

## 11. Group DID and group governance

### 11.1 Role of Group DID

`group_did` is the application layer global identifier of the group and is not equal to any specific cryptography implementation internal ID.

### 11.2 External group management

Objects such as group membership, role authorization, deployment extension group credential status, member status, policy version, group status summary, etc., **SHOULD** is provided by:

- Group corresponding `ANPMessageService`
- Or future group governance Profile

Provided with a signature rather than in a DID document.

### 11.3 Separation of control rights from group policy

The `controller` in the DID document only indicates who has the authority to control the DID document itself;
"Who can adding members, removing members, and change policies" within the group belong to application layer governance rules and should not be mechanically derived directly from `controller`.  
In the same way, `serviceDid` only represents the service calling identity and should not be directly interpreted as a business role subject such as `owner/admin/member` in the group.

---

## 12. Privacy and Minimum Disclosure

### 12.1 Service endpoint minimization

The `service` item **SHOULD** in the DID document is minimized.  
If a service is not required to be publicly discovered, **SHOULD NOT** appears in the DID document.

### 12.2 Relevance control

Implementers **SHOULD** avoid:

- Reusing unique endpoint patterns in multiple DID documents creates strong correlations;
- Place descriptions in the DID document that can directly infer the organizational structure, deployment topology, and internal role distribution;
- Expose message volume, activity, online status or internal replica structure through DID documents.

### 12.3 Separation of public and restricted

Information necessary for public discovery **MAY** is placed into the DID document;
Information requiring access control **SHOULD** is returned by the restricted service endpoint.

---

## 13. Minimum interoperability requirements

An implementation conforming to this Profile MUST at least:

1. Each Agent has `agent_did`;
2. Each Group has `group_did`;
3. The Agent DID and Group DID documents must provide at least one `ANPMessageService`;
4. Support service discovery based on DID documents;
5. Static hint supports at least `profiles`, `securityProfiles`, `serviceDid`;
6. Runtime capabilities are authoritative with `anp.get_capabilities`;
7. Do not embed dynamic group status in DID documents;
8. Do not introduce the device/replica concept into the protocol layer.

---

## 14. Example

### 14.1 Agent DID document fragment example

```json
{
  "id": "did:example:agent-a",
  "verificationMethod": [
    {
      "id": "did:example:agent-a#sig-1",
      "type": "JsonWebKey2020",
      "controller": "did:example:agent-a",
      "publicKeyJwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "..."
      }
    },
    {
      "id": "did:example:agent-a#ka-1",
      "type": "JsonWebKey2020",
      "controller": "did:example:agent-a",
      "publicKeyJwk": {
        "kty": "OKP",
        "crv": "X25519",
        "x": "..."
      }
    }
  ],
  "authentication": [
    "did:example:agent-a#sig-1"
  ],
  "assertionMethod": [
    "did:example:agent-a#sig-1"
  ],
  "keyAgreement": [
    "did:example:agent-a#ka-1"
  ],
  "service": [
    {
      "id": "did:example:agent-a#message",
      "type": "ANPMessageService",
      "serviceEndpoint": "https://agent-a.example.com/anp",
      "serviceDid": "did:example:domain-a",
      "profiles": [
        "anp.core.binding.v1",
        "anp.direct.base.v1",
        "anp.direct.e2ee.v1",
        "anp.attachment.v1"
      ],
      "securityProfiles": [
        "transport-protected",
        "direct-e2ee"
      ]
    }
  ]
}
```

### 14.2 Group DID document fragment example

```json
{
  "id": "did:example:group-123",
  "controller": [
    "did:example:group-host",
    "did:example:group-admin-controller"
  ],
  "verificationMethod": [
    {
      "id": "did:example:group-123#gov-1",
      "type": "JsonWebKey2020",
      "controller": "did:example:group-123",
      "publicKeyJwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "..."
      }
    }
  ],
  "assertionMethod": [
    "did:example:group-123#gov-1"
  ],
  "service": [
    {
      "id": "did:example:group-123#message",
      "type": "ANPMessageService",
      "serviceEndpoint": "https://group-host.example.com/anp/groups/group-123",
      "serviceDid": "did:example:group-host-domain",
      "profiles": [
        "anp.core.binding.v1",
        "anp.group.base.v1",
        "anp.group.e2ee.v1"
      ],
      "securityProfiles": [
        "transport-protected",
        "group-e2ee"
      ]
    }
  ]
}
```

---

## 15. Registry placeholder

Subsequent versions of this standard **SHOULD** establish the following registry:

1. ANP DID Service Type registry;
2. ANP service endpoint extension field registration form;
3. ANP identity discovery error code registry;
4. ANP group governance object type registry.

---

## 16. Reference implementation description (non-normative)

Implementers should adopt the following principles when implementing this Profile:

- The DID document is a "stable entry", not a "real-time status table";
- The service endpoint is the "discovery anchor", not the "full data container";
- Dynamic capabilities should be returned through `anp.get_capabilities` as much as possible instead of being piled in the DID document;
- Group DID is an "application layer group identifier", not a "unique serialization of all cryptographic internal states";
- Concepts such as devices, replicas, and internal executors remain inside the Agent and do not enter the wire protocol.
