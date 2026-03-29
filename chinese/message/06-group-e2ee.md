# ANP Profile 6：Group E2EE Profile（草案）

- 文档编号：ANP-P6
- 标题：Group E2EE Profile
- 状态：Draft
- 版本：0.1.0
- 语言：中文
- 适用范围：本 Profile 适用于基于 `group_did` 的群端到端加密 Overlay，不包含 Agent 内部副本同步语义。

---

## 1. 目的

本 Profile 定义 ANP 的群端到端加密 Overlay，规定：

1. 如何在 `anp.group.base.v1` 的群组与群管理语义之上叠加端到端机密性、完整性、成员认证和群状态演进；
2. 如何将 `group_did` 与密码学内部群标识绑定；
3. 如何发布与发现群加入所需的 KeyPackage 类材料；
4. 如何把 `group.create`、`group.add`、`group.remove`、`group.leave`、`group.send` 等基础操作映射到群密钥状态机；
5. 如何处理 `epoch`、排序、分叉检测、重放和握手消息。

本 Profile **不**定义：

- 历史消息拉取；
- 设备级群成员；
- Agent 内部多个副本如何共享同一个群密钥状态；
- 非群场景的端到端加密；
- 群之外的目录同步协议。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

- **MLS-like Group State**：本 Profile 所采用的群密钥状态机，支持成员变更、epoch 演进和加密应用消息。
- **Crypto Group ID**：密码学内部群标识，可与 `group_did` 分离。
- **KeyPackage**：用于把某 Agent 加入群所需的公开加入材料。
- **Proposal**：对群状态变化的提议对象。
- **Commit**：使一组提议生效并推进群状态的握手对象。
- **Welcome**：把新成员引入群所需的欢迎对象。
- **PrivateMessage**：加密并带成员认证的群消息对象。
- **Epoch**：群密钥状态机的逻辑代际。
- **Group State Ref**：应用层群状态引用对象，至少包含 `group_did` 与 `group_state_version`。
- **Fork**：不同成员对同一 `group_did` 观察到不一致的加密群状态或不一致的 `epoch_authenticator`。

---

## 3. 设计原则

### 3.1 一个 Agent = 一个协议主体

本 Profile 的互通边界只识别 Agent 与 Group。

对于群端到端加密而言，一个 `agent_did` 在外部互通层 **MUST** 表现为一个逻辑成员实体。某 Agent 内部若存在多个执行副本、工作单元或设备，它们如何共享同一份群状态，属于 Agent 内部实现问题，不属于本 Profile 的互通语义。

### 3.2 Group DID 与 Crypto Group ID 分离

`group_did` 是群的应用层全球标识；`crypto_group_id` 是密码学内部群标识。

二者：

- **MUST** 通过本 Profile 定义的绑定规则关联；
- **MUST NOT** 被实现方机械视为同一个字节串，除非具体实现显式选择这样做；
- **MUST** 在握手和应用消息中可被接收方验证。

### 3.3 复用 Group Base 的业务语义

本 Profile **不**发明新的群业务动作；它复用 `anp.group.base.v1` 的：

- `group.create`
- `group.invite`
- `group.accept_invite`
- `group.join`
- `group.add`
- `group.remove`
- `group.leave`
- `group.update_profile`
- `group.update_policy`
- `group.send`

其中，成员变更类操作 **MUST** 与群密钥状态机中的相应握手动作建立绑定。

### 3.4 排序与 Host 职责

`Group Host Service` **MUST** 对会改变群加密状态的握手事件做线性排序，并保证同一 `group_did` 的成员看到一致的被接受顺序。

### 3.5 不以硬时间窗做主 anti-replay

`created_at` **MAY** 用于审计和过期策略，但 **MUST NOT** 作为唯一的群消息 anti-replay 条件。

接收方 **MUST** 基于：

- `crypto_group_id`
- `epoch`
- 成员认证上下文
- 消息 generation / nonce 使用状态
- `message_id`

做状态型 anti-replay。

---

## 4. Profile 标识与依赖

### 4.1 Profile 名称

本 Profile 的标准名称为：

`anp.group.e2ee.v1`

### 4.2 依赖关系

本 Profile **MUST** 依赖以下 Profile：

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`
- `anp.group.base.v1`

### 4.3 安全模式

使用本 Profile 时：

- `meta.profile` **MUST** 等于 `anp.group.e2ee.v1`
- `meta.security_profile` **MUST** 等于 `group-e2ee`

若群策略要求 `group-e2ee`，任意 `transport-protected` 的 `group.send` 或群控制操作 **MUST** 被拒绝，除非该操作在本 Profile 中被明确定义为纯发现或纯查询动作。

---

## 5. 套件与能力模型

### 5.1 群加密套件

本 Profile 采用 MLS-like 群密钥状态机。

一个 Group E2EE suite 至少应覆盖：

1. 群初始化；
2. KeyPackage 格式与验证；
3. Proposal / Commit / Welcome；
4. `PrivateMessage` 加密应用消息；
5. `epoch` 推进与状态更新；
6. 成员认证与组上下文绑定。

### 5.2 能力通告

支持本 Profile 的服务 **MUST** 在 `anp.get_capabilities` 中通告：

- 支持的 `group-e2ee` 安全模式；
- 支持的 Group E2EE suite / MLS ciphersuite 列表；
- 是否支持外部加入、是否支持邀请审批；
- 最大群成员数、最大握手对象字节数、最大应用消息字节数；
- 是否暴露 `epoch_authenticator` 或等价一致性令牌。

### 5.3 最小实现要求

一个符合本 Profile 的实现：

- **MUST** 至少实现一个已注册的 Group E2EE suite；
- **MUST** 支持加密应用消息对象；
- **SHOULD** 支持成员变更、欢迎对象和分叉检测。

---

## 6. Group DID、群状态与绑定规则

### 6.1 `group_did` 与 `crypto_group_id`

`group_did` 是应用层群的全球标识；`crypto_group_id` 是密码学内部的组标识。

本 Profile 要求：

- `group_did` **MUST** 由 Group Base 管理；
- `crypto_group_id` **MUST** 对每个群唯一；
- 接收方 **MUST** 能验证某个 `crypto_group_id` 归属于哪个 `group_did`。

### 6.2 `group_state_ref`

本 Profile 推荐以下 `group_state_ref` 结构：

```json
{
  "group_did": "did:example:group-001",
  "group_state_version": "42",
  "policy_hash": "sha256:..."
}
```

其中：

- `group_did` **MUST** 存在；
- `group_state_version` **SHOULD** 存在；
- `policy_hash` **SHOULD** 在群策略参与授权判断时存在。

### 6.3 绑定要求

以下要素 **MUST** 在群加密语义中被绑定：

- `group_did`
- `crypto_group_id`
- `meta.profile = anp.group.e2ee.v1`
- `meta.security_profile = group-e2ee`
- `group_state_ref`（至少包含 `group_did` 与 `group_state_version`）

绑定位置可以是：

- 群上下文扩展；
- `authenticated_data`；
- 加密应用载荷中的受认证对象；
- suite 定义的等价机制。

实现方 **MUST NOT** 让这些字段处于可被中间人更换而不被检测的状态。

---

## 7. Key Service 与 KeyPackage

### 7.1 总则

支持本 Profile 的 Agent **SHOULD** 通过 `ANPKeyService` 发布可用于群加入的 KeyPackage 类材料。

需要把某 Agent 加入群时，发起方或 Group Host Service **MUST** 获取目标 Agent 的可用 KeyPackage，除非该材料已随邀请或加入请求显式携带。

### 7.2 `group_key_package` 对象

推荐字段：

- `key_package_id`：字符串，**MUST**
- `suite`：字符串，**MUST**
- `owner_did`：字符串，**MUST**
- `key_package_b64u`：字符串，**MUST**
- `expires_at`：RFC 3339 时间字符串，**SHOULD**
- `not_before`：RFC 3339 时间字符串，**MAY**
- `key_package_extensions`：对象，**MAY**

### 7.3 `group.e2ee.publish_key_package`

#### 7.3.1 语义

由某 Agent 向其 `ANPKeyService` 发布一个可用于后续群加入的 KeyPackage。

#### 7.3.2 请求要求

- `method = "group.e2ee.publish_key_package"`
- `meta.profile = "anp.group.e2ee.v1"`
- `meta.security_profile = "transport-protected"`
- `body.group_key_package` **MUST** 存在
- `body.group_key_package.owner_did` **MUST** 等于 `meta.sender_did`

#### 7.3.3 成功响应

成功响应 **MUST** 至少包含：

- `published`：布尔值，且为 `true`
- `owner_did`
- `key_package_id`
- `published_at`

### 7.4 `group.e2ee.get_key_package`

#### 7.4.1 语义

由发起方或 Group Host Service 获取某目标 Agent 当前可用的 KeyPackage。

#### 7.4.2 请求要求

`body` **MUST** 包含：

- `target_did`

`body` **MAY** 包含：

- `preferred_suite`
- `min_expiry`

#### 7.4.3 成功响应

成功响应 **MUST** 至少包含：

- `target_did`
- `group_key_package`

### 7.5 KeyPackage 验证要求

使用某 KeyPackage 前，调用方 **MUST** 验证：

1. `owner_did` 与目标 Agent 一致；
2. `suite` 本地可接受；
3. KeyPackage 未过期、未撤销；
4. KeyPackage 中的身份绑定与 DID 信任链一致。

---

## 8. 外层内容类型与承载对象

### 8.1 标准外层内容类型

本 Profile 定义以下标准外层 `meta.content_type`：

- `application/anp-group-handshake+mls`
- `application/anp-group-cipher+mls`

### 8.2 `group_handshake_object`

当 `meta.content_type = "application/anp-group-handshake+mls"` 时，`body` **MUST** 为 `group_handshake_object`。

推荐字段：

- `crypto_group_id_b64u`：字符串，**MUST**
- `suite`：字符串，**MUST**
- `epoch`：十进制字符串，**SHOULD**
- `handshake_type`：字符串，**MUST**，推荐值：`proposal`、`commit`、`welcome`、`external-commit`
- `proposal_b64u`：字符串，**MAY**
- `commit_b64u`：字符串，**MAY**
- `welcome_b64u`：字符串，**MAY**
- `group_state_ref`：对象，**SHOULD**
- `epoch_authenticator`：字符串，**MAY**

规则：

- `proposal_b64u`、`commit_b64u`、`welcome_b64u` 中 **MUST** 至少出现一个；
- `handshake_type` 与实际出现的对象 **MUST** 一致；
- 若 `group_state_ref` 存在，其 `group_did` **MUST** 与外层目标 `group_did` 一致。

### 8.3 `group_cipher_object`

当 `meta.content_type = "application/anp-group-cipher+mls"` 时，`body` **MUST** 为 `group_cipher_object`。

推荐字段：

- `crypto_group_id_b64u`：字符串，**MUST**
- `suite`：字符串，**MUST**
- `epoch`：十进制字符串，**MUST**
- `private_message_b64u`：字符串，**MUST**
- `group_state_ref`：对象，**SHOULD**
- `epoch_authenticator`：字符串，**MAY**

### 8.4 `group_application_plaintext`

`anp.group.base.v1` 的 `group.send` 应用语义，在本 Profile 下 **MUST** 先变换为 `group_application_plaintext` 再加密承载。

推荐结构：

```json
{
  "application_content_type": "text/plain | application/json | application/anp-attachment-manifest+json | ...",
  "thread_id": "thread-001",
  "reply_to_message_id": "msg-previous",
  "annotations": {},
  "group_state_ref": {
    "group_did": "did:example:group-001",
    "group_state_version": "42",
    "policy_hash": "sha256:..."
  },
  "text": "...",
  "payload": {},
  "payload_b64u": "..."
}
```

规则：

- `application_content_type` **MUST** 存在；
- `text` / `payload` / `payload_b64u` 三者中 **MUST** 恰好出现一个；
- `group_state_ref.group_did` **MUST** 等于目标 `group_did`。

---

## 9. 基础方法与群密钥状态机映射

### 9.1 总则

本 Profile 不新增新的群业务动作；它规定 Group Base 方法在 `group-e2ee` 模式下的密码学承载与绑定。

### 9.2 `group.create`

在 `group-e2ee` 模式下，`group.create` 除了创建 `group_did` 和基础 `group_profile` / `group_policy` 外，还 **MUST**：

1. 初始化新的 `crypto_group_id`；
2. 建立初始群密钥状态；
3. 为创建者建立初始成员资格；
4. 返回初始 `epoch` 与必要的群握手材料。

`body` **SHOULD** 包含：

- `creator_key_package_id` 或 `creator_key_package_b64u`
- `preferred_suite`

成功响应 **MUST** 至少包含：

- `group_did`
- `group_state_version`
- `crypto_group_id_b64u`
- `epoch`
- `suite`

### 9.3 `group.invite`

`group.invite` 在 `group-e2ee` 模式下表示应用层邀请动作；它 **MAY** 仅创建邀请记录，而暂不改变加密成员集。

是否在 `group.invite` 阶段立即产生密码学加入动作，由群策略决定；若未立即加入，则后续 `group.accept_invite` **MUST** 触发真正的加密加入。

### 9.4 `group.accept_invite`

当被邀请方接受邀请并进入加密群时，`group.accept_invite` **MUST** 导致：

1. 获取被邀请方有效的 KeyPackage；
2. 生成对应的 Add Proposal / Commit 或等价握手；
3. 生成 `Welcome` 对象或等价引导材料；
4. 推进 `epoch`。

成功响应 **MUST** 至少包含：

- `group_did`
- `group_state_version`
- `epoch`
- `handshake_type = "welcome"` 或等价结果标记

### 9.5 `group.add`

`group.add` 在 `group-e2ee` 模式下 **MUST** 导致一次成员加入握手，并 **MUST** 使用目标 Agent 的 KeyPackage。

若调用方未显式提供 `member_key_package_id` 或 `member_key_package_b64u`，Group Host Service **MUST** 通过 `ANPKeyService` 获取。

### 9.6 `group.remove`

`group.remove` 在 `group-e2ee` 模式下 **MUST** 导致一次成员移除握手，并 **MUST** 推进 `epoch`。

被移除成员在成功移除后 **MUST NOT** 再解密后续 `epoch` 的群消息。

### 9.7 `group.leave`

`group.leave` 在 `group-e2ee` 模式下 **SHOULD** 通过自移除握手或等价 Commit 完成，并 **MUST** 推进 `epoch`。

### 9.8 `group.update_profile` 与 `group.update_policy`

这两类操作本质上属于应用层状态变化，而不一定改变密码学成员集。

在 `group-e2ee` 模式下：

- 其请求与响应语义仍由 Group Base 定义；
- 其状态变化 **MUST** 被 Group Host Service 线性化；
- 若变化会影响成员资格、安全模式或后续加入规则，则 **SHOULD** 被绑定到下一次 Commit 的 `authenticated_data`、群上下文扩展或等价机制中；
- 否则 **MAY** 作为加密的群控制应用消息承载。

### 9.9 `group.send`

在 `group-e2ee` 模式下，`group.send` **MUST** 使用：

- `method = "group.send"`
- `meta.profile = "anp.group.e2ee.v1"`
- `meta.security_profile = "group-e2ee"`
- `meta.content_type = "application/anp-group-cipher+mls"`

外层 `body` **MUST** 为 `group_cipher_object`。

内层应用负载 **MUST** 先构造成 `group_application_plaintext`，然后作为 `PrivateMessage` 的应用数据被加密。

---

## 10. 握手、排序、Epoch 与一致性

### 10.1 握手对象排序

所有会改变群密码学状态的握手对象 **MUST** 由 Group Host Service 排序。至少包括：

- Add / Remove / Update 等 Proposal 的采纳结果；
- Commit；
- External Commit（若支持）。

### 10.2 应用消息与握手的关系

实现方 **MUST** 确保：

- 群应用消息能够识别其所属 `epoch`；
- 当握手推进 `epoch` 后，成员按 suite 规则切换到新状态；
- 对于允许迟到消息的窗口，实现方 **MAY** 保留有限的旧状态以处理延迟到达的应用消息。

### 10.3 `epoch` 的表示

外层对象中的 `epoch` **MUST** 采用十进制字符串表示。

### 10.4 `epoch_authenticator`

若所用 suite 支持或可导出等价一致性令牌，实现方 **SHOULD** 暴露 `epoch_authenticator` 或等价字段，用于：

- 多成员一致性抽检；
- 分叉检测；
- 调试与诊断。

### 10.5 分叉处理

若成员观察到同一 `group_did` 在相同或相邻状态下出现不一致的 `epoch_authenticator`、不一致的 `crypto_group_id` 绑定或不可调和的握手顺序，**SHOULD**：

- 标记该群为 `fork-suspected`；
- 暂停发送新的加密应用消息；
- 要求重新同步群状态或人工恢复。

---

## 11. Anti-Replay 与延迟消息

### 11.1 状态型 anti-replay

接收方 **MUST** 基于以下维度进行 anti-replay：

- `crypto_group_id`
- `epoch`
- 成员发送者上下文
- generation / nonce 使用状态
- `message_id`

### 11.2 延迟和乱序

实现方 **MUST** 容忍在 suite 允许范围内的延迟与乱序消息。

若为了处理迟到消息需要暂存旧 `epoch` 的接收状态，实现方 **MAY** 这样做，但 **MUST** 对保留窗口和资源消耗设置上限。

### 11.3 时间戳规则

`created_at` **MAY** 用于软过期策略与审计，但 **MUST NOT** 成为唯一 anti-replay 规则。

---

## 12. 安全与策略

### 12.1 强制安全模式

若 `group_policy.required_security_profile = "group-e2ee"`：

- 发送方 **MUST** 使用本 Profile；
- 任意 `transport-protected` 的 `group.send`、`group.add`、`group.remove`、`group.leave`、`group.update_policy` 等操作 **MUST** 被拒绝；
- 服务端 **MUST NOT** 静默降级。

### 12.2 成员变更的密码学绑定

以下操作 **MUST** 被绑定到对应的加密状态变更：

- `group.accept_invite`
- `group.add`
- `group.remove`
- `group.leave`

也就是说，应用层成员关系更新 **MUST NOT** 独立于对应的 Proposal / Commit / Welcome 成功而单独生效。

### 12.3 应用层 Group Policy 的地位

`group_policy` 仍然是应用层权限权威；本 Profile 只要求它与群加密状态机保持一致绑定。

`group_did` 文档中的 `controller` **MUST NOT** 被机械等同为当前加密群的应用层管理员集合。

### 12.4 不透明负载原则

除非实现承担终端群解密职责，中间服务 **SHOULD** 将 `group_handshake_object` 与 `group_cipher_object` 视为不透明对象，而不解释其应用层载荷。

---

## 13. Profile 特定错误（推荐）

在沿用 ANP Core 公共错误模型的前提下，本 Profile 推荐以下 `anp_code`：

| `code` | `anp_code` | 含义 |
|---|---|---|
| 5000 | `group.e2ee.key_package_not_found` | 未找到可用的 KeyPackage |
| 5001 | `group.e2ee.invalid_key_package` | KeyPackage 验证失败 |
| 5002 | `group.e2ee.welcome_required` | 需要 Welcome 或等价加入材料 |
| 5003 | `group.e2ee.epoch_conflict` | `epoch` 与当前状态冲突 |
| 5004 | `group.e2ee.commit_conflict` | 并发 Commit 或排序冲突 |
| 5005 | `group.e2ee.stale_epoch` | 消息或握手来自过旧的 `epoch` |
| 5006 | `group.e2ee.invalid_group_binding` | `group_did` 与 `crypto_group_id` 绑定非法 |
| 5007 | `group.e2ee.decrypt_failed` | 群消息解密失败 |
| 5008 | `group.e2ee.fork_suspected` | 检测到潜在分叉 |
| 5009 | `group.e2ee.policy_binding_missing` | 缺少必要的 `group_state_ref` / `policy_hash` 绑定 |

---

## 14. 最小互通要求

一个符合本 Profile 的实现至少 **MUST** 支持：

1. `group.e2ee.publish_key_package`
2. `group.e2ee.get_key_package`
3. `group.create` 在 `group-e2ee` 模式下创建群
4. `group.add` / `group.accept_invite` 的加密成员加入
5. `group.remove` 或 `group.leave` 的加密成员移除
6. 通过 `group.send` 承载 `application/anp-group-cipher+mls`
7. 至少一个已注册的 Group E2EE suite
8. `group_did` 与 `crypto_group_id` 的绑定验证
9. 状态型 anti-replay 与基本分叉检测能力

---

## 15. 示例

### 15.1 获取 KeyPackage

```json
{
  "jsonrpc": "2.0",
  "id": "req-60001",
  "method": "group.e2ee.get_key_package",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.group.e2ee.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:agent-a",
      "operation_id": "op-60001",
      "created_at": "2026-03-29T13:00:00Z"
    },
    "body": {
      "target_did": "did:example:agent-b",
      "preferred_suite": "anp-group-mls-v1"
    }
  }
}
```

### 15.2 加密群消息

```json
{
  "jsonrpc": "2.0",
  "id": "req-60002",
  "method": "group.send",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.group.e2ee.v1",
      "security_profile": "group-e2ee",
      "sender_did": "did:example:agent-a",
      "target": {
        "kind": "group",
        "did": "did:example:group-001"
      },
      "operation_id": "op-60002",
      "message_id": "msg-60002",
      "created_at": "2026-03-29T13:01:00Z",
      "content_type": "application/anp-group-cipher+mls"
    },
    "body": {
      "crypto_group_id_b64u": "BASE64URL_GROUP_ID",
      "suite": "anp-group-mls-v1",
      "epoch": "7",
      "private_message_b64u": "BASE64URL_PRIVATE_MESSAGE",
      "group_state_ref": {
        "group_did": "did:example:group-001",
        "group_state_version": "42",
        "policy_hash": "sha256:abc123"
      },
      "epoch_authenticator": "BASE64URL_AUTH"
    }
  }
}
```

### 15.3 成员加入后的握手通知对象

```json
{
  "jsonrpc": "2.0",
  "method": "group.state_changed",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.group.e2ee.v1",
      "security_profile": "group-e2ee",
      "sender_did": "did:example:group-host",
      "target": {
        "kind": "group",
        "did": "did:example:group-001"
      },
      "content_type": "application/anp-group-handshake+mls"
    },
    "body": {
      "crypto_group_id_b64u": "BASE64URL_GROUP_ID",
      "suite": "anp-group-mls-v1",
      "epoch": "8",
      "handshake_type": "welcome",
      "welcome_b64u": "BASE64URL_WELCOME",
      "group_state_ref": {
        "group_did": "did:example:group-001",
        "group_state_version": "43",
        "policy_hash": "sha256:def456"
      }
    }
  }
}
```

---

## 附录 A（信息性）：参考规范

- ANP Profile 1：Core Binding Profile（草案）
- ANP Profile 2：Identity and Discovery Profile（草案）
- ANP Profile 4：Group Base Profile（草案）
- IETF MLS Protocol
- IETF MLS Architecture
