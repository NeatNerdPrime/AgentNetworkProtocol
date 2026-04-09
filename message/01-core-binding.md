# ANP Profile 1: Core Binding (Final Revision)

- Document ID: ANP-P1
- Title: Core Binding
- Status: Draft
- Version: 0.2.0 (Final Revision)
- Language: English
- Applicability: This profile applies to all ANP basic profiles and security overlay profiles.

---

## 1. Purpose

This Profile defines ANP's unified outer message bindings, common fields, capability negotiation, error models, and interoperability constraints.

The goals of this Profile are:

1. Provide a unified message envelope for all ANP methods;
2. Avoid repeated invention of requests, responses, notifications and error formats for different business profiles;
3. Provide a common foundation for Profiles such as Direct Base, Group Base, Direct E2EE, Group E2EE, Attachment, Federation, etc.;
4. While retaining the basic compatibility of JSON-RPC 2.0, tighten the optional degrees of freedom and reduce cross-implementation ambiguity.

---

## 2. Terminology and normative conventions

### 2.1 Normative keywords

In this document, **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, **OPTIONAL** are interpreted as normative requirements according to their capitalized form.

### 2.2 Terminology

- **ANP Endpoint**: The protocol endpoint that implements ANP, usually the ingress service of the domain where the Agent is located, the group Host service or other declared service endpoints.
- **Request**: JSON-RPC call object with `id`.
- **Notification**: JSON-RPC call object without `id`.
- **Result**: `result` member in the successful response object.
- **Error**: `error` member in the failure response object.
- **Profile**: ANP's protocol capability unit, such as `anp.direct.base.v1`.
- **Security Profile**: Security semantic unit of ANP, such as `transport-protected`, `direct-e2ee`, `group-e2ee`.
- **Operation**: A protocol action that can be recognized idempotently, such as sending a message, group creation, adding members, and submitting a group status change.
- **Message-bearing Operation**: An operation that carries application layer message payload, such as `direct.send`, `group.send`, `group.e2ee.send`.
- **Message-bearing Notification**: Push method that carries application layer message payload as Notification, such as `direct.incoming`, `group.incoming`, `group.e2ee.notice`.
- **Control Operation**: does not carry application layer business messages, but operations that change the protocol or business status, such as `group.create`, `group.add`, `group.remove`.

---

## 3. Design principles

### 3.1 Layering principle

ANP uses the following layering:

1. **Transport layer**: HTTP(S), WebSocket Secure and other secure transmission;
2. **Binding layer**: JSON-RPC 2.0 binding defined by this Profile;
3. **Business layer**: Business semantics such as Direct Base and Group Base;
4. **Security Overlay layer**: Direct E2EE, Group E2EE and other security semantics;
5. **Media/Object layer**: Large object extensions such as Attachment.

### 3.2 Minimum interoperability principle

Different implementations can share the same as long as they meet this Profile constraint:

- Request/response format;
- Notification format;
- Common field semantics;
- Capacity negotiation methods;
- Error model;
- Idempotent processing principle.

### 3.3 Non-target

This Profile does not define the following capabilities:

- History pull;
- Read status;
- Device synchronization;
- online status;
- Internal copy consistency;
- Specific E2EE algorithm.

These capabilities must be defined by other Profiles or explicitly stated as being outside the scope of the ANP standard.

### 3.4 Profile identification

The standard name of this Profile is:

`anp.core.binding.v1`

Subsequent Profiles **MUST** use this name to reference this Profile when declaring dependencies.

---

## 4. Binding basics

### 4.1 JSON-RPC version

ANP Core Binding **MUST** use JSON-RPC 2.0.

The `JSON-RPC` member **MUST** in every request object and response object is exactly equal to the string `"2.0"`.

### 4.2 Secure transmission requirements

All ANP bindings **MUST** run over a certified secure transport layer, such as:

- HTTPS;
- WSS;
- Other secure channels that provide confidentiality, integrity and peer authentication.

This profile does not allow operation over unauthenticated, unencrypted raw transfers.

### 4.3 Transport independence

This Profile is logically transport-agnostic; HTTP(S) and WSS are the recommended bindings, but not the only allowed bindings.  
Any new binding that does not change the message object semantics of this Profile is defined as a supplementary binding document.

---

## 5. JSON-RPC interoperability constraints

### 5.1 `params` form

The original JSON-RPC specification allowed `params` to take either a positional array or a by-name object.  
In ANP, `params` **MUST** be an object; **MUST NOT** uses array form.  
If the array form `params` is received, the receiver **MUST** returns a `anp.invalid_params_shape` error.

### 5.2 `id` type

The original JSON-RPC specification allowed `id` to be a string, a number, or `null`.  
In ANP, Request's `id` **MUST** be a non-empty string.  
ANP Request **MUST NOT** uses the number `id`.  
ANP Request **MUST NOT** use `null` as `id`.  
If `id` is received that does not meet the requirements, the receiver **MUST** returns `anp.invalid_request_id`.

### 5.3 Notification usage scope

In ANP, Notification is **only** used in the following scenarios:

1. Asynchronous events actively pushed by the peer;
2. One-way prompts that do not require confirmation and should not return error details.

The following operations **MUST NOT** use Notification:

- Control operations that change persistent state;
- Sending messages that require idempotent confirmation;
- Any operation that requires the caller to perceive success or failure.

### 5.4 Batch prohibited

JSON-RPC batch calls MUST NOT be used in ANP.  
Client **MUST NOT** send batches.  
When the server receives the batch, it **MUST** reject it and returns `anp.batch_not_supported`.

### 5.5 Method name constraints

The method name **MUST** be a string and follows the following naming rules:

- Use logical namespace;
- Start with a lowercase letter;
- Use `.` to separate sections;
- The method name **MUST NOT** starts with `rpc.`;
- Business methods **SHOULD** use `<domain>.<action>` style.

Recommended examples:

- `anp.get_capabilities`
- `direct.send`
- `group.create`
- `group.add`
- `group.send`
- `group.e2ee.send`
- `group.e2ee.notice`

### 5.6 Response constraints

Except for Notification, the server **MUST** returns a Response for each Request.  
A successful response **MUST** contain `result`, and **MUST NOT** contains `error`.  
The failure response **MUST** contain `error`, and **MUST NOT** contains `result`.  
Response's `id` **MUST** be exactly the same as the corresponding Request's `id`.

---

## 6. General `params` structure

### 6.1 Top-level objects

With the exception of certain methods with explicit exceptions, ANP's `params` **MUST** takes the following structure:

```json
{
  "meta": { "...": "..." },
  "auth": { "...": "..." },
  "body": { "...": "..." }
}
```

Specifically:

- `meta`: general metadata, carrying interpretation profile, target, idempotence, security mode, etc.;
- `auth`: optional authentication and certification objects; only appears when explicitly required by a specific Profile;
- `body`: method specific parameters.

If `auth` is not defined for a specific Profile, the caller **MAY** omits it.  
If a specific Profile explicitly requires `auth`, the caller **MUST** provides it and the receiver **MUST** validate it.  
Top-level `params` members other than `meta`, `auth`, and `body` are only allowed to appear if the corresponding Profile is explicitly defined.

### 6.2 `meta` object

The `meta` object fields are defined as follows:

#### 6.2.1 `anp_version`

- Type: string
- Requirements: **MAY**
- Semantics: ANP major version prompt
- Default: If omitted, the receiver **MUST** interprets it as `"1.0"`
- Description:
  - This field is reserved for explicit debugging or cross-version gateways;
  - In v1, `profile` is used first to determine the interpretation rules;
  - New implementation of **SHOULD** treats this as a compatibility field rather than a primary negotiation field.

#### 6.2.2 `profile`

- Type: string
- Requirements: **MUST**
- Semantics: the only interpretation of this request Profile
- Description:
  - `profile` is used to declare "which Profile interprets the `body`, `result`, error constraints and method semantics of the current request";
  - `profile` **MUST NOT** expresses the union semantics of multiple Profiles at the same time;
  - `security_profile` only expresses safe mode and does not replace `profile`.
- Example:
  - `"anp.direct.base.v1"`
  - `"anp.group.base.v1"`
  - `"anp.direct.e2ee.v1"`
  - `"anp.group.e2ee.v1"`

#### 6.2.3 `security_profile`

- Type: string
- Requirements: **MUST**
- Semantics: the safe mode of this call
- Allowed values:
  - `"transport-protected"`
  - `"direct-e2ee"`
  - `"group-e2ee"`
- Description:
  - `security_profile` indicates the security mode required by the current request;
  - It describes the security level or security semantics, not the interpretation syntax of `body`;
  - If a certain `profile` only allows certain `security_profile` combinations, this must be explicitly specified by the corresponding Profile.

#### 6.2.4 `sender_did`

- Type: String (DID)
- Requirements: In addition to anonymous public discovery capabilities, **MUST**
- Semantics: The sending subject DID of this request in terms of business semantics (business origin DID / logical sender DID)
- Description:
  - For ordinary Request, `sender_did` **SHOULD** indicates the current business initiator;
  - For Notifications generated by the server, whether `sender_did` is allowed to be omitted or other fields are used to express the logical issuer is defined by the specific Profile;
  - `sender_did` **MUST NOT** is automatically equated to the one-hop caller identity of the outer transport connection.

#### 6.2.5 `target`

- Type: Object
- Requirement: **MUST** when a method has a protocol-level target
- Structure:

```json
{
  "kind": "agent | group | service",
  "did": "did:example:..."
}
```

- Description:
  - `kind = "agent"` indicates that the target is a single Agent;
  - `kind = "group"` indicates that the target is a single group;
  - `kind = "service"` indicates that the target is a public `ANPMessageService.serviceDid`;
  - `target.did` **MUST NOT** directly carries the transport layer URL;
  - Any method Profile **MUST** explicitly declares whether it is `agent-addressed`, `group-addressed`, `service-scoped` or `endpoint-local`;
  - Whether `target` is allowed to be omitted, **MUST** be explicitly declared by the specific Profile, and the caller and receiver **MUST NOT** can guess by themselves.

#### 6.2.5.1 Target modeling pattern declaration rules

In order to eliminate the bifurcation of interpretations of `target` by different Profiles, a specific Profile **MUST** explicitly declares which of the following target modeling modes its methods belong to:

1. **agent-addressed**
   - `meta.target.kind = "agent"`
   - `meta.target.did` points to the target Agent DID

2. **group-addressed**
   - `meta.target.kind = "group"`
   - `meta.target.did` points to the target Group DID

3. **service-scoped**
   - `meta.target.kind = "service"`
   - `meta.target.did` points to target public `ANPMessageService.serviceDid`

4. **endpoint-local**
   - Omission of `meta.target` is allowed only if the corresponding Profile is explicitly declared

If a method is not explicitly declared endpoint-local by its Profile, the receiver MUST be treated as requiring explicit `target`.

If the `meta.target.kind` of a request is inconsistent with the target modeling mode declared by the method, the receiver **MUST** returns `anp.invalid_target_binding`.


#### 6.2.6 `operation_id`

- Type: string
- Requirement: All operations that change state **MUST**
- Semantics: Idempotent identifier of this operation
- Rules:
  - `operation_id` **MUST** remains unchanged when the same initiator retries in the same semantic context;
  - Idempotent scope **MUST** be clearly defined by a specific Profile;
  - The server **MUST** performs idempotent hit checking first, and then performs optimistic concurrency or version precondition checking;
  - For message-type operations, the sender **SHOULD** directly orders `operation_id = message_id`, unless it really needs to distinguish between "message identification" and "operation retry identification".

#### 6.2.7 `message_id`

- Type: string
- Requirement: Message-bearing Operation **MUST**
- Semantics: application layer message identification
- Description:
  - `message_id` is used for message-level unique identification or duplicate identification;
  - `message_id` and `operation_id` can be the same or different;
  - If the implementation does not have an independent operation life cycle, **SHOULD** directly reuses `message_id` as `operation_id`;
  - `message_id` **MUST NOT** implicitly overrides the general idempotent semantics of `operation_id`, unless the corresponding Profile explicitly allows the same;
  - This constraint also applies when the specific method is message-bearing Notification.

#### 6.2.8 `created_at`

- type: string (RFC 3339 time)
- Requirements: **SHOULD**
- Semantics: timestamp when the initiator created the operation
- Note: Unless otherwise specified in the subsequent Profile, `created_at` shall not be used as the only basis for anti-replay.

#### 6.2.9 `trace_id`

- Type: string
- Requirement: **No longer as a standard interoperable field**
- Semantics: implement internal tracking identifiers
- Description:
  - If the deployment requires cross-service tracking, **SHOULD** use transport layer metadata or private extension fields (such as `x_trace_id`);
  - The recipient **MUST NOT** incorporate this into any security semantics, authorization judgments, or idempotence judgments.

#### 6.2.10 `content_type`

- Type: string
- Requirement: Message-bearing Operation **MUST**
- Semantics: The main business load type of the current message operation; if the current Profile / Overlay uses an independent outer envelope, it indicates the type of the outer envelope.

The rules are as follows:

1. In Base Profile, if `body` is just a structured hosting container (such as `text` / `payload` / `payload_b64u` mutually exclusive structure), then `meta.content_type` **MUST** describes the main business load type in the container, not the type of the JSON container object itself;
2. In the Security Overlay, if `body` carries an independent ciphertext envelope, then `meta.content_type` **MUST** represents the wire object type of the outer envelope;
3. If the original application content type is different from the outer envelope type, **MUST** must be expressed by the corresponding Overlay in its internal fields (such as `application_content_type`);
4. When the specific method is message-bearing Notification, this rule also applies;
5. The right to basic interpretation of `meta.content_type` is solely stipulated by this Profile; other business profiles and security overlay **MUST NOT** rewrite its basic semantics.

Example:

- Direct Base text message: `text/plain`
- Group Base JSON message: `application/json`
- Direct E2EE text messages: outer `meta.content_type = "application/anp-direct-cipher+json"`, inner `application_content_type = "text/plain"`
- Group E2EE Attachment Message: Outer `meta.content_type = "application/anp-group-cipher+json"`

Among them, if the inner original service type of Group E2EE is attachment manifest, then the inner plain text should be written:

```json
{
  "application_content_type": "application/anp-attachment-manifest+json"
}
```

And **not** continue to write the attachment manifest type in the outer `meta.content_type`.

### 6.3 `body` object

The `body` object is a collection of method-specific parameters:

- Business Profile **MUST** defines its fields;
- Security Overlay Profile **MUST** defines its cryptography fields;
- Whether unrecognized fields in `body` can be ignored, **MUST** be explicitly stated by the corresponding Profile;
- The receiver **MUST** reject unknown fields that affect security, routing, permissions, idempotence, or state machine semantics.

---

## 7. Load representation rules

### 7.1 JSON object first

Any business object that can be naturally expressed as a JSON object is directly represented as a JSON object.  
ANP **MUST NOT** uses double serialization of "JSON within a JSON string" as the default practice.

### 7.2 Binary representation

When a binary payload needs to be transmitted, the field **MUST** be represented as unpadded base64url text.  
Related field names **SHOULD** end with `_b64u`, for example:

- `ciphertext_b64u`
- `key_package_b64u`
- `welcome_b64u`

### 7.3 Numerical representation

In order to avoid differences in the representation of large integers, counters, and serial numbers in different languages, the following fields **MUST** be represented by decimal strings:

- Counter;
- serial number;
- logical clock;
- epoch;
- generation;
- Large integer length;
- Any value that may exceed the range of IEEE 754 double-safe integers.

If the subsequent Profile needs to perform standardized signature on JSON, the serialization rules for the signature input must be clearly defined.  
Once a Profile defines a Signed Payload or equivalent cryptographic binding object, the Profile **MUST** specifies a unique normalization algorithm; different implementations **MUST NOT** choose different "stable serialization" strategies.

---

## 8. Capability Negotiation

### 8.1 General

ANP Endpoint **MUST** exposes the capability negotiation interface.  
The results of capability negotiation **MUST** include at least:

- List of supported ANP Profiles;
- Supported Security Profile list;
- Runtime service identity;
- Implement constraints (such as maximum load, maximum object size, throttling strategy, etc.).

The implementer **MAY** returns more fine-grained extended fields (such as supported content types, method-level capabilities, Notification capabilities, authentication scheme capabilities), but these extended fields do not affect the minimum standard response structure defined in this section.

### 8.2 Standard method: `anp.get_capabilities`

#### 8.2.1 Request

```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "anp.get_capabilities",
  "params": {
    "meta": {
      "profile": "anp.core.binding.v1",
      "security_profile": "transport-protected",
      "operation_id": "op-cap-001",
      "created_at": "2026-03-29T12:00:00Z"
    },
    "body": {}
  }
}
```

illustrate:

- `anp.get_capabilities` **MAY** is called as an anonymous public discovery capability;
- When calling anonymously, `meta.sender_did` **MAY** is omitted;
- If the server returns different capability subsets based on identity, the caller **MAY** calls again in the authenticated context.

#### 8.2.2 Successful response

```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "result": {
    "service_did": "did:example:service",
    "supported_profiles": [
      "anp.core.binding.v1",
      "anp.direct.base.v1",
      "anp.group.base.v1",
      "anp.direct.e2ee.v1"
    ],
    "supported_security_profiles": [
      "transport-protected",
      "direct-e2ee"
    ],
    "limits": {
      "max_request_bytes": "1048576",
      "max_message_bytes": "262144"
    },
    "supported_content_types": [
      "text/plain",
      "application/json",
      "application/anp-attachment-manifest+json"
    ]
  }
}
```

illustrate:

- `result.service_did` represents the service identity DID corresponding to the current runtime capability result;
- Static DID documents only provide hints, and runtime capabilities are subject to this result;
- `supported_content_types` is a recommended extension, but it is very common. The server **SHOULD** should try to return it.

### 8.3 Negotiation Rules

- Static extension fields in DID documents only represent cacheable static hints;
- The return result of `anp.get_capabilities` represents the runtime authority;
- If the static hint conflicts with the runtime capability, the caller **MUST** takes the runtime capability result as the criterion and refreshes the cache;
- The caller **SHOULD** obtains the target service capabilities before the first interaction or after the cache expires;
- If `profile` or `security_profile` in the request is not supported, the server **MUST** returns an explicit error;
- The caller **MUST NOT** assumes that "if the other party supports Base Profile, it must support E2EE Overlay".

---

## 9. Idempotence and retry

### 9.1 Idempotence principle

All state-changing operations **MUST** support idempotence.  
Duplicate request for the same `(sender_did, target_scope, method, operation_id)`:

- If semantically equivalent, the server **MUST** returns the same result or an equivalent result;
- If there is a semantic conflict, the server **MUST** returns `anp.idempotency_conflict`.

Specifically:

- The specific value of `target_scope` **MUST** be defined by the corresponding Profile;
- For Direct class methods, `target_scope` is usually `target.did`;
- For Group class methods, `target_scope` is usually `group_did`.

### 9.2 Message retry

For message sending operations:

- `message_id` **MUST** remains unchanged when retrying;
- `operation_id` **MUST** remains unchanged when retrying;
- If the implementation has no independent operation semantics, the sender **SHOULD** makes the two directly the same;
- The server **MUST** checks operation-level idempotent records first;
- The key used for message-level repeat identification (such as whether it contains `message_id`) must be explicitly defined by the corresponding message Profile.

### 9.3 Non-idempotent operations

If an operation is inherently not idempotent, the corresponding Profile **MUST** be clearly marked and an alternative remediation mechanism is provided.  
Those not explicitly marked are always considered to be idempotent.

---

## 10. Error model

### 10.1 General

ANP uses JSON-RPC's `error` object to carry errors.  
ANP **retains** the original semantics of JSON-RPC standard error codes, while defining ANP's own application error codes.

For the following situations, the server **SHOULD** preferentially uses JSON-RPC standard error codes:

|scene|Recommended JSON-RPC error codes|
|---|---|
|Unable to parse JSON| `-32700 Parse error` |
|Illegal JSON-RPC object| `-32600 Invalid Request` |
|method does not exist| `-32601 Method not found` |
|Parameter shape is illegal| `-32602 Invalid params` |
|Server internal exception| `-32603 Internal error` |

For ANP business layer errors, the server **SHOULD** uses the 1000+ error codes defined in this document, and also provides machine-readable semantics in `error.data.anp_code`.

### 10.2 ANP Error Object Extension

`error` object suggestion structure:

```json
{
  "code": 1001,
  "message": "Unsupported profile",
  "data": {
    "anp_code": "anp.unsupported_profile",
    "retryable": false,
    "details": {}
  }
}
```

`error.data.anp_code` **MUST** exists when `code` falls within the ANP custom error scope.

### 10.3 ANP public error code

| `code` | `anp_code` |meaning|
|---|---|---|
| 1000 | `anp.invalid_request_id` |`id` Illegal|
| 1001 | `anp.unsupported_profile` |The requested Profile is not supported|
| 1002 | `anp.unsupported_security_profile` |The requested security mode is not supported|
| 1003 | `anp.invalid_params_shape` |`params` The structure does not meet the requirements|
| 1004 | `anp.batch_not_supported` |batch is not supported|
| 1005 | `anp.unauthorized` |Not certified|
| 1006 | `anp.forbidden` |Authenticated but no permissions|
| 1007 | `anp.target_not_found` |Target DID does not exist or is unreachable|
| 1008 | `anp.idempotency_conflict` |Idempotent key conflict|
| 1009 | `anp.unsupported_content_type` |Content type not supported|
| 1010 | `anp.delivery_rejected` |Target service refuses to receive|
| 1011 | `anp.rate_limited` |Trigger current limit|
| 1012 | `anp.temporarily_unavailable` |Service is temporarily unavailable|
| 1013 | `anp.invalid_security_binding` |Security mode does not match payload structure|
| 1014 | `anp.invalid_target_binding` |The target modeling schema required by the method does not match the actual `meta.target`|

### 10.4 Error return requirements

- For ANP custom errors, the server **MUST** returns machine-determinable `anp_code`;
- `message` **SHOULD** Short and readable;
- `data.retryable` **SHOULD** specifies whether to retry;
- Any errors **MUST NOT** leak unnecessarily sensitive internal state.
- **SHOULD** returns `anp.invalid_target_binding` for target binding errors, misuse of service-scoped / endpoint-local, etc.

---

## 11. Method registration and namespace

### 11.1 Namespace

It is recommended to use the following first-level namespace:

- `anp.*`
- `direct.*`
- `group.*`
- `attachment.*`
- `federation.*`

### 11.2 Version Management

Profile name **MUST** be explicit with version, for example:

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`
- `anp.direct.base.v1`

### 11.3 Extension methods

The implementer **MAY** defines private extension methods, but:

- **MUST NOT** have the same name as a standard method;
- **SHOULD** Use private prefix;
- **MUST NOT** Assume other implementations understand these methods.

---

## 12. Compatibility and version evolution

### 12.1 Forward Compatibility

The receiver's processing rules for unknown extended fields are as follows:

- Receiver **MUST** reject unknown core `meta` field;
- Implementations that begin with `x_` extend the `meta` field, ignored by the receiver **MAY**;
- For unknown `auth` fields, the receiver **MUST** reject them unless the corresponding Profile explicitly states that they can be extended;
- For unknown `body` fields, the receiver will **MAY** ignore them only if the corresponding Profile explicitly states that they can be ignored;
- If the unknown field affects security, routing, permissions, idempotence, or state machine semantics, the receiver **MUST** reject.

### 12.2 Destructive changes

The following changes are considered breaking changes and the Profile major version must be upgraded:

- `meta` field meaning changes;
- Changes in error code semantics;
- Semantic changes in method names;
- Security mode semantic changes;
- Load structures are no longer compatible.

---

## 13. Safety precautions

### 13.1 Safe mode fixed

The caller and server **MUST NOT** silently downgrade from high security mode to low security mode without explicit negotiation.  
If the target does not support the requested `security_profile`, the server **MUST** explicitly returns `anp.unsupported_security_profile`.

### 13.2 Timestamp is not the main anti-replay mechanism

`created_at` **MUST NOT** as the only anti-replay mechanism.  
Anti-replay should be defined by subsequent Profiles in session state, message state or group state.

### 13.3 Tracking field isolation

`trace_id`, log tag, monitoring field **MUST NOT** participate in any cryptographic binding or business authorization judgment.

### 13.4 Load mutual exclusion

If a Profile defines `body.payload` and `body.payload_b64u` as mutually exclusive fields, the sender **MUST NOT** provide both at the same time; the receiver **MUST** reject when receiving conflicting input.

---

## 14. Privacy Notice

### 14.1 Minimum Metadata Principle

The sender **SHOULD** places only the minimum metadata necessary for interoperability across implementations in `meta`.

### 14.2 No device semantics introduced

This Profile only identifies Agents and Groups, and does not define devices, terminals, replicas, or internal operating units.  
These concepts are implementation internal and must not be forced as standard fields in Core Binding.

### 14.3 Capability cache

The caller **SHOULD** caches capability negotiation results, but **MUST** renegotiates upon capability changes, authentication failure, service endpoint switching, or cache invalidation.

---

## 15. Minimum interoperability requirements

An ANP Core Binding compliant implementation MUST support at least:

1. JSON-RPC 2.0;
2. Object form `params`;
3. String `id`;
4. `anp.get_capabilities`;
5. Public error code;
6. Idempotent `operation_id`;
7. `meta` / `body` top-level structure;
8. Secure transmission;
9. Processing of anonymous or authenticated `anp.get_capabilities`;
10. Unified `content_type` semantics: the outer layer always represents the current wire object type;
11. Explicitly declare the target modeling mode for each method: `agent-addressed`, `group-addressed`, `service-scoped` or `endpoint-local`;
12. Force verification of `meta.target.kind = "service"` and `target.did = serviceDid` for `service-scoped` method;
13. Explicit declaration of `endpoint-local` method can omit `target`, and reject ambiguous omission when not declared.

## 16. Example

The following example only demonstrates the Core Binding outer envelope; Overlay methods (such as `group.e2ee.send`, `group.e2ee.notice`) are also subject to the Request / Notification, `meta`, target modeling and error model of this Profile.

### 16.1 `direct.send` request example

```json
{
  "jsonrpc": "2.0",
  "id": "req-10001",
  "method": "direct.send",
  "params": {
    "meta": {
      "profile": "anp.direct.base.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:agent-a",
      "target": {
        "kind": "agent",
        "did": "did:example:agent-b"
      },
      "operation_id": "msg-10001",
      "message_id": "msg-10001",
      "created_at": "2026-03-29T12:00:00Z",
      "content_type": "text/plain"
    },
    "auth": {
      "scheme": "anp-rfc9421-origin-proof-v1",
      "sender_proof": {
        "contentDigest": "sha-256=:BASE64_SHA256_OF_SIGNED_DIRECT_PAYLOAD:",
        "signatureInput": "sig1=(\"@method\" \"@target-uri\" \"content-digest\");created=1774785600;expires=1774785660;nonce=\"n-10001\";keyid=\"did:example:agent-a#key-1\"",
        "signature": "sig1=:BASE64_SIGNATURE:"
      }
    },
    "body": {
      "text": "hello"
    }
  }
}
```

### 16.2 Successful response example

```json
{
  "jsonrpc": "2.0",
  "id": "req-10001",
  "result": {
    "accepted": true,
    "message_id": "msg-10001",
    "operation_id": "msg-10001",
    "target_did": "did:example:agent-b",
    "accepted_at": "2026-03-29T12:00:01Z"
  }
}
```

---

## 17. IANA / Registry Placeholder

Subsequent versions of this standard **SHOULD** establish the following registry:

1. ANP Profile name registry;
2. Security Profile registry;
3. Content-Type registry;
4. ANP error code registry.

---

## 18. Reference implementation description (non-normative)

Implementers should adopt the following principles when implementing this Profile:

- Core Binding only retains fields that must be consistent across implementations;
- Static hints in DID documents only perform discovery and do not perform runtime judgment;
- The business layer only cares about business semantics, and security details are placed in the Overlay;
- Tracking, routing and internal gateway fields should be placed in the private extension or transport layer as much as possible and do not enter the standard interoperability boundary.

---

## Appendix A (normative): Shared Origin Proof bearer convention

This appendix defines the application layer origin proof (Origin Proof) bearer convention shared by P3, P4, P6 and subsequent business profiles.

### A.1 Shared `auth.scheme`

When a business profile uses application layer originator certification based on RFC 9421 style component mapping:

- `auth.scheme` **MUST** equal `anp-rfc9421-origin-proof-v1`
- Specific business Profile **MAY** uses different field names to carry specific proof, for example:
  - P3: `auth.sender_proof`
  - P4: `auth.actor_proof`
  - P6: `auth.actor_proof`
- Different field names **MUST NOT** change the sharing semantics of the scheme

### A.2 Shared proof object structure

The specific proof object **MUST** must contain at least the following fields:

- `contentDigest`
- `signatureInput`
- `signature`

The recommended structure is as follows:

```json
{
  "auth": {
    "scheme": "anp-rfc9421-origin-proof-v1",
    "sender_proof": {
      "contentDigest": "sha-256=:...:",
      "signatureInput": "sig1=("@method" "@target-uri" "content-digest");created=...;expires=...;nonce="...";keyid="did:wba:...#key-1"",
      "signature": "sig1=:...:"
    }
  }
}
```

### A.3 Normalization and summary input

- Specific business Profile **MUST** defines a unique Signed Payload structure;
- `contentDigest` **MUST** Bind a business object that does not contain `auth`;
- Signed Payload **MUST** use RFC 8785 JCS for canonical serialization;
- `auth` itself **MUST NOT** into `contentDigest`;
- Upstream service routing information, local cache fields, and operation and maintenance tracking fields **MUST NOT** enter the Signed Payload.

### A.4 Signature component mapping separation of responsibilities

This appendix only defines the shared proof bearer structure and does not directly define the signature component mapping of each business profile.

Therefore:

- The business mapping of `@method` **MUST** be defined by the corresponding business Profile;
- The logical target URI rule **MUST** of `@target-uri` is defined by the corresponding business Profile;
- `content-digest` **MUST** Bind the Signed Payload defined by the business Profile.

### A.5 DID and verification relationship

- `keyid` **MUST** points to a parsable DID URL;
- The verifier **MUST** parses the DID document to which `keyid` belongs and checks whether the verification method is authorized by the `authentication` relationship;
- For did:wba path type `e1_` DID, the verifier **MUST** additionally performs path fingerprint binding verification;
- The specific did:wba verification rules **MUST** follow the did:wba method specifications and the verification steps of the corresponding business profile.

### A.6 Relationship with level-skipping certification

`anp-rfc9421-origin-proof-v1` proves the identity of the service originator, not the identity of the current network one-hop caller.

Therefore:

- **MAY** changes in hop/service authentication for any hop;
- The intermediate service **MUST NOT** rewrites its service-level identity into a new business Origin Proof;
- The target recipient **MUST** independently verifies the business Origin Proof, while **MUST NOT** presumes its establishment solely based on the identity of the upstream service.
