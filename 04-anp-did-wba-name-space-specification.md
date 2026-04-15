# ANP-DID:WBA Name Space Specification (Draft)

Abbreviation: WNS (WBA Name Space)

Note: This specification is still in draft status and will undergo further optimization and iteration.

## Abstract

This specification defines WNS (WBA Name Space), a human-readable namespace based on did:wba. WNS introduces Handles (such as `alice.example.com`) as readable aliases for `did:wba` DIDs. Through a standardized resolution flow, a Handle is mapped to a DID, and the DID is then resolved to a DID Document and service capabilities according to the [did:wba Method Specification](03-did-wba-method-design-specification.md).

Handles solve the problem that DID identifiers are not human-friendly. Identifiers such as `did:wba:example.com:user:alice:e1_<fingerprint>` are machine-friendly but difficult to remember and share. In particular, under the latest did:wba specification, path-type DIDs carry a bound public key fingerprint by default, and the path-type DID itself may rotate when the binding key or binding profile changes. Therefore, WNS not only provides an experience similar to email addresses or social platform usernames, but also serves as a stable human-readable naming layer: the Handle can remain stable while the underlying did:wba may rotate as the binding key changes.

The Handle-related functionality defined by this specification can also be compatible with the native `did:web` method. See Appendix A for the compatibility entry.

## 1. Background and Motivation

### 1.1 Problem Statement

The `did:wba` method provides decentralized identity capabilities for agents (see the [did:wba Method Specification](03-did-wba-method-design-specification.md)), but its identifier format is not human-friendly:

- **Hard to remember**: `did:wba:example.com:user:alice:e1_<fingerprint>` contains the method prefix, domain, path, and binding fingerprint, making the identifier relatively long.
- **Hard to share**: Sharing DID identifiers in social contexts is inconvenient and error-prone.
- **Hard to input**: The user experience of manually entering DID identifiers is poor.
- **Potentially rotating**: For path-type DIDs using the default path profile, the DID itself may change when the binding key or binding profile changes.

These problems are especially prominent in the following scenarios:

- Sharing agent identifiers through social channels
- Entering recipients in instant messaging
- Referencing agent identities in business cards, documents, or verbal communication
- Keeping a stable public-facing reference while allowing the underlying DID to rotate

### 1.2 Design Goals

The design goals of WNS include:

1. **Human-readable**: Provide short, memorable, and easy-to-type aliases such as `alice.example.com`.
2. **Domain-independent**: Any entity with a domain name and TLS certificate can host a Handle service without depending on a specific centralized platform.
3. **Deterministic resolution**: The mapping from Handle to DID is explicit, and the resolution process is standardized.
4. **Stable reference**: Handle serves as a stable naming layer, allowing the underlying path-type did:wba to rotate as the binding key changes.
5. **Bidirectional binding**: Handles and DIDs support bidirectional verification to prevent unilateral tampering.
6. **Protocol integration**: Seamless integration with the existing ANP protocol stack (Specifications 03/07/08/09).
7. **Minimal design**: Define only the core naming and resolution mechanisms without specifying Handle registration, management, or other business processes.

### 1.3 Relationship with Existing Protocols

- **03-did:wba Method Specification**: WNS Handles are readable aliases for did:wba DIDs. Handle resolution ultimately depends on Specification 03 to obtain the DID Document. For path-type DIDs using the default path profile, WNS does not redefine binding fingerprint generation rules and directly reuses Specification 03.
- **07-Agent Description Protocol**: After Handle resolution, the DID Document's `service` section leads to the Agent Description document.
- **08-Agent Discovery Protocol**: Handle Providers can serve as supplementary entry points for agent discovery.
- **09-End-to-End Instant Messaging Protocol**: Handles can be used for recipient display and input, while message routing remains DID-based.

## 2. Terminology

| Term | Definition |
|------|------------|
| **Handle** | A human-readable short identifier in the format `local-part.domain`, such as `alice.example.com` |
| **Handle Provider** | The domain party that hosts the Handle resolution service and maintains Handle-to-DID mappings |
| **Local Part** | The user identifier portion of a Handle, such as `alice` in `alice.example.com` |
| **Domain** | The domain portion of a Handle, such as `example.com` in `alice.example.com` |
| **DID Binding** | The one-to-one mapping relationship from a Handle to a DID |
| **Handle Resolution** | The process of resolving a Handle to a DID |
| **DID Rotation** | For path-type did:wba, the process in which the DID changes because the binding key or binding profile changes |
| **WNS** | WBA Name Space, the namespace system defined by this specification |
| **Handle Resolution Document** | The JSON document returned by the Handle Resolution Endpoint, containing Handle-to-DID mapping information |
| **DID Confirmation Endpoint** | A confirmation endpoint under the Handle Provider's domain, used to confirm that a DID is indeed resolved by that Provider without disclosing a specific Handle in the DID Document |

## 3. Handle Format Specification

### 3.1 Handle Syntax

Handles use DNS-style syntax in the format `local-part.domain`.

**ABNF Definition:**

```abnf
handle     = local-part "." domain
local-part = (ALPHA / DIGIT) *61(ALPHA / DIGIT / "-") (ALPHA / DIGIT)
domain     = ; A valid Fully Qualified Domain Name (FQDN), see RFC 1035
```

**Syntax Rules:**

- The local-part MUST contain only ASCII lowercase letters `a-z`, digits `0-9`, and hyphens `-`.
- The local-part MUST begin and end with a letter or digit.
- The local-part MUST NOT contain consecutive hyphens `--`.
- The local-part MUST be 1 to 63 characters in length.
- The domain MUST be a valid FQDN protected by a TLS/SSL certificate.
- The domain portion of a Handle MUST NOT carry a port number.
- All input MUST be normalized to lowercase before processing.

**Examples:**

```text
alice.example.com          ✓ Valid
bob-smith.example.com      ✓ Valid
agent-42.example.com       ✓ Valid
a.example.com              ✓ Valid (single-character local-part)
-alice.example.com         ✗ Invalid (starts with hyphen)
alice-.example.com         ✗ Invalid (ends with hyphen)
al--ice.example.com        ✗ Invalid (consecutive hyphens)
Alice.Example.com          → Normalized to alice.example.com
```

### 3.2 URI Representation

To explicitly identify a Handle in sharing scenarios, the `wba://` prefix MAY be used:

```text
wba://alice.example.com
```

The `wba://` prefix is used only for sharing and recognition scenarios, and is semantically equivalent to the Handle itself.

- Clients MAY accept input with the `wba://` prefix.
- If a client accepts the prefix, it MUST strip `wba://` before resolution and then follow the standard resolution flow.
- Implementations MUST NOT make support for the `wba://` prefix a prerequisite for interoperability.

> Note: `wba://` has not been registered with IANA as a formal URI scheme. Implementers may also use the following Web URL as an alternative:
> ```text
> https://{domain}/.well-known/handle/{local-part}
> ```

### 3.3 Reserved Word Principles

Handle Providers SHOULD maintain reserved word lists to prevent certain local-parts from being registered. The protocol defines the following reserved word categories; the specific list is determined by each Handle Provider:

**a) Protocol reserved words**: Words that conflict with ANP protocol keywords, such as `did`, `agent`, `well-known`, and `service`.

**b) System reserved words**: Words that conflict with common system functions, such as `admin`, `root`, `system`, and `api`.

**c) Defensive reserved words**: Words that may be used for phishing or confusion attacks, such as `support`, `security`, and `official`.

Handle Providers SHOULD publish their reserved word lists.

## 4. Handle Resolution Protocol

### 4.1 Resolution Flow

Handle resolution follows the flow below:

```text
Handle → Handle Resolution Endpoint → DID → DID Document → service
```

```mermaid
sequenceDiagram
    participant C as Client
    participant H as Handle Provider
    participant D as DID Document Server

    C->>H: GET /.well-known/handle/{local-part}
    H-->>C: Handle Resolution Document (containing DID)
    Note over C: Extract DID from the Resolution Document
    C->>D: Resolve the DID Document per Spec 03
    D-->>C: DID Document
    Note over C: Obtain service endpoints from the DID Document
```

### 4.2 Handle Resolution Endpoint

The Handle Resolution Endpoint is a standardized HTTP endpoint provided by the Handle Provider:

- **URL**: `https://{domain}/.well-known/handle/{local-part}`
- **Method**: `GET`
- **Response Content-Type**: `application/json`

Where `{domain}` is the domain portion of the Handle and `{local-part}` is the user identifier portion.

**Example Request:**

```http
GET /.well-known/handle/alice HTTP/1.1
Host: example.com
Accept: application/json
```

### 4.3 Handle Resolution Document

The JSON document returned by the Handle Resolution Endpoint has the following format:

```json
{
  "handle": "alice.example.com",
  "did": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "status": "active",
  "updated": "2025-01-01T00:00:00Z",
  "versionId": "42",
  "ttl": 300
}
```

**Field Descriptions:**

| Field | Required/Optional | Description |
|-------|-------------------|-------------|
| `handle` | Required | The complete Handle identifier |
| `did` | Required | The did:wba DID currently bound to the Handle |
| `status` | Required | The current Handle status; see Section 4.7 |
| `updated` | Optional | Last update time in ISO 8601 format |
| `versionId` | Optional | Mapping version identifier used for caching and troubleshooting |
| `ttl` | Optional | Suggested cache lifetime in seconds |

### 4.3.1 DID Confirmation Endpoint

When the DID holder does not want to disclose a specific Handle in the DID Document, the Handle Provider MAY provide a DID Confirmation Endpoint.

**Recommended URL:**

```text
https://{domain}/.well-known/handle/by-did?did={urlencoded-did}
```

- **Method**: `GET`
- **Response Content-Type**: `application/json`

**Example Response:**

```json
{
  "did": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "confirmed": true,
  "status": "active",
  "updated": "2025-01-01T00:00:00Z",
  "ttl": 300
}
```

**Field Descriptions:**

| Field | Required/Optional | Description |
|-------|-------------------|-------------|
| `did` | Required | The DID being confirmed |
| `confirmed` | Required | MUST be `true`, indicating that this DID is indeed resolved by the current Handle Provider |
| `status` | Optional | The current resolution status of this DID at the Handle Provider |
| `updated` | Optional | Last update time in ISO 8601 format |
| `ttl` | Optional | Suggested cache lifetime in seconds |

When a DID Confirmation Endpoint is used, the response document SHOULD NOT directly return a specific `handle`, so as to avoid indirectly disclosing the Handle via the DID Document.

### 4.4 Handle-to-DID Mapping Rules

Handles and DIDs have a one-to-one correspondence maintained by the Handle Provider. The mapping follows these rules:

1. **Hostname consistency**: The domain portion of the Handle MUST match the hostname in the DID. If the DID authority includes a port, the comparison MUST ignore the port and compare only the hostname.
2. **Unique binding**: A Handle MUST be bound to exactly one DID.
3. **Local-part uniqueness**: The local-part MUST be unique within the same domain.
4. **No redefinition of did:wba binding fingerprints**: If a Handle points to a path-type did:wba using the default path profile, the generation, validation, and profile semantics of the final binding fingerprint segment in the DID path are defined entirely by Specification 03. WNS does not redefine or override those rules.

**Mapping Examples:**

```text
Handle:  alice.example.com
DID:     did:wba:example.com:user:alice:e1_<fingerprint>
```

```text
Handle:  alice.example.com
DID:     did:wba:example.com%3A8800:user:alice:e1_<fingerprint>
```

In the second example, the Handle domain is `example.com`. Although the DID contains the encoded port `%3A8800`, its hostname is still `example.com`, so the mapping remains valid. The Handle itself does not carry a port number. The port only affects where the DID Document is resolved, not the textual form of the Handle.

### 4.5 did:wba Standard Resolution

After obtaining the DID, implementations MUST resolve the DID Document according to the [did:wba Method Specification](03-did-wba-method-design-specification.md).

Implementers MUST NOT bypass the DID Document and directly infer service endpoints, binding keys, or other DID-related information from the Handle. The DID Document is the authoritative source of agent capabilities and services.

### 4.6 Handle Uniqueness Constraints

- A Handle MUST be bound to exactly one DID.
- The local-part MUST be unique within the same domain.
- Different domains MAY have the same local-part (decentralized model).

For example, `alice.example.com` and `alice.other.com` are two different Handles that point to different DIDs.

### 4.7 Handle Status

Handles have the following three states:

| Status | Description |
|--------|-------------|
| `active` | Normal state; the Handle can be resolved |
| `suspended` | Temporarily unresolvable but recoverable |
| `revoked` | Permanently revoked and not recoverable |

### 4.8 Error Responses

The Handle Resolution Endpoint SHOULD return the following standard HTTP status codes:

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| `200 OK` | Resolution successful | Returns the Handle Resolution Document |
| `404 Not Found` | Handle does not exist | The local-part was never registered, or the server is unwilling to disclose whether the Handle exists |
| `410 Gone` | Handle permanently revoked | The Handle previously existed but has been revoked |
| `301 Moved Permanently` | Handle migrated | The `Location` header points to the new Resolution Endpoint |
| `308 Permanent Redirect` | Handle migrated | Similar to `301`, but preserves request semantics more explicitly |
| `429 Too Many Requests` | Request rate too high | Returned when rate limits are triggered; it may include `Retry-After` |

When `301` or `308` is returned:

1. `Location` is only a migration hint.
2. The client MUST re-run the bidirectional binding verification defined in Section 6 at the new address.
3. The client MUST NOT accept the new Handle → DID binding solely based on the HTTP redirect.

**Error Response Example:**

```json
{
  "error": "handle_not_found",
  "message": "The handle 'bob.example.com' does not exist"
}
```

## 5. Profile URL

### 5.1 Profile Entry Point

Handle Providers MAY provide a Profile entry point for each Handle. The following URL formats are recommended:

- Subdomain style: `https://{local-part}.{domain}/`
- Path style: `https://{domain}/{local-part}/`

### 5.2 Profile Format

Profiles are business-level documents. This specification only defines the Profile URL entry point and does not constrain the content format. The specific content and presentation of Profiles are defined by Handle users and Handle Providers.

The Profile URL is a presentation or business entry point, not the authoritative source for Handle → DID binding or service discovery. Implementers MUST NOT infer the DID, service endpoints, or authorization capabilities solely from the Profile URL. Any security-sensitive identity binding, message routing, and service discovery MUST still follow the standard chain of Handle → DID → DID Document.

## 6. Reverse Verification (Bidirectional Binding)

To prevent a malicious Handle Provider from mapping an arbitrary Handle to someone else's DID, WNS defines a bidirectional binding verification mechanism.

### 6.1 Handle Provider Declaration (Forward)

The Handle Provider declares the Handle-to-DID mapping through the Resolution Endpoint. This is part of the standard resolution flow (Section 4).

### 6.2 DID Document Declaration (Reverse)

The DID holder adds an entry of type `ANPHandleService` to the `service` section of the DID Document to declare the Handle binding service endpoint it uses. `ANPHandleService.serviceEndpoint` no longer merely expresses the provider domain. Instead, it is a dereferenceable HTTPS endpoint. This endpoint supports the following two compatible modes:

1. **Public Handle mode**: `serviceEndpoint` directly uses the standard Resolution Endpoint of that Handle.
2. **Private confirmation mode**: `serviceEndpoint` points to the DID Confirmation Endpoint, which confirms that the DID is indeed resolved by the Handle Provider without disclosing a specific Handle in the DID Document.

**Public Handle mode example:**

```json
{
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>#handle",
  "type": "ANPHandleService",
  "serviceEndpoint": "https://example.com/.well-known/handle/alice"
}
```

**Private confirmation mode example:**

```json
{
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>#handle",
  "type": "ANPHandleService",
  "serviceEndpoint": "https://example.com/.well-known/handle/by-did?did=did%3Awba%3Aexample.com%3Auser%3Aalice%3Ae1_%3Cfingerprint%3E"
}
```

**Field Descriptions:**

- `id`: Unique identifier of the service; using the `#handle` suffix is recommended.
- `type`: MUST be `ANPHandleService`.
- `serviceEndpoint`: MUST be a dereferenceable absolute HTTPS URI under the Handle Provider's domain. In Public Handle mode, it SHOULD directly use the standard Handle Resolution Endpoint. In Private confirmation mode, it MAY use the DID Confirmation Endpoint.

`ANPHandleService` is used to express the DID holder's reverse declaration of its Handle binding service.

- In Public Handle mode, the DID holder explicitly declares the Resolution Endpoint of a specific Handle, and the verifier can perform a strong check on whether the input Handle exactly matches the DID.
- In Private confirmation mode, the DID holder declares only the accepted Handle Provider and DID confirmation endpoint. The verifier can confirm the provider relationship, but cannot infer from that alone that a specific Handle has been precisely reverse-confirmed.

Future versions may introduce stronger Name Service provider identity or privacy-preserving mechanisms such as `providerDid` and `handleCommitment`, while preserving compatibility.

### 6.3 Verification Flow

For the following security-sensitive scenarios, verifiers MUST perform bidirectional binding verification:

- Identity authentication
- Authorization decisions
- Instant messaging recipient resolution
- Automated calls that trigger state changes, write operations, charges, or resource creation

For scenarios used only for UI display, search preview, or directory browsing, verifiers MAY delay bidirectional binding verification. However, once a security-sensitive operation is about to occur, the verifier MUST complete the verification.

```mermaid
sequenceDiagram
    participant V as Verifier
    participant H as Handle Provider
    participant D as DID Document Server

    V->>H: 1. Resolve Handle to obtain DID
    H-->>V: Handle Resolution Document
    V->>D: 2. Resolve DID to obtain DID Document
    D-->>V: DID Document
    Note over V: 3. Find ANPHandleService and read serviceEndpoint
    V->>H: 4. Dereference serviceEndpoint
    H-->>V: Handle Resolution Document or DID Confirmation Document
    alt Public Handle mode and exact match
        Note over V: ✓ exact-handle
    else Private confirmation mode and confirmed=true
        Note over V: ✓ provider-confirmed
    else Verification failed
        Note over V: ✗ unverified
    end
```

**Verification Steps:**

1. Resolve the input Handle through the standard Handle Resolution Endpoint, obtain the Handle Resolution Document, and extract its `did`.
2. Resolve that `did` according to Specification 03 and obtain the DID Document.
3. Find entries of type `ANPHandleService` in the DID Document's `service` section.
4. Verify that `serviceEndpoint` is an absolute `https` URI and that its hostname is consistent with the domain of the input Handle.
5. Send a `GET` request to `serviceEndpoint` and parse the returned JSON document.
6. If `serviceEndpoint` is equal to the standard Resolution Endpoint of the input Handle, and the returned document's `did` is identical to the `did` from Step 1, and the returned document's `handle` exactly matches the input Handle, the verifier has completed precise bidirectional binding verification for that specific Handle.
7. If the returned document does not contain `handle`, but contains `confirmed = true`, and the returned document's `did` is identical to the `did` from Step 1, this means that the DID is indeed resolved by the Handle Provider. This result confirms only the provider relationship.
8. All other cases MUST be treated as verification failure or insufficient verification strength.

For security-sensitive scenarios that require confirmation of a specific Handle, the verifier MUST obtain the precise bidirectional binding verification result defined in Step 6. The provider confirmation result in Step 7 is not sufficient on its own for such scenarios.

### 6.3.1 Rules for Using `ANPHandleService` (v2)

When performing bidirectional binding verification, the verifier should use `ANPHandleService.serviceEndpoint` according to the following rules:

1. Extract the domain and local-part from the input Handle, and construct the standard Resolution Endpoint for that Handle: `https://{domain}/.well-known/handle/{local-part}`.
2. Resolve the Handle through that Resolution Endpoint, obtain the Handle Resolution Document, and extract its `did`.
3. Resolve the DID Document for that `did` according to Specification 03.
4. Find the entry where `type = "ANPHandleService"` in the DID Document's `service` section.
5. Verify that the entry's `serviceEndpoint` is an absolute `https` URI and that its hostname MUST match the Handle domain extracted in Step 1.
6. Send a `GET` request to `serviceEndpoint` and obtain the returned JSON document.
7. If `serviceEndpoint` is exactly the same as the standard Resolution Endpoint constructed in Step 1, and the returned document's `did` is identical to the `did` from Step 2, and the returned document's `handle` exactly matches the input Handle, then that Handle and DID are considered to have completed precise bidirectional binding verification.
8. If the returned document does not contain `handle`, but contains `confirmed = true`, and the returned document's `did` is identical to the `did` from Step 2, this means that the DID is indeed resolved by the Handle Provider where `ANPHandleService` resides. This result confirms only the provider relationship and MUST NOT by itself be treated as meaning that a specific Handle and DID have completed precise bidirectional binding verification.
9. If `ANPHandleService` does not exist, `serviceEndpoint` is not `https`, the hostname is inconsistent, dereferencing `serviceEndpoint` fails, the returned document's `did` is inconsistent, or the checks in Step 7 or Step 8 fail, the binding MUST NOT be treated as verified.
10. For security-sensitive scenarios such as identity authentication, authorization decisions, and recipient confirmation before message sending that require confirmation of a specific Handle, the verifier MUST obtain the precise bidirectional binding verification result defined in Step 7. The provider confirmation result in Step 8 is not sufficient for such scenarios.

**Notes:**

- When the DID holder is willing to disclose its Handle, `ANPHandleService.serviceEndpoint` SHOULD directly use the standard Resolution Endpoint of that Handle.
- When the DID holder does not want to disclose its Handle in the DID Document, `ANPHandleService.serviceEndpoint` MAY point to a DID Confirmation Endpoint, which returns `did` and `confirmed = true`.
- Future versions may introduce `providerDid`, `handleCommitment`, or other stronger privacy-preserving binding mechanisms while preserving compatibility.

### 6.3.2 Verification Result Semantics

To avoid conflating verification results of different strengths, implementers SHOULD distinguish at least the following three results:

| Result | Description |
|--------|-------------|
| `exact-handle` | The input Handle and DID have completed precise bidirectional binding verification |
| `provider-confirmed` | The resolution relationship between the DID and the Handle Provider has been confirmed, but no specific Handle has been confirmed |
| `unverified` | Verification failed, or only a result with insufficient trust strength was obtained |

`provider-confirmed` is suitable for DID-first, directory browsing, or privacy-friendly Handle Provider confirmation scenarios. Only `exact-handle` satisfies high-assurance scenarios that require confirmation of a specific Handle.

## 7. Integration with the ANP Protocol Stack

### 7.1 Integration with DID Document (Spec 03)

The DID Document adds the `ANPHandleService` service type to support reverse verification (Section 6).

```json
{
  "service": [
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#ad",
      "type": "AgentDescription",
      "serviceEndpoint": "https://example.com/agents/alice/ad.json"
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#handle",
      "type": "ANPHandleService",
      "serviceEndpoint": "https://example.com/.well-known/handle/alice"
    }
  ]
}
```

For did:wba using the default path profile, WNS does not define the binding fingerprint format and does not redefine the `e1_` / `k1_` rules through WNS. Those semantics are entirely handled by Specification 03.

The example above shows Public Handle mode. If the DID holder does not want to disclose a specific Handle in the DID Document, `ANPHandleService.serviceEndpoint` MAY instead use a DID Confirmation Endpoint, for example:

```json
{
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>#handle",
  "type": "ANPHandleService",
  "serviceEndpoint": "https://example.com/.well-known/handle/by-did?did=did%3Awba%3Aexample.com%3Auser%3Aalice%3Ae1_%3Cfingerprint%3E"
}
```

In this mode, the verifier can confirm only the provider relationship and cannot, based on that alone, treat a specific Handle as having completed precise bidirectional binding verification.

### 7.2 Integration with Agent Description Protocol (Spec 07)

An Agent Description document MAY include an optional `handle` field:

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "AgentDescription",
  "did": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "handle": "alice.example.com",
  "name": "Alice's Agent",
  "description": "..."
}
```

The `handle` field is optional and helps other agents obtain a human-readable identifier. Its authoritative binding relationship is still determined by the WNS resolution result and the DID Document.

### 7.3 Integration with Agent Discovery Protocol (Spec 08)

In the collection returned by `.well-known/agent-descriptions`, each entry MAY include an optional `handle` field:

```json
{
  "@type": "ad:AgentDescription",
  "name": "Alice's Agent",
  "@id": "https://example.com/agents/alice/ad.json",
  "handle": "alice.example.com"
}
```

In addition, the Handle Provider's `/.well-known/handle/` path may serve as a supplementary entry point for agent discovery.

### 7.4 Integration with Instant Messaging Protocol (Spec 09)

Handles can be used for recipient display and input in instant messaging scenarios:

- Users can specify message recipients by entering a Handle such as `alice.example.com`.
- The client resolves the Handle to a DID and then performs message routing.
- The messaging UI may display the Handle instead of the DID to improve readability.

Message routing and transport remain DID-based. Handles are used only for display and input at the human-computer interaction layer.

## 8. Handle Provider Requirements

### 8.1 Resolution Service Requirements

Handle Providers MUST satisfy the following requirements:

- MUST provide the resolution service over HTTPS.
- MUST implement the `/.well-known/handle/{local-part}` endpoint.
- MAY implement the `/.well-known/handle/by-did` DID Confirmation Endpoint.
- SHOULD support HTTP caching headers (at least `Cache-Control` and `ETag`; `Last-Modified` is optional).
- SHOULD implement rate limiting to prevent abuse.
- When returning `429 Too Many Requests`, SHOULD include `Retry-After`.
- When a Handle is in a migration window or an underlying DID rotation window, SHOULD reduce the cache TTL.

### 8.2 Handle Management

- Handle Providers are responsible for Handle allocation and lifecycle management.
- Handle registration flows, identity verification methods, length policies, and similar operational rules are defined by each Handle Provider.
- Handle Providers MUST ensure Handle uniqueness within the same domain.

### 8.3 Handle Provider Migration

Users may need to migrate a Handle from one Handle Provider to another. During migration:

- The old Handle Provider MAY return `301 Moved Permanently` or `308 Permanent Redirect`, with the `Location` header pointing to the new Handle Provider's Resolution Endpoint.
- During the migration period, the old and new Handle Providers SHOULD both maintain resolution capability.
- The DID holder needs to update `ANPHandleService` in the DID Document so that it continues to point to the Public Handle Resolution Endpoint or DID Confirmation Endpoint under the new Handle Provider's domain.
- After resolving the result at the new address, the client MUST re-run bidirectional binding verification and MUST NOT accept the new binding solely based on the redirect.
- If stronger provider identity needs to be expressed in the future without breaking the current interoperability model, a `providerDid` mechanism may be introduced in a later version.

### 8.4 Underlying DID Rotation

For path-type did:wba using the default path profile, the underlying DID rotates when the binding key changes or when the binding profile switches between `e1_` and `k1_`. In this scenario, WNS has the following requirements:

- The Handle MAY remain unchanged to provide a stable human-readable name.
- The Handle Provider SHOULD update the Handle mapping to the new DID as soon as the new DID Document is available.
- During the rotation window, the Handle Provider SHOULD reduce the cache TTL to reduce the time during which clients may use an outdated mapping.
- Clients MUST NOT assume that a Handle is always bound to the same DID; the current resolution result is the authoritative current DID for that Handle.
- For security-sensitive operations, after obtaining a new DID through a Handle, the client MUST re-run bidirectional binding verification.
- If the upper-layer operation requires confirmation of a specific Handle, the client MUST require an `exact-handle` result and MUST NOT accept only `provider-confirmed`.
- Policies for deactivating, retaining, or keeping the old DID in parallel are determined jointly by Specification 03 and the specific deployment. WNS is responsible only for the mapping between the stable name and the current DID.

## 9. Security Considerations

### 9.1 Domain Security

The security model of WNS is consistent with the did:wba method and relies on the TLS/SSL certificate system. The domain portion of a Handle MUST be protected by a valid TLS certificate. The security of a Handle Provider is equivalent to the security of its domain and TLS configuration.

### 9.2 Phishing and Confusion Attacks

WNS reduces phishing and confusion risks through the following mechanisms:

- The local-part is restricted to ASCII lowercase letters, digits, and hyphens, avoiding Unicode homograph attacks.
- Handle Providers SHOULD maintain reserved word lists (see Section 3.3).
- Clients SHOULD visually emphasize the domain portion when displaying Handles to help users identify the source.

### 9.3 Handle Squatting

Handle Providers SHOULD take measures to prevent malicious squatting, including but not limited to:

- Maintaining reserved word lists
- Implementing registration review mechanisms
- Providing dispute resolution processes

Specific policies are defined by each Handle Provider.

### 9.4 Privacy Considerations

- The Handle Resolution Endpoint exposes the existence of a Handle (for example, through differences among `200`, `404`, and `410`). Handle Providers SHOULD implement rate limiting to mitigate enumeration attacks.
- Handle Providers SHOULD NOT return sensitive information beyond the mapping relationship in the Resolution Endpoint.
- Handle Providers SHOULD try to normalize error response structures to avoid leaking unnecessary state through excessive differences.
- If the DID holder does not want to disclose a specific Handle in the DID Document, it MAY use the DID Confirmation Endpoint mode and return only provider-level confirmation information.
- For display-only scenarios, clients MAY delay bidirectional binding verification to reduce unnecessary cross-site resolution requests.

### 9.5 Anti-Tampering

The core anti-tampering mechanism of WNS is bidirectional binding verification (Section 6):

1. The Handle Provider declares Handle → DID through the standard Resolution Endpoint in the forward direction.
2. The DID holder declares, through `ANPHandleService` in the DID Document, a dereferenceable HTTPS endpoint under the same Handle Provider domain in the reverse direction.
3. The verifier dereferences that endpoint and distinguishes between `exact-handle` and `provider-confirmed` based on the returned result.
4. For high-assurance scenarios that require confirmation of a specific Handle, the verifier MUST require `exact-handle` and MUST NOT substitute `provider-confirmed`.
5. Future versions may introduce mechanisms such as `providerDid` and `handleCommitment` to provide stronger Name Service provider identity verification and privacy protection.

For path-type did:wba using the default path profile, the DID itself may also carry a binding fingerprint segment defined by Specification 03 (such as `e1_...` or `k1_...`). This belongs to the did:wba method layer and is not redefined by WNS.

WNS no longer defines a separate "public key fingerprint extension whose algorithm and encoding are chosen by the Handle Provider" in order to avoid redundant definitions or semantic conflicts with the default path profile of did:wba.

## 10. Use Cases

### 10.1 Social Sharing

User Alice can share `wba://alice.example.com` on social media. When other users see it, they can:

1. Recognize the `wba://` prefix and remove it to get the Handle `alice.example.com`.
2. Resolve the Handle to obtain the DID.
3. Obtain Alice's agent description and service endpoints through the DID Document.
4. Establish interaction with Alice's agent.

### 10.2 Inter-Agent Communication

Agent A needs to communicate with Agent B whose Handle is `bob.example.com`:

1. Resolve the Handle `bob.example.com` to obtain the DID.
2. Resolve the DID Document according to Specification 03.
3. Obtain the AgentDescription endpoint from the DID Document's `service` section.
4. Fetch the Agent Description document to understand Agent B's capabilities and interfaces.
5. Initiate communication according to the interface definition.

### 10.3 Instant Messaging

A user enters the recipient Handle `carol.example.com` in an instant messaging application:

1. The client resolves the Handle to obtain the DID.
2. The client obtains the messaging service endpoint through the DID Document.
3. The client sends a message using the instant messaging protocol defined in Specification 09.
4. The messaging interface displays the recipient's Handle rather than the DID.

### 10.4 Stable Handle and DID Rotation

Alice uses the Handle `alice.example.com` publicly over the long term. After some time, due to binding key rotation, the underlying path-type did:wba rotates from:

```text
did:wba:example.com:user:alice:e1_<old-fingerprint>
```

to:

```text
did:wba:example.com:user:alice:e1_<new-fingerprint>
```

During this process:

1. Alice's Handle `alice.example.com` remains unchanged.
2. The Handle Provider updates the mapping of the Handle to the new DID.
3. Alice updates `ANPHandleService` in the new DID Document.
4. After re-running bidirectional binding verification, resolvers continue to find Alice's current DID through the same Handle.

## 11. Normative Requirements Summary

The following summarizes all MUST / SHOULD / MAY requirements in this specification (terminology defined per [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)):

### MUST

1. The local-part of a Handle MUST begin and end with a letter or digit.
2. The local-part of a Handle MUST NOT contain consecutive hyphens.
3. The domain of a Handle MUST be a valid FQDN protected by a TLS/SSL certificate.
4. All Handle input MUST be normalized to lowercase.
5. If a client accepts input with the `wba://` prefix, it MUST strip the prefix before resolution.
6. The domain portion of a Handle MUST match the hostname in the DID; if the DID includes a port, the comparison MUST ignore the port.
7. A Handle MUST be bound to exactly one DID.
8. The local-part MUST be unique within the same domain.
9. After obtaining the DID, the DID Document MUST be resolved according to Specification 03.
10. Implementations MUST NOT bypass the DID Document and infer service endpoints, binding keys, or other DID information directly from a Handle.
11. Handle Providers MUST provide the resolution service over HTTPS.
12. Handle Providers MUST implement the `/.well-known/handle/{local-part}` endpoint.
13. In identity authentication, authorization decisions, instant messaging recipient resolution, and other security-sensitive scenarios, verifiers MUST perform bidirectional binding verification.
14. `ANPHandleService.serviceEndpoint` MUST be an absolute HTTPS URI under the Handle Provider's domain. During verification, its hostname MUST match the domain of the input Handle.
15. When performing bidirectional binding verification, the verifier MUST dereference `ANPHandleService.serviceEndpoint`.
16. To treat a specific Handle as a verified binding, the verifier MUST obtain an `exact-handle` result.
17. A `provider-confirmed` result MUST NOT by itself be treated as meaning that a specific Handle and DID have completed precise bidirectional binding verification.
18. After a client follows a `301` / `308` redirect to a new Resolution Endpoint, it MUST re-run bidirectional binding verification and MUST NOT accept the new binding solely based on the redirect.
19. For security-sensitive operations after underlying DID rotation, the client MUST re-run bidirectional binding verification.
20. A Profile URL MUST NOT be treated as the authoritative source for Handle → DID binding or service discovery.

### SHOULD

1. Handle Providers SHOULD maintain and publish reserved word lists.
2. The Handle Resolution Endpoint SHOULD support HTTP caching headers.
3. The Handle Resolution Endpoint SHOULD implement rate limiting.
4. During Handle migration, the old Provider SHOULD return a `301` or `308` redirect hint.
5. Clients SHOULD visually emphasize the domain portion when displaying a Handle.
6. Handle Providers SHOULD NOT return sensitive information in the Resolution Endpoint.
7. During Handle migration or an underlying DID rotation window, Handle Providers SHOULD reduce the cache TTL.
8. When returning `429 Too Many Requests`, Handle Providers SHOULD include `Retry-After`.
9. Handle Providers SHOULD try to normalize error response structures to reduce unnecessary state leakage.
10. When the DID holder is willing to disclose a specific Handle, it SHOULD directly use the standard Resolution Endpoint of that Handle as `ANPHandleService.serviceEndpoint`.
11. When a DID Confirmation Endpoint is used, the response document SHOULD NOT directly return a specific `handle`.
12. Implementers SHOULD distinguish among `exact-handle`, `provider-confirmed`, and `unverified`.
13. After Handle Provider migration, the DID holder SHOULD update `ANPHandleService` in the DID Document.
14. When the underlying path-type DID rotates, the Handle Provider SHOULD update the Handle mapping to the new DID as soon as possible.

### MAY

1. Clients MAY accept input with the `wba://` prefix.
2. Handle Providers MAY provide Profile entry points for Handles.
3. Agent Description documents MAY include a `handle` field.
4. Entries in the agent discovery collection MAY include a `handle` field.
5. For scenarios used only for UI display, search preview, or directory browsing, verifiers MAY delay bidirectional binding verification.
6. Handle Providers MAY implement the `/.well-known/handle/by-did` DID Confirmation Endpoint.
7. When the DID holder does not want to disclose a specific Handle, it MAY use the DID Confirmation Endpoint as `ANPHandleService.serviceEndpoint`.
8. A Handle MAY remain unchanged when the underlying path-type DID rotates to provide a stable human-readable name.

## Appendix A: Native `did:web` Compatibility

Reference document: [Appendix B: Compatibility with native `did:web`](appendix-b-compatibility-with-native-did-web.md)

## References

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [RFC 2119 - Key words for use in RFCs to Indicate Requirement Levels](https://www.rfc-editor.org/rfc/rfc2119)
- [RFC 1035 - Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035)
- [RFC 6585 - Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585)
- [RFC 8615 - Well-Known URIs](https://www.rfc-editor.org/rfc/rfc8615)
- [RFC 9110 - HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [ANP Technical White Paper](01-agentnetworkprotocol-technical-white-paper.md)
- [DID:WBA Method Design Specification](03-did-wba-method-design-specification.md)
- [Agent Description Protocol Specification](07-anp-agent-description-protocol-specification.md)
- [Agent Discovery Protocol Specification](08-anp-agent-discovery-protocol-specification.md)
- [End-to-End Instant Messaging Protocol Specification](09-ANP-end-to-end-instant-messaging-protocol-specification.md)

## Copyright Notice

Copyright (c) 2024 ANP Community
This file is released under the [MIT License](LICENSE). You are free to use and modify it, but you must retain this copyright notice.
