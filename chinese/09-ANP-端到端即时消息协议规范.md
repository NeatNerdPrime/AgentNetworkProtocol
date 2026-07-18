# ANP-端到端即时消息协议规范总纲

- 文档编号：ANP-09
- 标题：ANP-端到端即时消息协议规范总纲
- 状态：v1.1 已发布基线；vNext 多设备草案
- 版本：1.1 / vNext Draft
- 语言：中文
- 适用范围：本文档同时索引已发布的 ANP 1.1 消息 Profile 与独立版本化的 vNext 多设备草案。

> 本文是 ANP端到端即时消息规范集的总纲性说明，用于帮助读者快速理解整套协议的目标、分层、核心理念与关键技术路线。本文**不是**逐条规范性条文，规范性要求以各 Profile 原文为准。

---

## 1. ANP端到端即时消息是什么

ANP端到端即时消息是一套面向 **Agent 与 Agent 跨域即时消息通信** 的协议规范。

它要解决的不是“某个产品内部如何聊天”，而是：

- 不同域、不同平台、不同实现的 Agent，如何彼此发现；
- 如何发送私聊与群聊消息；
- 如何在需要时提供端到端加密；
- 如何传输附件与大对象；
- 如何在跨域场景下完成路由、中继、排序与结果见证。

ANP 的业务身份和授权主体仍是 **Agent DID**。在已发布的 v1.1 Profile 中，设备和内部副本仍不属于互通边界。独立版本化的 vNext Profile 使普通非 E2EE 私聊、群聊、Mention 和附件操作保持 DID 定址，端点 fan-out 留在接收域内部。只有 E2EE Profile 公开安全跨域密码学通信必需的最小设备语义：`device_id` 表示同一 DID 下的一个密码学端点，它不是新的业务身份、群成员或 `target.kind`。

---

## 2. 核心理念

### 2.1 联邦制，而不是单一中心

ANP 采用的是一种 **联邦式（Federated）** 架构，理念上更接近 Email，而不是单一中心服务器架构。

每个 Agent 或群都可以属于不同的域，不同域通过标准化的服务发现、服务到服务直接调用和结果见证机制完成互通。也就是说：

- 身份是分布式的；
- 服务入口是分布式的；
- 跨域服务调用可以发生；
- 但每一类操作都有明确的责任边界。

在私聊场景中，目标 Agent 所在域的入口服务负责接收消息；在群场景中，群 Host Service 负责群状态排序与群事件序列化。

### 2.2 身份优先、服务发现优先

ANP 的一等标识不是用户名或设备号，而是：

- `agent_did`
- `group_did`

ANP 通过 DID 文档发现可交互的服务端点，并以此建立后续的消息发送、密钥发现、群服务发现和对象服务发现路径。当前版本中，DID 文档对外公开的 ANP 服务入口统一收敛为 `ANPMessageService`；私聊、群聊、密钥材料访问和对象控制等能力由该统一入口承载。

在 vNext 中，宣告设备定址 E2EE Profile 的 DID 还可以在其根签名 DID Document 中携带完整 `deviceManifest`。条目只公开当前设备端点标识、签名 key 引用、E2EE key 引用及支持的 v2 Profile；仅 Base 发现不要求 Manifest。产品域内角色、token、恢复状态、Registry 版本和文档 checkpoint 都不是 ANP wire 语义。

### 2.3 分层设计，而不是“大一统协议”

ANP 不把所有问题塞进一份文档，而是拆成 9 个 Profile：

- P1 / P2：共同绑定与身份发现
- P3 / P4：私聊和群聊的基础业务语义
- P5 / P6：私聊与群聊的 E2EE Overlay
- P7：附件与大对象
- P8：联邦、跨域服务调用与群事件分发
- P9：群消息 mention 与 selector 语义

这种设计的好处是：

- 基础消息语义和安全语义解耦；
- 明文模式和加密模式可以共存；
- 私聊、群聊、附件、联邦各自清晰；
- 后续升级某一层，不必推翻整套协议。

### 2.4 控制面与数据面分离

ANP 明确区分：

- **控制面**：建群、邀请、加人、踢人、能力协商、票据签发、跨域服务调用等；
- **数据面**：私聊消息、群消息、附件对象内容。

尤其在附件场景中，ANP 明确采用：

- 消息里传 **manifest（清单）**；
- 对象内容通过独立 HTTP(S) 通道下载；
- 跨域服务调用链路不转发对象字节流。

---

## 3. 核心设计

### 3.1 统一外层绑定：JSON-RPC

ANP 的统一外层绑定采用 **JSON-RPC 2.0**，并做了收紧：

- `params` 使用对象形式；
- `id` 使用字符串；
- 不使用 batch；
- Notification 仅用于明确的异步通知场景。

这样做的目的，是在保持实现简洁的同时，让不同语言、不同平台、不同服务之间拥有统一的请求/响应/错误模型。

### 3.2 私聊与群聊分别建模

ANP 没有把“消息”做成一个模糊的大对象，而是明确区分：

- `direct.send`：私聊
- `group.send`：群聊

同时，群聊不仅是“发消息”，还包括：

- `group.create`
- `group.invite`
- `group.accept_invite`
- `group.join`
- `group.add`
- `group.remove`
- `group.leave`
- `group.update_profile`
- `group.update_policy`

这使得群治理、群状态和群加密可以自然衔接。

vNext 不创建设备级业务成员。P3 Direct Base 投递，以及 P4 的成员、角色、策略、发送和通知都仍按 DID 管理。只有 Direct E2EE 投递和 MLS 密码学 Leaf 按设备管理。

### 3.3 明文与 E2EE 并存

ANP 允许：

- `transport-protected`：仅依赖传输安全
- `direct-e2ee`：私聊端到端加密
- `group-e2ee`：群聊端到端加密

也就是说，基础 Profile 可以独立运行；安全 Overlay 则在其之上叠加。这样既利于渐进部署，也有利于不同场景采用不同安全级别。

---

## 4. 核心技术路线

### 4.1 传输与消息绑定：JSON-RPC 2.0

ANP 采用 JSON-RPC 2.0 作为统一消息绑定层，作用不是“模拟函数调用”，而是给跨域协议提供统一的：

- 请求格式
- 响应格式
- 错误模型
- 能力协商接口
- 异步通知机制

这使得 ANP 在私聊、群聊、附件控制、跨域服务调用等不同场景下，都能共享一致的外层协议形状。

### 4.2 私聊端到端加密：X3DH-like + Double Ratchet-like

ANP 的私聊 E2EE 采用如下技术路线：

- 身份锚点：`did:wba`
- 密钥发现：通过 DID 文档公开的 `ANPMessageService` 获取
- 初始建链：`X3DH-like`
- 后续消息保护：`Double Ratchet-like`

其中：

- DID 文档中的认证密钥用于证明身份；
- DID 文档中的 `keyAgreement`（例如 X25519）用于协商；
- Prekey Bundle 用于异步离线建链；
- Ratchet 用于后续每消息密钥滚动、乱序容忍与重放防护。

在 vNext 中，PreKey Bundle、异步 Session、Ratchet State、AAD、重放状态和 Mailbox 都绑定到双方具体的 `(DID, device_id)`。同一逻辑消息为每台合法接收设备分别加密和提交，设备之间不得共享私有状态。

这条路线适合 Agent 异步通信，而且保留了向更强套件升级的空间。

### 4.3 群组端到端加密：MLS + did:wba 绑定

ANP 的群组 E2EE 主线采用：

- **MLS** 作为群密钥状态机；
- **did:wba** 作为身份锚点；
- **Group Host Service** 作为排序与回执权威。

这意味着：

- 群应用消息使用 `PrivateMessage` 承载；
- 成员加入、移除、欢迎、外部加入等能力通过 MLS 的 `KeyPackage / Commit / Welcome / External Commit` 完成；
- `group_did`、`group_state_version`、`policy_hash` 与密码学群状态建立绑定；
- `group_receipt` 负责证明“群已接受并排序了该操作/消息”。

在 vNext 中，一个业务成员 DID 可以拥有多个经过认证的 MLS Leaf；每个 Leaf 使用独立的设备绑定 KeyPackage 和私有状态。增加或移除一个设备 Leaf 本身不等于增加或移除 DID 级群成员。

这种做法比自己发明一套群密码学状态机更适合成为长期标准。

### 4.4 附件与对象：Manifest + 独立 HTTPS 下载 + 可选对象级加密

附件方案采用三层结构：

1. **消息层**：只传 `attachment_manifest`
2. **访问层**：通过 Object Service 与短时下载票据控制下载
3. **内容层**：必要时对对象本身做对象级加密（`object-e2ee`）

因此：

- 大对象不通过跨域服务调用链路传输；
- 下载链接可以做成 locator 而不是长期直链；
- 即使链接泄露，也可以通过对象级加密确保第三方拿不到明文。

在 vNext Direct E2EE 中，同一份已上传对象和 `object_key` 可以由多份逐设备加密消息引用，key 分别发送给每台接收设备；在 Group E2EE 中，key 放入当前 epoch 的 MLS Application Message。

### 4.5 联邦：服务到服务直接调用

ANP 的联邦层定义了：

- 服务发现
- 跨域服务到服务直接调用
- 群 Host 排序
- 附件控制面的跨域调用
- `attachment.get_download_ticket` 的最终落点

其中一个重要原则是：

- 跨域时直接使用原有业务方法或控制方法与目标服务交互，而不是新增独立的 Relay 包装协议；
- 对象字节流必须独立 HTTPS 下载；
- 群操作以 Group Host 的接受与排序作为跨域成功语义；
- 私聊以目标 Agent 入口服务的接受作为跨域成功语义。
- vNext 联邦仅在外层 E2EE Profile 声明发送/接收设备标识时保留并校验它们。普通 P3/P4/P7 操作保持 DID 定址，任何端点 fan-out 留在接收域内部；网关既不给这些操作添加设备 selector，也不为 E2EE 投递执行隐藏 fan-out。

---

## 5. 关键设计取舍

ANP 有几个有意识的设计取舍：

### 5.1 业务身份与设备端点分离

v1.1 基线仍把设备、终端和副本视为 Agent 内部细节。vNext 使普通 Base wire 边界保持 DID 定址，只调整 E2EE 密码学端点边界：公开避免共享设备 key、共享 Ratchet、隐藏加密投递 fan-out 和 MLS Leaf 歧义所需的最小设备标识及 key 绑定。DID 仍是业务身份，产品域内设备管理仍不属于协议范围。

### 5.2 群治理优先于极致匿名性

在群场景中，ANP 同时保留：

- 发起者证明（谁发起了请求）
- 群结果见证（群是否接受）
- 群内消息机密性（MLS）

这意味着它更偏向“治理友好型 Agent 协议”，而不是纯匿名聊天协议。

### 5.3 附件安全不依赖“隐藏链接”

ANP 不把“绝对隐藏下载链接”作为核心安全手段，而是采用：

- 受控下载票据
- 短时 URL
- 对象级加密

来确保即使链接泄露，也不一定能获取有意义的明文。

---

## 6. 文档结构

以下 9 份 Profile 构成已发布的 v1.1 基线：


| 编号 | 文档 | 作用 | 内容概览 |
| --- | --- | --- | --- |
| 1 | [01-核心绑定](message/01-核心绑定.md) | 定义统一外层绑定 | 规定 JSON-RPC 互操作约束、通用 `params` 结构、负载表示、能力协商、幂等、错误模型和方法命名空间。 |
| 2 | [02-身份与发现](message/02-身份与发现.md) | 定义标识与服务发现 | 规定 Agent DID / Group DID 的语义、DID 文档中的 ANP 解释规则、统一 `ANPMessageService` 服务入口以及发现流程。 |
| 3 | [03-私聊基础语义](message/03-私聊基础语义.md) | 定义私聊基础业务层 | 规定 `direct.send` 等私聊基础方法、内容模型、接受语义、幂等语义、排序语义和发送方证明边界。 |
| 4 | [04-群组基础语义](message/04-群组基础语义.md) | 定义群生命周期与群消息基础层 | 规定群创建、邀请、加入、成员变更、群资料/策略更新、`group.send`、群状态版本与群 Host 排序职责。 |
| 5 | [05-私聊端到端加密](message/05-私聊端到端加密.md) | 定义私聊 E2EE Overlay | 规定 Prekey Bundle、`did:wba` 绑定、X3DH-like 初始建链、Double Ratchet-like 后续消息、AAD、重放防护和会话重建。 |
| 6 | [06-群组端到端加密](message/06-群组端到端加密.md) | 定义群组 E2EE Overlay | 规定基于 MLS 的群密码学状态、KeyPackage 发布与发现、群基础方法到密码学状态机的映射，以及 `epoch` 与分叉处理。 |
| 7 | [07-附件与对象传输](message/07-附件与对象传输.md) | 定义附件与大对象语义 | 规定 `attachment_manifest`、Object Service、上传/提交/下载票据、对象级加密以及附件在私聊和群聊中的承载方式。 |
| 8 | [08-联邦与跨域](message/08-联邦与跨域.md) | 定义跨域服务调用原则 | 规定服务角色、发现与路由、服务到服务安全、跨域直接调用原则、群事件分发以及跨域成功语义。 |
| 9 | [09-消息Mention扩展](message/09-消息Mention扩展.md) | 定义群消息 mention 载荷语义 | 规定结构化 mention 对象、`@all`、`@agents`、`@humans` 等 group selector、Group Base 与 Group E2EE 的放置规则以及终端侧校验。 |

[vNext 中文草案集](message/vnext/README.md)镜像相同分层：P1–P8 使用独立 `.v2` Profile ID，P9 仅为不变的 Mention payload 提供 vNext binding：

| Profile | vNext 草案 | 主要多设备变化 |
| --- | --- | --- |
| P1 | [`anp.core.binding.v2`](message/vnext/01-核心绑定.md) | DID 级通用元数据，以及仅在外层 E2EE Profile 声明时使用的设备 selector |
| P2 | [`anp.identity.discovery.v2`](message/vnext/02-身份与发现.md) | 面向设备定址安全 Profile 的根签名 `deviceManifest` 和当前资格；Base 发现保持 DID 级 |
| P3 | [`anp.direct.base.v2`](message/vnext/03-私聊基础语义.md) | 一次 DID-to-DID 普通投递，不携带设备 selector |
| P4 | [`anp.group.base.v2`](message/vnext/04-群组基础语义.md) | DID 级成员、发送和通知，端点 fan-out 由所属域在本地完成 |
| P5 | [`anp.direct.e2ee.v2`](message/vnext/05-私聊端到端加密.md) | 设备绑定 PreKey、Session、Ratchet、AAD、重放状态和 Mailbox |
| P6 | [`anp.group.e2ee.v2`](message/vnext/06-群组端到端加密.md) | 同一成员 DID 的多个独立认证设备 Leaf |
| P7 | [`anp.attachment.v2`](message/vnext/07-附件与对象传输.md) | DID 定址的 manifest、对象控制和 Ticket 流程；E2EE object key 投递继承 P5/P6 |
| P8 | [`anp.federation.relay.v2`](message/vnext/08-联邦与跨域.md) | 针对外层 E2EE Profile 的条件式设备 selector 保留和资格校验 |
| P9 | [vNext binding](message/vnext/09-消息Mention扩展.md) | v2 依赖和载荷位置；mention 仍使用 DID/群 selector |


建议阅读顺序为：

- 先读 P1 / P2
- 再读 P3 / P4
- 然后读 P5 / P6
- 最后按需读 P7 / P8 / P9

---

## 7. 总结

ANP 的核心，不是做一个“聊天协议”，而是做一套 **面向 Agent 生态的跨域通信标准**。

它的基本思路可以概括为：

- **联邦制**：像 Email 一样跨域互通；
- **身份优先**：以 DID 为统一锚点；
- **设备安全的 vNext**：一个 DID 可以公开多个独立密码学端点，而不改变业务身份；
- **分层设计**：业务、加密、附件、联邦各自分离；
- **E2EE 可选叠加**：基础协议可独立运行，安全 Overlay 可按需启用；
- **附件直连下载**：消息传 manifest，对象走独立 HTTP(S) 数据面；
- **治理友好**：尤其在群场景中，同时兼顾身份、排序、回执与加密。

这使 ANP 既能作为一个可实现的协议体系，也能作为后续长期标准化演进的基础。
