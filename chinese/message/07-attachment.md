# ANP Profile 7：Attachment Profile（草案）

- 文档编号：ANP-P7
- 标题：Attachment Profile
- 状态：Draft
- 版本：0.1.0
- 语言：中文
- 适用范围：本 Profile 适用于文本以外的大对象、文件、多媒体和其清单对象的标准化承载，不定义 Agent 内部对象缓存、对象同步或设备级下载策略。

---

## 1. 目的

本 Profile 定义 ANP 的附件与对象传输扩展层，规定：

1. 如何以 `attachment_manifest` 表达文件、图片、音频、视频等大对象的标准元数据；
2. 如何把附件与 `anp.direct.base.v1`、`anp.group.base.v1` 以及其 E2EE Overlay 结合使用；
3. 如何在不把大对象直接塞进业务消息的前提下，完成对象上传、确认与下载解析；
4. 如何在 `transport-protected`、`direct-e2ee`、`group-e2ee` 三种安全模式下表达附件保护语义；
5. 如何通过对象摘要、对象级加密信息和访问提示，降低跨实现歧义。

本 Profile **不**定义：

- 媒体转码流程；
- 缩略图生成算法；
- 对象存储后端实现；
- CDN 或对象存储厂商 API；
- Agent 内部对象缓存、对象副本同步或设备下载策略；
- 历史附件列表拉取；
- 人类 IM 风格的预览、相册、已下载状态。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

- **Attachment**：需要与业务消息关联传输的大对象或其逻辑表示。
- **Attachment Manifest**：用于描述某个附件对象的位置、摘要、大小、MIME 类型、加密信息及可选缩略图信息的结构化对象。
- **Object**：上传到对象服务或可通过 URI 获取的二进制实体。
- **Object Service**：提供对象上传、提交、下载解析或临时访问票据的服务。
- **Upload Slot**：一次上传会话所需的临时上传位置、访问凭证或请求模板。
- **Stored Object Digest**：对实际上传字节序列计算的摘要。
- **Plaintext Digest**：对对象解密或解压后的原始明文字节计算的摘要。
- **Attachment Encryption Info**：描述对象是否经过本地加密、采用何种算法以及密钥材料如何表达的对象。
- **Chunking Info**：描述对象是否分块、分块大小、块数量和分块摘要树等信息的对象。

---

## 3. 设计原则

### 3.1 小消息承载语义，大对象独立传输

ANP 业务消息 **MUST NOT** 直接承载大型对象字节流。附件 **MUST** 通过“小消息 + 大对象”的模式表达：

- 业务消息只传递 `attachment_manifest` 或 `attachment_bundle`；
- 真正的大对象通过对象服务上传或下载；
- 对象服务 **MAY** 与消息服务同域，也 **MAY** 与其分离。

### 3.2 业务语义与对象传输分离

本 Profile 只定义附件的标准对象与控制动作；它 **MUST NOT** 改变：

- `direct.send` 的私聊语义；
- `group.send` 的群消息语义；
- `direct-e2ee` 与 `group-e2ee` 的密码学边界。

### 3.3 对象一经完成即不可变

一旦某个对象上传完成并形成可发送的 `attachment_manifest`：

- 其 `object_id`、`stored_object_digest`、`size`、`encryption_info` **MUST** 视为不可变；
- 若对象内容发生实质变化，发送方 **MUST** 生成新的对象与新的清单。

### 3.4 摘要绑定优先于位置绑定

接收方 **MUST NOT** 仅凭 `object_uri`、`filename` 或 `mime_type` 信任对象内容。对象可信性 **MUST** 由摘要校验与相应安全 Profile 共同保证。

### 3.5 安全模式继承承载消息

附件 Profile 不发明新的安全模式。附件的安全模式 **MUST** 继承承载它的业务消息：

- `transport-protected`
- `direct-e2ee`
- `group-e2ee`

### 3.6 非目标

本 Profile **不**提供：

- 对象历史索引；
- 对象版本控制；
- 对象全文检索；
- Agent 内部副本是否已拉取某对象的互通语义。

---

## 4. Profile 标识与依赖

### 4.1 Profile 名称

本 Profile 的标准名称为：

`anp.attachment.v1`

### 4.2 依赖关系

本 Profile **MUST** 依赖以下 Profile：

- `anp.core.binding.v1`
- `anp.identity.discovery.v1`

当 manifest 通过私聊承载时，还 **MUST** 与以下之一结合：

- `anp.direct.base.v1`
- `anp.direct.e2ee.v1`

当 manifest 通过群聊承载时，还 **MUST** 与以下之一结合：

- `anp.group.base.v1`
- `anp.group.e2ee.v1`

### 4.3 安全模式

对象上传与下载控制面方法（如申请上传槽位、提交对象）**SHOULD** 使用：

- `meta.profile = "anp.attachment.v1"`
- `meta.security_profile = "transport-protected"`

无论最终附件 manifest 通过何种业务消息发送，上传控制面默认仍运行在安全传输层上。

---

## 5. 媒体类型与对象模型

### 5.1 标准内容类型

本 Profile 定义以下标准 `content_type`：

- `application/anp-attachment-manifest+json`
- `application/anp-attachment-bundle+json`

实现方 **MAY** 额外定义私有或扩展内容类型，但跨实现最小互通只要求支持上述类型。

### 5.2 `object_locator`

`object_locator` 表示对象位置与访问提示。

推荐字段：

- `primary_uri`：字符串，**MUST**
- `mirror_uris`：字符串数组，**MAY**
- `download_ticket_required`：布尔值，**MAY**
- `preferred_method`：字符串，**MAY**，例如 `GET`、`POST`、`signed-url`
- `range_supported`：布尔值，**MAY**
- `expires_at`：RFC 3339 时间字符串，**MAY**

规则：

- `primary_uri` **MUST** 可被接收方用于下载或进一步解析下载票据；
- `mirror_uris` 仅表示可选下载入口，不构成真实性证明；
- `download_ticket_required` 仅表示访问提示，不构成权限边界。

### 5.3 `chunking_info`

当对象分块上传或分块校验时，`chunking_info` **MAY** 出现。

推荐字段：

- `chunked`：布尔值，**MUST**
- `chunk_size`：十进制字符串，若 `chunked = true` 则 **MUST**
- `chunk_count`：十进制字符串，若 `chunked = true` 则 **MUST**
- `tree_digest`：字符串，**MAY**
- `chunk_digests`：字符串数组，**MAY**

### 5.4 `encryption_info`

`encryption_info` 表示对象级加密信息。

推荐字段：

- `mode`：字符串，**MUST**，推荐值：`none`、`local-aead`、`inline-key`
- `suite`：字符串，若 `mode != "none"` 则 **MUST**
- `key_b64u`：字符串，**MAY**
- `nonce_b64u`：字符串，**MAY**
- `aad_digest`：字符串，**MAY**
- `key_ref`：字符串，**MAY**
- `extensions`：对象，**MAY**

规则：

- 当 `mode = "none"` 时，不存在对象级加密；
- 当 `mode = "local-aead"` 时，发送方 **MUST** 在上传前完成本地加密；
- 当 `mode = "inline-key"` 时，`key_b64u` 仅 **MAY** 出现在 E2EE 保护的 manifest 中；
- `key_b64u` **MUST NOT** 在普通 `transport-protected` 附件消息里直接明文传播。

### 5.5 `attachment_manifest`

`attachment_manifest` 表示一个附件对象的标准描述。

推荐字段：

- `attachment_id`：字符串，**MUST**
- `object_id`：字符串，**MUST**
- `locator`：对象，**MUST**，类型为 `object_locator`
- `filename`：字符串，**MAY**
- `mime_type`：字符串，**MUST**
- `size`：十进制字符串，**MUST**
- `stored_object_digest`：字符串，**MUST**，推荐格式：`sha256:<base64url-or-hex>`
- `plaintext_digest`：字符串，**MAY**
- `created_at`：RFC 3339 时间字符串，**SHOULD**
- `expires_at`：RFC 3339 时间字符串，**MAY**
- `encryption_info`：对象，**MAY**
- `chunking_info`：对象，**MAY**
- `thumbnail`：对象，**MAY**
- `annotations`：对象，**MAY**

规则：

- `attachment_id` 在发送方上下文中 **MUST** 唯一；
- `size` **MUST** 表示上传后对象字节长度，而不是明文长度；
- `stored_object_digest` **MUST** 对上传后的实际字节序列计算；
- `plaintext_digest` 若存在，**MUST** 对解密或解压后的明文字节计算；
- 中继服务 **MUST NOT** 擅自修改 `attachment_manifest` 中的摘要、大小、位置或加密字段。

### 5.6 `attachment_bundle`

当一条消息需要携带多个附件时，**MAY** 使用 `attachment_bundle`。

推荐字段：

- `bundle_id`：字符串，**MUST**
- `items`：`attachment_manifest[]`，**MUST**
- `caption`：字符串，**MAY**
- `annotations`：对象，**MAY**

若未显式协商支持多附件 bundling，发送方 **SHOULD** 使用多条消息分别发送。

---

## 6. 可选对象服务方法

### 6.1 总则

本 Profile 为对象控制面定义一组**可选**方法。支持对象服务方法的实现可以标准化上传和下载控制；不支持这些方法的实现，仍可通过其它部署方式生成合规的 manifest。

### 6.2 `attachment.prepare_upload`

#### 6.2.1 语义

申请一个上传槽位或上传会话，使发送方能够把对象上传到某对象服务。

#### 6.2.2 请求要求

- `method = "attachment.prepare_upload"`
- `meta.profile = "anp.attachment.v1"`
- `meta.security_profile = "transport-protected"`
- `meta.sender_did` **MUST** 存在

`body` **MUST** 包含：

- `mime_type`
- `size`

`body` **MAY** 包含：

- `filename`
- `stored_object_digest`
- `chunking_info`
- `requested_retention`
- `encryption_planned`：布尔值
- `target_context`：对象，表示对象最终用于 `direct` 还是 `group` 场景

#### 6.2.3 成功响应

成功响应 **MUST** 至少包含：

- `upload_session_id`
- `object_id`
- `object_uri` 或 `locator.primary_uri`
- `expires_at`

成功响应 **MAY** 包含：

- `upload_url`
- `upload_urls`
- `required_headers`
- `max_chunk_size`
- `resume_supported`

### 6.3 `attachment.complete_upload`

#### 6.3.1 语义

声明某个对象上传已完成，并让对象服务将其从“临时上传状态”转入“可解析状态”。

#### 6.3.2 请求要求

`body` **MUST** 包含：

- `upload_session_id`
- `object_id`
- `size`
- `stored_object_digest`

`body` **MAY** 包含：

- `plaintext_digest`
- `chunking_info`
- `encryption_info`
- `content_metadata`

#### 6.3.3 成功响应

成功响应 **MUST** 至少包含：

- `completed`：布尔值，且为 `true`
- `object_id`
- `locator`
- `completed_at`

成功响应 **SHOULD** 直接返回一个可发送的 `attachment_manifest`。

### 6.4 `attachment.resolve`

#### 6.4.1 语义

在接收方无法直接使用 `locator.primary_uri` 下载时，向对象服务请求一个下载票据或可用下载入口。

#### 6.4.2 请求要求

`body` **MUST** 包含：

- `object_id` 或 `locator.primary_uri` 二者之一

`body` **MAY** 包含：

- `prefer_range_access`
- `want_mirrors`

#### 6.4.3 成功响应

成功响应 **MUST** 至少包含：

- `object_id`
- `download_uri`
- `expires_at`

成功响应 **MAY** 包含：

- `required_headers`
- `mirror_uris`
- `range_supported`
- `ticket_id`

---

## 7. 与承载 Profile 的绑定

### 7.1 通过 Direct Base 承载

当通过 `direct.send` 承载附件时：

- `meta.profile` **MUST** 为 `anp.direct.base.v1` 或 `anp.direct.e2ee.v1`；
- `meta.content_type` **MUST** 为 `application/anp-attachment-manifest+json` 或 `application/anp-attachment-bundle+json`；
- `body.payload` **MUST** 表示一个 `attachment_manifest` 或 `attachment_bundle` 对象。

### 7.2 通过 Group Base 承载

当通过 `group.send` 承载附件时：

- `meta.profile` **MUST** 为 `anp.group.base.v1` 或 `anp.group.e2ee.v1`；
- `meta.content_type` **MUST** 为 `application/anp-attachment-manifest+json` 或 `application/anp-attachment-bundle+json`；
- `body.payload` **MUST** 表示一个 `attachment_manifest` 或 `attachment_bundle` 对象。

### 7.3 通过 Direct E2EE 承载

在 `direct-e2ee` 模式下：

- `attachment_manifest` 或 `attachment_bundle` **MUST** 先成为 Direct E2EE 的应用层明文对象；
- 然后再由 Profile 5 加密承载；
- 任何需要随 manifest 一起保护的对象密钥材料，**MUST** 位于该 E2EE 保护边界内。

### 7.4 通过 Group E2EE 承载

在 `group-e2ee` 模式下：

- `attachment_manifest` 或 `attachment_bundle` **MUST** 先成为 Group E2EE 的应用层明文对象；
- 然后再由 Profile 6 加密承载；
- 对象密钥材料仅 **MAY** 在群 E2EE 保护边界内分发。

---

## 8. 对象生命周期与不可变性

### 8.1 对象创建

发送方在生成 `attachment_manifest` 前 **MUST**：

1. 确定对象是否需要本地加密；
2. 若需要，先本地加密对象，再上传密文字节；
3. 计算 `stored_object_digest`；
4. 若本地加密后仍需校验原文，计算 `plaintext_digest`。

### 8.2 对象完成

一旦某 `attachment_manifest` 已被发送：

- 发送方 **MUST NOT** 在保持 `attachment_id` 不变的情况下静默替换 `locator`、摘要、大小或加密信息；
- 若对象发生实质变化，**MUST** 视为新的附件并生成新的 `attachment_id`。

### 8.3 对象失效

对象服务 **MAY** 对附件设置过期时间、保留策略或访问次数上限。若对象会过期，`attachment_manifest.expires_at` **SHOULD** 明示该事实。

---

## 9. 安全要求

### 9.1 传输保护与对象加密分离

`transport-protected` 只保证控制面和业务消息的安全传输；它**不自动等于**对象本身已加密。若对象内容敏感，发送方 **SHOULD** 额外做对象级本地加密。

### 9.2 摘要必须绑定密文对象

`stored_object_digest` **MUST** 对实际上传的对象字节计算。若对象做了本地加密，则该摘要绑定的是密文对象而不是原文对象。

### 9.3 `inline-key` 的使用限制

- `key_b64u` **MUST NOT** 在普通 `transport-protected` 附件消息中明文传播；
- `key_b64u` 仅 **MAY** 出现在 `direct-e2ee` 或 `group-e2ee` 保护的 manifest 中；
- 若在非 E2EE 场景下仍需要对象级加密，密钥交换机制 **MUST** 由其它安全规范或部署侧约定提供。

### 9.4 元数据最小化

发送方 **SHOULD** 避免在 `filename`、`annotations` 或 URI 中携带不必要的敏感信息。

### 9.5 访问令牌与临时 URL

若实现使用临时 URL、下载票据或附加头访问对象，则：

- 它们 **SHOULD** 尽量短时有效；
- **SHOULD** 与对象 ID 或 manifest 绑定；
- **MUST NOT** 被视为持久对象标识。

---

## 10. 幂等与去重

### 10.1 控制方法的幂等

对同一对象的 `attachment.prepare_upload`、`attachment.complete_upload` 重试时，服务 **SHOULD** 基于：

- `sender_did`
- `object_id` 或上传会话标识
- 摘要

做幂等处理。

### 10.2 对象级去重

对象服务 **MAY** 对相同摘要对象做内部去重，但这 **MUST NOT** 改变对外暴露的 `attachment_id` 与语义边界。

### 10.3 重复 manifest

接收方若重复收到同一 `attachment_id` 且 `stored_object_digest` 一致，**MAY** 视为幂等重复；若 `attachment_id` 相同但摘要或大小不同，**MUST** 视为冲突。

---

## 11. Profile 特定错误（推荐）

推荐实现至少支持以下错误码：

- `anp.attachment.invalid_manifest`
- `anp.attachment.invalid_digest`
- `anp.attachment.unsupported_mime_type`
- `anp.attachment.too_large`
- `anp.attachment.prepare_expired`
- `anp.attachment.object_missing`
- `anp.attachment.resolve_denied`
- `anp.attachment.range_not_supported`
- `anp.attachment.encryption_required`

---

## 12. 最小互通要求

一个最小兼容实现若声称支持 `anp.attachment.v1`，则至少：

1. **MUST** 支持 `application/anp-attachment-manifest+json`；
2. **MUST** 支持单对象 manifest；
3. **MUST** 支持 `attachment_id`、`object_id`、`locator`、`mime_type`、`size`、`stored_object_digest`；
4. **MUST** 支持在 `direct.send` 或 `group.send` 中承载附件清单；
5. **MUST** 在接收方验证 `stored_object_digest`；
6. **SHOULD** 支持 `attachment.complete_upload` 或等价流程；
7. **SHOULD** 支持对象级本地加密；
8. **SHOULD** 支持多对象 bundle；
9. **SHOULD** 支持范围下载提示。

---

## 13. 示例

### 13.1 `attachment.prepare_upload` 示例

```json
{
  "jsonrpc": "2.0",
  "id": "req-70001",
  "method": "attachment.prepare_upload",
  "params": {
    "meta": {
      "anp_version": "1.0",
      "profile": "anp.attachment.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:example:agent-a",
      "target": {
        "kind": "agent",
        "did": "did:example:agent-b"
      },
      "operation_id": "op-70001",
      "created_at": "2026-03-29T14:00:00Z",
      "content_type": "application/anp-attachment-manifest+json"
    },
    "body": {
      "mime_type": "application/pdf",
      "size": "1048576",
      "filename": "report.pdf",
      "encryption_planned": true,
      "target_context": {
        "kind": "direct",
        "did": "did:example:agent-b"
      }
    }
  }
}
```

### 13.2 通过 Direct Base 发送附件 Manifest

```json
{
  "jsonrpc": "2.0",
  "id": "req-70002",
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
      "operation_id": "op-70002",
      "message_id": "msg-70002",
      "created_at": "2026-03-29T14:05:00Z",
      "content_type": "application/anp-attachment-manifest+json"
    },
    "body": {
      "conversation_id": "conv-001",
      "payload": {
        "attachment_id": "att-001",
        "object_id": "obj-001",
        "locator": {
          "primary_uri": "https://objects.example/obj-001"
        },
        "filename": "report.pdf",
        "mime_type": "application/pdf",
        "size": "1048576",
        "stored_object_digest": "sha256:BASE64URL_DIGEST",
        "encryption_info": {
          "mode": "none"
        }
      }
    }
  }
}
```

### 13.3 通过 Group E2EE 发送附件 Bundle（示意）

```json
{
  "bundle_id": "bundle-001",
  "items": [
    {
      "attachment_id": "att-002",
      "object_id": "obj-002",
      "locator": {
        "primary_uri": "https://objects.example/obj-002"
      },
      "filename": "diagram.png",
      "mime_type": "image/png",
      "size": "240123",
      "stored_object_digest": "sha256:BASE64URL_CIPHERTEXT_DIGEST",
      "plaintext_digest": "sha256:BASE64URL_PLAINTEXT_DIGEST",
      "encryption_info": {
        "mode": "inline-key",
        "suite": "anp-object-a256gcm-v1",
        "key_b64u": "BASE64URL_OBJECT_KEY",
        "nonce_b64u": "BASE64URL_NONCE"
      }
    }
  ],
  "caption": "拓扑图"
}
```

---

## 14. 注册表占位

本标准后续版本 **SHOULD** 建立以下注册表：

1. Attachment 内容类型注册表；
2. 对象加密套件注册表；
3. 对象摘要算法注册表；
4. Attachment 错误码注册表；
5. 对象服务能力字段注册表。

---

## 15. 参考实现说明（非规范性）

实现方在落地本 Profile 时，宜把它视为：

- 一个独立于 Direct / Group 业务语义的大对象扩展层；
- 一个允许 Base Profile 与 E2EE Overlay 共用的附件清单层；
- 一个通过 manifest 表达互通、而不是通过字节流 JSON 内联实现互通的媒体层。

---

## 附录 A（信息性）：参考规范

- ANP Profile 1：Core Binding Profile（草案）
- ANP Profile 2：Identity and Discovery Profile（草案）
- ANP Profile 3：Direct Messaging Base Profile（草案）
- ANP Profile 4：Group Base Profile（草案）
- ANP Profile 5：Direct E2EE Profile（草案）
- ANP Profile 6：Group E2EE Profile（草案）
