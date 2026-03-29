# ANP Profile 5：Direct E2EE Profile（草案）

- 文档编号：ANP-P5
- 标题：Direct E2EE Profile
- 状态：Draft
- 版本：0.1.0
- 语言：中文
- 适用范围：本 Profile 适用于 Agent 与 Agent 之间的私聊端到端加密 Overlay，不包含 Agent 内部设备、副本或执行器同步语义。

---

## 1. 目的

本 Profile 定义 ANP 的私聊端到端加密 Overlay，规定：

1. 如何在 `anp.direct.base.v1` 的业务语义之上叠加端到端机密性、完整性与发送方身份绑定；
2. 如何进行面向离线接收方的异步初始建链；
3. 如何进行后续消息的 ratchet 化加密与乱序处理；
4. 如何进行会话重建、重放防护、降级防护与安全绑定；
5. 如何通过 Key Service 发布和获取面向 Direct E2EE 的公开材料。

本 Profile **不**定义：

- 设备、多端登录或内部副本同步；
- 历史消息拉取；
- 已读回执；
- Agent 内部密钥复制策略；
- 具体密码学算法的唯一实现；
- 群组端到端加密。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

- **Direct E2EE Session**：两个 Agent 之间的一个私聊端到端加密会话，由 `session_id` 标识。
- **Prekey Bundle**：目标 Agent 公开发布的、用于离线异步建链的公开材料集合。
- **Initial Handshake**：发送方向目标 Agent 的 Prekey Bundle 发起的初始建链动作。
- **Ratchet State**：用于后续消息加密、乱序处理与密钥前移的会话状态。
- **Ratchet Header**：携带 ratchet 所需最小公开头字段的对象。
- **Replay Cache**：接收方用于识别重复消息、重复计数器或重复密文的状态集合。
- **Session Reset**：会话失效、状态冲突或策略要求时的重建行为。
- **Application Plaintext**：由 Direct Base 逻辑内容对象组成、但在本 Profile 下被加密承载的应用层明文对象。

---

## 3. 设计原则

### 3.1 Agent 是协议终点

本 Profile 的互通终点是 `agent_did`，不是设备、终端、会话副本或内部执行器。

只要目标 Agent 成功处理了对应 E2EE 会话材料并接受了密文，本 Profile 的跨域互通目标即已达成。目标 Agent 内部如何把会话状态复制到多少个副本或工作单元，超出本 Profile 范围。

### 3.2 Base 语义与 Security Overlay 分离

本 Profile **不**定义新的私聊业务语义；它复用 `anp.direct.base.v1` 的：

- 发送方与接收方语义；
- `direct.send` 方法语义；
- `message_id` / `operation_id` 语义；
- 应用层内容类型语义。

当 `meta.profile = "anp.direct.e2ee.v1"` 时：

- 业务方法仍为 `direct.send`；
- 但外层 `body` 结构、`meta.content_type` 取值以及受认证上下文由本 Profile 定义；
- Direct Base 中的 `text` / `payload` / `payload_b64u` 不再直接出现在外层，而是作为 `Application Plaintext` 被加密封装。

### 3.3 异步建链 + 消息级 Ratchet

本 Profile 采用两阶段安全模型：

1. **初始建链阶段**：使用面向离线接收方的 Prekey Bundle 建立第一个共享秘密；
2. **后续消息阶段**：使用 ratchet 化消息保护进行前向更新、乱序容忍和重放防护。

### 3.4 不依赖硬时间窗防重放

`created_at` **MAY** 用于审计、诊断和过期策略，但 **MUST NOT** 作为唯一的防重放机制。

接收方 **MUST** 基于：

- `session_id`
- `message_id`
- ratchet 序号 / generation
- Replay Cache

进行状态型防重放处理。

### 3.5 非目标

本 Profile **不**承诺：

- 对 Agent 内部多个副本的透明同步；
- 人类 IM 式“多设备一致视图”；
- 历史会话恢复接口；
- 任意算法族之间的自动互通。

---

## 4. Profile 标识与依赖

### 4.1 Profile 名称

本 Profile 的标准名称为：

`anp.direct.e2ee.v1`

### 4.2 依赖关系

本 Profile **MUST** 依赖以下 Profile：

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`
- `anp.direct.base.v1`

### 4.3 安全模式

使用本 Profile 时：

- `meta.profile` **MUST** 等于 `anp.direct.e2ee.v1`
- `meta.security_profile` **MUST** 等于 `direct-e2ee`

任何实现 **MUST NOT** 在未显式协商的情况下把 `direct-e2ee` 静默降级为 `transport-protected`。

---

## 5. 套件与能力模型

### 5.1 抽象套件标识

本 Profile 不把某一个具体密码学构造写死为唯一合法实现，但要求所有实现 **MUST** 使用显式的 `suite` 标识。

`Direct E2EE Suite` 至少应覆盖以下能力族：

1. 初始异步建链；
2. 派生初始根密钥 / 会话密钥；
3. 后续消息 ratchet；
4. 对称加密与完整性保护；
5. 头部与 AAD 绑定规则。

### 5.2 套件支持通告

支持本 Profile 的 ANP Endpoint **MUST** 在 `anp.get_capabilities` 中通告：

- 支持的 `direct-e2ee` 安全模式；
- 支持的 Direct E2EE suite 列表；
- 是否支持初始消息内嵌首条应用负载；
- `MAX_SKIP`、最大会话重叠数、最大消息密文字节数等实现约束。

### 5.3 最小实现要求

一个符合本 Profile 的实现：

- **MUST** 至少实现一个已注册的 Direct E2EE suite；
- **SHOULD** 至少实现一个面向长期部署的、具备后量子准备能力的 suite；
- **MAY** 额外实现面向兼容部署的经典 suite。

### 5.4 密钥用途分离

以下密钥材料 **MUST NOT** 混用：

- DID 文档中的长期 `keyAgreement` 材料；
- Prekey Bundle 中的中期或一次性建链材料；
- 已建立会话中的 ratchet 密钥；
- 用于内容加密的临时派生密钥。

---

## 6. Key Service 与 Prekey Bundle

### 6.1 总则

支持本 Profile 的 Agent **SHOULD** 通过 `ANPKeyService` 发布用于异步建链的 Prekey Bundle。

发送方在向某目标 Agent 首次建立 `direct-e2ee` 会话前，**MUST** 获取该目标 Agent 的可用 Prekey Bundle，除非本地已有仍然有效的会话。

### 6.2 `prekey_bundle` 对象

`prekey_bundle` 表示可用于建立新会话的公开材料集合。

推荐字段：

- `bundle_id`：字符串，**MUST**
- `suite`：字符串，**MUST**
- `owner_did`：字符串，**MUST**
- `identity_key_ref`：字符串，**SHOULD**，用于引用 DID 文档中可验证的长期材料
- `signed_prekey_b64u`：字符串，**MUST**
- `signed_prekey_sig_b64u`：字符串，**MUST**
- `one_time_prekey_id`：字符串，**MAY**
- `one_time_prekey_b64u`：字符串，**MAY**
- `pq_prekey_id`：字符串，**MAY**
- `pq_prekey_b64u`：字符串，**MAY**
- `expires_at`：RFC 3339 时间字符串，**SHOULD**
- `not_before`：RFC 3339 时间字符串，**MAY**
- `bundle_extensions`：对象，**MAY**

### 6.3 `direct.e2ee.publish_prekey_bundle`

#### 6.3.1 语义

由某 Agent 向其所属 `ANPKeyService` 发布或替换一个可被发现的 Prekey Bundle。

#### 6.3.2 请求要求

- `method = "direct.e2ee.publish_prekey_bundle"`
- `meta.profile = "anp.direct.e2ee.v1"`
- `meta.security_profile = "transport-protected"`
- `body.prekey_bundle` **MUST** 存在
- `body.prekey_bundle.owner_did` **MUST** 等于 `meta.sender_did`

#### 6.3.3 成功响应

成功响应 **MUST** 至少包含：

- `published`：布尔值，且为 `true`
- `owner_did`
- `bundle_id`
- `published_at`

### 6.4 `direct.e2ee.get_prekey_bundle`

#### 6.4.1 语义

由发送方从目标 Agent 的 `ANPKeyService` 获取一个可用于新建会话的 Prekey Bundle。

#### 6.4.2 请求要求

`body` **MUST** 包含：

- `target_did`

`body` **MAY** 包含：

- `preferred_suite`
- `require_one_time_prekey`
- `require_pq_material`

#### 6.4.3 成功响应

成功响应 **MUST** 至少包含：

- `target_did`
- `prekey_bundle`

服务端 **MUST NOT** 向非授权方泄露超出策略允许范围的额外密钥材料。

### 6.5 Prekey Bundle 验证要求

发送方在使用某个 Prekey Bundle 前 **MUST** 验证：

1. `owner_did` 与目标 DID 一致；
2. `suite` 为本地支持的 suite；
3. `signed_prekey_sig_b64u` 可由被信任的长期材料验证；
4. 若存在 `not_before` / `expires_at`，则其在本地策略允许的有效期内；
5. `bundle_id` 未被本地列入撤销或失效集合。

---

## 7. 外层内容类型与承载对象

### 7.1 标准外层内容类型

本 Profile 定义以下标准外层 `meta.content_type`：

- `application/anp-direct-init+json`
- `application/anp-direct-cipher+json`
- `application/anp-direct-control+json`

### 7.2 Application Plaintext 对象

Direct Base 的应用层内容在本 Profile 下 **MUST** 先转换为 `application_plaintext` 对象，再进行加密。

推荐结构：

```json
{
  "application_content_type": "text/plain | application/json | application/anp-attachment-manifest+json | ...",
  "conversation_id": "conv-01",
  "reply_to_message_id": "msg-previous",
  "annotations": {},
  "text": "...",
  "payload": {},
  "payload_b64u": "..."
}
```

规则：

- `application_content_type` **MUST** 存在；
- `text` / `payload` / `payload_b64u` 三者中 **MUST** 恰好出现一个；
- `application_plaintext` 的互斥规则与 `anp.direct.base.v1` 一致；
- 外层 `meta.content_type` 表示“本次承载的是 Direct E2EE 对象”，**不是**内层应用负载类型。

### 7.3 `direct_init_object`

当 `meta.content_type = "application/anp-direct-init+json"` 时，`body` **MUST** 为 `direct_init_object`。

推荐字段：

- `session_id`：字符串，**MUST**
- `suite`：字符串，**MUST**
- `bundle_id`：字符串，**MUST**
- `init_message_b64u`：字符串，**MUST**
- `first_message_embedded`：布尔值，**MAY**
- `session_policy_hint`：对象，**MAY**

其中 `init_message_b64u` 表示 suite 定义的初始建链消息，它 **MUST** 在密码学语义上绑定：

- `sender_did`
- `target.did`
- `session_id`
- `suite`
- `bundle_id`
- `security_profile = direct-e2ee`

并 **MAY** 内嵌首条 `application_plaintext`。

### 7.4 `ratchet_header`

当 `meta.content_type = "application/anp-direct-cipher+json"` 或 `application/anp-direct-control+json` 时，`body` **SHOULD** 包含 `ratchet_header`。

推荐字段：

- `dh_pub_b64u`：字符串，**SHOULD**
- `pn`：十进制字符串，**SHOULD**
- `n`：十进制字符串，**MUST**
- `header_extensions`：对象，**MAY**

### 7.5 `direct_cipher_object`

当 `meta.content_type = "application/anp-direct-cipher+json"` 时，`body` **MUST** 为 `direct_cipher_object`。

推荐字段：

- `session_id`：字符串，**MUST**
- `suite`：字符串，**MUST**
- `ratchet_header`：对象，**SHOULD**
- `ciphertext_b64u`：字符串，**MUST**
- `ciphertext_digest`：字符串，**MAY**

### 7.6 `direct_control_object`

当 `meta.content_type = "application/anp-direct-control+json"` 时，`body` **MUST** 为 `direct_control_object`。

推荐字段：

- `session_id`：字符串，**MUST**
- `suite`：字符串，**MUST**
- `control_type`：字符串，**MUST**，推荐值：`rekey`、`reset`、`close`、`error`、`ack-state`
- `ratchet_header`：对象，**MAY**
- `ciphertext_b64u`：字符串，**MUST**

---

## 8. 初始建链

### 8.1 总则

在以下任一场景中，发送方 **MUST** 发起新的初始建链或会话重建：

- 本地不存在面向目标 Agent 的可用 `direct-e2ee` 会话；
- 现有会话已被标记为 `closed` 或 `invalid`；
- 目标 Agent 要求切换到新的 suite；
- 本地策略要求主动重建。

### 8.2 使用 `direct.send` 承载初始建链

初始建链 **MUST** 使用：

- `method = "direct.send"`
- `meta.profile = "anp.direct.e2ee.v1"`
- `meta.security_profile = "direct-e2ee"`
- `meta.content_type = "application/anp-direct-init+json"`

### 8.3 初始建链请求要求

一个合规的初始建链请求 **MUST** 满足：

1. `meta.target.kind = "agent"`
2. `meta.sender_did` 与 `meta.target.did` 都存在
3. `meta.message_id` 与 `meta.operation_id` 存在
4. `body.session_id` 存在
5. `body.bundle_id` 引用一个已验证的 Prekey Bundle
6. `body.init_message_b64u` 存在

### 8.4 初始建链的接收方处理

接收方收到初始建链请求后 **MUST**：

1. 验证 `bundle_id` 是否仍可用；
2. 验证 `init_message_b64u` 的 suite、目标绑定和完整性；
3. 若使用了一次性材料，确保其只被消费一次或按 suite 语义安全地消费；
4. 建立新的 `Direct E2EE Session`；
5. 若内嵌了首条应用消息，则在会话建立成功后再解密和处理该应用消息。

### 8.5 初始建链成功响应

成功响应 **MUST** 至少包含：

- `accepted`：布尔值，且为 `true`
- `message_id`
- `operation_id`
- `target_did`
- `session_id`
- `accepted_at`

成功响应 **MAY** 包含：

- `session_status`，推荐值：`established`
- `suite`
- `needs_reply_init`：布尔值

---

## 9. 后续加密消息

### 9.1 使用 `direct.send` 承载加密消息

后续加密消息 **MUST** 使用：

- `method = "direct.send"`
- `meta.profile = "anp.direct.e2ee.v1"`
- `meta.security_profile = "direct-e2ee"`
- `meta.content_type = "application/anp-direct-cipher+json"`

### 9.2 请求要求

一个合规的加密消息请求 **MUST** 满足：

1. `body.session_id` 存在；
2. `body.suite` 与当前会话 suite 一致；
3. `body.ciphertext_b64u` 存在；
4. 若该 suite 需要头字段，则 `body.ratchet_header` **MUST** 存在；
5. `Application Plaintext` 在加密前 **MUST** 满足 Direct Base 的负载互斥规则。

### 9.3 接收方处理要求

接收方在处理加密消息时 **MUST**：

1. 定位 `session_id` 对应的活跃或可接受重叠会话；
2. 验证 `suite` 是否匹配；
3. 校验 `ratchet_header` 与当前状态的一致性；
4. 根据 ratchet 序号处理正常顺序、前跳和乱序；
5. 使用会话状态和 AAD 解密 `ciphertext_b64u`；
6. 解密后恢复 `Application Plaintext` 并按 Direct Base 语义处理。

### 9.4 重叠会话

为支持平滑重建，接收方 **MAY** 在有限窗口内保留多个与同一对等 Agent 相关的会话。

但在任一时刻，每个 `(sender_did, target_did, suite)` 维度：

- **SHOULD** 只有一个首选活跃会话；
- 较旧会话 **SHOULD** 被标记为 `superseded` 并在策略窗口结束后删除。

---

## 10. 受认证上下文与绑定要求

### 10.1 AAD 最小绑定集合

本 Profile 的 suite **MUST** 将以下字段纳入受认证上下文（或等价绑定上下文）：

- `meta.sender_did`
- `meta.target.did`
- `meta.profile`
- `meta.security_profile`
- `meta.message_id`
- `body.session_id`
- 内层 `application_content_type`

### 10.2 条件绑定字段

若以下字段存在，它们 **SHOULD** 一并进入受认证上下文：

- `conversation_id`
- `reply_to_message_id`
- `annotations`
- `attachment_manifest_digest`
- `operation_id`

### 10.3 禁止未绑定的安全降级

以下变化 **MUST NOT** 在未进入受认证上下文的情况下发生：

- suite 切换；
- `security_profile` 变化；
- `sender_did` / `target.did` 替换；
- `session_id` 替换；
- 内层应用内容类型替换。

---

## 11. 会话状态机

### 11.1 最小状态

一个 Direct E2EE Session **MUST** 至少支持以下状态：

- `pending`
- `active`
- `superseded`
- `closed`
- `invalid`

### 11.2 状态语义

- `pending`：已接收建链材料，但尚未完成本地提交；
- `active`：可用于收发后续消息；
- `superseded`：已被较新会话替代，但仍保留有限解密窗口；
- `closed`：正常关闭，不再用于新消息；
- `invalid`：状态冲突、密钥错误或策略拒绝导致不可继续使用。

### 11.3 会话重建

以下情况 **SHOULD** 触发会话重建：

- 收到 `direct_control_object` 中的 `reset` 或 `rekey`；
- 连续解密失败达到实现阈值；
- ratchet 状态严重分叉且无法恢复；
- 预期的 suite 或策略已变化。

---

## 12. 乱序、跳号与重放防护

### 12.1 状态型防重放

接收方 **MUST** 至少基于以下集合做重放防护：

- `session_id`
- `message_id`
- `ratchet_header.n`
- `ratchet_header.pn`（若存在）
- 密文或头字段摘要

### 12.2 跳号处理

实现方 **MUST** 支持一定范围内的跳号处理，并为此保存 `skipped message keys` 或 suite 等价状态。

实现方 **MUST** 定义并公开：

- `MAX_SKIP`
- 每会话保留的最大 skipped key 数量
- skipped key 的删除策略

### 12.3 过大前跳

若接收方观察到超出本地 `MAX_SKIP` 的前跳，**MUST**：

- 拒绝该消息，或
- 将会话标记为需要重建

并 **SHOULD** 返回 `direct.e2ee.reset_required` 或等价错误。

### 12.4 时间戳规则

`created_at` **MAY** 用于：

- 日志
- 审计
- 本地清理策略
- 软过期提示

`created_at` **MUST NOT** 作为唯一的 anti-replay 条件。

---

## 13. 安全与策略

### 13.1 强制安全模式

若目标 Agent 或其策略要求 `direct-e2ee`：

- 发送方 **MUST** 使用本 Profile；
- 目标服务收到 `transport-protected` 的 `direct.send` 时 **MUST** 拒绝；
- 目标服务 **MUST NOT** 静默回落到弱安全模式。

### 13.2 内容类型分层

外层 `meta.content_type` **MUST** 表示“承载对象类型”，例如：

- `application/anp-direct-init+json`
- `application/anp-direct-cipher+json`
- `application/anp-direct-control+json`

真正的业务内容类型 **MUST** 在加密前的 `application_plaintext.application_content_type` 中表达，并受到密码学保护。

### 13.3 不透明负载原则

除非实现同时承担目标 Agent 的终端解密职责，中间服务 **SHOULD** 将 `direct_init_object`、`direct_cipher_object`、`direct_control_object` 视为不透明对象，不理解其内部业务语义。

---

## 14. Profile 特定错误（推荐）

在沿用 ANP Core 公共错误模型的前提下，本 Profile 推荐以下 `anp_code`：

| `code` | `anp_code` | 含义 |
|---|---|---|
| 4000 | `direct.e2ee.bundle_not_found` | 未找到可用的 Prekey Bundle |
| 4001 | `direct.e2ee.bundle_expired` | Prekey Bundle 已过期或不可用 |
| 4002 | `direct.e2ee.invalid_bundle` | Prekey Bundle 验证失败 |
| 4003 | `direct.e2ee.session_not_found` | 未找到对应会话 |
| 4004 | `direct.e2ee.session_conflict` | 会话状态冲突 |
| 4005 | `direct.e2ee.bad_ratchet_header` | ratchet 头字段非法 |
| 4006 | `direct.e2ee.replay_detected` | 检测到重放 |
| 4007 | `direct.e2ee.decrypt_failed` | 解密失败 |
| 4008 | `direct.e2ee.reset_required` | 需要重建会话 |
| 4009 | `direct.e2ee.invalid_security_binding` | 安全绑定字段不一致 |

---

## 15. 最小互通要求

一个符合本 Profile 的实现至少 **MUST** 支持：

1. `direct.e2ee.publish_prekey_bundle`
2. `direct.e2ee.get_prekey_bundle`
3. 通过 `direct.send` 承载 `application/anp-direct-init+json`
4. 通过 `direct.send` 承载 `application/anp-direct-cipher+json`
5. 至少一个已注册的 Direct E2EE suite
6. 至少一个活跃会话与有限会话重叠窗口
7. 基于 `session_id + message_id + ratchet state` 的状态型防重放
8. 跳号与 `MAX_SKIP` 处理

---

## 16. 示例

### 16.1 获取 Prekey Bundle

```json
{
  "jsonrpc": "2.0",
  "id": "req-50001",
  "method": "direct.e2ee.get_prekey_bundle",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.direct.e2ee.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:agent-a",
      "operation_id": "op-50001",
      "created_at": "2026-03-29T12:00:00Z"
    },
    "body": {
      "target_did": "did:example:agent-b",
      "preferred_suite": "anp-direct-pq-v1"
    }
  }
}
```

### 16.2 初始建链消息

```json
{
  "jsonrpc": "2.0",
  "id": "req-50002",
  "method": "direct.send",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.direct.e2ee.v1",
      "security_profile": "direct-e2ee",
      "sender_did": "did:example:agent-a",
      "target": {
        "kind": "agent",
        "did": "did:example:agent-b"
      },
      "operation_id": "op-50002",
      "message_id": "msg-50002",
      "created_at": "2026-03-29T12:01:00Z",
      "content_type": "application/anp-direct-init+json"
    },
    "body": {
      "session_id": "sess-abc-001",
      "suite": "anp-direct-pq-v1",
      "bundle_id": "bundle-b-20260329-01",
      "init_message_b64u": "BASE64URL_INIT_MESSAGE",
      "first_message_embedded": true
    }
  }
}
```

### 16.3 后续加密消息

```json
{
  "jsonrpc": "2.0",
  "id": "req-50003",
  "method": "direct.send",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.direct.e2ee.v1",
      "security_profile": "direct-e2ee",
      "sender_did": "did:example:agent-a",
      "target": {
        "kind": "agent",
        "did": "did:example:agent-b"
      },
      "operation_id": "op-50003",
      "message_id": "msg-50003",
      "created_at": "2026-03-29T12:02:00Z",
      "content_type": "application/anp-direct-cipher+json"
    },
    "body": {
      "session_id": "sess-abc-001",
      "suite": "anp-direct-pq-v1",
      "ratchet_header": {
        "dh_pub_b64u": "BASE64URL_DH_PUB",
        "pn": "4",
        "n": "1"
      },
      "ciphertext_b64u": "BASE64URL_CIPHERTEXT"
    }
  }
}
```

---

## 附录 A（信息性）：参考规范

- ANP Profile 1：Core Binding Profile（草案）
- ANP Profile 2：Identity and Discovery Profile（草案）
- ANP Profile 3：Direct Messaging Base Profile（草案）
- Signal: PQXDH
- Signal: Double Ratchet
