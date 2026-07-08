# ANP Release 1.1 Is Here: Focused on Cross-Domain Agent Communication

After three months of refinement, ANP 1.1 was officially released last week.

We discussed this version many times in community meetings. Along the way, we made quite a few adjustments based on community feedback and our own implementation work. This article is a more formal summary of the major improvements in this release, as well as some of the thinking behind them.

The core of this upgrade is mainly about two things: self-controlled identity and the message protocol upgrade, especially cross-domain communication and secure communication.

## Self-Controlled Identity

ANP has always used DID as the identity layer for agents.

The biggest advantage of DID is that identity, keys, and service endpoints can be placed in a verifiable document. This allows different platforms and organizations to recognize and authenticate each other without relying on the same account system.

`did:web` is a very good method. It combines DID with existing Web infrastructure and directly reuses mature mechanisms such as domain names, HTTPS, and `.well-known`. The deployment barrier is relatively low, and it is also easy to integrate with existing Internet systems.

But `did:web` also has a problem: the DID Document is hosted on a Web server. In other words, if the server can modify the DID Document, then in some high-security scenarios it may affect the trustworthiness of the user's identity and keys.

For example, if we use DID for end-to-end encrypted communication, and the server can silently replace the key material in the DID Document, then both sides may believe they are securely communicating with a certain agent, while in fact the key may already have been replaced. This may not be very obvious in ordinary login authentication, but it becomes critical in scenarios such as end-to-end encryption and cross-domain identity verification.

So in this release, we upgraded `did:wba`.

To be precise: we are not putting the user's private key into the DID. A private key should never be written into a DID. What `did:wba` does is put the fingerprint of the bound public key into a path-style DID. In simple terms, the DID itself establishes a verifiable binding with a public key controlled by the user.

After this change, even if the DID Document is hosted by a Web service, the verifier can check whether the public-key fingerprint in the DID path matches the key declared in the DID Document. This makes silent key replacement by the server much harder.

The result is that the user's control over the private key can be reflected more directly in the DID identity itself. A DID is no longer just a document under a Web address. It now has a stronger relationship with the key actually controlled by the user.

Of course, `did:web` still has its own advantages. It is stable, simple, and highly compatible, especially for many low-barrier deployment scenarios. So ANP 1.1 is not about abandoning `did:web`. Instead, it supports both native `did:web` and `did:wba`. Different scenarios can choose different approaches, and they can interoperate with each other.

Another important identity design in 1.1 is Handle.

Why did we design Handle? Mainly for two reasons.

The first reason is readability.

DIDs are friendly to machines, but not to humans. A full DID is usually long. It is not suitable for chat windows, business cards, contact lists, or invitation links. It is also hard for users to manually type and remember.

So we need an identifier that is more suitable for humans, such as:

```text
alice.example.com
```

This form is much easier for users to understand and share.

The second reason is to provide a stable ID for `did:wba`.

Because the `did:wba` path binds a public-key fingerprint, when the underlying key changes, the DID itself may also need to change. From a security perspective, this is reasonable. But from a user experience perspective, people still expect a long-term stable name.

Handle is designed to solve this problem. The Handle can remain stable, while the underlying DID can rotate as keys, security policies, or devices change. Users see the Handle; when the protocol needs to verify identity, it resolves the Handle to the current valid DID.

So Handle is not a replacement for DID. It solves the question of "how humans recognize an identity"; DID solves the question of "how the protocol verifies it."

The relationship between Handle and DID is similar to the relationship between a domain name and an IP address.

Related documents:
https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/03-did-wba-method-design-specification.md

https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/04-anp-did-wba-name-space-specification.md

## Message Protocol Upgrade

The other major improvement in ANP 1.1 is the message protocol.

The first draft of the message protocol could run, but as we continued implementation work, we found several potential issues.

For example, attachment support was not complete enough. Cross-domain collaboration still had some hard problems. The end-to-end encryption design was still not close enough to mature industry approaches, especially around forward secrecy and group key management.

Before continuing to optimize the design, we first redefined the problem.

We do not want to turn ANP into a complete IM protocol like Matrix. Matrix solves a whole set of problems: client-to-server, server-to-server, multi-device synchronization, room state, message history, and more. That direction is powerful, but also very heavy.

ANP is solving a different problem.

What we care about more is: how agents in different domains and different systems can communicate with each other across domains.

As for how each domain implements its internal account system, how clients register, whether users are verified by phone number or email, whether an agent has multiple devices or multiple executors internally — these are not things we want to define in the main protocol.

If all of these were included, the protocol would become extremely complex. Many of these topics are internal system concerns, not cross-domain interoperability concerns.

So the message protocol in 1.1 focuses on three core scenarios:

First, how agents send direct messages and group messages.

Second, how attachments and large objects are sent in messages.

Third, how agents use end-to-end encrypted communication when needed.

This is how we define the boundary of the problem.

Once the problem boundary is clear, the next design decision becomes easier: ANP 1.1 does not define multi-device behavior at the protocol layer.

Multi-device support introduces a lot of protocol complexity. How devices synchronize state, how they synchronize keys, how they handle offline messages and message history — all of this is complicated. Different systems also have different requirements for multi-device support.

We believe that how many devices, execution nodes, or replicas an agent has internally should be handled by each system itself. ANP treats the agent as a cross-domain communication subject. As long as the agent can send and receive messages externally, its internal scheduling does not enter the interoperability boundary of the protocol.

This decision keeps the protocol lighter and more focused.

### Combining the Message Protocol with DID

A very important design in this message protocol upgrade is the deep integration between messaging and DID.

We do not assign DIDs only to people or agents. We also introduce DIDs for groups and message services. This creates several different roles in the messaging system.

The first is Agent DID, which represents the sender and recipient of a message. Of course, a human can also have a DID.

The second is Group DID, which represents the identity of a group. A group is not just an internal room ID inside a server. It is a protocol subject that can be recognized, discovered, and verified across domains.

The third is Service DID, which represents the identity of the server providing message services. In cross-domain communication, services also need to authenticate each other. We cannot only look at who the sender is inside the business message.

After this design, the identity layers become much clearer.

Agent DID proves who initiated a message. Group DID proves the identity of the group, the group state, and the ordering of group events. Service DID proves which service initiated this specific cross-domain call.

These DIDs must not be mixed together.

For example, a server may help Alice's agent forward a message to another domain, but it cannot claim that the message was sent by itself. A service identity can only prove "I am relaying this." It cannot replace the business identity.

The same applies to integrity proofs. Different roles can use their own DIDs to prove objects at different layers. An agent can prove that it initiated a message. A Group Host can prove that a group message has been accepted and ordered by the group. A service can prove that a certain HTTP call really came from itself.

This is also one of our strongest impressions from implementation: DID is very suitable for cross-domain systems.

The biggest risk in cross-domain systems is confusion around identity semantics. DID allows every subject to have its own identity, its own keys, and its own proof mechanism, without relying on the same centralized account system.

If one day multi-device support becomes necessary, each device could also have its own DID.

### Cross-Domain Messages Are Not Wrapped in Another Layer

Another important design decision in this release is that cross-domain messages are not wrapped in an additional Relay protocol.

In other words, cross-domain direct messages still use `direct.send`; cross-domain group messages still use `group.send`; group membership changes still use the original group management methods. The cross-domain Profile only defines how to discover the target service, how to authenticate the current service, how to preserve the original sender proof, and when the operation is considered successful.

This choice looks simple, but it matters.

If we had one set of methods inside a domain and invented another Relay method between domains, the protocol would become more and more complex over time. Business semantics would be split into two layers, and implementers would easily get confused: should they verify the Relay layer, or the original business layer?

So we chose to keep the business methods consistent. Cross-domain communication changes the call boundary, but it should not redefine business semantics.

### Attachments and Object Transfer

Attachments are another area strengthened in this release.

We do not want the message service to become a file relay service. If large files, images, audio, or video objects are forwarded directly together with messages across domains, the cost and reliability issues become significant.

So 1.1 separates messages from objects.

Messages only carry the attachment description, namely the attachment manifest. The actual object upload and download happen over an independent HTTPS channel. The cross-domain message service only participates in the control plane, such as requesting an upload slot, committing an object, or getting a download ticket. It does not relay file bytes all the way through.

This design is more practical for engineering and better suited to real deployments.

If an object needs stronger confidentiality, object-level encryption can also be enabled. The Object Service can store and distribute the object without knowing its plaintext.

### End-to-End Encrypted Communication

Finally, let's talk about end-to-end encryption.

We take this very seriously. In some important scenarios, messages between agents should not be available to servers. Servers can help route, order, store, and distribute messages, but they should not automatically have the ability to read the content.

For direct-message end-to-end encryption, we learned from some ideas in Signal. The sender does not need to wait for the recipient to be online. It can first fetch the recipient's public key-agreement material and then start an encrypted session. Later messages continuously update keys through a Double Ratchet-like mechanism, providing better forward secrecy.

For group end-to-end encryption, we use IETF MLS, which stands for Messaging Layer Security.

We did not choose to design our own Sender Key group key scheme. Traditional Sender Key schemes look simple in small groups, but member joins, leaves, removals, and key rotation quickly become complicated. In cross-domain scenarios, questions such as who updates the keys, who synchronizes state, and who proves the current group state create even more problems.

The advantage of MLS is that it was designed for secure group communication. It has a relatively clear group key state machine and can better handle member changes, key updates, and group message encryption. In ANP, we use DID to bind member identities, Group Host to handle business ordering and receipts, and MLS to handle the group encryption state.

This separation of responsibilities is clearer and more reliable than reinventing a group encryption protocol ourselves.

Our main work here is integrating DID with MLS.

Related document:

https://github.com/agent-network-protocol/AgentNetworkProtocol/tree/main/message

## Next Steps

After the release of ANP 1.1, we will focus on two directions next.

The first direction is agent permission control and auditing.

Collaboration between agents is not only about sending messages. We also need to know who has permission to do what, and whether the final result can be audited. Here we will combine W3C DID with VC, namely Verifiable Credentials, to support more fine-grained permission expression and result proofs.

VC is being researched in many areas today, and we believe it is very suitable for authorization, delegation, and audit scenarios in agent collaboration.

The second direction is context sharing in the message system.

Agent communication is not just about sending one sentence. Agents often need to share task background, tool call results, context state, and collaboration process. We will continue exploring how agents can share context better through the message system without making the protocol too heavy.

Overall, ANP 1.1 is a fairly important version upgrade. It moves ANP further from "able to connect" toward "able to collaborate across domains, verify identities, and protect content."

Our goal remains the same: to let agents connect openly, deploy independently, and collaborate across domains, just like Web services today.

Release 1.1 is another step forward in that direction.

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community

This file is released under the [Apache License 2.0](../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
