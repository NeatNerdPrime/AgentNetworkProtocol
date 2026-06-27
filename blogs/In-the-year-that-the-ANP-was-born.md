# The Year ANP Was Born: Gratitude to the Communities of web3, Agora Protocol, WebAgents, and did:web

It has been nearly a year since the inception and development of the ANP open-source project. During this period, I have dedicated most of my energy to this initiative, even resigning from Alibaba last year to commit myself full-time.

Entrepreneurship is challenging, and maintaining an open-source project without funding in such a difficult financing environment is even tougher. Allow me a moment of pride: **I foresaw the future a year ago and managed to persevere.**

My persistence isn't due to resilience alone, but rather because the journey itself has been incredibly enjoyable. The intrinsic interest of the work, combined with the vibrant atmosphere of the open-source community and interactions with developers worldwide, has significantly improved my physical and mental well-being compared to my time at Alibaba. (Only my wallet remains unsatisfied.)

**Doing what genuinely interests you nourishes both your body and mind.**

Today, I'd like to share the complete story behind ANP's creation and express my gratitude to the communities that have supported us along the way.

Recently, it has become increasingly clear that our vision for the future of the internet is gaining broader recognition. We have received growing positive feedback, and more open-source enthusiasts and collaborators have joined our community.

While ANP is not yet perfect, and I still have many ideas and plans awaiting implementation, it has already become an influential force among agent communication protocols. We **represent a distinct technological path (Agentic Web + Decentralization + Semantic Web)**, and our exploration along this path remains at the forefront of the industry.

## Origin

ANP originated from a simple question (stemming from my previous work closely related to audio and video): **How can people use personal assistants to participate in video conferences?** For a period, this question lingered persistently in my mind.

Upon deeper investigation, I discovered significant technological gaps in agent connectivity and collaboration. Existing technologies could not adequately meet the needs of intelligent agents, which require a more native form of connectivity—allowing all agents to interconnect seamlessly and directly exchange underlying data.

This line of thinking and design eventually led to the creation of the ANP protocol.

Throughout the design process, ANP underwent a major restructuring and incorporated excellent ideas from other communities.

## web3

The first community that significantly influenced ANP was web3.

In 2022, driven by my strong belief in personal data sovereignty, I began researching web3 in my spare time and engaged in extensive discussions with many web3 practitioners.

Within the web3 community, I learned blockchain technologies, understood the philosophies and techniques behind decentralization, and later encountered the concept of Decentralized Identifiers (DID) and the W3C DID standard. I also explored fascinating protocols such as Nostr, AT Protocol, and Lens Protocol.

Decentralization is also a core principle of ANP. However, rather than pursuing complete decentralization like blockchain, we advocate a model of global decentralization combined with local centralization, specifically tailored for agent identity interoperability.

W3C DID serves as the foundational technology for agent identity in ANP, and we believe it is currently the most suitable technology for this purpose.

Finally, a note on the web3 community:

Although web3 is closely associated with financial aspects and somewhat distant from mainstream users, it possesses a unique set of values, worldviews, and technological frameworks distinct from traditional web2. These aspects are incredibly intriguing.

Moreover, the web3 community fosters an open atmosphere, and I particularly appreciate its builder culture, DAO organizational structures, and token-based incentive mechanisms. These elements have greatly inspired and influenced my design of ANP.

## Agora Protocol

The second community deserving my gratitude is Agora Protocol.

Agora Protocol is a meta-protocol technology developed collaboratively by a team from Oxford University and Camel AI, designed for protocol negotiation among intelligent agents.

Given my extensive experience in protocol-related work, I had long recognized the potential impact of AI on protocol negotiation and integration, though I had not systematically explored it.

Inspired by Agora Protocol, I formally established ANP's three-layer architecture after deeper consideration: the Identity and Encryption Layer, the Meta-Protocol Layer, and the Application Protocol Layer.

This three-layer architecture remains in use today and continues to evolve and improve.

Our implementation of the Meta-Protocol Layer primarily references Agora Protocol's research papers, combined with engineering optimizations based on our experience in communication protocols.

Later, I engaged in technical exchanges regarding agent communication protocols with Agora Protocol's author, smarro from Oxford University, and Li Guohao, founder of Camel AI. Recently, smarro initiated a working group dedicated to standardizing agent communication protocols, in which we are actively participating.

## WebAgents

The third community I wish to thank is WebAgents.

WebAgents was introduced to me by James, an overseas member of our community.

WebAgents primarily leverages Semantic Web technologies to build web-based Multi-Agent Systems (MAS). I extensively reviewed materials from the WebAgents community, particularly their meeting records, gaining valuable insights into Semantic Web concepts.

Subsequently, I systematically studied the origins of the Semantic Web, especially articles by Tim Berners-Lee, the inventor of the World Wide Web, and related standards such as JSON-LD, RDF, and OWL.

The Semantic Web is a fascinating concept. If you've read Tim Berners-Lee's 2001 article in Scientific American, you'll recognize his remarkable foresight—the scenarios he described closely resemble our current vision for widespread intelligent agents.

However, limited by the AI technology of the time, the Semantic Web pursued a data annotation approach, which ultimately could not realize its envisioned potential. Later, the internet evolved into a more closed, mobile-centric era.

Nevertheless, the technologies inherited from the Semantic Web can effectively facilitate communication among intelligent agents. By defining semantics in advance, different agents can achieve consistent understanding of data, effectively resolving ambiguities inherent in natural language communication.

This is why Semantic Web technologies form the core of our agent description protocol.

## did:web

The fourth community deserving thanks is did:web.

did:web is an implementation method of W3C's DID standard, utilizing web technologies to achieve decentralized identity. Its overall design resembles email: globally decentralized with strong interoperability, yet internally centralized, capable of supporting billions of users.

Initially, we adopted a DID method called did:all, a self-verifying DID method similar to Bitcoin addresses, also based on web technologies. However, our method faced a critical unresolved issue: recovery after losing the private key associated with a DID. Interested readers can refer to our deprecated documentation for details.

Later, I encountered the did:web design, which elegantly solved the private key recovery issue and closely aligned with our overall design philosophy.

Consequently, we transitioned to the did:web solution, adding support for intelligent agents, including agent descriptions, agent identity privacy protection, and human authorization for agent identities. We proposed a new method called did:wba (web-based agent).

I have also communicated with the author of did:web on Twitter, and I hope our two methods can eventually merge.

## Open Source and Community

The ANP protocol and its core code implementations are licensed under the Apache License 2.0.

Throughout ANP's design process, we have extensively incorporated outstanding achievements from the open-source community, and we aim to give back to the community as well.

We firmly believe that **a closed protocol has no future, and open-source without incremental value is meaningless.**

Through participating in open-source and community building, I have witnessed the power and value of open-source. We sincerely hope more developers, communities, and companies will join us in building the ANP community.

## Contact Information

The goal of AgentNetworkProtocol is to become the HTTP protocol of the intelligent agent internet era.

Our vision is to define the connectivity among intelligent agents, building an open, secure, and efficient collaborative network for billions of agents.

If you are interested in agent communication protocols, we warmly invite you to join our open-source community, collaboratively define agent connectivity, and explore the future of the Agentic Web.

Contact us:

- Discord: https://discord.gg/sFjBKTY7sB
- Official Website: https://agent-network-protocol.com/
- GitHub: https://github.com/agent-network-protocol/AgentNetworkProtocol
- WeChat: flow10240
- Email: chgaowei@gmail.com
