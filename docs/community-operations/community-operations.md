# ANP Open Source Community Operation Strategy

**Overview:** ANP stands for "Agent Network Protocol". This document outlines a detailed global open-source community operation plan aimed at designing, refining, and promoting the ANP protocol, as well as developing related tools and reference implementations. The new community will draw on the practical experiences of mature open-source projects such as FFmpeg and Linux, maintaining a high degree of openness and sustained vitality, free from control by any individual or company, and avoiding internal conflicts and divisions. The following sections will elaborate on community governance, contributor management, platform usage, foundation operations, and conflict prevention.

## Community Governance Structure Design

To ensure the long-term healthy development of the project, a clear community governance model needs to be established. Considering the complexity of the ANP protocol and the geographical distribution of its participants, the community implements a "Technical Committee-led" governance structure, complemented by a project maintainer system and discussion consensus mechanism. A Core Technical Committee will be set up (overseeing most technical directions and decisions), while project maintainers handle daily tasks and interactions. The community will use public voting and consultation mechanisms, first striving for consensus through consultation, and then activating the Core Technical Committee's decision-making mechanism when consensus cannot be reached. This open governance model helps reduce the risk of the project being unmaintained or controlled by a single vendor, and creates a fair and trusting environment for all types of contributors.

Adopting a clear governance model early on is crucial for the success of open-source projects: it can reduce the risk of projects being unmaintained or controlled by a single vendor, and provide a safe environment for innovation.

### Technical Committee Responsibilities and Composition

The Technical Committee is the community's high-level technical decision-making body, primarily responsible for technical planning, product roadmap definition, and major technical decisions for the ANP protocol and related projects. The committee consists of active core developers within the community, initially considering 5-7 members, including ANP's founding initiators and maintainers of major toolchain and reference implementation projects. The main responsibilities of the Technical Committee include:

- **Technical Resource Allocation and Project Coordination**: Coordinating the development progress of various sub-projects, allocating technical resources, ensuring the development of protocol specifications and toolchain projects progresses according to plan, and regularly checking project status.
- **Technical Standard Setting**: Discussing and formulating protocol specifications and major functional designs through RFC/proposal processes, reviewing important technical change proposals, and making decisions.
- **Expanding Enterprise Cooperation**: Liaising with enterprise and end-user communities, listening to actual needs, promoting the application of the protocol, and ensuring ANP is widely adopted in the industry.
- **Guiding and Maintaining Community Culture**: Overseeing the implementation of community codes of conduct and code contribution processes, fostering a good collaborative atmosphere, and ensuring normal and orderly community operations.

The Technical Committee adopts a regular rotation system to generate new members. Initially, the founding team will appoint the first committee roster, gradually transitioning to community elections as the community grows. To ensure it's not controlled by a single company, the composition of the Technical Committee should be diverse. For example, it can be stipulated that the number of committee members from the same company does not exceed 1/4 of the total committee members, and ensure that the Technical Committee has representatives from at least four different time zones. Each committee member needs to maintain a stance of serving the open-source community, representing the interests of the entire community rather than the private interests of their affiliated organizations.

### Project Maintainer System

Below the Technical Committee, the community establishes a layered system of project maintainers. Each major toolchain or reference implementation project will designate one or more maintainers responsible for managing the daily development and collaboration of that project. Maintainers have code merge permissions for their respective repositories but must follow community submission processes during development. For example, all maintainers must submit code changes through PRs, which are then reviewed and merged by another maintainer. This process ensures code quality and transparency, preventing unilateral actions by individuals.

Maintainers make decisions on daily affairs through consultation among themselves. When encountering cross-module or significant modifications, contributors need to initiate discussions in advance on mailing lists or GitHub Issues to address major plans early. If a decision involves multiple sub-projects or is controversial, maintainers will uniformly submit the issue to the Technical Committee for adjudication.

## Contributor Admission and Promotion Rules

The community defines a clear set of rules to guide various stages from newcomers to core contributors. The growth path of contributors typically includes several stages: Users → Contributors (submitting code or opinions through PRs/Issues) → Core Contributors (continuous significant contributions) → Maintainers/Collaborators (gaining direct commit rights and maintenance membership) → Technical Committee Members (elected by peers).

- **New Contributors**: Anyone interested in ANP is welcome to join the community. Provide clear contribution guidelines and quality documentation for newcomers, and offer internship-level tasks to familiarize them with the project. The community provides a CONTRIBUTING.md file on GitHub, guiding the contribution process and standards. Additionally, provide published reference implementations and community user case studies to help newcomers quickly find suitable contribution entry points.

- **Code Contributors**: Those who become major contributors by submitting PRs/code improvements. Each PR needs to be reviewed and merged by at least one maintainer. When a person has submitted enough valuable code, they will be nominated by existing maintainers to become senior contributors or collaborators.

- **Collaborators/Maintainers**: Once promoted to maintainer by the Technical Committee or maintainers based on the list of major contributors and voting, they begin to have direct code merge rights. Maintainers need to contribute sufficient time and energy to the community and actively participate in decision-making. The addition of new maintainers should be nominated collaboratively by existing members and accepted through internal voting. To maintain fairness, the list of maintainers should be regularly evaluated and updated based on the quality and effectiveness of contributions.

- **Technical Committee Members**: As the community matures, core maintainers of various projects will nominate candidates for the Technical Committee, who will be elected by all core developers (i.e., GA members mentioned above). Technical Committee members serve terms, with new committee members elected every year or every two years to encourage the inclusion of new forces and avoid long-term solidification.

The community will formally establish documents such as the Code of Conduct and Community Charter (project governance guidelines), clearly defining the rights and obligations of contributors at various levels, as well as the standards for promoting contributors to maintainers and technical committee members. These rules let participants know how to engage more deeply with the project and whom to contact when they need answers and assistance.

## Community Platform Usage Guidelines

The ANP community will use GitHub, Discord, and mailing lists as the main communication platforms to meet the needs of different types of contributors and users. To ensure effective and orderly platform communication, usage norms and operational procedures for these platforms will be established.

### GitHub Repository Structure and Management

The community will establish multiple repositories under the ANP organization on GitHub, including the main ANP protocol description/standard repository, reference implementation repositories (for implementing ANP protocol versions on different platforms or languages), and toolchain repositories (e.g., ANP-related development tools, testing frameworks). Each repository will be equipped with contribution guidelines, code of conduct, and management policy files. The main repository will use the Issue/PR process to publish, review, and improve ANP protocol updates, and use labels and Release features to manage version releases. Each repository will display key responsible persons through maintainer communication lists, facilitating contact with contributors and code reviews.

To create a good contribution experience, the community recommends that each repository adopt the following management strategies:

- **Issue and PR Management**: Establish a label system to categorize and guide Issues, marking labels such as "good first issue" to facilitate newcomer contributions. Maintain a certain frequency of replying to and handling issues, summarizing and guiding contributions.
- **PR Review Process**: All maintainers must submit changes through PRs, which are then approved and merged by another maintainer. High-quality Code Review is crucial for ensuring concise code and stable architecture. It requires at least one other maintainer to review each change, including optimized code submitted by maintainers themselves.
- **CI/CD and Automation**: Use continuous integration and commit validation to improve quality, automatically triggering build, test, and core functionality verification for each change to ensure the stability of code changes.
- **Wiki and Documentation**: Utilize community Wiki and README documents to provide project information sources and guidance documents, directing contributors and users to understand project details. Every major change or version release should be recorded on the project Wiki for easy tracking of change history.

### Mailing List Rules

The ANP community will set up common mailing lists as an important communication channel, especially for in-depth exchanges between developers and researchers. Mailing lists are mainly used for the following purposes:

- **Development Mailing List (dev@ANP)**: For developers and researchers, used to discuss protocol processes, new feature proposals, code programming optimization, etc. All major decisions and proposals should be notified and discussed on this list to ensure governance transparency and consensus building.
- **Announcement List (announce@ANP)**: A read-only notification for publishing important announcements and news (e.g., new version releases, conference information). This list is managed by community administrators with minimal interaction to ensure all project stakeholders receive timely updates.

Mailing list communications should adhere to community codes of conduct, maintaining friendly and rational discourse while avoiding personal attacks. For members exhibiting inappropriate behavior, community administrators will first provide friendly guidance through non-public means; if warnings are not heeded, the Technical Committee will jointly decide on further measures.

### Discord Usage Guidelines

Discord is not used as an official decision-making channel but provides a platform for instant communication and collaboration within the community. In the ANP community Discord server, different channels will be established to meet the needs of different user groups:

- **#general Channel**: For general communication and discussion about ANP, welcoming newcomers' questions and everyone's opinion sharing.
- **#dev Channel**: A working channel for developers, allowing in-depth technical discussions, raising difficult issues, analyzing problems, and sharing code version information. This channel can help developers quickly respond to and solve practical problems.
- **#research Channel**: A channel for researchers and academic communities to discuss theoretical issues related to the ANP protocol, such as intelligent agent collaboration mechanisms and network protocol improvement ideas. This channel will expand deep thinking on the ANP protocol.
- **#community Channel**: A channel for discussing overall community operations and activities, such as regular events, conference calls, etc.

Discord communications should adhere to the community's main code of conduct and cultural maintenance. Any major decisions or issues from Discord should be subsequently recorded and processed on official platforms to prevent information distortion during transmission. Administrators will monitor channel communications and use permission tools for management and guidance when necessary.

## Foundation Structure and Operation Method

To give the ANP community an independent legal entity status and neutrality, an independent foundation (or non-profit organization) will be established as the community's legal entity. The foundation's purpose is to ensure that the community is not controlled by any individual or company and maintains long-term neutrality and openness. The foundation's operation methods include:

- **Legal Entity and Neutrality**: The foundation owns the intellectual property rights of the ANP project, such as trademarks and domain names, protecting the project brand from misuse or monopoly. The foundation does not directly intervene in technical decisions; all technical directions are decided by the community according to established governance processes, ensuring the neutrality and objectivity of technical directions.

- **Donation Acceptance and Fund Management**: The foundation accepts donations from individuals and companies, but sponsorship does not grant donors control over the project's technical direction. The foundation establishes a transparent financial system and publishes annual income and expenditure statements. Funds are mainly used for infrastructure (such as CI servers, domain names, conference tools), community activities (seminars, hackathons), and incentives for contributors (such as travel subsidies). This ensures that fund usage aligns with community interests and is subject to community oversight.

- **Governance Structure**: The foundation establishes a board of directors responsible for operational supervision, which can be composed of senior community members and sponsor representatives, but community representatives should hold the majority of seats to maintain public interest. The board's main responsibilities include financial approval, legal compliance, brand use authorization, etc. Representatives from the technical committee or community-elected members can serve on the board, strengthening communication between the community and the foundation. Important matters require board voting and resolutions are made public to the community.

- **Long-term Planning and Cooperation**: The foundation operates on a non-profit principle, adhering to open and transparent bylaws. When necessary, it can cooperate with higher-level open source foundations such as the Linux Foundation or OpenAtom Foundation to obtain additional resource support and third-party supervision. Through legal registration and external cooperation, the ANP project ensures long-term operational legality and stability, not interrupted by the rise and fall of a single company or personnel changes.

**Considering the current development stage, joining an existing foundation, such as the OpenAtom Foundation, is also an option.**

## Mechanism Design to Prevent Community Conflicts and Centralized Control

To ensure the harmony, stability, and long-term vitality of the ANP community, we introduce several mechanisms in governance to prevent internal disputes and excessive concentration of power:

- **Decision Transparency and Recording**: All major proposals, architectural changes, and version release decisions will be discussed on public channels (mailing lists or GitHub issues) with discussion conclusions recorded. Technical committee meeting minutes will also be published via mailing lists or websites, ensuring all community members can understand the decision-making process. The foundation regularly publishes financial and operational reports, subject to community oversight.

- **Code of Conduct and Dispute Resolution**: The community establishes a clear Code of Conduct, requiring members to respect each other and engage in rational discussions. A community committee or designated behavior administrators can be established to specifically monitor behavior standards in mailing lists and chat rooms, maintaining a good communication environment. For behavior violating the guidelines, friendly reminders are given privately first; if not corrected, further actions (warnings, temporary muting, or even removal of contribution privileges) are decided by the community committee or technical committee according to the bylaws.

- **Power Balance and Rotation**: Prevent individual arbitrariness through institutional design to achieve power dispersion and flow. The technical committee adopts a term system, where members need to be re-elected or confirmed for continuation by the community every certain period (e.g., 1-2 years) to avoid long-term monopoly of power. The list of project maintainers is also regularly evaluated and updated, adding new members based on contributions and persuading long-term inactive members to step down, maintaining metabolism. No single company or organization can gain complete control over the community through personnel placement.

- **Consensus-Priority Decision-Making Mechanism**: The community advocates seeking consensus in decision-making as much as possible, fully discussing different opinions. When technical disagreements arise, persuasion through experimental prototypes and data validation is encouraged. When necessary, the technical committee votes to adjudicate technical disputes, with the minority respecting collective decisions and continuing cooperation. For governance or policy disputes, they can be submitted to the foundation's board of directors for arbitration, who will make decisions from the perspective of overall community interests.

Through these measures, the community forms a self-regulating and balancing system internally, minimizing the risk of infighting, preventing core projects from being hijacked by a few people, thereby ensuring the stable development and team cohesion of the ANP project.

## Attracting Developers, Researchers, and Enterprise Representatives for Continuous Participation

### Attracting Developers and Researchers

- **Provide Attractive Development Materials and Tasks**: From the project's inception, focus on providing comprehensive and easy-to-understand tutorials, examples, and task guidelines. Through good documentation and teaching materials, guide new developers and researchers to familiarize themselves with ANP, stimulating their interest in deeper exploration. The community releases concise introductory materials and testing frameworks to lower participation barriers.

- **Optimize Collaboration Processes and Guidelines**: Use modern contribution tools and communication channels to ensure every developer and researcher can easily find suitable tools and guidelines for collaboration. Provide clear contribution guidelines, issue templates, etc., to facilitate participants in submitting problems and patches, and quickly receive feedback and help.

- **Contributor Incentives and Recognition**: Acknowledge contributors through contribution lists and version update records. Mention and thank authors in key proposal or PR discussions, and share active contributors' achievements through community monthly reports or blogs, enhancing their reputation and sense of belonging.

- **Online Courses and Events**: To help more people understand ANP, the community can organize online courses and seminars. Through hackathons and technical exchange meetings, help developers and researchers apply ANP in practice, deepen their understanding of the protocol, and strengthen community cohesion.

### Attracting Enterprise Representatives

- **Demonstrate Business Value**: Prepare ANP application examples and prototypes for enterprises, showcasing the protocol's value in actual business scenarios. Through specific cases, explain how ANP solves enterprise pain points, allowing potential enterprise users to see the benefits of adopting ANP.

- **Enterprise Participation and Feedback**: Invite enterprise technical representatives to participate in requirement discussions and testing early on. Establish an enterprise user advisory group to regularly hear industry feedback, ensuring protocol design aligns with business needs. Early enterprise participation helps validate ANP's practicality and creates a sense of identification with the project.

- **Intellectual Property and License Assurance**: Adopt a permissive open source license (such as Apache 2.0), and clarify the intellectual property ownership of code contributions through Contributor License Agreements (CLA) or Developer Certificate of Origin (DCO), eliminating enterprise legal concerns. The foundation ensures all contributed code follows a unified open source license, avoiding intellectual property disputes and allowing enterprises to use and contribute to ANP with peace of mind.

- **Collaborative Promotion**: Establish partnerships with interested companies to jointly host technical sharing sessions or pilot projects. Encourage enterprises to promote ANP application results through their official channels (blogs, conferences, etc.), endorsing the community and attracting more enterprises to join. Form a positive word-of-mouth effect through enterprise success stories and positive feedback.

## Initial Promotion and Operation Strategy

In the early stages of community establishment, actively promote the ANP project and establish a solid operational foundation:

- **Announcement and Documentation**: Write a white paper or technical blog for the ANP project, publish it in developer communities, clearly articulating ANP's positioning, technical vision, and roadmap. Prepare ample public documentation (e.g., README, FAQ) to lower the barrier for outsiders to understand the project. Use social media and technical forums to announce project launch news, attracting the first batch of followers.

- **Build Community Infrastructure**: Quickly establish and configure GitHub organization repositories, mailing lists, and Discord servers. Ensure these platforms have comprehensive instructions (such as contribution guidelines, code of conduct) to facilitate new member joining. Set up CI pipelines, issue templates, and other tools to lay the foundation for subsequent collaboration.

- **Regular Communication and Promotion**: Regularly organize online meetings or seminars, inviting core developers to share project progress and answer community questions. Promote the latest achievements and important decisions through monthly briefs, blog posts, etc., keeping the entire community synchronized on information. Participate in industry conferences or online tech summits to introduce the ANP project and expand awareness.

- **Integration into Relevant Ecosystems**: Actively integrate into technology communities and open source ecosystems related to ANP. For example, participate in open source forums and discussions in fields such as artificial intelligence agents and network communication, establishing connections with these communities. Through cross-community collaboration and experience sharing, increase ANP's recognition in related fields and seek potential cooperation opportunities.

- **Establish Partnerships**: Establish partnerships with interested companies to jointly host technical sharing sessions or pilot projects. Encourage enterprises to promote ANP application results through their official channels (blogs, conferences, etc.), endorsing the community and attracting more enterprises to join. Form a positive word-of-mouth effect through enterprise success stories and positive feedback.

- **Build a More Flexible Decision-Making Mechanism**: In the initial stage, adopt a relaxed decision-making process, encouraging rapid action and iteration. As the community matures, gradually introduce stricter governance mechanisms to ensure the long-term healthy development of the protocol.

Through these measures, the ANP community can attract sufficient attention and contributory forces in the startup phase, quickly forming a virtuous cycle: more participants bring faster iterations and richer results, which in turn attract more new members to join, providing continuous momentum for the design and promotion of the ANP protocol.
