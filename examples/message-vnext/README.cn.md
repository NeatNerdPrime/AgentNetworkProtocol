# ANP Messaging 1.2 多设备示例

状态：说明性草案示例，不是密码学一致性向量。

[English](README.md) | [中文](README.cn.md)

这些文件配套[混合版本的 ANP Messaging 1.2 草案](../../chinese/message/vnext/README.md)。JSON 可用于 schema 与流程评审；其中公钥、digest、签名、密文和 proof value 都是明确的占位符，绝不能（**MUST NOT**）作为密码学测试向量使用。

| 文件 | 用途 |
| --- | --- |
| [`01-did-document-two-devices.json`](01-did-document-two-devices.json) | 一个 Agent DID 下两个使用独立 key 的合法设备端点 |
| [`02-direct-two-device-deliveries.json`](02-direct-two-device-deliveries.json) | 同一逻辑 Direct E2EE 消息的两次独立加密、独立幂等 P5 设备投递 |
| [`03-device-prekey-bundle.json`](03-device-prekey-bundle.json) | 绑定一个 owner DID/device 及 Manifest key 引用的 PreKey Bundle |
| [`04-mls-two-device-leaves.json`](04-mls-two-device-leaves.json) | 同一个 DID 级业务成员的两个设备绑定 MLS Leaf |
| [`05-device-revocation.json`](05-device-revocation.json) | 移除一个设备及其 key 引用前后的公开 DID Document 片段 |
| [`06-device-state-changed-error.json`](06-device-state-changed-error.json) | 要求重新解析当前 DID、但不泄露内部 checkpoint 的可重试 P5/P6 设备状态错误；Base 消息不使用该错误 |

中英文 Profile 规范仍是权威来源。未来的一致性向量任务必须用可复现输入和预期字节替换所有密码学占位值。

## 版权声明

Copyright (c) 2024 ANP 开源社区
本文件依据 [Apache License 2.0](../../LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
