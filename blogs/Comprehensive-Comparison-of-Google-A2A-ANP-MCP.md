# Comprehensive Comparison of Google's Latest A2A, ANP, and MCP

Google has just released a new agent communication protocol called A2A (Agent to Agent). This article will comprehensively compare A2A, ANP, and MCP from multiple perspectives.

## Problems Being Solved

Both ANP and A2A aim to solve the communication problems between agents, and both recognize MCP's limitations in agent communication: MCP is more adept at connecting models with tools and resources.

At the same time, both ANP and A2A consider themselves complementary to MCP. There is some overlap between ANP and A2A. The reason for "some overlap" is because, from what I can see, A2A seems to be designed to solve enterprise internal agent collaboration, although their official website doesn't explicitly state this. I can sense this from their design, especially in the design of Tasks.

## Design Principles

In terms of design principles, ANP and A2A have many similarities:
- Emphasis on simplicity and reuse of existing protocols.
- Emphasis on identity, with agent identity being the core module of ANP.
- Decoupling (opacity): Agents don't need to share their thinking processes, plans, or tools. This is the biggest difference in design details between ANP, A2A, and MCP.

A2A seems to have also recognized MCP's complexity and chose to use Task as the core concept. Task is indeed a more abstract, higher-level concept than Tools and Resources.

MCP's Tools and Resources are also very suitable concepts for MCP, but I think the design of sampling and root needs to be reconsidered.

## Protocol Architecture

Both ANP and A2A can be considered P2P architectures. MCP is a typical C/S architecture, not just in terms of connection, but also in terms of protocol concepts and role settings.

Undoubtedly, P2P architecture is more suitable for agent networks.

## Transport Layer

All support HTTP. In addition, because MCP needs to access local resources, it also supports stdio for convenience.

## Core Concepts

MCP's core concepts are Tools, Resources, Sampling, Root, and Prompts.

A2A's core concepts are Task, Artifact, Message, and Part.

ANP's core concept is Interface, including NaturalLanguageInterface and StructuredInterface.

ANP delegates the definition of agent interaction methods to the Interface. For example, an Interface can be an API for booking hotels that directly returns results. It can also be similar to A2A's Task, defining the state of the Task in the Interface. However, at the protocol layer, we don't directly and explicitly define Tasks and states.

From the perspective of opacity:
- MCP is a white box, able to view the other party's internal files, tools, resources, and other information.
- A2A is a gray box. Although it doesn't share the agent's thinking process, plans, or tools, it still defines tasks between agents and the state of tasks.
- ANP is a black box. Two agents are completely opaque, only delivering final results while maintaining flexibility.

## Agent Identity

There are very significant differences in this area.

**ANP**

The protocol itself carries identity information and identity verification information, currently mainly using the W3C DID scheme. An agent can use its own identity information to interact with all other agents without having to apply for an account on other agent platforms.

We believe that DID is the most suitable identity scheme for agents, especially in internet scenarios. Of course, it can also be extended to other authentication methods.

**A2A**

A2A adopts authentication methods supported by OpenAPI, including: HTTP authentication (such as Basic, Bearer), API Key (which can be placed in request headers, query parameters, or cookies), Cookie authentication, OAuth 2.0, and OpenID Connect.

The A2A protocol itself does not carry identity information, only identity verification information. Identity verification information is obtained out-of-band, that is, through other means outside the A2A protocol, such as through OAuth.

A2A's design allows it to fully utilize existing enterprise identity systems. However, in the scenario of an agent internet, if you want to achieve connection between any agents, A2A would be more cumbersome to use.

**MCP**

MCP uses OAuth for identity verification, which is also a centralized solution, suitable for the scenario of connecting tools and resources.

## Agent Description

ANP and A2A are quite similar, both using JSON.

A2A's agent description document is named Agent Card, which is essentially a JSON document.

ANP's agent description is based on JSON-LD and schema.org, which are semantic web technologies aimed at improving the consistency of information understanding between two agents.

## Agent Discovery

I haven't seen MCP's discovery specification yet, but it's likely to use a discovery mechanism similar to ANP and A2A.

Both ANP and A2A are based on RFC 8615, which involves adding a metadata document in the .well-known directory of a domain. A2A's file name is agent.json, and ANP's file name is agent-descriptions.

Using this approach, both can be very easily crawled by search engines.

## Agent Information Organization

In terms of how agents or MCP servers organize information externally, both A2A and MCP use JSON-RPC, a kind of remote call technology.

ANP is quite unique here. ANP adopts the semantic web's Linked-Data technology, with the goal of building an AI-native data network that is easy for AI to access and understand.

![](/blogs/images/ai-native-network.png)

From this perspective, ANP's technical route is closer to the Web. We believe that the future agent internet will be a very open network, and only in this way can information flow freely, thereby unleashing the capabilities of AI.

## Open Source License

ANP's license has been changed to Apache 2.0, aligning it with Google-A2A's Apache 2.0 license.

I've studied this carefully, and if you want to push to big companies, participate in standardization, and go international, Apache 2.0 will be the protocol that corporate legal departments will prioritize. It is better suited to a protocol project with potential patent considerations and commercialization paths.

ANP now uses Apache 2.0 for open source licensing.

## Trends

Although A2A claims to be complementary to MCP, while reading the documentation, I vaguely see a possibility: **tools becoming agents, agents becoming tools**.

Can existing tools evolve into agents? Will future agents also be tools?

From this perspective, MCP, A2A, and ANP should have some overlap.

## Impact on Industry Agent Protocols

MCP has already become the de facto standard for models connecting to tools and resources, and A2A is difficult to challenge in the short term. However, it has a significant impact on ANP.

The positive impact is that it makes agent communication and collaboration visible to more people. Previously, when MCP was popular and we talked about ANP, many people didn't understand. Now we no longer need to emphasize the importance of agent communication and collaboration.

The negative impact is that A2A and ANP have a large overlap in functionality. A2A is backed by Google and has a very large influence, while ANP mainly relies on the open-source community and cannot compare in terms of influence. This is unfavorable for the development of ANP.

## Conclusion

The most valuable part of ANP is actually the community's vision for the future agent internet, the community's unique internet philosophy (connection is power), and the technical route of DID + semantic web.

If you also agree with our philosophy and our vision for the future agent internet, welcome to join us, whether as an individual or in the name of a company. **We need your support**.

We are preparing the ANP Open Source Technology Community Founding Committee, which is a temporary committee aimed at getting the community on the right track and growing into a more open community. If you're interested, you can contact me.
