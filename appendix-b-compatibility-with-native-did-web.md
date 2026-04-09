
## Appendix B: Compatibility with native `did:web`

### B.1 Objectives and Scope

This appendix defines the did:wba network compatibility mode for native `did:web`.

The goal of the compatibility mode is to enable the native `did:web` to still access the capabilities defined in this specification without requiring the other party to migrate the DID to `did:wba`, including but not limited to:

- Cross-platform identity authentication (Chapter 3, Chapter 4)
- Handle / WNS integration
- end-to-end encryption Communication (E2EE)
- ANP service discovery (including `AgentDescription` and `ANPMessageService`)

In compatibility mode, `did:web` continues to be created, parsed, and updated according to the `did:web` method specification; this appendix only defines how the did:wba network accepts and verifies native `did:web`.

### B.2 Parsing and verification rules

When an implementation receives a native `did:web`, it MUST perform parsing according to the `did:web` method specification and complete at least the following checks:

1. Parse DID Document according to `did:web` rules;
2. Check whether the `id` of the DID Document is completely consistent with the requested `did:web`;
3. Check according to DID Core rules whether the relevant verification method exists and is in the correct verification relationship.

In compatibility mode, implementations MUST NOT enforce the following did:wba-specific checks on native `did:web`:

- `e1_` / `k1_` path binding public key fingerprint check;
- Path binding profile semantic check in did:wba main specification;
- did:wba's unique path-type DID rotation semantic check;
- Use did:wba-specific proof rules as a prerequisite for successful `did:web` parsing.

If the native `did:web` DID Document itself carries a standard proof (such as Data Integrity proof), the implementation MAY perform verification according to the proof's declaration profile and local policy; however, the success of `did:web` parsing itself is not predicated on the `proof` rules of did:wba.

### B.3 Compatibility with cross-platform authentication

Native `did:web` is compatible with the cross-platform identity authentication process defined in Chapters 3 and 4 of this specification.

When the client uses `did:web` to participate in cross-platform authentication:

1. `keyid` still MUST be a complete DID URL;
2. The server must still parse the DID Document;
3. The server must still verify that the verification method pointed to by `keyid` exists;
4. The server must still (MUST) verify that the verification method is located in the `authentication` relationship of the DID Document;
5. The subsequent HTTP Message Signatures / `Content-Digest` verification logic is the same as did:wba.

In compatibility mode, the identity binding semantics of `did:web` comes from the parsing result of `did:web` itself, rather than the path binding public key fingerprint of did:wba.

### B.4 Compatibility with Handle / WNS

Native `did:web` is compatible with did:wba's Handle / WNS system.

When `did:web` DID Document declares `ANPHandleService` in `service`, the verifier MAY perform bidirectional binding verification according to the v1 rules of the [ANP DID:WBA Namespace Specification](04-anp-did-wba-name-space-specification.md):

1. Parse the Handle through the Handle Resolution Endpoint and obtain the DID;
2. Parse the DID;
3. Find `ANPHandleService` in DID Document;
4. Extract the scheme and domain of `ANPHandleService.serviceEndpoint`;
5. Verify that `serviceEndpoint` uses `https` and its domain is consistent with the domain of the input Handle.

In compatibility mode, the role of `ANPHandleService.serviceEndpoint` is consistent with WNS v1: it is mainly used to declare the Handle Provider domain used by the DID subject, rather than requiring the declaration of a precise Handle Resolution Endpoint.

Therefore, the reverse binding check for native `did:web`:

- Only compare the domain of `ANPHandleService.serviceEndpoint` with the domain of the input Handle;
- The path of `serviceEndpoint` is not required to be exactly the same as a specific Resolution Endpoint;
- There is no requirement that `serviceEndpoint` be exactly equal to `https://{domain}/.well-known/handle/{local-part}`;
- You can use the Resolution Endpoint corresponding to the Handle, or you can use other stable HTTPS URLs under the same domain.

For native `did:web`, two-way binding verification only relies on:

- Handle → DID parsing result;
- Statement of Name Service domain by `ANPHandleService` in DID Document;

There is no need to perform did:wba's `e1_` / `k1_` fingerprint binding check.

### B.5 Compatibility with end-to-end encryption communication (E2EE)

Native `did:web` is compatible with end-to-end encryption communication in did:wba network.

When a `did:web` DID Document contains identifiable `keyAgreement` entries, implementations MAY use these keys for key negotiation and encrypted communications per the upper-level instant messaging or E2EE protocols.

If the upper layer protocol adopts ANP instant messaging related Profile, the discovery and access of public materials can also be completed through `ANPMessageService` declared in the DID Document; `did:web` is handled in the same way as `did:wba` at this point.

For example:

- `X25519KeyAgreementKey2019`
- or other key agreement types explicitly supported by the upper-layer protocol

In compatibility mode, the prerequisites for E2EE capabilities are:

1. DID Document can be parsed successfully;
2. The required `keyAgreement` verification method exists;
3. If the ANP Profile used relies on Unified Messaging entry, there is available `ANPMessageService` in the DID Document;
4. The upper layer protocol supports corresponding algorithms and public key representation methods.

### B.6 Compatibility with ANP service discovery and `ANPMessageService`

The native `did:web` DID Document can also (MAY) declare the service type in the did:wba network, for example:

- `AgentDescription`
- `ANPHandleService`
- `ANPMessageService`

Specifically:

- `AgentDescription` is used to discover agent description documents that follow the [ANP Agent Description Protocol Specification](07-anp-agent-description-protocol-specification.md);
- `ANPHandleService` is used to express that the DID holder accepts the name binding relationship of a certain Handle Provider domain;
- `ANPMessageService` is used to express the Unified Messaging and Interaction Portal for ANP's public discovery in DID documents.

If the `ANPMessageService` entry declares `serviceDid`, this field is used to express "which DID this service uses for signing in cross-domain service-to-service HTTP authentication." For native `did:web` deployment:

- `serviceDid` **SHOULD** gives priority to naked domain name DID, such as `did:web:example.com`;
- The `keyid` in the outer HTTP `Signature-Input` belongs to a DID **MUST** consistent with the `serviceDid`;
- The verifier **MUST** parses the `serviceDid`, checks that the verification method pointed to by `keyid` is authorized by the `authentication` relationship, and verifies the request signature using its public key.

If the native `did:web` subject participates in the ANP instant messaging protocol, then:

1. The Agent DID document SHOULD contain at least one `ANPMessageService`;
2. The Group DID document MUST contain at least one `ANPMessageService`;
3. The same `ANPMessageService` can (MAY) simultaneously carry capabilities such as direct messaging, group messages, capability negotiation, security overlay public material access, and object control;
4. Home Role, Key Role, Group Role, Join Role, Capability Role, and Object Role are the logical roles behind `ANPMessageService`, rather than additional independent standards `service.type` in the DID Document;
5. If the service will participate in cross-domain service-to-service calls, its `ANPMessageService` entry SHOULD declare `serviceDid`;
6. If multiple `ANPMessageService` exist, the caller SHOULD choose based on `profiles`, `securityProfiles`, `priority` or local policy.

As long as these service entries are correctly declared in the DID Document, implementations can use these services per the application layer or message layer protocols of did:wba/ANP without requiring that the DID method be `did:wba`.

### B.7 Implementation Recommendations

Implementers SHOULD distinguish between two parsing modes:

1. **did:wba mode**
   - Enforce full path binding, public key fingerprinting, and proof rules as per the master specification (and Appendix A, if enabled).

2. **did:web compatibility mode**
   - Parsed according to `did:web` specification;
   - Do not implement did:wba's unique path binding, public key fingerprint and proof enforcement rules;
   - If `ANPHandleService` exists, perform domain-based name binding verification according to WNS v1 rules;
   - If `ANPMessageService` exists, perform service discovery and capability selection according to the unified message entry semantics of ANP Profile 2;
   - If `ANPMessageService` declares `serviceDid`, use this DID to complete cross-domain service-to-service identity authentication according to the rules of P8;
   - You can still access did:wba's cross-platform identity authentication, Handle, ANP service discovery, E2EE and other upper-layer capabilities.

Application implementations SHOULD NOT deny participation in cross-domain authentication, Handle integration, `ANPMessageService` service discovery, or end-to-end encryption communication simply because it is native `did:web` and does not contain did:wba-specific `e1_` / `k1_` path bindings or proofs.

Application implementations SHOULD NOT require native `did:web` to expose independent DID service types for logical roles such as Home / Key / Group / Join / Capability / Object; if it exposes these capabilities through a single `ANPMessageService`, it should be regarded as compliant with the current service discovery model of ANP.

At the same time, if new deployments want stronger "path binding public key verifiability" and a unified standard proof experience, they should still (SHOULD) give priority to the `e1_` profile of the did:wba main specification.
