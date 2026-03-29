# ANP Profile 3：Direct Messaging Base Profile（草案）

- 文档编号：ANP-P3
- 标题：Direct Messaging Base Profile
- 状态：Draft
- 版本：0.1.0
- 语言：中文
- 适用范围：本 Profile 适用于 Agent 与 Agent 之间的基础私聊语义，不包含端到端加密算法本身。

---

## 1. 目的

本 Profile 定义 ANP 的私聊基础语义层，规定：

1. Agent 到 Agent 的直接消息如何表示；
2. 私聊消息的最小互通字段与内容模型；
3. 私聊消息的成功语义、幂等语义与排序语义；
4. 在非 E2EE 模式下，私聊消息如何独立运行；
5. Direct E2EE Profile 如何在本 Profile 的业务语义之上叠加。

本 Profile **不**定义：

- 具体 E2EE 算法；
- 设备或内部副本概念；
- 历史拉取；
- 已读状态；
- Presence；
- Agent 内部同步；
- 大对象密文格式。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

- **Direct Message**：一个 Agent 发往另一个 Agent 的应用层消息。
- **Sender Agent**：发起 `direct.send` 的 Agent，由 `sender_did` 标识。
- **Recipient Agent**：`direct.send` 的目标 Agent，由 `target.did` 标识。
- **Ingress Service**：目标 Agent 对外暴露的主入口服务，用于接收直接消息。
- **Conversation**：发送方和接收方之间的应用层会话上下文；是否存在稳定 `conversation_id` 由业务层决定。
- **Accepted**：消息已被目标 Agent 的入口服务接受并进入其处理边界。
- **Rejected**：消息在协议层被拒绝，未进入目标 Agent 的处理边界。

---

## 3. 设计原则

### 3.1 Agent 是协议终点

ANP Direct Messaging 的协议终点是 Agent，而非设备、终端、会话副本或内部执行单元。

只要目标 Agent 的入口服务接受了该消息，本 Profile 的投递使命即告完成。目标 Agent 内部如何同步到多少个副本、多少个执行器或多少个设备，不属于本 Profile 的互通范围。

### 3.2 Base 语义与 Security Overlay 分离

本 Profile 仅定义业务语义与消息语义；若后续叠加 Direct E2EE Profile，则：

- 业务动作仍然是 `direct.send`；
- 私聊对象仍然是 `sender_did -> recipient_did`；
- 内容类型和应用语义仍由本 Profile 定义；
- 额外的密码学对象、会话状态与安全绑定由 E2EE Profile 定义。

### 3.3 最小成功语义

本 Profile 中，一次 `direct.send` 的成功不意味着：

- 目标 Agent 已处理应用负载；
- 目标 Agent 已持久化该消息；
- 目标 Agent 已转发到内部任意副本；
- 目标 Agent 已向任何人类用户展示该消息。

本 Profile 中，一次 `direct.send` 的成功仅表示：

- 目标 Agent 的入口服务已接受该消息；
- 该消息已进入目标 Agent 的协议处理边界。

### 3.4 非目标

本 Profile **不**尝试提供：

- 端到端机密性；
- 多设备一致性；
- 全局严格顺序；
- 历史可重放语义；
- 设备级送达证明。

---

## 4. Profile 标识与依赖

### 4.1 Profile 名称

本 Profile 的标准名称为：

`anp.direct.base.v1`

### 4.2 依赖关系

本 Profile **MUST** 依赖以下 Profile：

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`

### 4.3 安全模式

本 Profile 作为独立运行的基础私聊 Profile 时：

- `meta.profile` **MUST** 等于 `anp.direct.base.v1`
- `meta.security_profile` **MUST** 等于 `transport-protected`

若后续某 Direct E2EE Overlay 复用本 Profile 的业务动作与应用语义，则：

- 对应 Profile **MUST** 明确说明如何在 `direct.send` 语义之上叠加安全对象；
- 接收方 **MUST NOT** 在未显式协商的情况下，从高安全模式静默降级到 `transport-protected`。

---

## 5. 直接寻址与会话模型

### 5.1 目标类型

`direct.send` 的 `meta.target.kind` **MUST** 为 `"agent"`。

`meta.target.did` **MUST** 是一个可解析的 `agent_did`。

若 `target.kind` 不是 `"agent"`，接收方 **MUST** 返回 `anp.invalid_params_shape` 或更具体的业务错误。

### 5.2 发送方与接收方

一次 `direct.send`：

- **MUST** 只有一个发送方 Agent；
- **MUST** 只有一个接收方 Agent；
- **MUST NOT** 直接面向多个目标 Agent 广播。

若调用方希望同时向多个 Agent 发送相同内容，**MUST** 发送多次独立的 `direct.send`。

### 5.3 `conversation_id`

本 Profile **MAY** 使用 `conversation_id` 表示发送方与接收方之间的应用层上下文。

若存在 `conversation_id`：

- 它 **MUST** 是字符串；
- 它 **MUST NOT** 被解释为设备、会话副本或内部执行器标识；
- 它 **MAY** 由发送方生成，或由双方业务逻辑协商确定；
- 它 **MUST NOT** 作为唯一安全上下文或防重放标识。

### 5.4 Agent 内部实现不可见

接收方的以下内部细节 **MUST NOT** 暴露为线协议互通语义：

- 内部队列数；
- 内部副本数；
- 内部工作流节点数；
- 内部设备数；
- 内部转发路径。

---

## 6. 内容模型

### 6.1 内容类型

`direct.send` 的 `meta.content_type` **MUST** 存在。

本 Profile 最小互通 **MUST** 支持以下内容类型：

- `text/plain`
- `application/json`
- `application/anp-attachment-manifest+json`

实现方 **MAY** 支持更多内容类型，但：

- 未注册或未协商的内容类型 **SHOULD** 被拒绝；
- 接收方 **MUST** 对不支持的内容类型返回 `anp.unsupported_content_type`。

### 6.2 `body` 结构

`direct.send` 的 `body` **MUST** 是对象，并可包含以下字段：

#### 6.2.1 `conversation_id`

- 类型：字符串
- 要求：**MAY**
- 语义：应用层会话上下文标识

#### 6.2.2 `reply_to_message_id`

- 类型：字符串
- 要求：**MAY**
- 语义：表示该消息回复的上一条消息

#### 6.2.3 `annotations`

- 类型：对象
- 要求：**MAY**
- 语义：发送方自定义的应用层附加元数据
- 规则：
  - 中继服务 **MUST NOT** 擅自改写；
  - 未识别字段 **MAY** 被接收方忽略。

#### 6.2.4 `text`

- 类型：字符串
- 要求：当 `content_type = "text/plain"` 时 **MUST**
- 规则：
  - 使用 `text` 时，`payload` 与 `payload_b64u` **MUST NOT** 同时出现。

#### 6.2.5 `payload`

- 类型：对象
- 要求：当 `content_type` 为 JSON 类型时 **MUST**
- 规则：
  - `payload` **SHOULD** 直接表示应用对象；
  - **MUST NOT** 采用“JSON 字符串中再嵌 JSON”的双重序列化。

#### 6.2.6 `payload_b64u`

- 类型：字符串
- 要求：当内容为二进制扩展或私有扩展对象时 **MAY**
- 规则：
  - 必须为无填充 base64url；
  - 使用 `payload_b64u` 时，`text` 与 `payload` **MUST NOT** 同时出现。

### 6.3 负载字段互斥规则

在 `direct.send` 中，`text`、`payload`、`payload_b64u` 三者中：

- **MUST** 恰好出现一个；
- 若出现多个，接收方 **MUST** 拒绝请求；
- 若三者均不存在，接收方 **MUST** 拒绝请求。

---

## 7. 标准方法

### 7.1 `direct.send`

#### 7.1.1 语义

`direct.send` 表示发送方 Agent 向目标 Agent 发送一条直接消息。

#### 7.1.2 请求要求

一个合规的 `direct.send` 请求 **MUST** 满足：

1. `method = "direct.send"`
2. `meta.profile = "anp.direct.base.v1"`
3. `meta.security_profile = "transport-protected"`
4. `meta.sender_did` **MUST** 存在
5. `meta.target.kind = "agent"`
6. `meta.target.did` **MUST** 存在
7. `meta.operation_id` **MUST** 存在
8. `meta.message_id` **MUST** 存在
9. `meta.content_type` **MUST** 存在
10. `body` **MUST** 满足本 Profile 的内容互斥规则

#### 7.1.3 成功响应

成功响应的 `result` **MUST** 至少包含：

- `accepted`：布尔值，且 **MUST** 为 `true`
- `message_id`：与请求中的 `meta.message_id` 一致
- `operation_id`：与请求中的 `meta.operation_id` 一致
- `target_did`：目标 Agent DID
- `accepted_at`：RFC 3339 时间字符串

成功响应 **MAY** 包含：

- `conversation_id`
- `delivery_state`（推荐值：`"accepted"`）
- `policy_ref`
- `routing_hint`

#### 7.1.4 失败条件

在以下情况下，接收方 **MUST** 拒绝 `direct.send`：

- 目标 DID 不存在或不可达；
- 调用方未认证或无权限代表 `sender_did` 发起请求；
- 内容类型不被支持；
- 请求体不符合内容互斥规则；
- 目标策略禁止该消息；
- 请求违反安全模式要求。

### 7.2 `direct.incoming`（可选 Notification）

#### 7.2.1 语义

`direct.incoming` 是一个可选的异步通知，用于已建立双向连接的场景中，由某 ANP Endpoint 向目标 Agent 推送一条已被接受的直接消息。

#### 7.2.2 使用范围

- 该方法 **MAY** 使用；
- 它是传输便利能力，不改变 `direct.send` 的成功语义；
- 即使不支持 `direct.incoming`，实现仍然可以是本 Profile 合规实现。

#### 7.2.3 约束

- `direct.incoming` **MUST** 作为 Notification 发送；
- 接收方 **MUST NOT** 对其返回 JSON-RPC Response；
- 其 `params` 结构 **SHOULD** 与 `direct.send` 的业务对象保持一致。

---

## 8. 投递、幂等与排序语义

### 8.1 接受语义

一次 `direct.send` 返回成功，仅表示：

- 目标 Agent 的入口服务已接受该消息；
- 发送方可停止对同一 `operation_id` 的重试，除非本地策略另有要求。

### 8.2 幂等与去重

接收方 **MUST** 基于以下最小集合进行幂等判断：

- `sender_did`
- `target.did`
- `method`
- `operation_id`

对于消息级重复，接收方 **SHOULD** 进一步基于：

- `sender_did`
- `target.did`
- `message_id`

进行重复识别。

### 8.3 排序语义

本 Profile **不**提供全局严格顺序保证。

对于直接消息：

- 实现方 **MAY** 在同一 `conversation_id` 内做 best-effort 顺序处理；
- 但跨域互通层 **MUST NOT** 假设网络或服务会天然提供严格 FIFO；
- 若后续安全 Overlay 需要更强排序约束，必须由 Overlay 自身定义计数器或会话态机制。

### 8.4 重试

发送方在重试同一消息时：

- `operation_id` **MUST** 保持不变；
- `message_id` **MUST** 保持不变；
- 业务负载 **MUST** 保持语义等价。

若重试时负载语义改变，则发送方 **MUST** 视为新的消息与新的操作。

---

## 9. 安全与策略

### 9.1 传输保护要求

本 Profile 在独立运行时，**MUST** 依赖经过认证的安全传输层。未受保护的裸 HTTP、裸 WebSocket 或其它未认证信道 **MUST NOT** 使用。

### 9.2 发送方鉴权

接收方服务 **SHOULD** 验证调用方是否有权代表 `meta.sender_did` 发起该请求。

若验证失败，接收方 **MUST** 返回：

- `anp.unauthorized`，或
- `anp.forbidden`

### 9.3 安全模式升级与降级

若某 Agent 的策略要求 `direct-e2ee`：

- 发送方 **MUST** 使用对应的 Direct E2EE Profile；
- 接收方收到 `transport-protected` 的 `direct.send` 时 **MUST** 拒绝；
- 接收方 **MUST NOT** 在未显式协商的情况下静默接受较弱安全模式。

### 9.4 与 Overlay 的绑定点

后续 Direct E2EE Overlay **SHOULD** 至少将以下字段纳入受认证上下文：

- `sender_did`
- `target.did`
- `message_id`
- `conversation_id`（若存在）
- `content_type`
- `security_profile`

---

## 10. 隐私注意事项

### 10.1 最小元数据原则

发送方 **SHOULD** 只发送实现互通所必需的最小元数据。

### 10.2 不暴露内部拓扑

任何实现 **MUST NOT** 通过本 Profile 暴露：

- 内部设备数量；
- 内部副本数量；
- 内部工作流拓扑；
- 内部投递路径。

### 10.3 中继最小知情

中继或入口服务 **SHOULD** 仅检查协议互通所必需的最小字段；
若应用负载不需要被其理解，则 **SHOULD** 将其视为不透明负载。

---

## 11. Profile 特定错误（推荐）

在沿用 ANP Core 公共错误模型的前提下，本 Profile 推荐以下 `anp_code`：

| `code` | `anp_code` | 含义 |
|---|---|---|
| 2000 | `direct.recipient_unreachable` | 目标 Agent 暂不可达 |
| 2001 | `direct.policy_violation` | 目标策略拒绝该消息 |
| 2002 | `direct.invalid_payload_shape` | 私聊负载结构非法 |
| 2003 | `direct.conversation_conflict` | 会话上下文冲突 |
| 2004 | `direct.security_mode_required` | 目标要求更高安全模式 |

这些错误码为推荐扩展；实现方 **MAY** 返回更通用的 ANP Core 错误码，但 **SHOULD** 在 `error.data.anp_code` 中保留可机器识别的语义。

---

## 12. 最小互通要求

一个符合本 Profile 的实现至少 **MUST** 支持：

1. `direct.send`
2. `target.kind = "agent"`
3. `text/plain`
4. `application/json`
5. `application/anp-attachment-manifest+json`
6. `text` / `payload` / `payload_b64u` 的互斥规则
7. `message_id` 与 `operation_id` 的幂等处理
8. 基于安全传输的运行方式

---

## 13. 示例

### 13.1 文本消息示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-20001",
  "method": "direct.send",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.direct.base.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:agent-a",
      "target": {
        "kind": "agent",
        "did": "did:example:agent-b"
      },
      "operation_id": "op-20001",
      "message_id": "msg-20001",
      "created_at": "2026-03-29T12:00:00Z",
      "content_type": "text/plain"
    },
    "body": {
      "conversation_id": "conv-01",
      "text": "hello from agent-a"
    }
  }
}
```

成功响应示例：

```json
{
  "jsonrpc": "2.0",
  "id": "req-20001",
  "result": {
    "accepted": true,
    "message_id": "msg-20001",
    "operation_id": "op-20001",
    "target_did": "did:example:agent-b",
    "accepted_at": "2026-03-29T12:00:01Z",
    "delivery_state": "accepted"
  }
}
```

### 13.2 附件清单示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-20002",
  "method": "direct.send",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.direct.base.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:agent-a",
      "target": {
        "kind": "agent",
        "did": "did:example:agent-b"
      },
      "operation_id": "op-20002",
      "message_id": "msg-20002",
      "created_at": "2026-03-29T12:05:00Z",
      "content_type": "application/anp-attachment-manifest+json"
    },
    "body": {
      "payload": {
        "object_uri": "https://objects.example.com/o/abc",
        "mime_type": "application/pdf",
        "size": "1048576",
        "digest": "sha256-...",
        "filename": "report.pdf"
      }
    }
  }
}
```

---

## 14. 注册表占位

本标准后续版本 **SHOULD** 建立以下注册表：

1. Direct 内容类型扩展注册表；
2. Direct 业务错误码注册表；
3. Direct 注解字段注册表。

---

## 15. 参考实现说明（非规范性）

实现方在落地本 Profile 时，宜把它视为：

- 私聊的业务语义层；
- Direct E2EE Overlay 的承载层；
- Agent 之间最小可互通的消息交换层。

是否存在本地缓存、内部工作队列、内部副本、内部人机界面，均不影响本 Profile 的互通语义。
