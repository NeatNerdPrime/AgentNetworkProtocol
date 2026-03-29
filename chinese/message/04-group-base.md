# ANP Profile 4：Group Base Profile（草案）

- 文档编号：ANP-P4
- 标题：Group Base Profile
- 状态：Draft
- 版本：0.1.0
- 语言：中文
- 适用范围：本 Profile 适用于基于 Group DID 的群生命周期、群管理与群消息基础语义，不包含群端到端加密算法本身。

---

## 1. 目的

本 Profile 定义 ANP 的群基础语义层，规定：

1. Group DID 作为群的应用层全球标识；
2. 群的创建、邀请、加入、添加成员、移除成员、离群、更新群资料、更新群策略等基础动作；
3. 群消息 `group.send` 的基础语义；
4. 群 Host 服务的排序职责；
5. Group E2EE Overlay 如何在本 Profile 的应用语义之上叠加。

本 Profile **不**定义：

- 具体群 E2EE 算法；
- 历史消息拉取；
- 已读与在线状态；
- 设备或内部副本概念；
- 群外部目录同步细节；
- 内部审批系统的具体实现；
- 动态群状态如何存储在 Agent 内部。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

- **Group**：由 `group_did` 标识的群协议主体。
- **Group Host Service**：负责该群的基础状态排序、策略应用与群消息入口的服务。
- **Group State**：一个群在某一时刻的应用层状态，包括资料、策略和成员关系等。
- **Group State Version**：由 Group Host Service 赋予的当前群状态版本标识。
- **Group Event Sequence**：由 Group Host Service 赋予的群事件单调递增序号，覆盖控制操作与群消息。
- **Member**：群中的 Agent 成员。
- **Invitation**：尚未生效为活跃成员关系的邀请对象。
- **Policy**：决定谁可以加人、踢人、发消息、改资料、改策略等行为的应用层规则。

---

## 3. 设计原则

### 3.1 一个群，一个 Group DID

每个群 **MUST** 具有一个 `group_did`。`group_did` 是该群的应用层全局标识，用于：

- 群发现；
- 群管理；
- 群消息寻址；
- 后续 Group E2EE Overlay 的绑定锚点。

### 3.2 Group Host 负责排序

所有会改变群状态的操作 **MUST** 经过 Group Host Service 接受与排序。

Group Host Service **MUST** 对群状态变更维护可判定的线性顺序，并为每次已接受的状态变更分配新的 `group_state_version`。

### 3.3 应用语义与密码学语义分离

本 Profile 只定义群的应用层动作与对象；具体的群密钥建立、成员加密状态演进、欢迎消息、加密应用消息等能力由 Group E2EE Profile 定义。

### 3.4 协议终点仍然是 Agent

群成员在协议层仍然是 Agent。任何 Agent 内部存在的副本、工作器、设备或终端均不进入本 Profile 的互通语义。

### 3.5 非目标

本 Profile **不**提供：

- 全局历史回放；
- 强同步语义；
- 设备级成员关系；
- 设备级投递；
- 内部执行器级权限控制。

---

## 4. Profile 标识与依赖

### 4.1 Profile 名称

本 Profile 的标准名称为：

`anp.group.base.v1`

### 4.2 依赖关系

本 Profile **MUST** 依赖以下 Profile：

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`

### 4.3 安全模式

本 Profile 作为独立运行的基础群 Profile 时：

- `meta.profile` **MUST** 等于 `anp.group.base.v1`
- `meta.security_profile` **MUST** 等于 `transport-protected`

若后续叠加 Group E2EE Overlay，则对应安全 Profile **MUST** 明确如何对本 Profile 的群状态对象与群消息对象进行密码学绑定。

---

## 5. 群模型

### 5.1 `group_did`

`group_did` 是群的应用层全局标识。

`group_did`：

- **MUST** 作为群管理操作的目标标识；
- **MUST** 作为群消息操作的目标标识；
- **MUST NOT** 自动等同于任何特定密码学实现中的内部 `group_id`；
- 若某 Group E2EE Profile 另有内部 `crypto_group_id`，则对应 Profile **MUST** 定义其与 `group_did` 的绑定关系。

### 5.2 `group_state_version`

`group_state_version` 表示当前群应用状态的版本。

其要求如下：

- **MUST** 由 Group Host Service 分配；
- **MUST** 作为不透明字符串处理；
- 每次成功的群状态变更 **MUST** 产生新的 `group_state_version`；
- 群消息发送 **MAY** 引用发送时所见的 `group_state_version`。

### 5.3 `group_event_seq`

`group_event_seq` 表示群事件序号。

其要求如下：

- **MUST** 在同一群内单调递增；
- **MUST** 覆盖群控制操作与群消息；
- **MUST** 采用十进制字符串表示；
- **MUST NOT** 直接作为安全语义的唯一依据。

### 5.4 角色模型

本 Profile 最小互通 **MUST** 支持以下角色：

- `owner`
- `admin`
- `member`

实现方 **MAY** 扩展更多角色，但跨实现最小互通只要求理解上述三类。

### 5.5 成员状态

本 Profile 最小互通 **MUST** 支持以下成员状态：

- `invited`
- `active`
- `left`
- `removed`
- `pending`

---

## 6. 标准对象

### 6.1 `group_profile`

`group_profile` 表示群的展示性资料对象。

推荐字段：

- `display_name`：字符串，创建群时 **SHOULD** 提供
- `description`：字符串，**MAY**
- `avatar_uri`：字符串，**MAY**
- `discoverability`：字符串，**MAY**，推荐值：`private`、`listed`、`public`
- `labels`：对象，**MAY**

### 6.2 `group_policy`

`group_policy` 表示群的应用层授权与治理规则对象。

最小推荐字段：

- `required_security_profile`：字符串，**SHOULD**
- `membership_mode`：字符串，**MUST**，推荐值：`invitation-only`、`admin-managed`、`open-join`、`request-approval`
- `who_can_send`：字符串，**MUST**，推荐值：`owner`、`admin`、`member`
- `who_can_invite`：字符串，**MUST**
- `who_can_add`：字符串，**MUST**
- `who_can_remove`：字符串，**MUST**
- `who_can_update_profile`：字符串，**MUST**
- `who_can_update_policy`：字符串，**MUST**
- `attachments_allowed`：布尔值，**MAY**
- `max_members`：十进制字符串，**MAY**
- `custom`：对象，**MAY**

### 6.3 `group_member`

`group_member` 表示群成员关系对象。

最小推荐字段：

- `agent_did`：字符串，**MUST**
- `role`：字符串，**MUST**
- `status`：字符串，**MUST**
- `joined_at`：RFC 3339 时间字符串，**MAY**
- `invited_by`：DID 字符串，**MAY**

### 6.4 `invitation`

`invitation` 表示邀请对象。

最小推荐字段：

- `invitation_id`：字符串，**MUST**
- `group_did`：字符串，**MUST**
- `inviter_did`：字符串，**MUST**
- `invitee_did`：字符串，**MUST**
- `proposed_role`：字符串，**MAY**
- `expires_at`：RFC 3339 时间字符串，**MAY**
- `status`：字符串，**MUST**，推荐值：`pending`、`accepted`、`expired`、`revoked`

### 6.5 `group_state_ref`

`group_state_ref` 表示群状态引用对象。

最小推荐字段：

- `group_did`：字符串，**MUST**
- `group_state_version`：字符串，**MUST**
- `policy_hash`：字符串，**MAY**
- `roster_hash`：字符串，**MAY**


### 6.6 群消息负载

`group.send` 的 `meta.content_type` **MUST** 存在。

本 Profile 最小互通 **MUST** 支持以下内容类型：

- `text/plain`
- `application/json`
- `application/anp-attachment-manifest+json`

`group.send` 的 `body` 中，`text`、`payload`、`payload_b64u` 三者中：

- **MUST** 恰好出现一个；
- 若出现多个，接收方 **MUST** 拒绝请求；
- 若三者均不存在，接收方 **MUST** 拒绝请求。

对于 `payload_b64u`：

- **MUST** 使用无填充 base64url；
- **SHOULD** 仅用于二进制扩展或私有扩展对象。

---

## 7. 标准方法

### 7.1 `group.create`

#### 7.1.1 语义

创建一个新群，并由 Group Host Service 分配新的 `group_did` 与初始 `group_state_version`。

#### 7.1.2 请求要求

`group.create` 请求 **MUST** 满足：

1. `method = "group.create"`
2. `meta.profile = "anp.group.base.v1"`
3. `meta.security_profile = "transport-protected"`
4. `meta.sender_did` **MUST** 存在
5. `meta.operation_id` **MUST** 存在
6. `meta.target` **MAY** 省略
7. `body.group_profile` **SHOULD** 存在
8. `body.group_policy` **MUST** 存在
9. `body.initial_members` **MAY** 存在

#### 7.1.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `group_state_version`
- `created_at`
- `creator_did`

成功响应 **MAY** 包含：

- `group_event_seq`
- `group_service_endpoint`
- `group_profile`
- `group_policy`

### 7.2 `group.get_info`

#### 7.2.1 语义

获取当前群的基础信息快照。

#### 7.2.2 请求要求

- `meta.target.kind` **MUST** 为 `"group"`
- `meta.target.did` **MUST** 为目标 `group_did`

`body` **MAY** 包含：

- `include_policy`
- `include_membership_summary`
- `include_member_list`

#### 7.2.3 成功响应

成功响应 **SHOULD** 至少包含：

- `group_did`
- `group_state_version`
- `group_profile`
- `group_policy` 或 `group_policy_summary`

成员列表是否返回，取决于群策略和调用方权限。

### 7.3 `group.invite`

#### 7.3.1 语义

由有权限的成员向某 Agent 发出加入邀请。

#### 7.3.2 请求要求

`body` **MUST** 包含：

- `invitee_did`

`body` **MAY** 包含：

- `proposed_role`
- `expires_at`
- `invitation_note`
- `expected_group_state_version`

#### 7.3.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `invitation_id`
- `group_state_version`

### 7.4 `group.accept_invite`

#### 7.4.1 语义

被邀请 Agent 接受邀请，并尝试成为该群成员。

#### 7.4.2 请求要求

`body` **MUST** 包含：

- `invitation_id`

#### 7.4.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `membership_status`
- `group_state_version`

`membership_status` 推荐值：

- `active`
- `pending`

### 7.5 `group.join`

#### 7.5.1 语义

在群策略允许时，由某 Agent 主动申请或加入该群。

#### 7.5.2 请求要求

`body` **MAY** 包含：

- `join_token`
- `join_note`
- `expected_group_state_version`

#### 7.5.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `membership_status`
- `group_state_version`

### 7.6 `group.add`

#### 7.6.1 语义

由有权限的成员或治理服务直接把目标 Agent 加入群。

#### 7.6.2 请求要求

`body` **MUST** 包含：

- `member_did`

`body` **MAY** 包含：

- `role`
- `expected_group_state_version`

#### 7.6.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `member_did`
- `group_state_version`

### 7.7 `group.remove`

#### 7.7.1 语义

由有权限的成员或治理服务将某成员移出群。

#### 7.7.2 请求要求

`body` **MUST** 包含：

- `member_did`

`body` **MAY** 包含：

- `reason`
- `expected_group_state_version`

#### 7.7.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `member_did`
- `group_state_version`

### 7.8 `group.leave`

#### 7.8.1 语义

表示当前发送方主动退出群。

#### 7.8.2 请求要求

- `meta.sender_did` **MUST** 是当前离群成员
- `body.expected_group_state_version` **MAY** 存在

#### 7.8.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `leaver_did`
- `group_state_version`

### 7.9 `group.update_profile`

#### 7.9.1 语义

更新群展示资料对象。

#### 7.9.2 请求要求

`body` **MUST** 包含：

- `group_profile_patch`

`body` **MAY** 包含：

- `expected_group_state_version`

#### 7.9.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `group_state_version`
- `group_profile`

### 7.10 `group.update_policy`

#### 7.10.1 语义

更新群策略对象。

#### 7.10.2 请求要求

`body` **MUST** 包含：

- `group_policy_patch`

`body` **MAY** 包含：

- `expected_group_state_version`

#### 7.10.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `group_state_version`
- `group_policy`

### 7.11 `group.send`

#### 7.11.1 语义

向某群发送一条应用层群消息。

#### 7.11.2 请求要求

一个合规的 `group.send` 请求 **MUST** 满足：

1. `method = "group.send"`
2. `meta.profile = "anp.group.base.v1"`
3. `meta.security_profile = "transport-protected"`
4. `meta.target.kind = "group"`
5. `meta.target.did` **MUST** 是目标 `group_did`
6. `meta.sender_did` **MUST** 是当前发送方 Agent DID
7. `meta.message_id` **MUST** 存在
8. `meta.operation_id` **MUST** 存在
9. `meta.content_type` **MUST** 存在
10. `body` **MUST** 满足负载互斥规则

#### 7.11.3 `group.send` 的 `body`

`group.send` 的 `body` 字段规则与 Direct Base 类似，可包含：

- `thread_id`：字符串，**MAY**
- `reply_to_message_id`：字符串，**MAY**
- `annotations`：对象，**MAY**
- `expected_group_state_version`：字符串，**SHOULD**
- `text` / `payload` / `payload_b64u`：三者中 **MUST** 恰好出现一个

#### 7.11.4 成功响应

成功响应 **MUST** 至少包含：

- `accepted`：布尔值，且 **MUST** 为 `true`
- `group_did`
- `message_id`
- `operation_id`
- `group_event_seq`
- `group_state_version`
- `accepted_at`

### 7.12 可选 Notification

#### 7.12.1 `group.incoming`

用于向已建立双向连接的群成员 Agent 异步推送一条新群消息。

#### 7.12.2 `group.state_changed`

用于异步推送群状态变化，例如：

- 成员变更
- 群资料变更
- 群策略变更
- 邀请状态变化

这两个 Notification 均为可选传输便利能力；是否支持它们，不影响本 Profile 的基础互通合规性。

---

## 8. 排序、并发与冲突

### 8.1 状态变更线性化

以下操作一旦被接受，Group Host Service **MUST** 将其线性化：

- `group.create`
- `group.invite`
- `group.accept_invite`
- `group.join`
- `group.add`
- `group.remove`
- `group.leave`
- `group.update_profile`
- `group.update_policy`

### 8.2 `expected_group_state_version`

对于状态变更操作，发送方 **SHOULD** 提供 `expected_group_state_version`。

若接收方收到的期望版本与当前版本不一致：

- **MUST** 拒绝，或
- **MUST** 返回明确的冲突语义

接收方 **MUST NOT** 在调用方要求版本匹配时静默改用最新状态继续执行。

### 8.3 群消息与状态版本

`group.send` **SHOULD** 携带 `expected_group_state_version`，以便发送方显式表达“此消息是基于哪一个群状态快照形成的”。

若调用方未提供该字段：

- 接收方 **MAY** 按当前最新群状态受理；
- 但 **MUST NOT** 承诺该消息与某个特定成员集合或策略快照绑定。

### 8.4 幂等与去重

对于群状态变更与群消息，接收方 **MUST** 基于：

- `sender_did`
- `group_did`
- `method`
- `operation_id`

执行幂等判断。

对于 `group.send`，接收方 **SHOULD** 进一步基于：

- `sender_did`
- `group_did`
- `message_id`

进行重复识别。

---

## 9. 安全与策略

### 9.1 安全传输要求

本 Profile 在独立运行时，**MUST** 依赖经过认证的安全传输层。

### 9.2 群策略是应用层权威

群内“谁能加人、踢人、更新资料、更新策略、发送消息”等权限，**MUST** 由 `group_policy` 决定。

`group_did` 文档中的 `controller` 仅表示谁可以控制 DID 文档本身，**MUST NOT** 被机械等同为群内应用层管理员权限。

### 9.3 安全模式要求

若群策略中的 `required_security_profile` 要求 `group-e2ee`：

- 发送方 **MUST** 使用 Group E2EE Profile；
- Group Host Service 收到 `transport-protected` 的 `group.send` 或群控制操作时 **MUST** 拒绝；
- 服务端 **MUST NOT** 在未显式协商的情况下静默降级。

### 9.4 与 Overlay 的绑定点

后续 Group E2EE Overlay **SHOULD** 至少绑定以下字段：

- `group_did`
- `sender_did`
- `group_state_version` 或等价状态引用
- `message_id`
- `content_type`
- `security_profile`

---

## 10. Profile 特定错误（推荐）

在沿用 ANP Core 公共错误模型的前提下，本 Profile 推荐以下 `anp_code`：

| `code` | `anp_code` | 含义 |
|---|---|---|
| 3000 | `group.not_member` | 调用方不是该群成员 |
| 3001 | `group.already_member` | 目标已经是群成员 |
| 3002 | `group.invitation_invalid` | 邀请不存在、失效或不可接受 |
| 3003 | `group.policy_violation` | 操作违反群策略 |
| 3004 | `group.state_version_conflict` | 期望的群状态版本与当前状态不一致 |
| 3005 | `group.member_conflict` | 成员状态冲突 |
| 3006 | `group.security_mode_required` | 群要求更高安全模式 |
| 3007 | `group.host_unavailable` | 群 Host 暂不可用 |

---

## 11. 隐私注意事项

### 11.1 DID 与动态状态分离

群的动态成员状态、审批状态、实时在线状态等 **SHOULD NOT** 直接暴露在 DID 文档中，而应通过受控的群服务返回。

### 11.2 不暴露 Agent 内部结构

无论群成员 Agent 内部存在多少副本、执行器或设备，这些内部结构 **MUST NOT** 成为群互通语义的一部分。

### 11.3 成员列表最小披露

`group.get_info` 返回完整成员列表时，服务端 **SHOULD** 根据调用方权限和群策略执行最小披露。

---

## 12. 最小互通要求

一个符合本 Profile 的实现至少 **MUST** 支持：

1. `group.create`
2. `group.get_info`
3. `group.invite`
4. `group.accept_invite`
5. `group.join`
6. `group.add`
7. `group.remove`
8. `group.leave`
9. `group.update_profile`
10. `group.update_policy`
11. `group.send`
12. `group_did`
13. `group_state_version`
14. `group_event_seq`
15. 角色：`owner`、`admin`、`member`
16. 成员状态：`invited`、`active`、`left`、`removed`、`pending`
17. 安全传输运行方式

---

## 13. 示例

### 13.1 `group.create` 示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-30001",
  "method": "group.create",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.group.base.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:agent-a",
      "operation_id": "op-30001",
      "created_at": "2026-03-29T12:30:00Z"
    },
    "body": {
      "group_profile": {
        "display_name": "Cross-Domain Agents",
        "description": "协作群",
        "discoverability": "private"
      },
      "group_policy": {
        "required_security_profile": "transport-protected",
        "membership_mode": "invitation-only",
        "who_can_send": "member",
        "who_can_invite": "admin",
        "who_can_add": "admin",
        "who_can_remove": "admin",
        "who_can_update_profile": "admin",
        "who_can_update_policy": "owner"
      },
      "initial_members": [
        {
          "agent_did": "did:example:agent-a",
          "role": "owner"
        },
        {
          "agent_did": "did:example:agent-b",
          "role": "member"
        }
      ]
    }
  }
}
```

成功响应示例：

```json
{
  "jsonrpc": "2.0",
  "id": "req-30001",
  "result": {
    "group_did": "did:example:group-123",
    "group_state_version": "1",
    "group_event_seq": "1",
    "created_at": "2026-03-29T12:30:01Z",
    "creator_did": "did:example:agent-a"
  }
}
```

### 13.2 `group.send` 示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-30002",
  "method": "group.send",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.group.base.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:agent-a",
      "target": {
        "kind": "group",
        "did": "did:example:group-123"
      },
      "operation_id": "op-30002",
      "message_id": "msg-30002",
      "created_at": "2026-03-29T12:35:00Z",
      "content_type": "text/plain"
    },
    "body": {
      "expected_group_state_version": "1",
      "text": "大家好"
    }
  }
}
```

成功响应示例：

```json
{
  "jsonrpc": "2.0",
  "id": "req-30002",
  "result": {
    "accepted": true,
    "group_did": "did:example:group-123",
    "message_id": "msg-30002",
    "operation_id": "op-30002",
    "group_event_seq": "2",
    "group_state_version": "1",
    "accepted_at": "2026-03-29T12:35:01Z"
  }
}
```

---

## 14. 注册表占位

本标准后续版本 **SHOULD** 建立以下注册表：

1. Group 业务错误码注册表；
2. Group 角色名称注册表；
3. Group 成员状态注册表；
4. Group 政策字段注册表；
5. Group 事件类型注册表。

---

## 15. 参考实现说明（非规范性）

实现方在落地本 Profile 时，宜把它视为：

- Group DID 对应的应用层群语义；
- Group E2EE Overlay 的应用层承载；
- 跨域群管理与群消息的最小互通层。

真正的群密钥更新、成员加密状态和加密群消息保护，不应回流到本 Profile 中，而应由 Group E2EE Profile 定义。
