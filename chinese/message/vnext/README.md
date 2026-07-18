# ANP 消息 vNext 草案 Profile 索引

- 状态：草案 / 未发布
- 范围：同一 Agent DID 下的 DID 定址 Base 消息与多设备密码学 Overlay
- 已发布基线：[ANP 消息 v1.1](../01-核心绑定.md)
- 英文镜像：[ANP Messaging vNext Draft](../../../message/vnext/README.md)

## 1. 版本边界

本目录中的文档是独立版本化草案，不修改或重新解释 `chinese/message/` 下已发布的文件。

- v1.1 把设备视为 Agent 内部实现细节。
- vNext 保持 Agent DID 为业务身份，只在 Profile 要求该 DID 下的密码学设备端点时引入 `device_id`。
- 普通非 E2EE 私聊、群聊、Mention 和附件操作保持 DID 定址，不要求也不携带设备 selector。这些操作的设备 fan-out 由接收 DID 所属域在本地完成。
- 设备定址的安全操作要求其 Profile 声明的完整依赖集和有效当前 `deviceManifest`，即使 DID 只有一台设备也一样。Base 操作不要求 Manifest，也不合成设备。
- 实现不得（**MUST NOT**）从 v1 推断支持 v2、为 v1 对端虚构设备，或把 v2 请求/会话静默降级到 v1。

草案存在不表示 SDK、服务或产品已经实现，也不授权公开宣告相应能力。

## 2. Profile 集

| Profile | 标识 | 文档 | vNext 主要职责 |
| --- | --- | --- | --- |
| P1 | `anp.core.binding.v2` | [核心绑定](01-核心绑定.md) | 通用 DID 元数据、条件式设备 selector、签名绑定、能力协商、幂等和共享错误 |
| P2 | `anp.identity.discovery.v2` | [身份与发现](02-身份与发现.md) | 面向设备定址安全 Profile 的根保护 `deviceManifest`、key 引用、资格和发现 |
| P3 | `anp.direct.base.v2` | [私聊基础语义](03-私聊基础语义.md) | 一次 DID-to-DID 普通投递、DID 级接受和消息关联 |
| P4 | `anp.group.base.v2` | [群组基础语义](04-群组基础语义.md) | DID 级成员关系、治理、发送和 DID 定址通知 |
| P5 | `anp.direct.e2ee.v2` | [私聊端到端加密](05-私聊端到端加密.md) | 设备绑定 PreKey、Session、Ratchet、AAD、重放状态和 Mailbox |
| P6 | `anp.group.e2ee.v2` | [群组端到端加密](06-群组端到端加密.md) | 同一成员 DID 的多个独立设备 Leaf |
| P7 | `anp.attachment.v2` | [附件与对象传输](07-附件与对象传输.md) | DID 定址的 manifest、对象控制与 Bearer Ticket 流程；加密 object key 分发继承 P5/P6 |
| P8 | `anp.federation.relay.v2` | [联邦与跨域](08-联邦与跨域.md) | 仅在外层 Profile 声明设备定址时保留 selector 并校验资格 |
| P9 | vNext binding 扩展 | [消息 Mention 扩展](09-消息Mention扩展.md) | 把不变的 Mention payload 语义绑定到 P1/P4/P6 v2 |

## 3. 共享决策

所有 vNext Profile 统一采用以下解释：

1. Agent DID 是 Base 消息的 wire 身份与地址。`device_id` 是由 Profile 自主声明的可选密码学端点 selector；它在出现时不透明，在所属 DID 的设备命名空间内唯一，且不是 Device DID、业务成员、角色、硬件标识或 `target.kind`。
2. `deviceManifest` 是宣告设备定址安全 Profile 的 DID 之完整当前公开设备集合，内嵌于根保护 DID Document，不具有独立 endpoint、proof、epoch、hash 或 CAS 协议。仅 Base 发现不要求它。
3. Manifest 条目只包含 `device_id`、`signing_key_id`、`e2ee_key_id` 和 `profiles[]`；严禁包含产品域内角色、token、Registry 状态、恢复状态和私钥。
4. P3、P4、P7 普通流程与 P9 payload 语义只使用业务 DID 或 Group DID，**MUST NOT** 要求或携带 `sender_device_id`、`recipient_device_id` 或 `requester_device_id`。P5/P6 拥有 E2EE 所需的设备 selector，业务目标仍位于 `meta.target.did`。
5. 继续复用现有 `anp-rfc9421-origin-proof-v1` 和 Data Integrity proof scheme；Profile ID 使用 `.v2` 不会自动创建 proof v2。Base Profile 认证 sender DID。P5/P6 设备字段 **MUST** 受所属 Overlay 定义的 authenticated context 覆盖：当该操作使用 `auth.origin_proof` 时，proof key 必须匹配选中的 Manifest 条目；P5 MTI 密文发送则通过设备对 Session 和经认证 AAD 绑定 selector。
6. ANP 不公开部署私有的 `document_version`、`document_hash` 或 checkpoint 字段；资格可能变化时，调用方重新 resolve 当前根保护 DID Document。
7. 在设备定址安全 Profile 中，每台设备分别持有签名/E2EE 私钥、PreKey、Direct Ratchet State、MLS 私有状态和重放状态，禁止在设备间复制。
8. 已移除设备不得用原 `device_id` 或设备 key 原地恢复；重新加入必须使用新 ID 和新 key。
9. P6 草案暂用私用 MLS ExtensionType `0xF0A1` 承载强制 LeafNode 设备绑定；该值不是 IANA 分配，取得稳定注册 code point 是发布 gate。

## 4. 阅读与评审顺序

先读 P1/P2，再读 Direct 的 P3/P5、Group 的 P4/P6，最后读 P7/P8/P9。评审时应同时检查中英文文件；任何字段、依赖、错误名或示例不一致都属于草案缺陷。

多设备示例集中在 [examples/message-vnext](../../../examples/message-vnext/README.cn.md)。

## 版权声明

Copyright (c) 2024 ANP 开源社区
本文件依据 [Apache License 2.0](../../../LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
