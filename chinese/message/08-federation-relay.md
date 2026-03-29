# ANP Profile 8：Federation and Relay Profile（草案）

- 文档编号：ANP-P8
- 标题：Federation and Relay Profile
- 状态：Draft
- 版本：0.1.0
- 语言：中文
- 适用范围：本 Profile 适用于域与域之间的服务到服务转发、路由、接收确认和群 Host 排序语义，不定义 Agent 内部队列、设备同步或历史消息复制。

---

## 1. 目的

本 Profile 定义 ANP 的联邦与中继层，规定：

1. Agent 所在域如何把私聊消息转交给目标 Agent 的入口服务；
2. 群成员所在域如何把群控制操作或群消息转交给 Group Host Service；
3. 联邦场景下的服务发现、路由选择、幂等、重试和跳数控制；
4. 服务到服务的成功语义：何时视为“已通知到目标 Agent”或“已被 Group Host 接受并排序”；
5. 服务如何在不破坏 E2EE 负载的前提下转发业务请求。

本 Profile **不**定义：

- 历史同步；
- 已读、presence、设备在线态；
- Agent 内部副本 fanout；
- 服务端内部队列实现；
- 设备级投递语义；
- 服务商之间的结算、计费或合规流程。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

- **Home Service**：某 Agent DID 对外暴露的主入口服务，通常来自 `ANPHomeService`。
- **Target Ingress Service**：目标 Agent 所在域用于接受转发消息的入口服务；通常是目标 Agent 的 Home Service 或其等价服务。
- **Group Host Service**：某 Group DID 的主入口与排序权威服务，通常来自 `ANPGroupService`。
- **Relay Service**：专用于跨域转发的服务，通常来自 `ANPRelayService`。
- **Federation Hop**：联邦转发中的一次服务到服务跳转。
- **Relay Envelope**：由本 Profile 定义的中继元数据对象，用于包装一次转发行为的幂等、路由和超时信息。
- **Forwarded Operation**：被中继的原始业务操作对象，包含原始 `method`、`meta` 和 `body`。
- **Ordering Acceptance**：Group Host Service 已接受并排序某个会改变群状态的操作。

---

## 3. 设计原则

### 3.1 协议终点是 Agent 或 Group Host

本 Profile 的成功语义只到达两种边界：

- 私聊：目标 Agent 的入口服务已接受消息；
- 群聊：目标群的 Group Host Service 已接受并完成排序（如适用）。

此后目标 Agent 内部如何路由到多少执行单元、多少副本或多少设备，不属于本 Profile。

### 3.2 联邦层不解释业务明文

联邦中继 **MUST NOT** 改写原始业务 Profile 的语义。中继层只增加：

- 源服务与目标服务信息；
- 跳数与过期控制；
- 服务级幂等与结果映射；
- 必要的故障报告。

### 3.3 幂等优先于严格一次

联邦实现很可能采用至少一次重试策略。接收方 **MUST** 优先提供幂等与去重语义，而不是假定网络层天然保证严格一次交付。

### 3.4 群排序权威唯一

对于同一 `group_did`，会影响群状态版本与群事件顺序的接受结果 **MUST** 来自唯一的 Group Host Service 或其等价排序权威。

### 3.5 非目标

本 Profile 不保证：

- 全网严格 FIFO；
- 任意服务之间的全互联；
- 消息一定被目标 Agent 内部某个执行单元成功消费；
- 任何设备或内部副本的一致视图。

---

## 4. Profile 标识与依赖

### 4.1 Profile 名称

本 Profile 的标准名称为：

`anp.federation.relay.v1`

### 4.2 依赖关系

本 Profile **MUST** 依赖以下 Profile：

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`

被转发的业务操作还 **MUST** 依赖其对应的业务或安全 Profile，例如：

- `anp.direct.base.v1`
- `anp.group.base.v1`
- `anp.direct.e2ee.v1`
- `anp.group.e2ee.v1`
- `anp.attachment.v1`

### 4.3 安全模式

本 Profile 作为服务到服务控制层运行时：

- `meta.profile` **MUST** 等于 `anp.federation.relay.v1`
- `meta.security_profile` **MUST** 等于 `transport-protected`

服务到服务链路 **MUST** 运行在经过认证的安全传输层之上。

---

## 5. 联邦角色模型

### 5.1 Agent Home Service

Agent Home Service 负责：

- 接受本域 Agent 发起的业务请求；
- 解析目标 Agent DID 或 Group DID；
- 必要时向其它域发起中继；
- 把目标域返回的结果映射给本域调用方。

### 5.2 Target Ingress Service

Target Ingress Service 负责：

- 代表目标 Agent 接受跨域转发的私聊请求；
- 验证目标 Agent 是否由本域负责；
- 执行或排队进入目标 Agent 边界；
- 返回“已接受”或明确拒绝结果。

### 5.3 Group Host Service

Group Host Service 负责：

- 代表某 Group DID 接受群控制操作与群消息；
- 对会改变群状态的操作进行排序；
- 维护 `group_state_version`、`group_event_seq` 及相关权威返回值；
- 向调用方返回“已排序接受”或明确冲突/拒绝结果。

### 5.4 Relay Service

Relay Service 是可选角色，用于：

- 承担专门的服务到服务转发；
- 隔离 Home Service 与外域的直接耦合；
- 实现专门的路由、审计或节流策略。

若某部署不区分 Home Service 与 Relay Service，则 Home Service **MAY** 直接承担 Relay 职责。

---

## 6. 发现与路由选择

### 6.1 私聊路由

对于私聊请求，发起方所在域 **MUST**：

1. 解析目标 `agent_did`；
2. 读取目标 DID 文档中的 `ANPHomeService`；
3. 若存在 `ANPRelayService` 且本地策略要求经其转发，则 **MAY** 选择该服务；
4. 选定一个 Target Ingress Service 作为联邦目标。

### 6.2 群路由

对于群控制操作和群消息，发起方所在域 **MUST**：

1. 解析目标 `group_did`；
2. 读取 Group DID 文档中的 `ANPGroupService`；
3. 若需要加入、审批或邀请扩展，**MAY** 读取 `ANPJoinService`；
4. 把相关操作转发给 Group Host Service。

### 6.3 缓存与刷新

服务发现结果 **MAY** 被缓存；但在以下情况下，调用方 **SHOULD** 刷新发现结果：

- 路由失败；
- 认证失败；
- 目标服务返回“已迁移”或等价错误；
- 本地缓存过期；
- 群 DID 或 Agent DID 文档版本发生变化。

---

## 7. 中继对象模型

### 7.1 `relay_envelope`

`relay_envelope` 表示一次联邦转发的控制信息。

推荐字段：

- `relay_id`：字符串，**MUST**
- `source_service_did`：字符串，**MUST**
- `target_service_did`：字符串，**MUST**
- `relay_mode`：字符串，**MUST**，推荐值：`direct`、`group`
- `original_sender_did`：字符串，**MUST**
- `original_target_kind`：字符串，**MUST**，推荐值：`agent`、`group`
- `original_target_did`：字符串，**MUST**
- `forwarded_profile`：字符串，**MUST**
- `forwarded_security_profile`：字符串，**MUST**
- `upstream_operation_id`：字符串，**MUST**
- `upstream_message_id`：字符串，**MAY**
- `created_at`：RFC 3339 时间字符串，**SHOULD**
- `expires_at`：RFC 3339 时间字符串，**MAY**
- `hop_count`：十进制字符串，**MUST**
- `max_hops`：十进制字符串，**MAY**
- `trace_id`：字符串，**MAY**
- `routing_trace`：对象数组，**MAY**

规则：

- `relay_id` 在 `source_service_did + relay_mode` 维度上 **MUST** 唯一；
- `hop_count` 每经过一个联邦 hop **MUST** 增加；
- 若存在 `max_hops`，且 `hop_count > max_hops`，接收方 **MUST** 拒绝请求；
- `forwarded_profile` 和 `forwarded_security_profile` **MUST** 与被转发业务操作一致。

### 7.2 `forwarded_operation`

`forwarded_operation` 表示被中继的原始业务操作对象。

推荐结构：

```json
{
  "method": "direct.send | group.add | group.send | ...",
  "meta": { },
  "body": { }
}
```

规则：

- `method` **MUST** 是一个已注册的 ANP 业务方法；
- `meta` **MUST** 是原始业务操作的 `meta` 对象；
- `body` **MUST** 是原始业务操作的 `body` 对象；
- 中继服务 **MUST NOT** 改写 `forwarded_operation.meta.sender_did`、`target`、`profile`、`security_profile`、`message_id`、`content_type` 或业务语义字段；
- 中继服务 **MAY** 在外层 `relay_envelope` 中补充路由元数据。

---

## 8. 标准方法

### 8.1 `relay.forward_direct`

#### 8.1.1 语义

把一个面向目标 Agent 的业务操作转发到目标 Agent 的入口服务。

#### 8.1.2 请求要求

- `method = "relay.forward_direct"`
- `meta.profile = "anp.federation.relay.v1"`
- `meta.security_profile = "transport-protected"`

`body` **MUST** 包含：

- `relay_envelope`
- `forwarded_operation`

额外要求：

- `relay_envelope.relay_mode` **MUST** 为 `direct`；
- `relay_envelope.original_target_kind` **MUST** 为 `agent`；
- `forwarded_operation.method` **MUST** 是 Direct Base 或 Direct E2EE 相关方法；
- `forwarded_operation.meta.target.kind` **MUST** 为 `agent`。

#### 8.1.3 成功响应

成功响应 **MUST** 至少包含：

- `accepted`：布尔值，且为 `true`
- `relay_id`
- `target_service_did`
- `accepted_at`
- `upstream_operation_id`

成功响应 **MAY** 包含：

- `upstream_message_id`
- `delivery_state`，推荐值：`accepted`
- `routing_trace`

### 8.2 `relay.forward_group`

#### 8.2.1 语义

把一个面向 `group_did` 的群控制操作或群消息转发到 Group Host Service。

#### 8.2.2 请求要求

`body` **MUST** 包含：

- `relay_envelope`
- `forwarded_operation`

额外要求：

- `relay_envelope.relay_mode` **MUST** 为 `group`；
- `relay_envelope.original_target_kind` **MUST** 为 `group`；
- `forwarded_operation.meta.target.kind` **MUST** 为 `group`；
- `forwarded_operation.method` **MUST** 是 Group Base 或 Group E2EE 相关方法。

#### 8.2.3 成功响应

成功响应 **MUST** 至少包含：

- `accepted`：布尔值，且为 `true`
- `relay_id`
- `group_did`
- `target_service_did`
- `accepted_at`
- `upstream_operation_id`

对于会改变群状态的操作，成功响应 **SHOULD** 进一步包含：

- `group_state_version`
- `group_event_seq`

对于群 E2EE 场景，成功响应 **MAY** 包含：

- `epoch`
- `epoch_authenticator`

### 8.3 `relay.outcome`（可选 Notification）

#### 8.3.1 语义

在某些异步联邦部署中，服务 **MAY** 使用 `relay.outcome` 作为单向通知，把较晚得出的结果回传给上游服务。

#### 8.3.2 使用范围

- `relay.outcome` 是可选方法；
- 它 **MUST** 作为 Notification 使用；
- 即使实现不支持 `relay.outcome`，仍可作为本 Profile 的合规实现。

#### 8.3.3 推荐字段

`body` **SHOULD** 包含：

- `relay_id`
- `final_state`，推荐值：`accepted`、`rejected`、`expired`、`conflict`
- `reported_at`
- `error`（若失败）

---

## 9. 成功语义与状态映射

### 9.1 私聊成功语义

一次 `relay.forward_direct` 成功，仅表示：

- 目标 Agent 的入口服务已接受该业务操作；
- 协议层“已通知到目标 Agent”的目标已经达成。

这 **MUST NOT** 被解释为：

- 目标 Agent 内部已完成业务处理；
- 目标 Agent 内部所有副本已收到；
- 目标 Agent 已执行应用动作。

### 9.2 群操作成功语义

一次 `relay.forward_group` 对状态变更类操作成功，表示：

- Group Host Service 已接受并排序该操作；
- 对应的 `group_state_version` 和 `group_event_seq` 已确定。

对于 `group.send`，成功表示：

- Group Host Service 已接受并为该群消息赋予其应有的事件位置或等价成功状态。

### 9.3 目标拒绝的映射

若目标服务基于业务 Profile 拒绝请求，中继层 **MUST** 把目标服务的拒绝映射回上游，而不是把它伪装成中继成功。

---

## 10. 幂等、重试与跳数控制

### 10.1 联邦幂等

接收中继请求的一侧 **MUST** 基于以下最小集合做幂等识别：

- `source_service_did`
- `relay_mode`
- `relay_id`

对于映射到同一业务操作的重复转发，接收方 **SHOULD** 进一步使用：

- `forwarded_operation.method`
- `relay_envelope.upstream_operation_id`

做重复识别。

### 10.2 重试规则

若上游服务因超时或暂时性故障重试：

- `relay_id` **MUST** 保持不变；
- `upstream_operation_id` **MUST** 保持不变；
- `forwarded_operation` 的业务语义 **MUST** 保持等价。

### 10.3 跳数控制

- `hop_count` **MUST** 从字符串 `"0"` 或 `"1"` 起始，并在每次联邦 hop 后递增；
- 若存在 `max_hops` 且上限被超过，接收方 **MUST** 拒绝并返回 `anp.relay.hop_limit_exceeded`；
- 服务 **SHOULD** 设置本地最大可接受 hop 上限，以防中继环路。

### 10.4 过期控制

若存在 `relay_envelope.expires_at` 且请求已过期，接收方 **MUST** 拒绝，并返回 `anp.relay.expired`。

---

## 11. 安全与信任要求

### 11.1 服务到服务认证

服务到服务链路 **MUST** 提供：

- 机密性；
- 完整性；
- 对端服务认证。

### 11.2 源服务信任

接收方 **MUST** 验证 `source_service_did` 是否为受信任或按本地联邦策略允许的对端服务。若不受信任，**MUST** 返回 `anp.relay.untrusted_source`。

### 11.3 发送方身份与源服务关系

接收方 **MAY** 依据本地策略验证：

- `source_service_did` 是否有资格代表 `original_sender_did` 所在域发起中继；
- `forwarded_operation.meta.sender_did` 是否与联邦路由语义一致。

若此类校验失败，接收方 **MUST** 拒绝请求。

### 11.4 不得静默降级安全模式

中继服务 **MUST NOT**：

- 把 `direct-e2ee` 降级为 `transport-protected`；
- 把 `group-e2ee` 降级为 `transport-protected`；
- 修改 `forwarded_security_profile` 而不被调用方显式授权。

### 11.5 E2EE 负载不透明性

当 `forwarded_security_profile` 为 `direct-e2ee` 或 `group-e2ee` 时：

- 中继服务 **SHOULD** 仅检查最小必要的路由字段；
- 中继服务 **MUST NOT** 依赖解密应用负载来完成正常路由；
- 中继服务 **MAY** 对负载大小、格式或基本结构做健全性检查，但 **MUST NOT** 擅自改写。

---

## 12. 标准错误

本 Profile 推荐至少定义以下错误代码：

- `anp.relay.untrusted_source`
- `anp.relay.route_not_found`
- `anp.relay.target_service_mismatch`
- `anp.relay.hop_limit_exceeded`
- `anp.relay.expired`
- `anp.relay.target_rejected`
- `anp.relay.idempotency_conflict`
- `anp.relay.group_host_conflict`

错误对象 **SHOULD** 至少包含：

- `code`
- `message`
- `relay_id`
- `source_service_did`
- `target_service_did`
- `details`（可选）

---

## 13. 最小互通要求

一个符合本 Profile 的实现至少 **MUST**：

1. 能根据 Agent DID 解析目标 `ANPHomeService`；
2. 能根据 Group DID 解析目标 `ANPGroupService`；
3. 支持 `relay.forward_direct`；
4. 支持 `relay.forward_group`；
5. 支持基于 `relay_id` 的幂等；
6. 支持 `hop_count` / `max_hops` 处理；
7. 不静默降级 `forwarded_security_profile`；
8. 正确返回“目标已接受”或“Group Host 已排序接受”的结果。

实现方 **SHOULD**：

- 支持 `relay.outcome`；
- 支持显式路由追踪；
- 支持更细粒度的联邦策略与错误映射；
- 支持对 Group Host 结果中的 `group_state_version`、`group_event_seq` 和 `epoch_authenticator` 做透传。

---

## 14. 示例

### 14.1 `relay.forward_direct` 示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-80001",
  "method": "relay.forward_direct",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.federation.relay.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:home-a",
      "target": {
        "kind": "service",
        "did": "did:example:home-b"
      },
      "operation_id": "op-80001",
      "created_at": "2026-03-29T15:00:00Z",
      "content_type": "application/anp-federation-direct+json"
    },
    "body": {
      "relay_envelope": {
        "relay_id": "relay-001",
        "source_service_did": "did:example:home-a",
        "target_service_did": "did:example:home-b",
        "relay_mode": "direct",
        "original_sender_did": "did:example:agent-a",
        "original_target_kind": "agent",
        "original_target_did": "did:example:agent-b",
        "forwarded_profile": "anp.direct.e2ee.v1",
        "forwarded_security_profile": "direct-e2ee",
        "upstream_operation_id": "op-50003",
        "upstream_message_id": "msg-50003",
        "created_at": "2026-03-29T15:00:00Z",
        "hop_count": "1"
      },
      "forwarded_operation": {
        "method": "direct.send",
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
          "ciphertext_b64u": "BASE64URL_CIPHERTEXT"
        }
      }
    }
  }
}
```

### 14.2 `relay.forward_group` 示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-80002",
  "method": "relay.forward_group",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.federation.relay.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:home-a",
      "target": {
        "kind": "service",
        "did": "did:example:group-host-1"
      },
      "operation_id": "op-80002",
      "created_at": "2026-03-29T15:05:00Z",
      "content_type": "application/anp-federation-group+json"
    },
    "body": {
      "relay_envelope": {
        "relay_id": "relay-002",
        "source_service_did": "did:example:home-a",
        "target_service_did": "did:example:group-host-1",
        "relay_mode": "group",
        "original_sender_did": "did:example:agent-a",
        "original_target_kind": "group",
        "original_target_did": "did:example:group-123",
        "forwarded_profile": "anp.group.e2ee.v1",
        "forwarded_security_profile": "group-e2ee",
        "upstream_operation_id": "op-60003",
        "upstream_message_id": "msg-60003",
        "created_at": "2026-03-29T15:05:00Z",
        "hop_count": "1"
      },
      "forwarded_operation": {
        "method": "group.send",
        "meta": {
          "anp_version": "1.0",
          "profile": "anp.group.e2ee.v1",
          "security_profile": "group-e2ee",
          "sender_did": "did:example:agent-a",
          "target": {
            "kind": "group",
            "did": "did:example:group-123"
          },
          "operation_id": "op-60003",
          "message_id": "msg-60003",
          "created_at": "2026-03-29T12:45:00Z",
          "content_type": "application/anp-group-cipher+json"
        },
        "body": {
          "group_did": "did:example:group-123",
          "crypto_group_id": "cg-001",
          "epoch": "6",
          "ciphertext_b64u": "BASE64URL_GROUP_CIPHERTEXT"
        }
      }
    }
  }
}
```

---

## 15. 注册表占位

本标准后续版本 **SHOULD** 建立以下注册表：

1. Federation 错误码注册表；
2. Relay envelope 字段注册表；
3. Service-to-service 内容类型注册表；
4. 联邦能力字段注册表；
5. 联邦结果状态值注册表。

---

## 16. 参考实现说明（非规范性）

实现方在落地本 Profile 时，宜把它视为：

- 所有跨域私聊和群操作的服务间通道层；
- 一个只负责“通知到目标 Agent / Group Host 即完成协议使命”的联邦层；
- 一个与 E2EE Overlay 共存、但不破坏其不透明性的最小转发层。

---

## 附录 A（信息性）：参考规范

- ANP Profile 1：Core Binding Profile（草案）
- ANP Profile 2：Identity and Discovery Profile（草案）
- ANP Profile 3：Direct Messaging Base Profile（草案）
- ANP Profile 4：Group Base Profile（草案）
- ANP Profile 5：Direct E2EE Profile（草案）
- ANP Profile 6：Group E2EE Profile（草案）
