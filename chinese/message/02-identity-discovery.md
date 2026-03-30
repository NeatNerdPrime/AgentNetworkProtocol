# ANP Profile 2：Identity and Discovery Profile（草案）

- 文档编号：ANP-P2
- 标题：Identity and Discovery Profile
- 状态：Draft
- 版本：0.1.0
- 语言：中文
- 适用范围：本 Profile 适用于 ANP 中 Agent 身份、Group 身份、服务发现与服务端点解释。

---

## 1. 目的

本 Profile 定义 ANP 的标识模型与发现模型，规定：

1. Agent 与 Group 如何使用 DID 表示；
2. DID 文档中哪些属性对 ANP 有规范性意义；
3. ANP 服务端点如何在 DID 文档中表达；
4. 调用方如何根据 DID 文档发现可交互的 ANP 服务；
5. 哪些动态状态不得放入 DID 文档。

本 Profile 不定义：

- DID 方法本身；
- DID 解析协议本身；
- 设备标识；
- 内部副本同步；
- 具体 E2EE 算法细节；
- 具体群状态机细节。

---

## 2. 术语与规范性约定

### 2.1 规范性关键字

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按照其大写形式解释为规范性要求。

### 2.2 术语

- **Agent DID**：表示一个 Agent 协议主体的 DID。
- **Group DID**：表示一个群协议主体的 DID。
- **Controller**：能够更新 DID 文档或代表 DID 发起受控动作的实体。
- **Home Service**：一个 Agent 的主入口服务，用于接收直接消息、返回能力信息、指示进一步的交互路径。
- **Key Service**：用于发布或发现与安全 Overlay 相关的公开密钥材料或引导材料的服务。
- **Group Service**：群的主入口或 Host 服务，用于群管理、群消息路由或群状态访问。
- **Join Service**：处理邀请、加入、审批等群加入相关动作的服务。
- **Relay Service**：用于跨域中继 ANP 请求或通知的服务。
- **Capability Service**：返回服务支持的 Profile、Security Profile 与约束信息的服务。
- **Object Service**：用于对象上传、提交、下载票据签发和对象下载入口发现的服务。
- **Discovery**：根据一个 DID 解析其 DID 文档，并选择适当服务端点以完成后续交互的过程。

---

## 3. 标识模型

### 3.1 基本原则

ANP 采用以下一等标识：

- **Agent DID**
- **Group DID**

ANP 协议层 **不**定义设备 DID、终端 DID、会话 DID 或副本 DID。  
如果某实现内部存在多个运行副本、多个设备、多个执行器，这些实体均属于该 Agent 内部实现问题，不属于 ANP 互通边界。

### 3.2 Agent DID

每个能够作为 ANP 协议主体发送或接收消息的 Agent **MUST** 持有一个 `agent_did`。

`agent_did` 用于：

1. 标识直接消息的发送方与接收方；
2. 标识控制操作的发起方；
3. 解析可用服务端点；
4. 获取安全 Overlay 需要的公开材料；
5. 建立授权与审计上下文。

### 3.3 Group DID

每个可被跨域发现、被引用、被管理或被发送群消息的群 **MUST** 持有一个 `group_did`。

`group_did` 用于：

1. 作为群的全局应用层标识；
2. 作为群发现与治理的锚点；
3. 作为群管理与群消息的共同目标标识；
4. 作为群服务端点的发现入口；
5. 作为后续群加密 Profile 的绑定对象。

### 3.4 加密标识分离

若后续某安全 Overlay Profile 定义独立的密码学内部标识，例如 `crypto_group_id`、`session_id`、`channel_id`，则：

- 它们 **MAY** 与 `group_did` 或 `agent_did` 不同；
- 但对应 Profile **MUST** 明确规定如何将这些内部标识与 DID 进行密码学绑定；
- 这种绑定 **MUST** 可由接收方验证。

---

## 4. DID 文档的 ANP 解释规则

### 4.1 一般规则

对于 ANP 而言，DID 文档承担以下职责：

1. 提供稳定身份入口；
2. 声明验证关系与受信任密钥材料；
3. 暴露服务端点；
4. 提供服务发现线索。

DID 文档 **MUST NOT** 被当作：

- 实时消息状态数据库；
- 群成员实时存储；
- 在线状态存储；
- 高频密钥轮换日志；
- Agent 内部副本列表。

### 4.2 DID 文档最小要求

对于被 ANP 使用的 DID 文档：

- `id` **MUST** 存在；
- `service` **SHOULD** 存在；
- 若支持认证控制，`authentication` **SHOULD** 存在；
- 若支持声明式签名对象，`assertionMethod` **SHOULD** 存在；
- 若支持加密 Overlay，`keyAgreement` **SHOULD** 存在；
- 群 DID 若支持治理能力委托，`capabilityInvocation` **SHOULD** 存在。

### 4.3 DID 文档最小化原则

DID 文档中的信息 **SHOULD** 保持：

- 低频变更；
- 低敏感度；
- 低可关联性；
- 与 DID 使用直接相关。

凡不满足上述要求的内容，**SHOULD** 转移到受控服务端点提供，而不是直接嵌入 DID 文档。

---

## 5. Agent DID 规范

### 5.1 Agent DID 文档必需语义

一个用于 ANP 的 Agent DID 文档 **MUST** 至少表达：

1. `id`
2. 至少一个可用于后续交互的 `service`

### 5.2 认证关系

若 Agent 需要对控制平面请求进行认证、签名或授权，则 DID 文档 **SHOULD** 提供 `authentication` 关系。

若 Agent 需要对群管理对象、声明对象、签名控制对象进行断言，则 DID 文档 **SHOULD** 提供 `assertionMethod` 关系。

### 5.3 密钥协商关系

若 Agent 支持任何 E2EE Overlay，则 DID 文档 **SHOULD** 提供 `keyAgreement` 关系。  
供 `keyAgreement` 使用的验证方法 **MUST** 仅用于表示该 DID 在密钥协商或接收机密信息时可被使用的公钥材料。

### 5.4 服务端点

Agent DID 文档 **SHOULD** 至少包含以下 ANP 服务类型中的一种或多种：

- `ANPHomeService`
- `ANPKeyService`
- `ANPCapabilityService`
- `ANPRelayService`
- `ANPObjectService`（若该 Agent 提供对象控制面或对象下载入口）

---

## 6. Group DID 规范

### 6.1 Group DID 文档必需语义

一个用于 ANP 的 Group DID 文档 **MUST** 至少表达：

1. `id`
2. `controller`
3. 至少一个群服务端点（`ANPGroupService`）

### 6.2 群控制权

`controller` 可为单个 DID，也可为多个 DID。  
若存在多个控制者，它们之间的内部协作机制不由本 Profile 定义，但：

- DID 文档更新的合法性 **MUST** 由 DID 方法保证；
- 调用方 **MUST** 以解析所得 DID 文档为准；
- 群治理 Profile **MUST** 进一步定义群内角色与授权规则。

### 6.3 群治理验证关系

群 DID 文档 **SHOULD** 至少提供以下之一：

- `assertionMethod`
- `capabilityInvocation`

当群管理对象、群策略对象、群状态对象需要被签名验证时，发送方 **MUST** 使用 DID 文档允许的验证关系。

### 6.4 Group DID 文档禁止内容

以下内容 **MUST NOT** 直接嵌入 Group DID 文档：

- 动态成员列表；
- 在线成员列表；
- 当前消息序号；
- 当前群 epoch；
- 逐消息状态；
- 一次性预密钥列表；
- MLS KeyPackage 实时集合；
- 高频变化的审批队列；
- Agent 内部副本列表。

### 6.5 Group DID 文档可选内容

以下内容 **MAY** 存在，但必须避免敏感泄露：

- 群显示名称；
- 群图标引用；
- 群公开描述；
- 群公开策略摘要；
- 文档版本信息；
- 服务能力摘要。

如果某可选字段可能带来明显隐私泄露或相关性风险，实现方 **SHOULD NOT** 将其写入 DID 文档，而应改由受限服务端点提供。

---

## 7. ANP 服务端点类型

### 7.1 总则

ANP 基于 DID 文档中的 `service` 进行服务发现。  
所有 ANP 服务端点对象 **MUST** 具有：

- `id`
- `type`
- `serviceEndpoint`

服务端点对象 **MAY** 携带额外 ANP 扩展字段，例如：

- `profiles`
- `securityProfiles`
- `accepts`
- `priority`
- `authSchemes`

### 7.2 `ANPHomeService`

#### 7.2.1 语义

`ANPHomeService` 表示某 Agent 的主入口服务。

#### 7.2.2 用途

- 接收 `direct.send`
- 返回能力协商结果
- 暴露进一步的中继或策略入口

#### 7.2.3 要求

- 一个 Agent DID 文档 **SHOULD** 至少包含一个 `ANPHomeService`
- 若存在多个 `ANPHomeService`，调用方 **SHOULD** 根据 `priority` 或本地策略选择

### 7.3 `ANPKeyService`

#### 7.3.1 语义

`ANPKeyService` 表示安全 Overlay 所需公开材料的发布或发现入口。

#### 7.3.2 用途

- 发现直接消息 E2EE 所需的公开材料
- 发现群 E2EE 所需的引导材料
- 发现后续安全 Profile 定义的公开对象

#### 7.3.3 要求

- 支持 E2EE 的 Agent **SHOULD** 暴露 `ANPKeyService`
- `ANPKeyService` 暴露的是公开材料或其索引，不得要求调用方先拥有目标私密状态才能解析最基本的引导信息

### 7.4 `ANPGroupService`

#### 7.4.1 语义

`ANPGroupService` 表示群的主入口或 Host 服务。

#### 7.4.2 用途

- 处理 `group.create` 之后的群管理动作
- 接收 `group.send`
- 暴露群策略或群能力入口
- 作为群状态变化排序的权威入口

#### 7.4.3 要求

- Group DID 文档 **MUST** 至少包含一个 `ANPGroupService`

### 7.5 `ANPJoinService`

#### 7.5.1 语义

`ANPJoinService` 表示加入、邀请、审批的入口。

#### 7.5.2 要求

- 若群支持邀请、外部加入、审批流等机制，Group DID 文档 **SHOULD** 提供 `ANPJoinService`

### 7.6 `ANPRelayService`

#### 7.6.1 语义

`ANPRelayService` 表示跨域转发与中继入口。

#### 7.6.2 用途

- Home Service 与其他域服务之间的中继
- 联邦协议的转发入口

#### 7.6.3 要求

- 若部署方将消息中继与 Home Service 分离，则 **SHOULD** 提供 `ANPRelayService`

### 7.7 `ANPCapabilityService`

#### 7.7.1 语义

`ANPCapabilityService` 表示能力协商入口。

#### 7.7.2 要求

- 若能力协商不直接由 `ANPHomeService` 或 `ANPGroupService` 提供，则 **SHOULD** 单独提供 `ANPCapabilityService`

### 7.8 `ANPTransparencyService`

#### 7.8.1 语义

`ANPTransparencyService` 为可选服务类型，用于公开可验证目录、透明日志或审计索引。

#### 7.8.2 要求

- 非基础互通所必需
- 若部署方支持目录透明性，则 **MAY** 提供

### 7.9 `ANPObjectService`

#### 7.9.1 语义

`ANPObjectService` 表示对象上传、对象访问控制、下载票据签发以及对象下载入口发现的服务。

#### 7.9.2 用途

- 提供 `attachment.create_slot`
- 提供 `attachment.commit_object`
- 提供 `attachment.abort_object`
- 提供 `attachment.get_download_ticket`
- 作为对象 HTTP(S) 下载的服务锚点

#### 7.9.3 要求

- 若部署方希望显式暴露对象控制面或对象下载入口，**SHOULD** 提供 `ANPObjectService`
- `ANPObjectService` 的能力范围 **MUST** 通过能力协商或服务扩展字段明确说明

---

## 8. ANP 服务端点扩展字段

为了便于跨实现发现，本 Profile 定义下列推荐扩展字段。

### 8.1 `profiles`

- 类型：字符串数组
- 语义：服务端点直接支持的 ANP Profile 集合
- 要求：**SHOULD**

### 8.2 `securityProfiles`

- 类型：字符串数组
- 语义：服务端点支持的安全模式集合
- 要求：**SHOULD**

### 8.3 `accepts`

- 类型：字符串数组
- 语义：服务端点接受的内容类型或对象类型
- 要求：**MAY**

### 8.4 `priority`

- 类型：整数或整数字符串
- 语义：端点优先级
- 要求：**MAY**
- 规则：值越小优先级越高

### 8.5 `authSchemes`

- 类型：字符串数组
- 语义：该端点支持的调用方认证方式
- 要求：**SHOULD**

---

## 9. 发现流程

### 9.1 Agent 发现

对 `agent_did` 的发现流程如下：

1. 解析 `agent_did`，获得 DID 文档；
2. 读取 `service` 列表；
3. 选择适当的 `ANPHomeService`；
4. 如需安全 Overlay，引导至 `ANPKeyService`；
5. 如需对象上传、下载票据或对象下载入口，**MAY** 发现 `ANPObjectService`；
6. 如需显式协商能力，调用 `ANPCapabilityService` 或 `anp.get_capabilities`。

### 9.2 Group 发现

对 `group_did` 的发现流程如下：

1. 解析 `group_did`，获得 DID 文档；
2. 读取 `ANPGroupService`；
3. 视场景读取 `ANPJoinService`、`ANPCapabilityService`；
4. 若启用群 E2EE，则读取与群加密 Profile 绑定所需的引导信息。

### 9.3 服务选择

若存在多个候选端点：

1. 优先选择与所请求 `profile` 兼容的端点；
2. 优先选择与所请求 `security_profile` 兼容的端点；
3. 再按 `priority` 选择；
4. 若仍冲突，按本地策略选择。

### 9.4 缓存

调用方 **MAY** 缓存 DID 解析结果与服务选择结果。  
但在以下情形下 **SHOULD** 重新解析：

- 签名验证失败；
- 密钥协商失败；
- 服务端点返回能力变更；
- DID 控制权疑似变更；
- 本地缓存到期。

---

## 10. DID 文档与安全 Overlay 的关系

### 10.1 `keyAgreement` 的使用

若某 Agent DID 或 Group DID 文档声明了 `keyAgreement`，则后续安全 Profile **MUST** 仅使用其中允许的方法作为该 DID 的机密信息接收或密钥协商依据。

### 10.2 签名验证关系

当某对象声称由某 DID 断言时：

- 若对象是认证控制行为，验证方 **SHOULD** 检查 `authentication`；
- 若对象是声明或签名断言行为，验证方 **SHOULD** 检查 `assertionMethod`；
- 若对象是治理能力调用行为，验证方 **SHOULD** 检查 `capabilityInvocation`。

### 10.3 动态安全材料外置

以下内容 **SHOULD** 通过受控服务端点提供，而非内嵌于 DID 文档：

- 高频轮换公开材料；
- 一次性引导材料；
- 群 epoch 相关材料；
- 动态群状态摘要。

---

## 11. Group DID 与群治理

### 11.1 Group DID 的角色

`group_did` 是群的应用层全球标识，不等于任何特定密码学实现内部 ID。

### 11.2 群治理外置

群成员关系、角色授权、审批状态、策略版本、群状态摘要等对象，**SHOULD** 由：

- `ANPGroupService`
- `ANPJoinService`
- 或未来群治理 Profile

提供与签名，而不是放在 DID 文档中。

### 11.3 控制权与群策略分离

DID 文档中的 `controller` 只表示谁有权控制 DID 文档本身；  
群内“谁能加人、踢人、改策略”属于应用层治理规则，不应直接从 `controller` 机械推导。

---

## 12. 隐私与最小披露

### 12.1 服务端点最小化

DID 文档中的 `service` 项 **SHOULD** 最小化。  
若某服务不需要公开发现，则 **SHOULD NOT** 出现在 DID 文档中。

### 12.2 相关性控制

实现方 **SHOULD** 避免：

- 在多个 DID 文档中复用会产生强相关性的独特端点模式；
- 在 DID 文档中放置可直接推断组织结构、部署拓扑、内部角色分布的描述；
- 通过 DID 文档暴露消息量、活跃度、在线状态或内部副本结构。

### 12.3 公开与受限分离

公开发现所必需的信息 **MAY** 放入 DID 文档；  
需要访问控制的信息 **SHOULD** 由受限服务端点返回。

---

## 13. 最小互通要求

一个符合本 Profile 的实现至少 **MUST** 满足：

1. 每个 Agent 有 `agent_did`；
2. 每个 Group 有 `group_did`；
3. Group DID 文档至少提供一个 `ANPGroupService`；
4. Agent DID 文档至少提供一个可用的 ANP 服务端点；
5. 支持根据 DID 文档执行服务发现；
6. 不在 DID 文档中嵌入动态群状态；
7. 不把设备/副本概念引入协议层。

---

## 14. 示例

### 14.1 Agent DID 文档片段示例

```json
{
  "id": "did:example:agent-a",
  "verificationMethod": [
    {
      "id": "did:example:agent-a#sig-1",
      "type": "JsonWebKey2020",
      "controller": "did:example:agent-a",
      "publicKeyJwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "..."
      }
    },
    {
      "id": "did:example:agent-a#ka-1",
      "type": "JsonWebKey2020",
      "controller": "did:example:agent-a",
      "publicKeyJwk": {
        "kty": "OKP",
        "crv": "X25519",
        "x": "..."
      }
    }
  ],
  "authentication": [
    "did:example:agent-a#sig-1"
  ],
  "assertionMethod": [
    "did:example:agent-a#sig-1"
  ],
  "keyAgreement": [
    "did:example:agent-a#ka-1"
  ],
  "service": [
    {
      "id": "did:example:agent-a#home",
      "type": "ANPHomeService",
      "serviceEndpoint": "https://agent-a.example.com/anp",
      "profiles": [
        "anp.core.binding.v1",
        "anp.direct.base.v1",
        "anp.direct.e2ee.v1"
      ],
      "securityProfiles": [
        "transport-protected",
        "direct-e2ee"
      ]
    },
    {
      "id": "did:example:agent-a#keys",
      "type": "ANPKeyService",
      "serviceEndpoint": "https://agent-a.example.com/anp/keys"
    }
  ]
}
```

### 14.2 Group DID 文档片段示例

```json
{
  "id": "did:example:group-123",
  "controller": [
    "did:example:group-host",
    "did:example:governance-service"
  ],
  "verificationMethod": [
    {
      "id": "did:example:group-123#gov-1",
      "type": "JsonWebKey2020",
      "controller": "did:example:group-123",
      "publicKeyJwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "..."
      }
    }
  ],
  "assertionMethod": [
    "did:example:group-123#gov-1"
  ],
  "capabilityInvocation": [
    "did:example:group-123#gov-1"
  ],
  "service": [
    {
      "id": "did:example:group-123#group",
      "type": "ANPGroupService",
      "serviceEndpoint": "https://group-host.example.com/anp/groups/group-123",
      "profiles": [
        "anp.core.binding.v1",
        "anp.group.base.v1",
        "anp.group.e2ee.v1"
      ],
      "securityProfiles": [
        "transport-protected",
        "group-e2ee"
      ]
    },
    {
      "id": "did:example:group-123#join",
      "type": "ANPJoinService",
      "serviceEndpoint": "https://group-host.example.com/anp/groups/group-123/join"
    }
  ]
}
```

---

## 15. 注册表占位

本标准后续版本 **SHOULD** 建立以下注册表：

1. ANP DID Service Type 注册表；
2. ANP 服务端点扩展字段注册表；
3. ANP 身份发现错误码注册表；
4. ANP 群治理对象类型注册表。

---

## 16. 参考实现说明（非规范性）

实现方在落地本 Profile 时，宜采用如下原则：

- DID 文档是“稳定入口”，不是“实时状态表”；
- 服务端点是“发现锚点”，不是“全部数据容器”；
- 群 DID 是“应用层群标识”，不是“所有密码学内部状态的唯一序列化”；
- 设备、副本、内部执行器等概念留在 Agent 内部，不进入线协议。
