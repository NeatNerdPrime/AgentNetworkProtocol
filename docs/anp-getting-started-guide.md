# ANP Getting Started Guide

## Overview

### What is ANP

ANP (Agent Network Protocol) is an open protocol suite for the Agentic Web. It is designed to let agents on the open internet identify each other, publish capabilities, discover services, negotiate usable interfaces, exchange secure messages, and build application-level collaborations.

The current specification set is organized around the ANP 1.1 release line. It covers:

- `did:wba` identity and cross-domain authentication
- WNS (WBA Name Space) human-readable handles
- Agent Description documents
- Agent Discovery documents and search registration
- End-to-end instant messaging profiles
- Application protocols such as AP2 agent payments

The meta-protocol specification is still a draft. It is useful for semantic negotiation, but it is not required for the currently released architecture.

> Version note: `Version: 1.1` is the document release version. It does not change ANP payload fields such as `"protocolVersion": "1.0.0"` in examples.

### Why ANP is Needed

Today, most AI agents still interact with network services in one of three limited ways: simulating a human browser, using platform-specific APIs, or staying inside a single application ecosystem. ANP provides a protocol-first alternative:

- **Interconnection**: agents from different domains can authenticate, discover, and communicate with each other.
- **Native interfaces**: agents can use machine-readable descriptions, interface documents, and JSON-RPC / OpenRPC style calls instead of only reading human webpages.
- **Stable identity and naming**: DIDs provide verifiable cryptographic identity, while WNS handles provide user-friendly names.
- **Secure messaging**: direct messages, group messages, attachments, federation, and end-to-end encryption are specified as layered profiles.
- **Open implementation path**: ANP reuses HTTP, DNS, TLS, JSON, JSON-LD, DID, and existing Web deployment patterns.

### Example: Cross-Platform Hotel Booking

Suppose a personal assistant needs to book a hotel room. Without ANP, it may have to scrape a website, log in through a platform account, or integrate with a vendor-specific API.

With ANP:

1. The personal assistant has its own DID and may also have a human-readable WNS handle.
2. It discovers hotel agents through search, `.well-known/agent-descriptions`, or a handle.
3. It reads the hotel agent's Agent Description document to understand products, services, and interfaces.
4. It authenticates requests with `did:wba` instead of creating a platform-specific account.
5. It can use a structured interface for booking and a natural-language interface for special requests.
6. If payment or human authorization is required, that requirement is visible in the interface description and handled by the relevant application protocol.

### Relationship with MCP and A2A

ANP is complementary to other agent protocols:

- **MCP (Model Context Protocol)** connects a model or agent host to tools and resources.
- **A2A-style protocols** often focus on task collaboration in controlled environments.
- **ANP** focuses on identity, naming, discovery, secure communication, and application collaboration across the open internet.

A simple rule of thumb: use MCP to connect tools, use enterprise collaboration protocols for controlled workflows, and use ANP when agents need to find and communicate with each other across domains.

## Current ANP Architecture

The latest README architecture organizes the released ANP capabilities into existing Internet infrastructure, two core protocol layers, and domain-specific application protocols.

![ANP protocol architecture](../images/anp-architecture2.png)

### Open Internet Infrastructure

ANP does not rebuild the internet stack. It reuses:

- HTTP / HTTPS for transport
- DNS and domain names for reachability
- CA / TLS for Web security roots
- CDN and hosting infrastructure for static documents
- Search engines and crawlers for public discovery

### Identity and Encrypted Communication Layer

This layer answers: **who is the agent, how can the peer verify it, and how can messages be protected?**

It includes:

- W3C DID-based identity
- the `did:wba` DID method
- HTTP Message Signatures style authentication
- DID Document service discovery
- key separation for signing and key agreement
- end-to-end encryption foundations for direct and group messaging

### Application Protocol Layer

This layer answers: **what can the agent do, how can it be found, and which application protocol should be used?**

It includes:

- Agent Description Protocol
- Agent Discovery Protocol
- instant messaging profiles
- application protocols such as payment, authorization, authentication, and transactions

### Meta-Protocol Status

ANP-06 is a draft. The updated direction is Agent Description-driven semantic negotiation:

```text
Agent Description -> MetaProtocolInterface -> anp.get_capabilities -> anp.negotiate
```

In the released path, agents can already interoperate through DID service discovery, Agent Description documents, declared interfaces, and messaging profiles. Treat `MetaProtocolInterface` and `anp.negotiate` as optional draft features unless your implementation explicitly supports them.

## How Agents Connect

A typical ANP connection path is:

```text
WNS Handle or Search Result
  -> DID
  -> DID Document
  -> AgentDescription / ANPMessageService
  -> Runtime capabilities
  -> Business interface or messaging profile
```

The important separation is:

- **WNS Handle** is a human-readable name.
- **DID** is the cryptographic identity anchor.
- **DID Document** is the authoritative source for verification methods and service endpoints.
- **Agent Description** explains the agent's public information and available interfaces.
- **ANPMessageService** is the unified messaging and interaction endpoint used by the instant messaging profile suite.
- **Runtime capability negotiation** confirms what the endpoint currently supports.

## Identity: `did:wba`

### What `did:wba` Provides

`did:wba` is ANP's Web-based DID method. It gives agents decentralized identity while still using ordinary Web infrastructure.

A root domain DID:

```text
did:wba:example.com
```

resolves to:

```text
https://example.com/.well-known/did.json
```

A path DID using the default `e1_` profile:

```text
did:wba:example.com:user:alice:e1_<fingerprint>
```

resolves to:

```text
https://example.com/user/alice/e1_<fingerprint>/did.json
```

If the domain contains a port, the colon is percent-encoded in the DID:

```text
did:wba:example.com%3A3000:user:alice:e1_<fingerprint>
```

### Root DID vs Path DID

- A **root domain DID** such as `did:wba:example.com` usually represents a domain-level subject or service identity.
- A **path DID** such as `did:wba:example.com:user:alice:e1_<fingerprint>` represents a specific subject under the domain.
- New path DIDs should use the default `e1_` Ed25519 binding fingerprint profile.
- When the binding key changes, a path DID may rotate. Use WNS handles when you need a stable human-readable reference.

### Minimal DID Document Shape

A DID Document publishes keys and services. For ANP, the common service types are:

- `AgentDescription`: points to the agent's `ad.json` document.
- `ANPHandleService`: supports WNS bidirectional binding verification.
- `ANPMessageService`: exposes the unified ANP messaging / interaction endpoint.

Example:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/data-integrity/v2",
    "https://w3id.org/security/multikey/v1"
  ],
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "verificationMethod": [
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#key-1",
      "type": "Multikey",
      "controller": "did:wba:example.com:user:alice:e1_<fingerprint>",
      "publicKeyMultibase": "z6Mk..."
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#key-x25519-1",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:wba:example.com:user:alice:e1_<fingerprint>",
      "publicKeyMultibase": "z9h..."
    }
  ],
  "authentication": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
  ],
  "assertionMethod": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
  ],
  "keyAgreement": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-x25519-1"
  ],
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
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#anp",
      "type": "ANPMessageService",
      "serviceEndpoint": "https://example.com/anp",
      "serviceDid": "did:wba:example.com"
    }
  ],
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-jcs-2022",
    "created": "2025-01-01T00:00:00Z",
    "verificationMethod": "did:wba:example.com:user:alice:e1_<fingerprint>#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z..."
  }
}
```

### Authentication Flow

At a high level:

1. Agent A signs an HTTP request with the private key corresponding to its DID Document.
2. Agent B resolves Agent A's DID Document.
3. Agent B checks that the key is authorized for authentication.
4. Agent B verifies the request signature.
5. After authentication, the parties can use the selected ANP interface or messaging profile.

## Name Service: WNS Handles

### Why WNS Exists

DIDs are reliable machine identifiers, but they are not convenient for humans to type, remember, or share. WNS (WBA Name Space) adds a stable human-readable naming layer on top of `did:wba`.

Example handle:

```text
alice.example.com
```

Optional sharing form:

```text
wba://alice.example.com
```

A handle resolves to a DID, and the DID then resolves to a DID Document:

```text
Handle -> Handle Resolution Endpoint -> DID -> DID Document -> service
```

### Handle Resolution Endpoint

For `alice.example.com`, the standard endpoint is:

```text
https://example.com/.well-known/handle/alice
```

Example response:

```json
{
  "handle": "alice.example.com",
  "did": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "status": "active",
  "updated": "2025-01-01T00:00:00Z",
  "versionId": "42",
  "ttl": 300,
  "profile": {
    "type": "DIDSubjectProfile",
    "subject_did": "did:wba:example.com:user:alice:e1_<fingerprint>",
    "subject_type": "agent",
    "handle": "alice.example.com",
    "display_name": "Alice Agent",
    "description": "A travel planning agent",
    "avatar_uri": "https://example.com/avatars/alice.png",
    "discoverability": "listed"
  }
}
```

Important rules:

- The top-level `did` is the authoritative identity result.
- `profile` is public display metadata only.
- `profile` must not be used for authentication, authorization, routing, E2EE binding, or service endpoint selection.
- For security-sensitive operations, clients must verify the Handle-to-DID binding through the DID Document's `ANPHandleService`.
- `exact-handle` verification is required when a specific handle must be trusted; `provider-confirmed` alone is not enough for high-assurance handle binding.

## Agent Description

### What an Agent Description Does

The Agent Description document is the public entry page of an agent. Other agents read it to understand:

- the agent's name, DID, owner, and description
- public information resources such as products, services, documents, or media
- supported natural-language and structured interfaces
- security requirements
- optional proof for document integrity

ANP's information interaction pattern is crawler-like: agents publish URLs for data, descriptions, and interface documents; other agents fetch those resources, reason locally, and call the appropriate interface only when needed.

### Information and Interfaces

Agent Description uses two core ideas:

- **Information**: externally available resources, such as product descriptions, service descriptions, documents, videos, or other data.
- **Interface**: ways to interact with the agent.
  - `NaturalLanguageInterface`: flexible conversation interface.
  - `StructuredInterface`: structured API interface such as YAML-described APIs, OpenRPC, JSON-RPC, MCP-compatible interfaces, or WebRTC.
  - `MetaProtocolInterface`: optional draft extension for semantic negotiation.

If a structured interface can satisfy the task, agents should prefer it for precision and efficiency. Natural-language interfaces remain useful for open-ended requests.

### Agent Description Example

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "AgentDescription",
  "url": "https://grand-hotel.com/agents/hotel-assistant/ad.json",
  "name": "Grand Hotel Assistant",
  "did": "did:wba:grand-hotel.com:service:hotel-assistant:e1_<fingerprint>",
  "owner": {
    "type": "Organization",
    "name": "Grand Hotel Management Group",
    "url": "https://grand-hotel.com"
  },
  "description": "An intelligent hospitality agent for room booking, concierge services, guest assistance, and messaging.",
  "created": "2024-12-31T12:00:00Z",
  "securityDefinitions": {
    "didwba_sc": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "security": "didwba_sc",
  "Infomations": [
    {
      "type": "Product",
      "description": "Luxury hotel rooms with premium amenities and personalized services.",
      "url": "https://grand-hotel.com/products/luxury-rooms.json"
    },
    {
      "type": "Information",
      "description": "Hotel facilities, amenities, location, and policies.",
      "url": "https://grand-hotel.com/info/hotel-basic-info.json"
    }
  ],
  "interfaces": [
    {
      "type": "NaturalLanguageInterface",
      "protocol": "YAML",
      "version": "1.2.2",
      "url": "https://grand-hotel.com/api/nl-interface.yaml",
      "description": "Natural language interface for conversational hotel services."
    },
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "url": "https://grand-hotel.com/api/booking-openrpc.json",
      "humanAuthorization": true,
      "description": "Structured interface for booking and reservation management."
    },
    {
      "type": "MetaProtocolInterface",
      "profile": "anp.meta.negotiation.v1",
      "binding": "jsonrpc-2.0",
      "url": "https://grand-hotel.com/anp",
      "methods": ["anp.get_capabilities", "anp.negotiate"],
      "description": "Optional draft negotiation interface."
    }
  ]
}
```

> Note: the current Agent Description specification uses the field name `Infomations` in examples. Implementations should follow the active specification while being careful with compatibility if future versions correct the spelling.

## Agent Discovery

Agent Discovery defines how agents and search services find public Agent Description documents.

### Active Discovery

A domain can publish all public Agent Description URLs under:

```text
https://{domain}/.well-known/agent-descriptions
```

Example:

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "did": "https://w3id.org/did#",
    "ad": "https://agent-network-protocol.com/ad#"
  },
  "@type": "CollectionPage",
  "url": "https://example.com/.well-known/agent-descriptions",
  "items": [
    {
      "@type": "ad:AgentDescription",
      "name": "Hotel Assistant",
      "@id": "https://example.com/agents/hotel-assistant/ad.json"
    },
    {
      "@type": "ad:AgentDescription",
      "name": "Customer Support Agent",
      "@id": "https://example.com/agents/support/ad.json"
    }
  ],
  "next": "https://example.com/.well-known/agent-descriptions?page=2"
}
```

Clients and search crawlers should follow `next` until all pages are retrieved.

### Passive Discovery

In passive discovery, an agent submits its Agent Description URL to a search service agent. The search service's registration API is described in that search service agent's own Agent Description document.

A typical passive discovery flow:

1. Read the search service agent's Agent Description.
2. Find its registration interface.
3. Submit your Agent Description URL.
4. The search service verifies, crawls, and indexes the description.

### Handle-Based Entry

WNS handle resolution can also be used as a discovery entry:

```text
alice.example.com -> DID -> DID Document -> AgentDescription service
```

However, clients must not infer service endpoints directly from the handle. The DID Document remains authoritative.

## Instant Messaging Protocol

ANP end-to-end instant messaging is a profile suite for cross-domain agent messaging. It is not a single centralized chat product protocol. It defines how agents discover messaging services, send direct and group messages, protect content, transfer attachments, and federate across domains.

### Core Ideas

- **Federated, not centralized**: different domains host their own agents and services.
- **Identity first**: `agent_did` and `group_did` are the primary identifiers.
- **Service discovery first**: messaging endpoints are discovered through DID Document `ANPMessageService` entries.
- **JSON-RPC 2.0 outer binding**: requests use `jsonrpc`, `method`, `id`, and object-shaped `params`.
- **Common params shape**: most methods use `params.meta`, optional `params.auth`, and `params.body`.
- **Base semantics and E2EE overlays are separate**: plaintext transport-protected mode and E2EE modes can coexist.
- **Control plane and data plane are separated**: attachments use manifests and separate HTTPS object transfer.

### Unified `ANPMessageService`

The current messaging profiles expect a DID Document to expose a single public `ANPMessageService` for cross-domain interaction. Internally, an implementation may have separate components for direct messages, groups, keys, objects, and federation, but externally these capabilities converge behind the unified service endpoint.

A service entry may include static hints:

```json
{
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>#message",
  "type": "ANPMessageService",
  "serviceEndpoint": "https://example.com/anp",
  "serviceDid": "did:wba:example.com",
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
```

Before important interactions, callers should confirm runtime capabilities with:

```text
anp.get_capabilities
```

Runtime results are authoritative when static DID hints and runtime capability results differ.

### Messaging Profile Index

The instant messaging suite is split into nine profiles:

| Profile | Purpose |
| --- | --- |
| [P1 Core Binding](../message/01-core-binding.md) | JSON-RPC 2.0 binding, `params` structure, capability negotiation, idempotency, and errors |
| [P2 Identity and Discovery](../message/02-identity-and-discovery.md) | Agent DID / Group DID, DID Document interpretation, and `ANPMessageService` discovery |
| [P3 Direct Messaging Base Semantics](../message/03-direct-messaging-base-semantics.md) | `direct.send`, content model, receipts, ordering, and sender proof boundaries |
| [P4 Group Messaging Base Semantics](../message/04-group-messaging-base-semantics.md) | group lifecycle, membership, group messages, group state versions, and host ordering |
| [P5 Direct End-to-End Encryption](../message/05-direct-end-to-end-encryption.md) | direct E2EE using DID-bound key material and ratcheting concepts |
| [P6 Group End-to-End Encryption](../message/06-group-end-to-end-encryption.md) | MLS-based group E2EE and group cryptographic state |
| [P7 Attachments and Object Transfer](../message/07-attachments-and-object-transfer.md) | attachment manifests, object service, upload / download tickets, and object-level encryption |
| [P8 Federation and Cross-Domain](../message/08-federation-and-cross-domain.md) | cross-domain service invocation, routing, relaying, and result witnessing |
| [P9 Message Mentions Extension](../message/09-message-mentions.md) | structured group-message mentions and selector semantics |

Recommended reading order: P1/P2 first, P3/P4 next, then P5/P6, and finally P7/P8/P9 as needed.

## Protocol SDK: AgentConnect

The ANP open-source SDK and reference implementation is maintained in AgentConnect:

- [https://github.com/agent-network-protocol/AgentConnect](https://github.com/agent-network-protocol/AgentConnect)

AgentConnect provides SDK support for identity, authentication, proofs, WNS, Agent Description, OpenRPC / JSON-RPC, crawling, AP2, E2EE, and examples.

Registry status below follows the AgentConnect README checked on 2026-06-27:

| Language | Package / module | How to start | Status |
| --- | --- | --- | --- |
| Python | `anp` | `pip install anp` or `pip install "anp[api]"` | stable published SDK |
| Go | `github.com/agent-network-protocol/anp/golang` | `go get github.com/agent-network-protocol/anp/golang@latest` | stable published SDK |
| Rust | `anp` | `cargo add anp` | stable published SDK |
| Dart | `anp` | `dart pub add anp` | published SDK |
| TypeScript | `@anp/typescript-sdk` workspace | build from `typescript/ts_sdk` source | preview / local source |
| Java | `com.agentconnect:anp4j` and Spring Boot starter | build from `java` source | local SDK |

### Minimal Python Agent with OpenANP

```bash
pip install "anp[api]"
```

```python
from fastapi import FastAPI
from anp.openanp import AgentConfig, anp_agent, interface

@anp_agent(AgentConfig(
    name="Calculator",
    did="did:wba:example.com:calculator:e1_<fingerprint>",
    prefix="/agent",
    description="A simple calculator agent",
))
class CalculatorAgent:
    @interface
    async def add(self, a: int, b: int) -> int:
        return a + b

app = FastAPI(title="Calculator Agent")
app.include_router(CalculatorAgent.router())
```

Typical generated endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /agent/ad.json` | Agent Description document |
| `GET /agent/interface.json` | OpenRPC interface document |
| `POST /agent/rpc` | JSON-RPC 2.0 method calls |

## Recommended Reading Path

1. Read the [README](../README.md) for the current specification index and architecture.
2. Read [ANP-03: did:wba](../03-did-wba-method-design-specification.md) and [ANP-04: WNS](../04-anp-did-wba-name-space-specification.md) for identity and naming.
3. Read [ANP-07: Agent Description](../07-anp-agent-description-protocol-specification.md) and [ANP-08: Agent Discovery](../08-ANP-Agent-Discovery-Protocol-Specification.md) to publish and find agents.
4. Read [ANP-09](../09-ANP-end-to-end-instant-messaging-protocol-specification.md) and the messaging profiles when building messaging.
5. Use [AgentConnect](https://github.com/agent-network-protocol/AgentConnect) to build or test a working implementation.

### ANP Process Detailed Explanation

The overall ANP process is as follows:

![](/images/anp-flow.png)

The ANP process mainly includes the following steps:

1. **Agent Discovery**: Search engines crawl Agent B's information through the agent discovery mechanism (`.well-known/agent-descriptions`), including its description document URL, name, and other basic information.

2. **Agent Search**: Agent A finds Agent B's description document URL through a search engine. This step allows agents to find suitable service providers through semantic search without knowing the specific domain of the other party.

3. **Authentication Request**: Agent A signs the request using its private key and carries its own DID identifier, requesting a description document or service from Agent B. The signature ensures the authenticity and integrity of the request.

4. **Authentication**: After receiving the request, Agent B obtains Agent A's DID document based on the DID identifier in the request, extracts the public key from it, and verifies the validity of the request signature, confirming Agent A's identity.

5. **Service Interaction**: After authentication is successful, Agent B returns the requested data or service response. Agent A completes tasks based on the returned data, such as booking a hotel, querying information, etc. The entire process is based on standardized interfaces and data formats, ensuring cross-platform interoperability.

This method of authentication based on DIDs and standardized description documents enables agents to securely and efficiently discover and interact with each other on the internet without relying on centralized platforms.
