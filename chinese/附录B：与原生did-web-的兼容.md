
## 附录 B：与原生 `did:web` 的兼容

### B.1 目标与范围

本附录定义 did:wba 网络对原生 `did:web` 的兼容模式。

兼容模式的目标是：在不要求对方把 DID 迁移为 `did:wba` 的前提下，使原生 `did:web` 仍然可以接入本规范定义的能力，包括但不限于：

- 跨平台身份认证（第 3 章、第 4 章）
- Handle / WNS 集成
- 端到端加密通信（E2EE）
- 智能体描述服务发现

在兼容模式下，`did:web` 继续按 `did:web` 方法规范进行创建、解析和更新；本附录只定义 did:wba 网络如何接受和验证原生 `did:web`。

### B.2 解析与验证规则

当实现接收到一个原生 `did:web` 时，必须（MUST）按 `did:web` 方法规范执行解析，并至少完成以下检查：

1. 按 `did:web` 规则解析 DID Document；
2. 检查 DID Document 的 `id` 是否与请求的 `did:web` 完全一致；
3. 按 DID Core 规则检查相关验证方法是否存在，并且是否位于正确的 verification relationship 中。

在兼容模式下，实现**不得（MUST NOT）**对原生 `did:web` 强制执行以下 did:wba 特有检查：

- `e1_` / `k1_` 路径绑定公钥指纹检查；
- did:wba 主规范中的路径绑定 profile 语义检查；
- did:wba 特有的路径型 DID 轮换语义检查；
- 将 did:wba 特有 proof 规则作为 `did:web` 解析成功的前提条件。

如果原生 `did:web` DID Document 自身携带了标准 proof（例如 Data Integrity proof），实现可以（MAY）按照该 proof 的声明 profile 和本地策略执行验证；但 `did:web` 解析成功本身不以 did:wba 的 `proof` 规则为前提。

### B.3 与跨平台身份认证的兼容

原生 `did:web` 可以兼容本规范第 3 章和第 4 章定义的跨平台身份认证流程。

当客户端使用 `did:web` 参与跨平台身份认证时：

1. `keyid` 仍然必须（MUST）为完整 DID URL；
2. 服务端仍然必须（MUST）解析 DID Document；
3. 服务端仍然必须（MUST）验证 `keyid` 指向的验证方法存在；
4. 服务端仍然必须（MUST）验证该验证方法位于 DID Document 的 `authentication` 关系中；
5. 随后的 HTTP Message Signatures / `Content-Digest` 验证逻辑与 did:wba 相同。

兼容模式下，`did:web` 的身份绑定语义来自 `did:web` 的解析结果本身，而不是 did:wba 的路径绑定公钥指纹。

### B.4 与 Handle / WNS 的兼容

原生 `did:web` 可以兼容 did:wba 的 Handle / WNS 体系。

当 `did:web` DID Document 在 `service` 中声明 `ANPHandleService` 时，验证者可以（MAY）对其执行与 did:wba 相同的双向绑定验证逻辑：

1. 通过 Handle Resolution Endpoint 解析 Handle，获得 DID；
2. 解析该 DID；
3. 在 DID Document 中查找 `ANPHandleService`；
4. 验证 `ANPHandleService.serviceEndpoint` 与该 Handle 对应的 Resolution Endpoint 一致。

对于原生 `did:web`，双向绑定验证只依赖：

- Handle → DID 的解析结果；
- DID Document 中的 `ANPHandleService` 声明；

而**不需要**执行 did:wba 的 `e1_` / `k1_` 指纹绑定检查。

### B.5 与端到端加密通信（E2EE）的兼容

原生 `did:web` 可以兼容 did:wba 网络中的端到端加密通信。

当 `did:web` DID Document 包含可识别的 `keyAgreement` 条目时，实现可以（MAY）按上层即时消息或 E2EE 协议使用这些密钥进行密钥协商与加密通信。

例如：

- `X25519KeyAgreementKey2019`
- 或其他被上层协议明确支持的 key agreement 类型

在兼容模式下，E2EE 能力的前提是：

1. DID Document 可成功解析；
2. 所需的 `keyAgreement` 验证方法存在；
3. 上层协议支持对应算法与公钥表示方式。

### B.6 与智能体描述服务的兼容

原生 `did:web` DID Document 也可以（MAY）声明 did:wba 网络中的服务类型，例如：

- `AgentDescription`
- `ANPHandleService`

只要这些服务条目在 DID Document 中声明正确，实现就可以按 did:wba 的应用层协议使用这些服务，而不要求 DID 方法必须是 `did:wba`。

### B.7 实现建议

实现者应当（SHOULD）区分两种解析模式：

1. **did:wba 模式**  
   - 按主规范（以及附录 A，如启用）执行完整的路径绑定、公钥指纹和 proof 规则。

2. **did:web 兼容模式**  
   - 按 `did:web` 规范解析；
   - 不执行 did:wba 特有的路径绑定、公钥指纹和 proof 强制规则；
   - 仍然可以接入 did:wba 的跨平台身份认证、Handle 和 E2EE 等上层能力。

应用实现**不应（SHOULD NOT）**仅因为某个 DID 是原生 `did:web`、且不包含 did:wba 特有的 `e1_` / `k1_` 路径绑定或 proof，而拒绝其参与跨域身份认证、Handle 集成或端到端加密通信。

同时，新部署如果希望获得更强的“路径绑定公钥可验证性”和统一的标准 proof 体验，仍应当（SHOULD）优先选择 did:wba 主规范的 `e1_` profile。
