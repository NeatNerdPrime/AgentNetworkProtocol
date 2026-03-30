# ANP Profile 6：Group E2EE Profile（草案）

- 文档编号：ANP-P6
- 标题：Group E2EE Profile
- 状态：Draft
- 版本：0.2.0
- 语言：中文
- 适用范围：本 Profile 适用于基于 Group DID 的群组端到端加密 Overlay，叠加在 `anp.group.base.v1` 之上。

---

## 1. 目的

本 Profile 定义 ANP 的群组端到端加密 Overlay，规定：

1. 如何在 `anp.group.base.v1` 的群应用语义之上叠加 MLS 型群端到端加密；
2. 如何把 `group_did`、`group_state_version`、`group_event_seq` 与 `crypto_group_id`、`epoch`、`epoch_authenticator` 建立可验证绑定；
3. 如何把 did:wba 身份与 MLS 成员凭证、KeyPackage、叶子签名键进行绑定；
4. 如何将 `group.create`、`group.invite`、`group.accept_invite`、`group.join`、`group.add`、`group.remove`、`group.leave`、`group.update_profile`、`group.update_policy`、`group.send` 等基础动作映射到群密码学状态机；
5. 如何处理 `Welcome`、`External Commit`、`PrivateMessage`、`PublicMessage`、分叉检测与恢复；
6. 如何与 P4 中的 `auth.actor_proof`、Signed Group Payload、`group_receipt`、`Logical Group Target URI` 完整对齐。

本 Profile **不**定义：

- 历史消息拉取；
- 已读与在线状态；
- 设备或内部副本概念；
- Agent 内部多个执行单元之间如何共享群密钥状态；
- 群外目录同步的具体实现；
- 非群场景的端到端加密。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

除非另有说明，本 Profile 继承 P4 中下列术语的定义：

- Group
- Group Host Service
- Group State Version
- Group Event Sequence
- Actor Proof
- Group Receipt
- Logical Group Target URI

本 Profile 额外引入如下术语：

- **Crypto Group ID**：群密码学内部标识，对应 MLS `group_id`，可与 `group_did` 不同。
- **MLS Group State**：基于 MLS 维护的群密码学状态。
- **Epoch**：MLS 群状态的一次代际推进。
- **KeyPackage**：MLS 加入材料对象，用于把一个新成员加入群。
- **Welcome**：MLS 欢迎对象，用于帮助新成员初始化群状态。
- **External Commit**：MLS 中由新成员主动生成的特殊 Commit，用于外部加入场景。
- **PrivateMessage**：加密且带成员认证的 MLS 消息。
- **PublicMessage**：仅签名而不加密的 MLS 消息。
- **did_wba_binding**：把某个 MLS 叶子签名键、成员凭证或 KeyPackage 绑定到某个 `agent_did` 的可验证证明对象。
- **Group Join Info**：为外部加入提供的群公开加入材料，至少包括 `GroupInfo` 和外部加入所需上下文。
- **Fork**：对同一 `group_did`，不同成员观察到无法调和的 `epoch` / `epoch_authenticator` / 状态推进序列。

---

## 3. 设计原则

### 3.1 继续复用 P4 作为控制面

本 Profile **不**替代 P4，而是在其之上叠加密码学语义。

因此：

- `auth.actor_proof` 仍然表示“是谁发起了请求”；
- Signed Group Payload 的定义、`@target-uri` 到 `Logical Group Target URI` 的映射、以及跨域转发时不得重写 `auth.actor_proof` 的规则，继续由 P4 约束；
- `group_receipt` 仍然表示“Group Host 已接受并排序了该结果”；
- MLS 负责“密码学上哪个成员提交了什么握手或消息”以及“哪些成员有权解密后续消息”。

### 3.2 群身份与密码学状态分层

本 Profile 明确区分：

- `group_did`：应用层群全球标识；
- `crypto_group_id`：密码学群内部标识；
- `group_state_version`：由 Group Host 分配的应用层群状态版本；
- `group_event_seq`：由 Group Host 分配的群事件序号；
- `epoch`：由 MLS 状态机分配的密码学群代际。

这些标识 **MUST NOT** 被机械等同；但它们之间 **MUST** 有可验证的绑定关系。

### 3.3 一个 Agent = 一个外部群成员

本 Profile 的外部互通边界中，一个群成员始终由一个 `agent_did` 表示。协议层 **不**引入设备、终端或内部副本成员概念。

某 Agent 内部若有多个执行副本，它们如何共享或同步 MLS 群状态，属于该 Agent 内部实现，不属于本 Profile 的互通语义。

### 3.4 Group Host 负责排序，不负责持有群明文

Group Host Service 的职责是：

- 接收并排序群控制操作；
- 为已接受事件分配 `group_event_seq`；
- 推进 `group_state_version`；
- 分发握手结果与应用事件；
- 返回 `group_receipt`。

默认情况下，Group Host Service **不应** 作为 MLS 群成员，也 **不应** 持有群应用明文的解密能力。

### 3.5 默认主线使用 did:wba `e1_`

本 Profile 的主线身份绑定 **SHOULD** 优先适配 did:wba 的默认 `e1_` 路径型 profile。为兼容 secp256k1 生态，支持 `k1_` 的 DID **MAY** 进入群，但其 MLS 叶子签名键与 KeyPackage 绑定证明仍 **SHOULD** 转化为本 Profile 可验证的 `did_wba_binding` 结构。

### 3.6 非目标

本 Profile 不试图把 MLS 的所有可选扩展一次性纳入 v1。v1 主线目标是：

- 标准化的群成员变更；
- 标准化的群应用消息加密；
- 标准化的 did:wba 绑定；
- 标准化的 Host 排序与回执语义；
- 与 P4 字段、方法和签名模型保持一致。

---

## 4. 依赖与 Profile 标识

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

- `meta.profile` **MUST** 等于 `anp.group.e2ee.v1`；
- `meta.security_profile` **MUST** 等于 `group-e2ee`。

若某群的 `group_policy.required_security_profile = "group-e2ee"` 或 `group_policy.required_security_profile = "group-e2ee-required"`，则：

- `transport-protected` 的 `group.send` **MUST** 被拒绝；
- 会改变成员加密状态的群控制操作 **MUST** 满足本 Profile 的密码学要求；
- 服务端 **MUST NOT** 静默降级到非 E2EE 路径。

---

## 5. 密码学主线与 MTI 套件

### 5.1 主线协议

本 Profile 的主线群密钥协议 **MUST** 基于 MLS 1.0 语义实现，至少包括：

- Add
- Update
- Remove
- Commit
- Welcome
- PrivateMessage
- PublicMessage
- Epoch 推进
- GroupInfo

### 5.2 Mandatory-to-Implement 套件

为保证最小互通，符合本 Profile 的实现 **MUST** 支持下列 MTI 套件：

`MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519`

### 5.3 额外套件

实现 **MAY** 支持更多 MLS 套件，但：

- 所有成员在同一群内 **MUST** 对所用套件达成一致；
- 若群策略限制允许套件集合，则 Group Host **MUST** 拒绝不满足策略的套件。

### 5.4 与 did:wba 的关系

本 Profile 的主线与 did:wba 的关系如下：

- DID 文档中的 `authentication` / `assertionMethod` 用于身份绑定证明；
- DID 文档中的 `keyAgreement` **SHOULD** 至少包含一个 X25519 条目，表示该 Agent 具备 E2EE 能力；
- MLS 群成员的叶子签名键 **不应** 直接等同于 DID 长期身份签名键；
- 叶子签名键 **SHOULD** 单独生成，并通过 `did_wba_binding` 绑定到 `agent_did`。

---

## 6. did:wba 与 MLS 的绑定模型

### 6.1 绑定目标

本 Profile 要求把以下 MLS 元素绑定到 `agent_did`：

1. KeyPackage 所属者；
2. 当前叶子签名键；
3. 群成员凭证中的身份字符串。

### 6.2 Credential Identity 规则

对于本 Profile，MLS 成员凭证中的 `credential.identity` **MUST** 等于 `agent_did` 的 UTF-8 字节串。

实现 **MUST NOT** 使用本地账号 ID、设备 ID、数值用户 ID 或其它非 DID 字符串替代 `credential.identity`。

### 6.3 `did_wba_binding` 对象

本 Profile 定义 `did_wba_binding` 对象，用于把 MLS 叶子签名键绑定到 `agent_did`。

推荐结构如下：

```json
{
  "agent_did": "did:wba:example.com:agents:alice:e1_<fingerprint>",
  "verification_method": "did:wba:example.com:agents:alice:e1_<fingerprint>#key-1",
  "leaf_signature_key_b64u": "BASE64URL_ED25519_LEAF_PK",
  "issued_at": "2026-03-29T12:00:00Z",
  "expires_at": "2026-04-29T12:00:00Z",
  "proof": {
    "type": "DataIntegrityProof",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:wba:example.com:agents:alice:e1_<fingerprint>#key-1",
    "proofValue": "z..."
  }
}
```

### 6.4 `did_wba_binding` 验证规则

接收方在接受 KeyPackage、LeafNode 更新或新成员加入前，**MUST** 完成以下验证：

1. `agent_did` 可被解析；
2. `verification_method` 存在于该 DID 文档中；
3. `verification_method` 被 DID 文档的 `assertionMethod` 或部署策略允许的等价关系授权；
4. `proof` 验证通过；
5. `proof` 覆盖了 `agent_did`、`leaf_signature_key_b64u`、`issued_at`、`expires_at`；
6. KeyPackage / LeafNode 中实际的叶子签名公钥与 `leaf_signature_key_b64u` 一致；
7. MLS 凭证中的 `credential.identity` 与 `agent_did` 一致。

### 6.5 `e1_` 与 `k1_` 兼容

- 对默认 `e1_` DID，`did_wba_binding.proof` **SHOULD** 使用与 Ed25519 兼容的 Data Integrity 证明；
- 对兼容型 `k1_` DID，`did_wba_binding.proof` **MAY** 使用与 secp256k1 兼容的证明；
- 无论 DID 的身份曲线为何，MLS 群的 MTI 叶子签名键仍 **MAY** 使用 Ed25519，只要绑定证明成立即可。

---

## 7. 群对象与承载对象

### 7.1 `crypto_group_id`

`crypto_group_id` 表示 MLS 的内部 `group_id`。

规则如下：

- `crypto_group_id` **MUST** 作为不透明字节串处理；
- 在 JSON 中 **MUST** 采用 `base64url` 表示，字段名推荐为 `crypto_group_id_b64u`；
- `crypto_group_id` **MUST** 与 `group_did` 建立可验证绑定。

### 7.2 `group_state_ref`

本 Profile 复用 P4 的 `group_state_ref` 概念，并要求在 E2EE 群中至少包含：

- `group_did`
- `group_state_version`
- `policy_hash`（若群策略已哈希化）

### 7.3 `group_key_package`

本 Profile 定义群加入材料包装对象：

```json
{
  "key_package_id": "kp-001",
  "owner_did": "did:wba:example.com:agents:bob:e1_<fingerprint>",
  "suite": "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519",
  "mls_key_package_b64u": "BASE64URL_KEYPACKAGE",
  "did_wba_binding": { ... },
  "expires_at": "2026-04-30T00:00:00Z"
}
```

其中：

- `key_package_id` **MUST** 存在；
- `owner_did` **MUST** 存在；
- `suite` **MUST** 存在；
- `mls_key_package_b64u` **MUST** 存在；
- `did_wba_binding` **MUST** 存在；
- `expires_at` **SHOULD** 存在。

### 7.4 `group_join_info`

为支持外部加入，本 Profile 定义 `group_join_info` 对象。

推荐结构如下：

```json
{
  "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
  "group_state_ref": {
    "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
    "group_state_version": "42",
    "policy_hash": "sha-256:..."
  },
  "suite": "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519",
  "group_info_b64u": "BASE64URL_GROUPINFO",
  "crypto_group_id_b64u": "BASE64URL_GROUPID",
  "epoch": "7",
  "epoch_authenticator": "BASE64URL_AUTH"
}
```

`group_join_info` **MUST** 提供足以让新成员生成 External Commit 的信息。

### 7.5 `body.e2ee`

当方法运行在 `group-e2ee` 模式下时，`body` **MAY** 含有常规的 P4 应用层字段，但其密码学承载 **MUST** 放入 `body.e2ee` 对象中。

推荐结构：

```json
{
  "...": "P4 业务字段",
  "e2ee": {
    "suite": "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519",
    "handshake": { ... },
    "cipher": { ... }
  }
}
```

规则：

- 状态改变型方法在需要密码学状态推进时，**MUST** 使用 `body.e2ee.handshake`；
- `group.send` **MUST** 使用 `body.e2ee.cipher`；
- 除 `group.send` 外，`body.e2ee.cipher` **MUST NOT** 出现；
- 对同一请求，`body.e2ee.handshake` 与 `body.e2ee.cipher` **MUST NOT** 同时出现。

### 7.6 `group_handshake_submission`

对于所有会改变群加密状态的操作，请求 `body.e2ee.handshake` **MUST** 使用 `group_handshake_submission`。

推荐结构如下：

```json
{
  "wire_format": "mls-private-message | mls-public-message",
  "crypto_group_id_b64u": "BASE64URL_GROUPID",
  "epoch": "7",
  "handshake_kind": "commit | proposal | welcome | external-commit",
  "mls_message_b64u": "BASE64URL_PUBLICMESSAGE_OR_PRIVATEMESSAGE",
  "welcome_b64u": "BASE64URL_WELCOME",
  "group_info_b64u": "BASE64URL_GROUPINFO",
  "group_state_ref": {
    "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
    "group_state_version": "42",
    "policy_hash": "sha-256:..."
  },
  "epoch_authenticator": "BASE64URL_AUTH"
}
```

规则如下：

- `wire_format` **MUST** 存在；
- `handshake_kind` **MUST** 存在；
- `mls_message_b64u` **MUST** 存在；
- `group_state_ref.group_did` **MUST** 等于外层目标 `group_did`；
- 若操作会添加成员，`welcome_b64u` **SHOULD** 存在；
- 若操作为外部加入，`group_info_b64u` **SHOULD** 存在。

### 7.7 `group_cipher_object`

当 `group.send` 在 `group-e2ee` 模式下发送应用消息时，`body.e2ee.cipher` **MUST** 为 `group_cipher_object`。

推荐结构如下：

```json
{
  "crypto_group_id_b64u": "BASE64URL_GROUPID",
  "epoch": "7",
  "private_message_b64u": "BASE64URL_PRIVATEMESSAGE",
  "group_state_ref": {
    "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
    "group_state_version": "42",
    "policy_hash": "sha-256:..."
  },
  "epoch_authenticator": "BASE64URL_AUTH"
}
```

### 7.8 外层 `meta.content_type` 与内层明文内容类型

为与 P4 对齐，当 `group.send` 运行在 `group-e2ee` 模式下时：

- 外层 `meta.content_type` **MUST** 继续表示原始应用内容类型；
- 允许值至少包括 P4 要求的：
  - `text/plain`
  - `application/json`
  - `application/anp-attachment-manifest+json`
- `body` 外层 **MUST NOT** 直接出现 P4 的 `text` / `payload` / `payload_b64u` 明文字段；
- 这些字段的语义 **MUST** 转移到加密后的内层应用明文对象中；
- `meta.content_type` 与内层应用明文的内容类型 **MUST** 一致。

### 7.9 `group_application_plaintext`

发送方在加密群应用消息前，**MUST** 先构造 `group_application_plaintext` 对象。

推荐结构如下：

```json
{
  "application_content_type": "text/plain | application/json | application/anp-attachment-manifest+json",
  "thread_id": "thread-001",
  "reply_to_message_id": "msg-previous",
  "annotations": {},
  "group_state_ref": {
    "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
    "group_state_version": "42",
    "policy_hash": "sha-256:..."
  },
  "text": "...",
  "payload": {},
  "payload_b64u": "..."
}
```

规则如下：

- `application_content_type` **MUST** 存在；
- `text`、`payload`、`payload_b64u` 三者中 **MUST** 恰好出现一个；
- `application_content_type` **MUST** 等于外层 `meta.content_type`；
- `group_state_ref.group_did` **MUST** 等于外层目标 `group_did`。

### 7.10 `group_receipt.e2ee`

为与 P4 的 `group_receipt` 对齐，本 Profile 定义可选的 `group_receipt.e2ee` 扩展对象。

推荐字段：

- `crypto_group_id_b64u`：字符串，**MAY**
- `epoch`：字符串，**MAY**
- `epoch_authenticator`：字符串，**MAY**
- `handshake_kind`：字符串，**MAY**
- `wire_format`：字符串，**MAY**
- `mls_message_digest`：字符串，**MAY**

该扩展对象的语义是：证明“Group Host 接受并排序了与某个 MLS 状态推进或群密文事件相绑定的结果”。

---

## 8. KeyPackage 发布与发现方法

### 8.1 `group.e2ee.publish_key_package`

#### 8.1.1 语义

由某 Agent 向其 `ANPKeyService` 发布一个可用于群加入的 KeyPackage。

#### 8.1.2 请求要求

- `method = "group.e2ee.publish_key_package"`
- `meta.profile = "anp.group.e2ee.v1"`
- `meta.security_profile = "transport-protected"`
- `meta.sender_did` **MUST** 存在
- `body.group_key_package` **MUST** 存在
- `body.group_key_package.owner_did` **MUST** 等于 `meta.sender_did`

#### 8.1.3 成功响应

成功响应 **MUST** 至少包含：

- `published = true`
- `owner_did`
- `key_package_id`
- `published_at`

### 8.2 `group.e2ee.get_key_package`

#### 8.2.1 语义

获取某个目标 Agent 的可用 KeyPackage。

#### 8.2.2 请求要求

`body` **MUST** 包含：

- `target_did`

`body` **MAY** 包含：

- `preferred_suite`
- `require_fresh`

#### 8.2.3 成功响应

成功响应 **MUST** 至少包含：

- `target_did`
- `group_key_package`

### 8.3 `group.e2ee.get_join_info`

#### 8.3.1 语义

为被邀请方或主动加入方获取外部加入所需的 `group_join_info`。

#### 8.3.2 请求要求

`body` **MUST** 包含：

- `group_did`

#### 8.3.3 成功响应

成功响应 **MUST** 至少包含：

- `group_did`
- `group_join_info`

---

## 9. 方法映射与操作规则

### 9.1 总则

本 Profile 不新增新的群业务动作；它规定 P4 方法在 `group-e2ee` 模式下的密码学承载与绑定。

所有会改变群加密状态的请求，以及 `group.send`，除满足本 Profile 的要求外，**MUST** 继续满足 P4 对以下内容的要求：

- `auth.actor_proof`
- Signed Group Payload
- `group_receipt`
- `expected_group_state_version`
- `group_state_version`
- `group_event_seq`

### 9.2 `group.create`

在 `group-e2ee` 模式下，`group.create` 除了创建 `group_did` 和基础 `group_profile` / `group_policy` 外，还 **MUST**：

1. 初始化新的 `crypto_group_id`；
2. 建立初始 MLS 群状态；
3. 为创建者建立初始成员资格；
4. 形成初始 `group_state_ref` 与 `epoch` 绑定。

`body` **MUST** 额外包含 `e2ee.init` 对象，推荐字段：

- `suite`
- `crypto_group_id_b64u`
- `creator_key_package_id` 或 `creator_key_package_b64u`
- `epoch`
- `group_info_b64u`（若生成）
- `epoch_authenticator`（若可导出）

成功响应 **MUST** 至少包含：

- `group_did`
- `group_state_version`
- `group_receipt`
- `result.e2ee.crypto_group_id_b64u`
- `result.e2ee.epoch`

### 9.3 `group.invite`

`group.invite` 在 `group-e2ee` 模式下默认表示**应用层邀请**，不要求立即改变密码学成员集。

因此：

- `group.invite` **MUST** 继续满足 P4 的邀请语义；
- `body.e2ee.handshake` **MAY** 省略；
- 若群策略要求“邀请即保留某种密码学上下文”，实现 **MAY** 附加 `body.e2ee.handshake`，但这不是最小互通要求。

### 9.4 `group.accept_invite`

当被邀请方接受邀请并真正进入加密群时，`group.accept_invite` **MUST** 导致以下之一：

- 由当前成员生成 Add/Commit/Welcome；或
- 由新成员生成 External Commit。

为支持跨域异步场景，符合本 Profile 的实现 **MUST** 支持 External Commit 路径。

因此 `body.e2ee.handshake`：

- **MUST** 存在；
- `handshake_kind` **SHOULD** 为 `external-commit` 或 `commit`；
- 若需要把新成员引导到群，`welcome_b64u` **MAY** 存在；
- `group_info_b64u` 在 `external-commit` 路径中 **SHOULD** 存在。

成功响应 **MUST** 至少包含：

- `group_did`
- `membership_status`
- `group_state_version`
- `group_receipt`

若密码学加入已完成，还 **MUST** 包含：

- `result.e2ee.epoch`
- `result.e2ee.crypto_group_id_b64u`

### 9.5 `group.join`

当群策略允许 `open-join` 或 `request-approval` 时，`group.join` 在 `group-e2ee` 模式下的规则如下：

- 若加入请求已获准并立即执行，则 `body.e2ee.handshake` **MUST** 存在；
- 若只是应用层进入审批阶段，则 `body.e2ee.handshake` **MAY** 省略，此时 `membership_status` **SHOULD** 返回 `pending`；
- 一旦真正完成密码学加入，服务端 **MUST** 返回新的 `group_state_version` 和 `group_receipt`，并 **SHOULD** 返回 `result.e2ee.epoch`。

### 9.6 `group.add`

在 `group-e2ee` 模式下，`group.add` **MUST** 导致一次密码学成员加入。

由于 Group Host 默认不是 MLS 成员，v1 基线要求如下：

- 请求 **MUST** 由有权限的现有成员发起；
- `body.e2ee.handshake` **MUST** 存在；
- 该握手 **MUST** 由当前加密群成员生成，而不是由 Host 代生成；
- 若需要，`welcome_b64u` **SHOULD** 存在。

部署 **MAY** 提供“群内 facilitator agent”来生成 Commit，但这不属于最小互通要求。

### 9.7 `group.remove`

在 `group-e2ee` 模式下，`group.remove` **MUST** 导致一次密码学成员移除。

请求 **MUST** 满足：

- `body.e2ee.handshake` **MUST** 存在；
- `handshake_kind` **SHOULD** 为 `commit`；
- 一旦新 `epoch` 生效，被移除成员 **MUST NOT** 解密后续群消息。

成功响应 **MUST** 至少包含：

- `group_did`
- `member_did`
- `group_state_version`
- `group_receipt`
- `result.e2ee.epoch`

### 9.8 `group.leave`

在 `group-e2ee` 模式下，`group.leave` v1 **SHOULD** 采用两阶段语义：

#### 阶段 A：应用层离群意图

- 发送方提交 `group.leave`；
- `auth.actor_proof` 证明离群请求由该成员发起；
- Group Host **MAY** 立即把其成员状态标记为 `pending` 或策略等价状态；
- 此阶段 **MAY** 不推进 `epoch`。

#### 阶段 B：密码学层正式移除

- 由在线且有权限的现有成员发起 Remove/Commit；
- 一旦 Commit 被 Host 接受，成员状态可转为 `left`；
- 服务端 **MUST** 返回新 `group_state_version`、`group_receipt` 和 `result.e2ee.epoch`。

若某部署可以在同一请求内附带有效的自离群或协调移除握手，则 `body.e2ee.handshake` **MAY** 出现，并在一次调用内完成两个阶段。

### 9.9 `group.update_profile` 与 `group.update_policy`

这两类操作首先是应用层状态变化，继续遵循 P4 语义。

但在 `group-e2ee` 模式下：

- 若变更会影响加入、移除、安全模式或消息授权规则，则其结果 **SHOULD** 被反映到 `group_state_ref.policy_hash`；
- 后续群握手或群消息 **MUST** 绑定最新的 `group_state_ref`；
- 这些操作本身 **MAY** 不推进 MLS `epoch`，除非具体部署策略要求在策略变化时做一次密码学重配置。

### 9.10 `group.send`

在 `group-e2ee` 模式下，`group.send` **MUST**：

1. 继续满足 P4 对 `auth.actor_proof`、Signed Group Payload 和 `expected_group_state_version` 的要求；
2. 外层 `meta.content_type` **MUST** 仍表示原始应用内容类型；
3. `body` **MUST** 包含 `e2ee.cipher`；
4. 外层 `body` **MUST NOT** 直接出现明文 `text` / `payload` / `payload_b64u`；
5. 内层加密消息 **MUST** 使用 MLS `PrivateMessage`；
6. `body.e2ee.cipher.group_state_ref.group_state_version` **SHOULD** 与 `body.expected_group_state_version` 一致；
7. Host 接受后 **MUST** 返回 `group_receipt`，并 **SHOULD** 在 `group_receipt.e2ee` 中返回：
   - `crypto_group_id_b64u`
   - `epoch`
   - `epoch_authenticator`

---

## 10. 受认证绑定与回执扩展

### 10.1 沿用 P4 的 Signed Group Payload

本 Profile 明确要求：

- P4 中的 Signed Group Payload 定义继续生效；
- 当请求包含 `body.e2ee` 时，`body.e2ee` **MUST** 被纳入 Signed Group Payload 的摘要计算；
- `auth` 本身仍 **MUST NOT** 纳入摘要。

### 10.2 群 E2EE 的最小绑定集合

对于运行在 `group-e2ee` 模式下的请求或消息，密码学层 **SHOULD** 至少绑定以下字段：

- `group_did`
- `sender_did`
- `group_state_version`
- `group_event_seq`（若已知）
- `message_id`
- `content_type`
- `security_profile`
- `auth.actor_proof.contentDigest`

### 10.3 `group_receipt` 扩展规则

若某操作推进了群密码学状态或携带了群密文，返回的 `group_receipt` **SHOULD** 含有 `e2ee` 扩展对象。

`group_receipt.e2ee` 的推荐字段见第 7.10 节。

---

## 11. 排序、Epoch、分叉与恢复

### 11.1 会改变密码学状态的操作

以下操作一旦在 `group-e2ee` 模式下真正改变密码学成员集或群密钥状态，Group Host Service **MUST** 将其线性化：

- `group.create`
- `group.accept_invite`
- `group.join`（真正加入时）
- `group.add`
- `group.remove`
- `group.leave`（真正完成密码学移除时）

### 11.2 `expected_group_state_version`

对于会改变群状态的操作，发送方 **SHOULD** 提供 `expected_group_state_version`。服务端：

- **MUST** 检查该值；
- 若冲突，**MUST** 返回明确冲突语义；
- **MUST NOT** 在调用方要求版本匹配时静默改用最新状态继续执行。

### 11.3 `epoch` 与 `group_state_version`

`epoch` 与 `group_state_version` 是不同维度：

- `group_state_version` 是应用层群状态版本；
- `epoch` 是密码学状态代际。

同一 `group_state_version` **MAY** 不推进 `epoch`；但一旦成员集或群密钥状态改变，新的 `group_state_version` **SHOULD** 与新的 `epoch` 共同出现。

### 11.4 分叉检测

实现 **SHOULD** 使用以下至少一种信号做分叉检测：

- `epoch_authenticator`
- `crypto_group_id_b64u`
- `group_receipt.e2ee.mls_message_digest`
- 对同一 `group_did` 的不一致 `epoch` 推进序列

若检测到不可调和的不一致，成员 **SHOULD**：

- 标记该群为 `fork-suspected`；
- 暂停发送新的加密应用消息；
- 请求新的群状态同步或人工恢复。

---

## 12. 与 P4 的方法和对象对齐说明

### 12.1 保持不变的 P4 要素

以下 P4 要素在本 Profile 中继续保持不变：

- `group_did`
- `group_state_version`
- `group_event_seq`
- `auth.actor_proof`
- Signed Group Payload
- `group_receipt`
- `group_profile`
- `group_policy`
- `group_state_ref`

### 12.2 被本 Profile 覆盖或细化的点

以下规则在 `meta.profile = anp.group.e2ee.v1` 时由本 Profile 覆盖或细化：

1. `group.send` 外层 `body` 不再直接承载 P4 的明文字段；
2. `group.send` 的真实业务明文进入 `group_application_plaintext` 后再加密；
3. 会改变密码学状态的操作 **MUST** 通过 `body.e2ee.handshake` 承载 MLS 对象；
4. `group_receipt` **SHOULD** 增加 `e2ee` 扩展字段。

---

## 13. Profile 特定错误（推荐）

在沿用 ANP Core 和 P4 公共错误模型的前提下，本 Profile 推荐以下 `anp_code`：

| `code` | `anp_code` | 含义 |
|---|---|---|
| 3100 | `group.e2ee.key_package_not_found` | 未找到可用的 KeyPackage |
| 3101 | `group.e2ee.invalid_key_package` | KeyPackage 验证失败 |
| 3102 | `group.e2ee.join_info_unavailable` | 无法提供外部加入材料 |
| 3103 | `group.e2ee.handshake_required` | 当前操作缺少必需的握手对象 |
| 3104 | `group.e2ee.epoch_conflict` | `epoch` 与当前密码学状态冲突 |
| 3105 | `group.e2ee.commit_conflict` | 并发 Commit 或排序冲突 |
| 3106 | `group.e2ee.stale_epoch` | 消息或握手来自过旧的 `epoch` |
| 3107 | `group.e2ee.invalid_group_binding` | `group_did` 与 `crypto_group_id` 绑定非法 |
| 3108 | `group.e2ee.decrypt_failed` | 群消息解密失败 |
| 3109 | `group.e2ee.fork_suspected` | 检测到潜在分叉 |
| 3110 | `group.e2ee.policy_binding_missing` | 缺少必要的 `group_state_ref` / `policy_hash` 绑定 |

---

## 14. 最小互通要求

一个符合本 Profile 的实现至少 **MUST** 支持：

1. `group.e2ee.publish_key_package`
2. `group.e2ee.get_key_package`
3. `group.e2ee.get_join_info`
4. `group.create` 在 `group-e2ee` 模式下创建群
5. `group.accept_invite` 的 External Commit 路径
6. `group.add` / `group.remove` 的密码学状态推进
7. `group.send` 通过 MLS `PrivateMessage` 承载应用消息
8. `group_did` 与 `crypto_group_id` 的绑定验证
9. `did_wba_binding` 验证
10. 状态型 anti-replay 与基本分叉检测能力
11. `group_receipt.e2ee` 扩展对象的生成或验证能力

---

## 15. 示例

### 15.1 `group.e2ee.publish_key_package` 示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-61001",
  "method": "group.e2ee.publish_key_package",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.group.e2ee.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:wba:a.example:agents:alice:e1_<fingerprint>",
      "operation_id": "op-61001",
      "created_at": "2026-03-29T15:00:00Z"
    },
    "body": {
      "group_key_package": {
        "key_package_id": "kp-001",
        "owner_did": "did:wba:a.example:agents:alice:e1_<fingerprint>",
        "suite": "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519",
        "mls_key_package_b64u": "BASE64URL_KEYPACKAGE",
        "did_wba_binding": {
          "agent_did": "did:wba:a.example:agents:alice:e1_<fingerprint>",
          "verification_method": "did:wba:a.example:agents:alice:e1_<fingerprint>#key-1",
          "leaf_signature_key_b64u": "BASE64URL_LEAF_PK",
          "issued_at": "2026-03-29T15:00:00Z",
          "expires_at": "2026-04-29T15:00:00Z",
          "proof": {
            "type": "DataIntegrityProof",
            "proofPurpose": "assertionMethod",
            "verificationMethod": "did:wba:a.example:agents:alice:e1_<fingerprint>#key-1",
            "proofValue": "z..."
          }
        },
        "expires_at": "2026-04-30T00:00:00Z"
      }
    }
  }
}
```

### 15.2 `group.send`（E2EE）示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-group-e2ee-send-001",
  "method": "group.send",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.group.e2ee.v1",
      "security_profile": "group-e2ee",
      "sender_did": "did:wba:a.example:agents:alice:e1_<fingerprint>",
      "target": {
        "kind": "group",
        "did": "did:wba:groups.example:team:dev:e1_<fingerprint>"
      },
      "operation_id": "op-group-e2ee-send-001",
      "message_id": "msg-group-e2ee-send-001",
      "content_type": "text/plain",
      "created_at": "2026-03-29T15:10:00Z"
    },
    "auth": {
      "scheme": "did:wba-json-v1",
      "actor_proof": {
        "contentDigest": "sha-256=:BASE64_SHA256_OF_SIGNED_GROUP_PAYLOAD:",
        "signatureInput": "sig1=(\"@method\" \"@target-uri\" \"content-digest\");created=1774797000;expires=1774797060;nonce=\"n-301\";keyid=\"did:wba:a.example:agents:alice:e1_<fingerprint>#key-1\"",
        "signature": "sig1=:BASE64_SIGNATURE:"
      }
    },
    "body": {
      "expected_group_state_version": "42",
      "e2ee": {
        "cipher": {
          "crypto_group_id_b64u": "BASE64URL_GROUPID",
          "epoch": "7",
          "private_message_b64u": "BASE64URL_PRIVATEMESSAGE",
          "group_state_ref": {
            "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
            "group_state_version": "42",
            "policy_hash": "sha-256:..."
          },
          "epoch_authenticator": "BASE64URL_AUTH"
        }
      }
    }
  }
}
```

成功响应可返回：

```json
{
  "jsonrpc": "2.0",
  "id": "req-group-e2ee-send-001",
  "result": {
    "accepted": true,
    "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
    "message_id": "msg-group-e2ee-send-001",
    "operation_id": "op-group-e2ee-send-001",
    "group_event_seq": "128",
    "group_state_version": "42",
    "accepted_at": "2026-03-29T15:10:01Z",
    "group_receipt": {
      "receipt_type": "group-message-accepted",
      "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
      "group_state_version": "42",
      "group_event_seq": "128",
      "subject_method": "group.send",
      "operation_id": "op-group-e2ee-send-001",
      "message_id": "msg-group-e2ee-send-001",
      "actor_did": "did:wba:a.example:agents:alice:e1_<fingerprint>",
      "accepted_at": "2026-03-29T15:10:01Z",
      "payload_digest": "sha-256=:BASE64_SHA256_OF_SIGNED_GROUP_PAYLOAD:",
      "e2ee": {
        "crypto_group_id_b64u": "BASE64URL_GROUPID",
        "epoch": "7",
        "epoch_authenticator": "BASE64URL_AUTH",
        "wire_format": "mls-private-message"
      },
      "proof": {
        "type": "DataIntegrityProof",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:wba:groups.example:team:dev:e1_<fingerprint>#key-1",
        "proofValue": "z..."
      }
    }
  }
}
```

### 15.3 `group.accept_invite`（External Commit）示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-group-e2ee-join-001",
  "method": "group.accept_invite",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.group.e2ee.v1",
      "security_profile": "group-e2ee",
      "sender_did": "did:wba:b.example:agents:bob:e1_<fingerprint>",
      "target": {
        "kind": "group",
        "did": "did:wba:groups.example:team:dev:e1_<fingerprint>"
      },
      "operation_id": "op-group-e2ee-join-001",
      "created_at": "2026-03-29T15:20:00Z"
    },
    "auth": {
      "scheme": "did:wba-json-v1",
      "actor_proof": {
        "contentDigest": "sha-256=:BASE64_SHA256_OF_SIGNED_GROUP_PAYLOAD:",
        "signatureInput": "sig1=(\"@method\" \"@target-uri\" \"content-digest\");created=1774797600;expires=1774797660;nonce=\"n-302\";keyid=\"did:wba:b.example:agents:bob:e1_<fingerprint>#key-1\"",
        "signature": "sig1=:BASE64_SIGNATURE:"
      }
    },
    "body": {
      "invitation_id": "inv-001",
      "e2ee": {
        "handshake": {
          "wire_format": "mls-public-message",
          "crypto_group_id_b64u": "BASE64URL_GROUPID",
          "epoch": "7",
          "handshake_kind": "external-commit",
          "mls_message_b64u": "BASE64URL_EXTERNAL_COMMIT",
          "group_info_b64u": "BASE64URL_GROUPINFO",
          "group_state_ref": {
            "group_did": "did:wba:groups.example:team:dev:e1_<fingerprint>",
            "group_state_version": "42",
            "policy_hash": "sha-256:..."
          }
        }
      }
    }
  }
}
```

---

## 16. 注册表占位

本标准后续版本 **SHOULD** 建立以下注册表：

1. Group E2EE 业务错误码注册表；
2. Group E2EE Suite 注册表；
3. `did_wba_binding` 扩展字段注册表；
4. `group_receipt.e2ee` 字段注册表；
5. 群握手类型注册表。

---

## 17. 参考实现说明（非规范性）

实现方在落地本 Profile 时，宜把它视为：

- `group_did` 对应的应用层群语义之上的密码学 Overlay；
- `auth.actor_proof` 与 `group_receipt` 之间的密码学补强层；
- 跨域群管理与加密群消息的最小互通层。

真正的 Agent 内部副本同步、历史回放、设备级状态传播，不应进入本 Profile。
