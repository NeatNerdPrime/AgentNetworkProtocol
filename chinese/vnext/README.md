# ANP 核心协议 vNext 草案索引

- 状态：草案 / 未发布
- 范围：ANP-01 至 ANP-09 的候选修订
- 已发布基线：[ANP 1.1 核心规范](../../README.cn.md)
- 英文镜像：[ANP Core Protocol vNext Draft](../../vnext/README.md)

## 1. 版本边界

本目录中的文档是核心 ANP 协议套件的候选草案。在本草案正式发布前，它们不修改 `chinese/` 下的已发布文件。

- **已发布规范**在对应 vNext 草案完成评审并发布前，仍是互操作合同。
- 草案存在不表示 SDK、服务或产品已经实现，也不授权公开宣告相应能力。
- 评审时应同时检查中英文草案；任何字段、流程、错误名或示例不一致都属于草案缺陷。

本目录新增独立的 ANP-02 DID 身份认证草案，并将 ANP-03 收敛为 WBA 方法规则、ANP-04 保留原有 WNS 和 Web 兼容规则。编号 02 复用已废弃 did:all 的历史编号；旧文件和链接保留。ANP-01、ANP-06、ANP-07、ANP-08 和 ANP-09 可在后续加入。

## 2. 文档集

| 编号 | 文档 | 状态 |
| --- | --- | --- |
| ANP-01 | [技术白皮书](../01-AgentNetworkProtocol技术白皮书.md) | 已发布 v1.1；尚未复制 vNext 草案 |
| ANP-02 | [基于 DID 的身份认证协议](02-ANP-基于DID的身份认证协议.md) | 新增草案；DID 方法无关的 HTTP/JSON 认证，支持 WBA/Web，WebVH/其他方法仅资料性说明 |
| ANP-03 | [did:wba 方法规范](03-did-wba方法规范.md) | 候选修订；通用认证提取到 ANP-02 |
| ANP-04 | [基于 DID 的命名空间规范（WNS）](04-ANP-基于DID-WBA的命名空间规范.md) | 候选修订；保留原 WBA 绑定行为和既有 Web 域声明兼容 |
| ANP-06 | [智能体通信元协议规范](../06-ANP-智能体通信元协议规范.md) | 仍为草案；尚未加入 vNext 副本 |
| ANP-07 | [智能体描述协议规范](../07-ANP-智能体描述协议规范.md) | 已发布 v1.1；尚未复制 vNext 草案 |
| ANP-08 | [智能体发现协议规范](../08-ANP-智能体发现协议规范.md) | 已发布 v1.1；尚未复制 vNext 草案 |
| ANP-09 | [端到端即时消息协议规范总纲](../09-ANP-端到端即时消息协议规范.md) | 已发布 v1.1；消息 vNext 仍位于 [`message/vnext/`](../message/vnext/README.md) |

历史附录继续保留；本目录新增 Web 集成候选附录：

- [附录 A：did:wba `k1_` 兼容扩展](../附录A：did-wba-k1_兼容扩展.md)
- [附录 B：原生 `did:web` 集成候选](附录B：与原生did-web-的兼容.md)；[已发布兼容文本](../附录B：与原生did-web-的兼容.md)保持原文

## 3. 阅读与评审顺序

先读 ANP-02 通用认证与方法绑定，再读 ANP-03 方法规则、ANP-04 WNS 和消息 P1/P2。规范依赖为普通 API → ANP-02 → 适用方法规则；消息 → P1/P2 → ANP-02 公共要求。ANP-02 不反向要求消息或 WNS。评审时同时检查双语规范、[向量](../../examples/did-authentication-vnext/README.cn.md)。

## 版权声明

Copyright (c) 2024 ANP 开源社区
本文件依据 [Apache License 2.0](../../LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
