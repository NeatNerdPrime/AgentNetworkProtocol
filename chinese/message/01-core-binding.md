# ANP Profile 1：Core Binding Profile（草案）

- 文档编号：ANP-P1
- 标题：Core Binding Profile
- 状态：Draft
- 版本：0.1.0
- 语言：中文
- 适用范围：本 Profile 适用于所有 ANP 基础 Profile 与安全 Overlay Profile。

---

## 1. 目的

本 Profile 定义 ANP 的统一外层消息绑定、通用字段、能力协商、错误模型以及互操作约束。

本 Profile 的目标是：

1. 为所有 ANP 方法提供统一的消息信封；
2. 避免不同业务 Profile 重复发明请求、响应、通知和错误格式；
3. 为后续 Direct Base、Group Base、Direct E2EE、Group E2EE、Attachment、Federation 等 Profile 提供共同基础；
4. 在保留 JSON-RPC 2.0 基本兼容性的前提下，收紧可选自由度，降低跨实现歧义。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

- **ANP Endpoint**：实现 ANP 的协议端点，通常是 Agent 所在域的入口服务、群 Host 服务或其它经声明的服务端点。
- **Request**：具有 `id` 的 JSON-RPC 调用对象。
- **Notification**：不具有 `id` 的 JSON-RPC 调用对象。
- **Result**：成功响应对象中的 `result` 成员。
- **Error**：失败响应对象中的 `error` 成员。
- **Profile**：ANP 的协议能力单元，例如 `anp.direct.base.v1`。
- **Security Profile**：ANP 的安全语义单元，例如 `transport-protected`、`direct-e2ee`、`group-e2ee`。
- **Operation**：一次可被幂等识别的协议动作，例如发送消息、建群、加人、提交群状态变更。
- **Message-bearing Operation**：携带应用层消息负载的操作，例如 `direct.send`、`group.send`。
- **Control Operation**：不携带应用层业务消息，而是改变协议或业务状态的操作，例如 `group.create`、`group.add`、`group.remove`。

---

## 3. 设计原则

### 3.1 分层原则

ANP 采用如下分层：

1. **Transport 层**：HTTP(S)、WebSocket Secure 等安全传输；
2. **Binding 层**：本 Profile 定义的 JSON-RPC 2.0 绑定；
3. **Business 层**：Direct Base、Group Base 等业务语义；
4. **Security Overlay 层**：Direct E2EE、Group E2EE 等安全语义；
5. **Media/Object 层**：Attachment 等大对象扩展。

### 3.2 最小互通原则

不同实现只要满足本 Profile 约束，即可共享相同的：

- 请求/响应格式；
- 通知格式；
- 通用字段语义；
- 能力协商方式；
- 错误模型；
- 幂等处理原则。

### 3.3 非目标

本 Profile **不**定义以下能力：

- 历史拉取；
- 已读状态；
- 设备同步；
- 在线状态；
- 内部副本一致性；
- 具体 E2EE 算法。

这些能力必须由其它 Profile 定义，或明确声明为超出 ANP 标准范围。

---

## 4. 绑定基础

### 4.1 JSON-RPC 版本

ANP Core Binding **MUST** 使用 JSON-RPC 2.0。

每个请求对象和响应对象中的 `jsonrpc` 成员 **MUST** 精确等于字符串 `"2.0"`。

### 4.2 安全传输要求

所有 ANP 绑定 **MUST** 运行在经过认证的安全传输层之上，例如：

- HTTPS；
- WSS；
- 其它能够提供机密性、完整性与对端认证的安全信道。

本 Profile 不允许在未认证、未加密的裸传输上运行。

### 4.3 传输无关性

本 Profile 在逻辑上是传输无关的；HTTP(S) 与 WSS 是推荐绑定，但不是唯一允许的绑定。  
任意新绑定只要不改变本 Profile 的消息对象语义，即 **MAY** 被定义为补充绑定文档。

---

## 5. JSON-RPC 互操作约束

本节定义 ANP 对 JSON-RPC 2.0 的收紧规则。

### 5.1 `params` 形式

JSON-RPC 原规范允许 `params` 采用按位置数组或按名称对象。  
ANP 中，`params` **MUST** 为对象；**MUST NOT** 使用数组形式。  
若收到数组形式 `params`，接收方 **MUST** 返回 `anp.invalid_params_shape` 错误。

### 5.2 `id` 类型

JSON-RPC 原规范允许 `id` 为字符串、数字或 `null`。  
ANP 中，Request 的 `id` **MUST** 为非空字符串。  
ANP Request **MUST NOT** 使用数字 `id`。  
ANP Request **MUST NOT** 使用 `null` 作为 `id`。  
若收到不符合要求的 `id`，接收方 **MUST** 返回 `anp.invalid_request_id`。

### 5.3 Notification 使用范围

ANP 中，Notification **仅**用于以下场景：

1. 对端主动推送的异步事件；
2. 不要求确认、也不应返回错误详情的单向提示。

以下操作 **MUST NOT** 使用 Notification：

- 改变持久状态的控制操作；
- 需要幂等确认的消息发送；
- 需要调用方感知成功或失败的任何操作。

### 5.4 Batch 禁止

JSON-RPC 的 batch 调用在 ANP 中 **MUST NOT** 使用。  
客户端 **MUST NOT** 发送 batch。  
服务端收到 batch 时 **MUST** 拒绝，并返回 `anp.batch_not_supported`。

### 5.5 方法名约束

方法名 **MUST** 为字符串，并遵循以下命名规则：

- 采用反向域无关的逻辑命名空间；
- 以小写字母开头；
- 段间使用 `.` 分隔；
- 方法名 **MUST NOT** 以 `rpc.` 开头；
- 业务方法 **SHOULD** 使用 `<domain>.<action>` 风格。

推荐示例：

- `anp.get_capabilities`
- `direct.send`
- `group.create`
- `group.add`
- `group.send`

### 5.6 响应约束

除 Notification 外，服务端 **MUST** 对每个 Request 返回一个 Response。  
成功响应 **MUST** 含有 `result`，且 **MUST NOT** 含有 `error`。  
失败响应 **MUST** 含有 `error`，且 **MUST NOT** 含有 `result`。  
Response 的 `id` **MUST** 与对应 Request 的 `id` 完全一致。

---

## 6. 通用 `params` 结构

为减少跨方法歧义，ANP 定义统一的 `params` 顶层结构。

### 6.1 顶层对象

除某些明确例外的方法外，ANP 的 `params` **MUST** 采用如下结构：

```json
{
  "meta": { ... },
  "auth": { ... },
  "body": { ... }
}
```

其中：

- `meta`：通用元数据，承载版本、目标、幂等、安全模式等；
- `auth`：可选的认证与证明对象；只有当具体 Profile 明确要求时才出现；
- `body`：方法特定参数。

若某具体 Profile 未定义 `auth`，则调用方 **MAY** 省略它。若某具体 Profile 明确要求 `auth`，则调用方 **MUST** 提供且接收方 **MUST** 验证。除 `meta`、`auth`、`body` 之外的顶层 `params` 成员，只有在对应 Profile 明确定义时才允许出现。

### 6.2 `meta` 对象

`meta` 对象字段定义如下：

#### 6.2.1 `anp_version`

- 类型：字符串
- 要求：**MUST**
- 语义：ANP 协议版本标识
- 示例：`"1.0"`

#### 6.2.2 `profile`

- 类型：字符串
- 要求：**MUST**
- 语义：本次调用所采用的业务或安全 Profile 名称
- 示例：
  - `"anp.direct.base.v1"`
  - `"anp.group.base.v1"`
  - `"anp.direct.e2ee.v1"`
  - `"anp.group.e2ee.v1"`

#### 6.2.3 `security_profile`

- 类型：字符串
- 要求：**MUST**
- 语义：本次调用的安全模式
- 允许值：
  - `"transport-protected"`
  - `"direct-e2ee"`
  - `"group-e2ee"`
- 说明：具体可扩展值由后续 Profile 注册。

#### 6.2.4 `sender_did`

- 类型：字符串（DID）
- 要求：除匿名公共发现能力外，**MUST**
- 语义：本次操作的发送方或发起方 Agent DID

#### 6.2.5 `target`

- 类型：对象
- 要求：目标存在时 **MUST**
- 结构：

```json
{
  "kind": "agent | group | service",
  "did": "did:example:..."
}
```

- 说明：
  - `kind = "agent"` 表示目标为单个 Agent；
  - `kind = "group"` 表示目标为群组；
  - `kind = "service"` 表示目标为某个服务端点或服务 DID，常见于联邦 / Relay / 对象服务控制面；
  - 建群前的 `group.create` 等操作可省略 `target`，由 `body` 返回新群 DID。

#### 6.2.6 `operation_id`

- 类型：字符串
- 要求：所有会改变状态的操作 **MUST**
- 语义：本次操作的幂等标识
- 规则：
  - 同一发起方在同一语义上下文中重试时，`operation_id` **MUST** 保持不变；
  - 服务端 **MUST** 基于 `sender_did + operation_id + method` 进行幂等判定。

#### 6.2.7 `message_id`

- 类型：字符串
- 要求：Message-bearing Operation **MUST**
- 语义：应用层消息标识
- 说明：`message_id` 与 `operation_id` 可以相同，也可以不同；若不同，必须在实现中保持稳定映射。

#### 6.2.8 `created_at`

- 类型：字符串（RFC 3339 时间）
- 要求：**SHOULD**
- 语义：发起方创建该操作的时间戳
- 说明：除非后续 Profile 另有规定，`created_at` 不得作为唯一的防重放依据。

#### 6.2.9 `trace_id`

- 类型：字符串
- 要求：**MAY**
- 语义：跨服务追踪标识
- 说明：`trace_id` 不得参与任何安全语义。

#### 6.2.10 `content_type`

- 类型：字符串
- 要求：Message-bearing Operation **MUST**
- 语义：应用层负载类型
- 示例：
  - `"text/plain"`
  - `"application/json"`
  - `"application/anp-attachment-manifest+json"`
  - `"application/anp-direct-cipher+json"`
  - `"application/anp-group-cipher+mls"`

### 6.3 `body` 对象

`body` 对象为方法特定参数集合：

- 业务 Profile **MUST** 定义其字段；
- 安全 Overlay Profile **MUST** 定义其密码学字段；
- 未识别字段 **MAY** 被忽略或拒绝，具体由对应 Profile 说明。

---

## 7. 负载表示规则

### 7.1 JSON 对象优先

凡能够自然表达为 JSON 对象的业务对象，**SHOULD** 直接以 JSON 对象表示。  
ANP **MUST NOT** 采用“在 JSON 字符串中再嵌 JSON”的双重序列化作为默认做法。

### 7.2 二进制表示

需要传输二进制负载时，字段 **MUST** 采用无填充 base64url 文本表示。  
相关字段名 **SHOULD** 以 `_b64u` 结尾，例如：

- `ciphertext_b64u`
- `key_package_b64u`
- `welcome_b64u`

### 7.3 数值表示

为避免不同语言对大整数、计数器、序号的表示差异，以下字段 **MUST** 采用十进制字符串表示：

- 计数器；
- 序列号；
- 逻辑时钟；
- epoch；
- generation；
- 大整数长度；
- 任何可能超过 IEEE 754 双精度安全整数范围的数值。

如果后续安全 Profile 需要对 JSON 做规范化签名，必须明确定义签名输入的序列化规则。  
除非后续 Profile 明确要求，本 Profile 不对传输层 JSON 规定统一规范化算法。

---

## 8. 能力协商

### 8.1 总则

ANP Endpoint **MUST** 暴露能力协商接口。  
能力协商的结果 **MUST** 至少包括：

- 支持的 ANP Profile 列表；
- 支持的 Security Profile 列表；
- 支持的内容类型；
- 推荐的服务端点角色；
- 实现约束（如最大负载、最大对象大小、节流策略等）。

### 8.2 标准方法：`anp.get_capabilities`

#### 8.2.1 请求

```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "anp.get_capabilities",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.core.binding.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:alice",
      "operation_id": "op-cap-001",
      "created_at": "2026-03-29T12:00:00Z"
    },
    "body": {}
  }
}
```

#### 8.2.2 成功响应

```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "result": {
    "service_did": "did:example:service",
    "supported_profiles": [
      "anp.core.binding.v1",
      "anp.direct.base.v1",
      "anp.group.base.v1",
      "anp.direct.e2ee.v1"
    ],
    "supported_security_profiles": [
      "transport-protected",
      "direct-e2ee"
    ],
    "supported_content_types": [
      "text/plain",
      "application/json",
      "application/anp-attachment-manifest+json"
    ],
    "limits": {
      "max_request_bytes": "1048576",
      "max_message_bytes": "262144"
    }
  }
}
```

### 8.3 协商规则

- 调用方 **MUST** 在首次交互前，或在缓存过期后，获取目标服务能力；
- 如果请求中的 `profile` 或 `security_profile` 不被支持，服务端 **MUST** 返回明确错误；
- 调用方 **MUST NOT** 假定“对方支持 Base Profile 就一定支持 E2EE Overlay”。

---

## 9. 幂等与重试

### 9.1 幂等原则

所有状态改变型操作 **MUST** 支持幂等。  
同一 `(sender_did, method, operation_id)` 的重复请求：

- 若语义等价，服务端 **MUST** 返回同一结果或等价结果；
- 若语义冲突，服务端 **MUST** 返回 `anp.idempotency_conflict`。

### 9.2 消息重试

对于消息发送类操作：

- 重试时 `message_id` **MUST** 保持不变；
- 重试时 `operation_id` **MUST** 保持不变；
- 服务端 **MUST** 以 `message_id` 和 `operation_id` 联合去重。

### 9.3 非幂等操作

如果某操作天生不可幂等，对应 Profile **MUST** 明确标注，并给出替代补救机制。  
未明确标注者，一律视为必须可幂等。

---

## 10. 错误模型

### 10.1 总则

ANP 使用 JSON-RPC 的 `error` 对象承载错误。  
ANP **保留** JSON-RPC 标准错误码原语义，同时定义 ANP 自身的应用错误编码。

### 10.2 ANP 错误对象扩展

`error` 对象建议结构：

```json
{
  "code": 1001,
  "message": "Unsupported profile",
  "data": {
    "anp_code": "anp.unsupported_profile",
    "retryable": false,
    "details": { }
  }
}
```

### 10.3 ANP 公共错误码

| `code` | `anp_code` | 含义 |
|---|---|---|
| 1000 | `anp.invalid_request_id` | `id` 非法 |
| 1001 | `anp.unsupported_profile` | 不支持所请求的 Profile |
| 1002 | `anp.unsupported_security_profile` | 不支持所请求的安全模式 |
| 1003 | `anp.invalid_params_shape` | `params` 结构不符合要求 |
| 1004 | `anp.batch_not_supported` | 不支持 batch |
| 1005 | `anp.unauthorized` | 未通过认证 |
| 1006 | `anp.forbidden` | 已认证但无权限 |
| 1007 | `anp.target_not_found` | 目标 DID 不存在或不可达 |
| 1008 | `anp.idempotency_conflict` | 幂等键冲突 |
| 1009 | `anp.unsupported_content_type` | 不支持内容类型 |
| 1010 | `anp.delivery_rejected` | 目标服务拒绝接收 |
| 1011 | `anp.rate_limited` | 触发限流 |
| 1012 | `anp.temporarily_unavailable` | 服务暂时不可用 |
| 1013 | `anp.invalid_security_binding` | 安全模式与负载结构不匹配 |

### 10.4 错误返回要求

- 服务端 **SHOULD** 尽量返回可机器判定的 `anp_code`；
- `message` **SHOULD** 简短、可读；
- `data.retryable` **SHOULD** 明确可否重试；
- 任何错误 **MUST NOT** 泄露不必要的敏感内部状态。

---

## 11. 方法注册与命名空间

### 11.1 命名空间

建议使用如下一级命名空间：

- `anp.*`
- `direct.*`
- `group.*`
- `attachment.*`
- `federation.*`

### 11.2 版本管理

Profile 名称 **MUST** 显式带版本，例如：

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`
- `anp.direct.base.v1`

### 11.3 扩展方法

实现方 **MAY** 定义私有扩展方法，但：

- **MUST NOT** 与标准方法同名；
- **SHOULD** 使用私有前缀；
- **MUST NOT** 假定其它实现理解这些方法。

---

## 12. 兼容性与版本演进

### 12.1 前向兼容

接收方对于未知的 `body` 扩展字段：

- 若该字段不影响安全语义，**MAY** 忽略；
- 若该字段影响安全、路由、权限或幂等语义，**MUST** 拒绝。

### 12.2 破坏性变更

以下变更视为破坏性变更，必须升级 Profile 主版本：

- `meta` 字段含义变化；
- 错误码语义变化；
- 方法名语义变化；
- 安全模式语义变化；
- 负载结构不再兼容。

---

## 13. 安全注意事项

### 13.1 安全模式固定

调用方与服务端 **MUST NOT** 在未明确协商的情况下，从高安全模式静默降级到低安全模式。  
若目标不支持请求的 `security_profile`，服务端 **MUST** 明确返回 `anp.unsupported_security_profile`。

### 13.2 时间戳不是主防重放机制

`created_at` **MUST NOT** 作为唯一防重放机制。  
防重放应由后续 Profile 在会话态、消息态或群态中定义。

### 13.3 追踪字段隔离

`trace_id`、日志标签、监控字段 **MUST NOT** 参与任何密码学绑定或业务授权判断。

### 13.4 负载互斥

若某 Profile 定义 `body.payload` 与 `body.payload_b64u` 为互斥字段，则发送方 **MUST NOT** 同时提供二者；接收方收到冲突输入时 **MUST** 拒绝。

---

## 14. 隐私注意事项

### 14.1 最小元数据原则

发送方 **SHOULD** 仅在 `meta` 中放置跨实现互通所必需的最小元数据。

### 14.2 不引入设备语义

本 Profile 只识别 Agent 与 Group，不定义设备、终端、副本或内部运行单元。  
这些概念属于实现内部，不得作为 Core Binding 的标准字段强制出现。

### 14.3 能力缓存

调用方 **SHOULD** 缓存能力协商结果，但 **MUST** 在能力变化、验证失败、服务端点切换或缓存失效时重新协商。

---

## 15. 最小互通要求

一个 ANP Core Binding 合规实现至少 **MUST** 支持：

1. JSON-RPC 2.0；
2. 对象形式 `params`；
3. 字符串 `id`；
4. `anp.get_capabilities`；
5. 公共错误码；
6. 幂等 `operation_id`；
7. `meta` / `body` 顶层结构；
8. 安全传输。

---

## 16. 示例

### 16.1 `direct.send` 请求示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-10001",
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
      "operation_id": "op-10001",
      "message_id": "msg-10001",
      "created_at": "2026-03-29T12:00:00Z",
      "content_type": "text/plain"
    },
    "body": {
      "payload": {
        "text": "hello"
      }
    }
  }
}
```

### 16.2 成功响应示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-10001",
  "result": {
    "accepted": true,
    "message_id": "msg-10001",
    "operation_id": "op-10001"
  }
}
```

---

## 17. IANA / 注册表占位

本标准后续版本 **SHOULD** 建立以下注册表：

1. ANP Profile 名称注册表；
2. Security Profile 注册表；
3. Content-Type 注册表；
4. ANP 错误码注册表；
5. ANP 标准方法名注册表。

---

## 18. 参考实现说明（非规范性）

实现方在落地时，建议将本 Profile 视为：

- **互通边界**；
- **服务接口稳定层**；
- **错误与协商稳定层**。

具体的密码学材料、签名输入、群状态机、媒体加密细节应由对应 Profile 进一步定义，而不应回流到本 Profile 。
