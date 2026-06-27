# ANP-智能体通信元协议规范（Draft）

- 文档编号：ANP-06
- 标题：ANP-智能体通信元协议规范
- 状态：Draft
- 版本：1.1-draft
- 语言：中文
- 适用范围：本规范适用于 ANP 智能体之间的协议协商、协议选择与通信建立过程。

备注：
- 本规范当前仍处于草案状态，尚未发布，后续可能会根据实现反馈和实际场景进行较大调整。
- 当前的协议实现聚焦于端到端消息加密，后续将调整为基于 did:wba 和 HTTP 的方案。

## 背景

**元协议（Meta-Protocol）**，即协商通信使用协议的协议，具体来说是一种定义协议如何操作、解析、组合和交互的协议。它提供协议的规则和模式，帮助设计通用、扩展性强的通信机制。元协议通常不处理具体的数据传输，而是定义通信框架和协议运行的基本约束。

元协议能够极大的提高智能体之间的通信效率，降低智能体之间通信成本。智能体之间如果采用自然语言传递数据，在智能体内部需要使用LLM对数据进行处理，信息处理效率低，成本高。使用元协议，结合AI生成代码处理协议的代码，可以：
- 提高数据传输效率：在数据进入LLM之前，先进行协议协商，可以减少LLM处理的数据量，提高数据传输效率。
- 提高数据理解的准确性：通过数据源对数据结构化，而非直接让LLM处理非结构化的数据，可以提高数据理解的准确性。
- 降低数据处理复杂度：特定领域数据复杂度高，当前行业已经有大量协议规范，无法使用自然语言传递，比如音视频数据。

同时，在人工智能加持下的元协议，能够让智能体网络变成一个自组织、自协商的协作网络。自组织、自协商是指智能体网络中的各个智能体能够自主地进行相互连接、协议协商、协议共识达成。通过自然语言和元协议，智能体可以互相沟通各自的能力、数据格式和使用的协议，最终选出最优的通信协议，确保整个网络的高效协作和信息传递。

在元协议层，我们参考和借鉴了[Agora Protocol](https://arxiv.org/html/2410.11905v1)的思路，结合协议在具体场景中的最佳实践与挑战，设计了AgentNetworkProtocol的元协议规范。

## 当前协议是如何协商的

在现在的软件系统中，如果对外提供的开发的API，一般会给出API调用方法，包含API的调用参数、返回值、使用的协议等。这个过程本质上就是协议协商的过程。它有以下缺点：
- 需要人工设计协议，并且编写协议处理代码。如果没有相应的协议，则无法进行通信。
- 协议的对接需要大量的人工参与，中间需要进行多次的沟通和确认。
- 如果行业没有标准规范，多个系统使用不同的定义，调用者需要分别进行协商和对接

## 元协议协商流程

LLM加持的智能体结合元协议可以有限的解决现有软件系统协议协商的问题，它的主要流程如下：

```plaintext
  Agent (A)                                       Agent (B)
    |                                                 |
    | ------------- Protocol Negotiation -----------> |
    |                                                 |
    |         (Multiple negotiations may occur)       |
    |                                                 |
    | <------------- Protocol Negotiation ----------- |
    |                                                 |
    |---------------                                  |
    |              |                                  |
    |   Protocol Code Generated                       |
    |              |                                  |
    | <-------------                                  |
    | --------------- Code Generation --------------> |
    |                                                 |---------------
    |                                                 |              |
    |                                                 |   Protocol Code Generated
    |                                                 |              |
    |                                                 | <-------------
    | <-------------- Code Generation --------------- |
    |                                                 |
    |                                                 |
    | ------------ Test Cases Negotiation ----------> |
    |                  (Optional)                     |
    |         (Multiple negotiations may occur)       |
    |                                                 |
    | <----------- Test Cases Negotiation ----------- |
    |                                                 |
    |                                                 |
    |    (Start Communication Using Final Protocol)   |
    |                                                 |
    | <------- Application Protocol Message --------> |
    |                                                 |
    |                                                 |
```

如图所示，智能体A向智能体B发起协议协商过程如下：
- 智能体A首先使用自然语言，向智能体B发起协议协商，携带A的需求、能力、期望协议规范等，可能有多个选项供B选择
- 智能体B收到A的协商请求后，根据A提供的信息，使用自然语言，向A回复B的能力、确定的协议规范等
- 智能体A和智能体B之间可能经过多轮协商，最终确定智能体之间通信使用的协议规范
- 根据协商结果，智能体A和B使用AI生成处理协议的代码。为了安全考虑，生成的代码建议在沙盒中运行
- 智能体之间进行协议互通测试，使用AI判断协议消息是否符合协商规范，如果不符合，则通过自然语言交互进行自动解决
- 最后，确定最终使用协议，智能体A和B使用最终的协议进行通信

通过以上的流程我们可以看到，智能体使用元协议进行协议协商，结合代码生成技术，可以极大的提高协议协商的效率，降低协议协商的成本。同时，也让智能体网络变成一个自组织、自协商的协作网络。

## 流程消息格式定义

协商消息基于[端到端加密](03-基于did的端到端加密通信技术协议.md)消息的encryptedData进行扩展，属于加密消息的上层消息。

加密消息encryptedData的ciphertext解密后的消息格式设计如下：

```plaintext
0               1               2               3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 0 ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|PT |  Reserved |              Protocol data                    | ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

```
- PT: Protocol Type，2bit，表示协议类型
    - 00：meta protocol，元协议
    - 01：application protocol，应用协议
    - 10：natural language protocol，自然语言协议
    - 11：verification protocol，验证协议
- Reserved: 6bit，保留字段，暂未使用
- Protocol Data: 变长，表示协议的具体内容

所有的消息都有一个二进制的头，大小为1个字节，头中主要的信息是协议数据的协议类型：
- 如果协议类型值为00，则表示此消息是元协议，用于进行协议的协商；
- 如果协议类型值为01，则表示此消息是应用协议，用于进行实际的数据传输；
- 如果协议类型值为10，则表示此消息是自然语言协议，直接使用自然语言进行数据传输；
- 如果协议类型值为11，则表示此消息是验证协议，用于进行协商协议的验证，验证通过后，则使用此协议进行数据传输，验证协议并非真正的用户数据。

当前二进制头是一个字节，如果后期一个字节无法满足需求，可以扩展为多个字节。通过在Hello消息中携带消息格式版本信息，可以保持前后兼容。

### 元协议协商消息定义

当协议类型（PT）为00时，消息的Protocol Data携带元协议消息，用于协商两个智能体之间通信使用的协议。元协议的协商过程是预先定义的，不用进行协商。预定义的文档即为本文档。

元协议消息我们定义为半结构化的格式，核心的协议协商部分使用自然语言，保持协商的灵活性，同时在流程控制上，使用结构化的json，保持协议协商过程可控。

元协议协商消息分为几类：
- 协议协商消息：用于协商协议内容
- 代码生成消息：用于生成处理协议的代码
- 调试协议消息：用于协商调试协议
- 自然语言消息：用于协商双方使用自然语言进行协商

下面协议所用的json格式，均符合json规范[RFC8259](https://tools.ietf.org/html/rfc8259)。

#### 协议协商消息定义

协议协商消息的json格式如下：
```json
{
    "action": "protocolNegotiation",
    "sequenceId": 0,
    "candidateProtocols": "",
    "modificationSummary": "",
    "status": "negotiating"
}
```

字段说明：
- action：固定为protocolNegotiation
- sequenceId：协商序号，用于标识协商轮次。
  - 从0开始，每次协商消息的sequenceId都需要在原有的基础上加1。
  - 为了防止协商轮次过大，代码实现人员可以根据业务场景设定协商轮次上限。建议不超过10次。
  - 同时在处理sequenceId的时候，需要判断对方返回的sequenceId是否按照规范递增。
- candidateProtocols：候选协议
  - 是一段自然语言文本，用于描述候选协议的目的、流程、数据格式、错误处理等。
  - 这段文本一般会使用AI处理，建议使用markdown格式，保持清晰、简洁。
  - 候选协议可以描述全部的协议内容，也可以基于已有的协议进行修改，携带已有协议的URI，以及修改的内容。
  - 候选协议每次必须携带全量协议内容。
  - status状态是negotiating时，必须携带candidateProtocols字段。
- modificationSummary：协议修改摘要
  - 是一段自然语言文本，用于描述在协商过程中，当前的候选协议相对上次的候选协议修改了哪些内容。
  - 这段文本一般会使用AI处理，建议使用markdown格式，保持清晰、简洁。
  - 首次发起协商时，可以不携带此字段。
  - status状态是negotiating时，除首次发起协商外，需要携带modificationSummary字段。
- status：协商状态，用于标识当前协商的状态，状态值如下：
  - negotiating：协商中
  - rejected：协商失败
  - accepted：协商成功


协商双方在协商轮次超出最大限制前，可以反复协商，直到任意一方判定对方给出的协议满足自己的需求，则协商成功，否则协商失败，可以反馈给人类工程师，介入协商过程。

##### candidateProtocols示例

- candidateProtocols携带全量协议描述示例如下：

```plaintext
# 需求
获取商品信息

# 流程描述
请求者携带商品id或名字，发送给商品提供者，商品提供者根据商品id或名字，返回商品详细信息。
异常处理：
- 错误码使用HTTP的错误码
- 错误信息使用自然语言描述
- 15秒内没有返回，则认为超时

# 数据格式描述
请求和响应均采用json格式，使用规范https://tools.ietf.org/html/rfc8259。

## 请求消息
请求json schema定义如下：
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProductInfoRequest",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string",
      "description": "A random string identifier for the message"
    },
    "type": {
      "type": "string",
      "description": "Indicates whether the message is a REQUEST or RESPONSE"
    },
    "action": {
      "type": "string",
      "description": "The action to be performed"
    },
    "productId": {
      "type": "string",
      "description": "The unique identifier for a product"
    },
    "productName": {
      "type": "string",
      "description": "The name of the product"
    }
  },
  "required": ["messageId", "type", "action", "productId"]
}

## 响应消息
响应json schema定义如下：
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProductInfoResponse",
  "type": "object",
  "properties": {
    "messageId": {
      "type": "string",
      "description": "The messageId from the request json"
    },
    "type": {
      "type": "string",
      "description": "Indicates whether the message is a REQUEST or RESPONSE"
    },
    "status": {
      "type": "object",
      "properties": {
        "code": {
          "type": "integer",
          "description": "HTTP status code"
        },
        "message": {
          "type": "string",
          "description": "Status message"
        }
      },
      "required": ["code", "message"]
    },
    "productInfo": {
      "type": "object",
      "properties": {
        "productId": {
          "type": "string",
          "description": "The unique identifier for a product"
        },
        "productName": {
          "type": "string",
          "description": "The name of the product"
        },
        "productDescription": {
          "type": "string",
          "description": "A detailed description of the product"
        },
        "price": {
          "type": "number",
          "description": "The price of the product"
        },
        "currency": {
          "type": "string",
          "description": "The currency of the price"
        }
      },
      "required": ["productId", "productName", "productDescription", "price", "currency"]
    }
  },
  "required": ["messageId", "type", "status", "productInfo"]
}

```

- candidateProtocols基于已有协议进行修改示例如下：

```plaintext
# 需求
获取商品信息

# 流程描述
该流程基于已有协议（URI: https://agent-network-protocol.com/protocols/product-info-0-1-1）实现。

# 修改内容
- 在响应消息中增加自定义错误码
  - 100001：商品缺货中
  - 100002：商品下架中
  - 100003：商品价格未知

```

##### modificationSummary示例

modificationSummary也是自然文本，示例如下：

```plaintext

修改点：
- 响应中增加字段：productImageUrl, productVideoUrl, productTags
- 明显响应超时时间：15秒。15秒内没有返回，则认为超时

```

#### 协议代码生成消息定义

协商完成协议后，智能体需要准备处理协议的代码，代码可能是AI生成或从网络加载。在代码就绪之前，如果收到用户的消息，可能会导致协议处理失败。

因此，协商完成后，智能体双方都需要回复对方代码生成消息，通知对方代码已生成，可以进行消息处理。

如果长时间没有收到代码生成消息，则认为代码生成失败，通信终止。建议超时时长15秒。

```json
{
    "action": "codeGeneration",
    "status": "generated"
}
```

字段说明：
- action：固定为codeGeneration
- status：状态
  - generated，表示代码已生成
  - error，表示代码生成失败，通信终止

#### 测试用例协商消息定义

协议协商完成、代码完成后，两个智能体是否能够基于此正常通信，可能需要一个测试过程。测试用例协商消息主要为此设计，用来让两个智能体协商测试用例，并通知对方进行测试。

测试用例协商消息并非流程中的必须支持功能，如果智能体或者人类工程师认为协议无需测试，可以跳过此步骤，直接进行后面的通信过程。

测试用例协商消息的json格式如下：

```json
{
    "action": "testCasesNegotiation",
    "testCases": "",
    "modificationSummary": "",
    "status": "negotiating"
}
```

字段说明：
- action：固定为testCasesNegotiation
- testCases：测试用例集，一段自然语言文本，用于描述测试用例集的内容，包括多个测试用例，每个测试用例包含测试请求数据、测试响应数据、测试预期结果。
- modificationSummary：测试用例修改摘要，一段自然语言文本，用于描述在协商过程中，当前的测试用例集相对上次的测试用例集修改了哪些内容。
- status：协商状态，用于标识当前协商的状态，状态值如下：
  - negotiating：协商中
  - rejected：协商失败
  - accepted：协商成功

testCases示例：

```plaintext
 # 测试用例1

 - **测试请求数据**：
 {
   "messageId": "msg001",
   "type": "REQUEST",
   "action": "getProductInfo",
   "productId": "P12345"
 }

 - **测试响应数据**：
 {
   "messageId": "msg001",
   "type": "RESPONSE",
   "status": {
     "code": 200,
     "message": "成功"
   },
   "productInfo": {
     "productId": "P12345",
     "productName": "高性能笔记本电脑",
     "productDescription": "配备最新处理器和大容量内存的高性能笔记本电脑。",
     "price": 1299.99,
     "currency": "USD"
   }
 }

 - **测试预期结果**：
 成功获取产品信息，状态码为200。

 # 测试用例2

 - **测试请求数据**：
 {
   "messageId": "msg002",
   "type": "REQUEST",
   "action": "getProductInfo",
   "productId": "P99999"
 }

 - **测试响应数据**：
 {
   "messageId": "msg002",
   "type": "RESPONSE",
   "status": {
     "code": 404,
     "message": "产品未找到"
   },
   "productInfo": null
 }

 - **测试预期结果**：
 请求的产品不存在，返回状态码404，产品信息为空。

```

#### 修复错误协商消息定义

在协议的测试或实际的运行过程中，如果发现对方的消息不符合协议定义或有错误，则需要通知对方错误信息，并一起协商修复错误。这个过程也可能会经过多轮，协议对接过程中的错误可能是双方都存在问题，需要一起协商修复。

比如，智能体A发送错误修复消息，指出智能体B发送的消息不符合协议定义或有错误，智能体B收到错误修复消息后，根据错误信息和协议定义，分析自己是否有错误。如果有错误，则接受错误并修改代码，进入代码生成过程。如果没有错误，则回复错误修复消息，拒绝修改并告知智能体A详细的原因。

修复错误协商消息的json格式如下
```json
{
    "action": "fixErrorNegotiation",
    "errorDescription": "",
    "status": "negotiating"
}
```

字段说明：
- action：固定为fixErrorNegotiation
- errorDescription：错误描述，一段自然语言文本，用于描述错误信息。
- status：协商状态，用于标识当前协商的状态，状态值如下：
  - negotiating：协商中
  - rejected：协商失败
  - accepted：协商成功

errorDescription示例：

```plaintext
# 错误描述
- 响应消息中，status字段缺少code字段

```

#### 自然语言协商消息

使用上面定义的协议协商、代码生成、修复错误等消息，已经能够满足大部分智能体之间的协商过程。不幸的是经验告诉我们，现实世界往往是非常复杂且有很多我们考虑不到的地方。之前我们很难解决这个问题，现在基于生成式AI和自然语言，这个问题可以得到很好的解决。

所以我们设计了一个纯自然语言交互的消息，用于解决那些无法使用我们预先定义的消息进行协商的问题。

自然语言协商消息非必须支持消息，智能体可以自由选择是否支持。我们建议优先使用预定义的消息进行协商，这样协商消息更高。

自然语言交互消息采用请求响应模式，json格式如下：

```json
{
    "action": "naturalLanguageNegotiation",
    "type": "REQUEST",
    "messageId": "",
    "message": ""
}
```

字段说明：
- action：固定为naturalLanguageNegotiation
- type：消息类型，用于标识消息的类型，值为REQUEST或RESPONSE
- messageId：消息ID，16位随机字符串，用于标识消息，在对方回复时，需要携带相同的messageId。
- message：自然语言内容，一段自然语言文本，智能体可以在message中携带自己的关于协议协商、通信等特殊的需求。

### 应用协议消息定义

当协议类型（PT）为01时，消息的Protocol Data携带应用协议消息，用于传递两个智能体之间的交互数据。消息的格式，取决于协议协商流程中协商出的具体协议。它可以是二进制数据，也可以是json、xml等结构化数据。

### 自然语言协议消息定义

当协议类型（PT）为02时，消息的Protocol Data携带自然语言协议消息，用于传递两个智能体之间的交互数据。

在某些特殊的情况下，智能体之间仅进行少量、低频甚至单次的交互，为了达到最高通信效率，可以跳过协议协商流程，直接使用自然语言进行数据交互。

Protocol Data中的数据为UTF-8编码的自然语言文本，为了方便AI处理，建议使用markdown格式，使用清晰、简洁的描述。

此消息非必须支持消息，智能体可以自由选择是否支持。

自然语言协议消息示例：

请求示例：
```plaintext
# 需求
获取商品信息，根据商品ID，返回商品的详细信息，包括商品ID、商品名称、商品描述、商品价格、商品货币单位。

# 输入
- 商品ID：P12345
```

响应示例：
```plaintext
# 输出
- 商品ID：P12345
- 商品名称：高性能笔记本电脑
- 商品描述：配备最新处理器和大容量内存的高性能笔记本电脑。
- 商品价格：1299.99
- 商品货币单位：USD
```

### 验证协议消息

当协议类型（PT）为03时，消息的Protocol Data携带验证协议消息，用于传递两个智能体之间的验证数据。消息的格式，取决于协议协商流程中协商出的具体协议。验证协议消息不是实际的业务数据，而是为了验证协议流程是否正常，验证协议消息的内容一般在协议协商流程中通过verificationProtocol消息协商。

此消息非必须支持消息，智能体可以自由选择是否支持。

## 元协议能力协商机制与扩展性设计

上面的协议协商流程展示了两个智能体是如何协商出具体协议的，但是出于现实中的各种原因，智能体可能未必能够支持所有的元协议能力，比如有的智能体不支持自然语言协议，有的智能体不支持验证协议。

为了解决这个问题，我们设计了元协议能力协商机制，用于智能体在连接前协商元协议能力，告知对方自己支持的元协议能力，避免协商失败。

这个问题和元协议的扩展性本质上属于一个问题，所以放在一起讨论。当我们需要对元协议流程进行升级的时候，比如将一个字节的协议类型扩展为两个字节，会产生新的元协议版本，这个时候需要考虑新老版本兼容问题。

我们的方案是，在连接握手消息，即sourceHello和destinationHello消息中，携带元协议的版本、以及在此版本上，支持的元协议能力。如果一个智能体支持V1版本，另外一个智能体支持V1和V2版本，则双方使用V1版本元协议进行协商。

关于元协议能力的协商，我们要求所有的智能体必须要支持基本的元协议能力，而对于可选的元协议能力，比如自然语言协议、验证协议等，智能体可以自由选择是否支持。

对sourceHello和destinationHello消息的修改如下：

```json
{
  "version": "1.0",
  "type": "sourceHello",  // destinationHello同理
  "metaProtocol": {
    "version": "1.0",
    "supportedCapabilities": [
        "naturalLanguageProtocol",
        "verificationProtocol",
        "naturalLanguageNegotiation",
        "testCasesNegotiation",
        "fixErrorNegotiation"
    ],
    "protocolHash": "1234567890abcdef..."
  },
  //其他字段省略
}
```

字段说明：
- version：元协议版本，当前版本为1.0
- supportedCapabilities：支持的元协议能力，数组类型，数组中每个元素为支持的元协议能力名称，对应功能如下：
  - naturalLanguageProtocol：自然语言协议
  - verificationProtocol：验证协议
  - naturalLanguageNegotiation：自然语言协商
  - testCasesNegotiation：测试用例协商
  - fixErrorNegotiation：错误修复协商

## 元协议协商效率优化

智能体使用元协议协商通信双方使用的数据传输协议，能够解决异构系统间协议对接带来的人工成本问题，让智能体组成一个自组织、自协商的网络，但也带来一些新的问题。

首先，协议协商流程明显增加通信RTT，并且使用AI处理自然语言也会引入新的耗时。从协议协商、代码生成、测试用例协商（非必须）、错误修复协商（非必须），整个流程至少会新增2个RTT，如果遇到多轮协商的情况，RTT会更多。使用LLM处理自然语言也会产生新的耗时，耗时大小取决于输入输出的长度，以及模型处理的速度，单次耗时可能从几秒到十几秒不等。

其次，协商过程中依赖AI对需求的理解能力、协议设计能力、协议处理代码生成能力，这些能力对AI的要求较高，并且由于当前AI的固有缺陷如LLM的幻觉问题，AI无法100%保证处理成功，这会降低协商成功率。

在用户实际的业务流程中，一个功能网上涉及很多次智能体交互，耗时问题和成功率问题如果无法很好的解决，将会严重影响用户体验。

为此，我们设计了0RTT的元协议协商机制，以及基于共识协议的元协议协商机制，来解决上述问题。

### 0RTT元协议协商机制

现代通信协议设计中，为了减少连接过程的RTT，一般都会设计0RTT的通信机制。比如以TLS1.3为例，它通过在首次连接中生成并缓存会话票据（Session Ticket），允许客户端在后续连接时利用该票据和早先协商的密钥直接发送加密的0-RTT数据，从而实现快速重连和即时数据传输。

ANP的0RTT元协议协商机制是在两个智能体首次连接时，完整的进行元协议协商全过程，双方都对协商协议进行缓存，保存协议的内容以及协议内容对应的hash值。协议的内容使用达成协议时protocolNegotiation消息的candidateProtocols字段。

第二次连接时，就可以直接复用第一次的协商结果进行通信。在握手消息设计上，连接发起者可以在sourceHello消息中携带上一次协商的结果，主要是使用的协议hash值。连接接收者在destinationHello消息中对发起者的协议进行确认，双方就可以直接跳过协商过程，使用上次协商的协议进行通信。

sourceHello消息示例：

```json
{
  "version": "1.0",
  "type": "sourceHello",
  "metaProtocol": {
    "version": "1.0",
    "supportedCapabilities": [
        "naturalLanguageProtocol",
        "verificationProtocol",
        "naturalLanguageNegotiation",
        "testCasesNegotiation",
        "fixErrorNegotiation"
    ],
    "usedProtocolHash": "1234567890abcdef..."
  },
  //其他字段省略
}
```

destinationHello消息示例：

```json
{
  "version": "1.0",
  "type": "destinationHello",
  "metaProtocol": {
    "version": "1.0",
    "supportedCapabilities": [
        "naturalLanguageProtocol",
        "verificationProtocol",
        "naturalLanguageNegotiation",
        "testCasesNegotiation",
        "fixErrorNegotiation"
    ],
    "usedProtocolHash": "1234567890abcdef..."
  },
  //其他字段省略
}
```

字段说明：
- usedProtocolHash：最终达成协议内容的hash值，用于标识使用的协议，在第二次连接时，用于跳过协商过程，直接使用该协议通信。如果接收者不支持该协议，则在destinationHello消息中去掉usedProtocolHash字段，表示需要重新进行协议协商。

协议内容的hash值使用SHA-256算法生成，hash值为64个字符的十六进制字符串，usedProtocolHash生成代码示例：

```python
import hashlib

candidateProtocols = "..."  # 从达成协议时protocolNegotiation消息中获取

def generate_protocol_hash(protocol_content):
    return hashlib.sha256(protocol_content.encode('utf-8')).hexdigest()

usedProtocolHash = generate_protocol_hash(candidateProtocols)
```

### 基于共识协议的元协议协商机制

使用0RTT元协议协商机制，虽然能够减少RTT，但是首次连接仍然需要进行协商，协商过程中仍然需要使用AI处理自然语言，仍然存在耗时长和成功率问题。智能体网络中，存在着大量的需求和功能相同或相似的通信行为，如果智能体能够复用其他智能体已经协商好的协议与协议代码，则可以大大提高通信效率。

为此，我们设计了基于共识协议的元协议协商机制。

共识协议分为两类，分别是：
- 由人制定的行业标准协议：由行业组织或标准化机构制定，比如W3C、IETF等组织制定的协议
- 由智能体网络达成的共识协议：由智能体网络中的智能体共同协商、选举的协议

我们可以为所有共识协议的每一个版本都生成一个唯一的标识URI，同时为这个版本的协议生成对应的协议处理代码。智能体在进行协议协商时，可以根据需求，选择一个或多个共识协议作为候选协议，直接向对方发起连接请求，对方选择一个它支持的协议并且返回。然后双方就可以使用此协议，以及此协议对应的协议代码进行通信。

更进一步，智能体在一个在线文档上发布自己支持的共识协议，其他智能体可以查看此在线文档，并根据此在线文档中的协议，与目标智能体协商通信协议。这样又进一步加快了协议协商过程。

智能体如何根据URI下载协议以及协议对应代码，将在其他规范中讨论。

sourceHello消息示例：

```json
{
  "version": "1.0",
  "type": "sourceHello",
  "metaProtocol": {
    "version": "1.0",
    "supportedCapabilities": [
        "naturalLanguageProtocol",
        "verificationProtocol",
        "naturalLanguageNegotiation",
        "testCasesNegotiation",
        "fixErrorNegotiation"
    ],
    "candidateProtocols": [
        "https://example.com/protocol/1.0",
        "https://example.com/protocol/2.0"
    ]
  },
  //其他字段省略
}
```

destinationHello消息示例：

```json
{
  "version": "1.0",
  "type": "destinationHello",
  "metaProtocol": {
    "version": "1.0",
    "supportedCapabilities": [
        "naturalLanguageProtocol",
        "verificationProtocol",
        "naturalLanguageNegotiation",
        "testCasesNegotiation",
        "fixErrorNegotiation"
    ],
    "selectedProtocol": "https://example.com/protocol/1.0"
  },
  //其他字段省略
}
```

字段说明：
- selectedProtocol：从candidateProtocols中选择的协议，用于标识双方使用的协议。

#### 智能体网络共识协议的达成

智能体网络如何达成共识协议，并且将共识协议发布到网络上，将在其他规范中讨论。

## 未来

本规范主要讨论了元协议的设计，以及元协议协商机制的设计。我们设计了一个更加灵活、更低成本的智能体协议协商规范，使用此规范，智能体可以在没有人参与的情况下完成智能体之间的自主协商、代码生成、调试、通信，为自组织、自协商的智能体网络打下了坚实的基础。

同时，我们相信，有了元协议的加持，智能体网络之上会诞生非常多智能体之间达成共识的通信协议，这些协议的数量将会大大超过人类制定协议的数量。

然而，如何设计一个合理的协议选举共识算法，如何激励智能体上报他们协商的共识协议，如何让智能体能够方便的获取其他智能体协商的共识协议，仍然需要进一步讨论。

## 挑战

如果AI无法将协议代码与应用的业务逻辑代码、数据处理代码很好的结合起来，而只是用协议处理格式，元协议发挥的作用会小很多。





## 版权声明
Copyright (c) 2024 ANP 开源社区
本文件依据 [Apache License 2.0](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
