# ANP-Agent Communication Meta-Protocol Specification(Draft)

Note:
- This chapter is in the draft stage and may undergo significant adjustments based on actual conditions.
- The current protocol implementation focuses on end-to-end message encryption and will later be modified to a solution based on did:wba and HTTP.

## Background

**Meta-Protocol**, a protocol for negotiating the use of communication protocols, specifically defines how protocols operate, parse, combine, and interact. It provides rules and patterns for protocols, helping to design a general, highly extensible communication mechanism. Meta-protocols typically do not handle specific data transmission but define the communication framework and basic constraints for protocol operation.

Meta-protocols can greatly improve communication efficiency between agents and reduce communication costs. If agents use natural language to transmit data, they need to use LLMs to process data in and out within the agents, resulting in low information processing efficiency and high costs. Using meta-protocols, combined with AI-generated code to handle protocol code, can:
- Improve data transmission efficiency: By negotiating the protocol before data enters the LLM, the amount of data processed by the LLM can be reduced, thereby improving data transmission efficiency.
- Improve data understanding accuracy: Structuring data from the source, rather than directly letting the LLM process unstructured data, can improve data understanding accuracy.
- Reduce data processing complexity: In specific domains with high data complexity, there are already many protocol specifications in the industry that cannot be transmitted using natural language, such as audio and video data.

At the same time, with the support of artificial intelligence, meta-protocols can transform the agent network into a self-organizing, self-negotiating collaborative network. Self-organizing and self-negotiating mean that agents in the network can autonomously connect, negotiate protocols, and reach protocol consensus. Through natural language and meta-protocols, agents can communicate their capabilities, data formats, and protocols used, ultimately selecting the optimal communication protocol to ensure efficient collaboration and information transmission across the network.

At the meta-protocol layer, we refer to and draw on the ideas of the [Agora Protocol](https://arxiv.org/html/2410.11905v1), combining best practices and challenges in specific scenarios to design the meta-protocol specification of the AgentNetworkProtocol.

## How Current Protocols Are Negotiated

In current software systems, if an API is provided externally, the API call method is generally given, including API call parameters, return values, and the protocol used. This process is essentially a protocol negotiation process. It has the following disadvantages:
- Requires manual design of protocols and writing protocol handling code. If there is no corresponding protocol, communication cannot proceed.
- Protocol docking requires a lot of manual involvement, with multiple rounds of communication and confirmation needed.
- If there are no industry standards, multiple systems use different definitions, and the caller needs to negotiate and dock separately.

## Meta-Protocol Negotiation Process
Intelligent agents empowered by LLMs combined with meta-protocols can effectively address the protocol negotiation issues in existing software systems. The main process is as follows:

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

As shown in the figure, the protocol negotiation process initiated by Agent A to Agent B is as follows:
- Agent A first uses natural language to initiate protocol negotiation with Agent B, carrying A's requirements, capabilities, and expected protocol specifications, with multiple options for B to choose from.
- After receiving A's negotiation request, Agent B responds to A with B's capabilities and determined protocol specifications using natural language based on the information provided by A.
- Multiple rounds of negotiation may occur between Agent A and Agent B, ultimately determining the protocol specifications for communication between the agents.
- Based on the negotiation results, Agents A and B use AI to generate code for handling the protocol. For security considerations, it is recommended that the generated code be run in a sandbox.
- The agents conduct protocol interoperability tests, using AI to determine whether the protocol messages conform to the negotiated specifications. If not, automatic resolution is performed through natural language interaction.
- Finally, the final protocol is determined, and Agents A and B communicate using the final protocol.
Through the above process, we can see that intelligent agents using meta-protocols combined with code generation technology can greatly improve the efficiency of protocol negotiation and reduce the cost of protocol negotiation. At the same time, it also transforms the intelligent agent network into a self-organizing, self-negotiating collaborative network.

## Message Format Definition

Negotiation messages are based on the encryptedData of [end-to-end encryption](04-End-to-End%20Encrypted%20Communication%20Technology%20Protocol%20Based%20on%20did.md) messages, which are upper-layer messages of encrypted messages.

The message format of the decrypted ciphertext of the encrypted message encryptedData is designed as follows:

```plaintext
0               1               2               3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 0 ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|PT |  Reserved |              Protocol data                    | ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

```
- PT: Protocol Type, 2 bits, indicating the protocol type
    - 00: meta protocol
    - 01: application protocol
    - 10: natural language protocol
    - 11: verification protocol
- Reserved: 6 bits, reserved field, not used yet
- Protocol Data: variable length, indicating the specific content of the protocol

All messages have a binary header of 1 byte, and the main information in the header is the protocol type of the protocol data:
- If the protocol type value is 00, it indicates that this message is a meta-protocol used for protocol negotiation;
- If the protocol type value is 01, it indicates that this message is an application protocol used for actual data transmission;
- If the protocol type value is 10, it indicates that this message is a natural language protocol, which directly uses natural language for data transmission;
- If the protocol type value is 11, it indicates that this message is a verification protocol used for verifying the negotiated protocol. After verification, this protocol is used for data transmission. The verification protocol is not real user data.

The current binary header is one byte. If one byte cannot meet the requirements in the future, it can be extended to multiple bytes. By carrying the message format version information in the Hello message, forward and backward compatibility can be maintained.
### Meta-Protocol Negotiation Message Definition

When the protocol type (PT) is 00, the Protocol Data of the message carries the meta-protocol message, which is used to negotiate the protocol used for communication between two agents. The meta-protocol negotiation process is predefined and does not require negotiation. The predefined document is this document.

We define the meta-protocol message as a semi-structured format. The core protocol negotiation part uses natural language to maintain the flexibility of negotiation, while the process control uses structured JSON to keep the protocol negotiation process controllable.

Meta-protocol negotiation messages are divided into several categories:
- Protocol Negotiation Message: Used to negotiate protocol content
- Code Generation Message: Used to generate code for handling the protocol
- Debug Protocol Message: Used to negotiate the debugging protocol
- Natural Language Message: Used to negotiate using natural language for communication

The JSON format used in the following protocols complies with the JSON specification [RFC8259](https://tools.ietf.org/html/rfc8259).

#### Protocol Negotiation Message Definition

The JSON format of the protocol negotiation message is as follows:
```json
{
    "action": "protocolNegotiation",
    "sequenceId": 0,
    "candidateProtocols": "",
    "modificationSummary": "",
    "status": "negotiating"
}
```

Field Description:
- action: Fixed as protocolNegotiation
- sequenceId: Negotiation sequence number, used to identify the negotiation round.
  - Starts from 0, and each negotiation message's sequenceId needs to be incremented by 1 based on the previous one.
  - To prevent the negotiation rounds from becoming too large, the code implementer can set an upper limit on the negotiation rounds based on the business scenario. It is recommended not to exceed 10 rounds.
  - When processing the sequenceId, it is necessary to check whether the sequenceId returned by the other party is incremented according to the specification.
- candidateProtocols: Candidate protocols
  - It is a piece of natural language text used to describe the purpose, process, data format, error handling, etc., of the candidate protocols.
  - This text is generally processed by AI and is recommended to be in markdown format to keep it clear and concise.
  - The candidate protocol can describe the entire protocol content or modify an existing protocol, carrying the URI of the existing protocol and the modifications.
  - The candidate protocol must carry the full protocol content each time.
- modificationSummary: Protocol modification summary
  - It is a piece of natural language text used to describe what content has been modified in the current candidate protocol compared to the previous candidate protocol during the negotiation process.
  - This text is generally processed by AI and is recommended to be in markdown format to keep it clear and concise.
  - This field can be omitted when initiating the negotiation for the first time.
- status: Negotiation status, used to indicate the current negotiation status. The status values are as follows:
  - negotiating: Negotiating
  - rejected: Negotiation failed
  - accepted: Negotiation successful
  - timeout: Negotiation timeout

The negotiation parties can negotiate repeatedly before the negotiation rounds exceed the maximum limit until either party determines that the protocol provided by the other party meets their requirements, then the negotiation is successful. Otherwise, the negotiation fails, and human engineers can be involved in the negotiation process.
##### candidateProtocols Example

- The following is an example of candidateProtocols carrying a full protocol description:

```plaintext
# Requirements
Retrieve product information

# Process Description
The requester carries the product id or name and sends it to the product provider. The product provider returns detailed product information based on the product id or name.
Exception Handling:
- Error codes use HTTP error codes
- Error messages are described in natural language
- If there is no return within 15 seconds, it is considered a timeout

# Data Format Description
Both request and response use JSON format, following the specification https://tools.ietf.org/html/rfc8259.

## Request Message
The request JSON schema is defined as follows:
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

## Response Message
The response JSON schema is defined as follows：
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
- Example of candidateProtocols modification based on existing protocols:

```plaintext
# Requirement
Retrieve product information

# Process Description
This process is implemented based on the existing protocol (URI: https://agent-network-protocol.com/protocols/product-info-0-1-1).

# Modifications
- Add custom error codes in the response message
  - 100001: Product out of stock
  - 100002: Product discontinued
  - 100003: Product price unknown

```

##### Example of modificationSummary

modificationSummary is also natural text, as shown below:

```plaintext

Modifications:
- Added fields in the response: productImageUrl, productVideoUrl, productTags
- Set explicit response timeout: 15 seconds. If no response is received within 15 seconds, it is considered a timeout.

```

#### Protocol Code Generation Message Definition

After the protocol negotiation is completed, the agents need to prepare the code to handle the protocol, which may be generated by AI or loaded from the network. If a user message is received before the code is ready, it may cause the protocol handling to fail.

Therefore, after the negotiation is completed, both agents need to reply to each other with a code generation message, notifying the other party that the code has been generated and message processing can proceed.

If the code generation message is not received for a long time, it is considered that the code generation has failed, and the communication is terminated. The recommended timeout duration is 15 seconds.

```json
{
    "action": "codeGeneration",
    "status": "generated"
}
```
Field Description:
- action: Fixed as codeGeneration
- status: Status
  - generated: Indicates that the code has been generated
  - error: Indicates that code generation failed, and communication is terminated

#### Test Cases Negotiation Message Definition

After the protocol negotiation is completed and the code is ready, a test process may be required to ensure that the two agents can communicate normally based on this protocol. The test cases negotiation message is mainly designed for this purpose, allowing the two agents to negotiate test cases and notify each other to conduct tests.

The test cases negotiation message is not a mandatory function in the process. If the agents or human engineers believe that the protocol does not need testing, this step can be skipped, and the subsequent communication process can proceed directly.

The JSON format of the test cases negotiation message is as follows:

```json
{
    "action": "testCasesNegotiation",
    "testCases": "",
    "modificationSummary": "",
    "status": "negotiating"
}
```

Field Description:
- action: Fixed as testCasesNegotiation
- testCases: A collection of test cases, a natural language text used to describe the content of the test case collection, including multiple test cases. Each test case includes test request data, test response data, and expected test results.
- modificationSummary: A summary of test case modifications, a natural language text used to describe the changes made to the current test case collection compared to the previous one during the negotiation process.
- status: Negotiation status, used to indicate the current status of the negotiation. The status values are as follows:
  - negotiating: Negotiating
  - rejected: Negotiation failed
  - accepted: Negotiation successful

Example of testCases:

```plaintext
 # Test Case 1

 - **Test Request Data**:
 {
   "messageId": "msg001",
   "type": "REQUEST",
   "action": "getProductInfo",
   "productId": "P12345"
 }

 - **Test Response Data**:
 {
   "messageId": "msg001",
   "type": "RESPONSE",
   "status": {
     "code": 200,
     "message": "Success"
   },
   "productInfo": {
     "productId": "P12345",
     "productName": "High-Performance Laptop",
     "productDescription": "A high-performance laptop equipped with the latest processor and large memory capacity.",
     "price": 1299.99,
     "currency": "USD"
   }
 }

 - **Expected Test Result**:
 Successfully retrieved product information, status code 200.

 # Test Case 2

 - **Test Request Data**:
 {
   "messageId": "msg002",
   "type": "REQUEST",
   "action": "getProductInfo",
   "productId": "P99999"
 }

 - **Test Response Data**:
 {
   "messageId": "msg002",
   "type": "RESPONSE",
   "status": {
     "code": 404,
     "message": "Product Not Found"
   },
   "productInfo": null
 }

 - **Expected Test Result**:
 The requested product does not exist, returns status code 404, and product information is null.

```

#### Fix Error Negotiation Message Definition

During the testing or actual operation of the protocol, if it is found that the other party's message does not conform to the protocol definition or contains errors, it is necessary to notify the other party of the error information and negotiate to fix the error together. This process may go through multiple rounds, as errors in the protocol docking process may be due to issues on both sides, requiring joint negotiation to resolve.

For example, Agent A sends an error fix message, pointing out that the message sent by Agent B does not conform to the protocol definition or contains errors. After receiving the error fix message, Agent B analyzes whether there is an error based on the error information and protocol definition. If there is an error, it accepts the error, modifies the code, and enters the code generation process. If there is no error, it replies with an error fix message, refusing to modify and informing Agent A of the detailed reasons.

The JSON format for the error fix negotiation message is as follows
```json
{
    "action": "fixErrorNegotiation",
    "errorDescription": "",
    "status": "negotiating"
}
```

Field Description:
- action: Fixed value "fixErrorNegotiation"
- errorDescription: Error description, a piece of natural language text used to describe the error information.
- status: Negotiation status, used to indicate the current status of the negotiation. The status values are as follows:
  - negotiating: In negotiation
  - rejected: Negotiation failed
  - accepted: Negotiation successful

errorDescription Example:

```plaintext
# Error Description
- The status field in the response message is missing the code field.

```
#### Natural Language Negotiation Message

The previously defined protocol negotiation, code generation, and error fixing messages can satisfy most of the negotiation processes between agents. Unfortunately, experience tells us that the real world is often very complex and there are many aspects we cannot foresee. Previously, it was difficult to solve this problem, but now, based on generative AI and natural language, this problem can be well addressed.

Therefore, we have designed a pure natural language interaction message to solve issues that cannot be negotiated using our predefined messages.

Natural language negotiation messages are not mandatory, and agents can freely choose whether to support them. We recommend prioritizing the use of predefined messages for negotiation, as they are more efficient.

Natural language interaction messages adopt a request-response model, with the JSON format as follows:

```json
{
    "action": "naturalLanguageNegotiation",
    "type": "REQUEST",
    "messageId": "",
    "message": ""
}
```
Field Description:
- action: Fixed value "naturalLanguageNegotiation"
- type: Message type, used to identify the type of message, values are REQUEST or RESPONSE.
- messageId: Message ID, a 16-character random string used to identify the message. When the other party replies, the same messageId needs to be carried.
- message: Natural language content, a piece of natural language text. The agent can carry its own special requirements regarding protocol negotiation, communication, etc., in the message.

### Application Protocol Message Definition

When the protocol type (PT) is 01, the Protocol Data of the message carries the application protocol message, which is used to transmit interaction data between two agents. The format of the message depends on the specific protocol negotiated in the protocol negotiation process. It can be binary data, or structured data such as JSON, XML, etc.

### Natural Language Protocol Message Definition

When the protocol type (PT) is 02, the Protocol Data of the message carries the natural language protocol message, which is used to transmit interaction data between two agents.

In some special cases, agents only perform a small amount, low frequency, or even single interaction. To achieve the highest communication efficiency, the protocol negotiation process can be skipped, and natural language can be used directly for data interaction.

The data in Protocol Data is UTF-8 encoded natural language text. To facilitate AI processing, it is recommended to use markdown format with clear and concise descriptions.

This message is not a mandatory support message, and agents can freely choose whether to support it.

Natural Language Protocol Message Example:

Request Example:
```plaintext
# Requirement
Get product information. Based on the product ID, return detailed information about the product, including product ID, product name, product description, product price, and product currency unit.

# Input
- Product ID: P12345
```

Response Example:
```plaintext
# Output
- Product ID: P12345
- Product Name: High-Performance Laptop
- Product Description: A high-performance laptop equipped with the latest processor and large-capacity memory.
- Product Price: 1299.99
- Product Currency Unit: USD
```
### Verification Protocol Message

When the protocol type (PT) is 03, the Protocol Data of the message carries the verification protocol message, which is used to transmit verification data between two agents. The format of the message depends on the specific protocol negotiated in the protocol negotiation process. The verification protocol message is not actual business data but is used to verify whether the protocol process is normal. The content of the verification protocol message is generally negotiated through the verificationProtocol message during the protocol negotiation process.

This message is not a mandatory support message, and agents can freely choose whether to support it.

## Meta-Protocol Capability Negotiation Mechanism and Extensibility Design

The above protocol negotiation process shows how two agents negotiate a specific protocol. However, due to various reasons in reality, agents may not be able to support all meta-protocol capabilities. For example, some agents do not support natural language protocols, and some agents do not support verification protocols.

To solve this problem, we designed a meta-protocol capability negotiation mechanism for agents to negotiate meta-protocol capabilities before connecting, informing the other party of the meta-protocol capabilities they support to avoid negotiation failure.

This issue and the extensibility of the meta-protocol are essentially the same, so they are discussed together. When we need to upgrade the meta-protocol process, such as expanding the protocol type from one byte to two bytes, a new version of the meta-protocol will be generated, and compatibility issues between the new and old versions need to be considered.

Our solution is to carry the version of the meta-protocol and the supported meta-protocol capabilities in the connection handshake messages, namely the sourceHello and destinationHello messages. If one agent supports version V1 and the other agent supports versions V1 and V2, they will use the V1 version meta-protocol for negotiation.

Regarding the negotiation of meta-protocol capabilities, we require all agents to support basic meta-protocol capabilities, while optional meta-protocol capabilities, such as natural language protocols and verification protocols, can be freely chosen by agents.

The modifications to the sourceHello and destinationHello messages are as follows:

```json
{
  "version": "1.0",
  "type": "sourceHello",  // destinationHello uses the same structure
  "metaProtocol": {
    "version": "1.0",
    "supportedCapabilities": [
        "naturalLanguageProtocol",
        "verificationProtocol",
        "naturalLanguageNegotiation",
        "testCasesNegotiation",
        "fixErrorNegotiation"
    ]
  },
  // Other fields omitted
}
```

Field Description:
- version: Meta-protocol version, the current version is 1.0
- supportedCapabilities: Supported meta-protocol capabilities, array type, each element in the array is the name of the supported meta-protocol capability, corresponding to the following functions:
  - naturalLanguageProtocol: Natural Language Protocol
  - verificationProtocol: Verification Protocol
  - naturalLanguageNegotiation: Natural Language Negotiation
  - testCasesNegotiation: Test Cases Negotiation
  - fixErrorNegotiation: Fix Error Negotiation

## Meta-Protocol Negotiation Efficiency Optimization

The meta-protocol negotiation mechanism used by agents can solve the problem of manual costs brought by protocol docking between heterogeneous systems, allowing agents to form a self-organizing and self-negotiating network, but it also brings some new problems.

First, the protocol negotiation process significantly increases communication RTT, and using AI to process natural language also introduces new delays. From protocol negotiation, code generation, test case negotiation (optional), to error fix negotiation (optional), the entire process will add at least 2 RTTs, and if multiple rounds of negotiation occur, the RTT will be even more. Using LLM to process natural language will also generate new delays, the length of which depends on the input and output length, as well as the model processing speed, with a single delay possibly ranging from a few seconds to more than ten seconds.

Secondly, the negotiation process relies on AI's ability to understand requirements, design protocols, and generate protocol processing code. These capabilities place high demands on AI, and due to inherent defects in current AI, such as the hallucination problem of LLM, AI cannot guarantee 100% success in processing, which will reduce the success rate of negotiation.

In the actual business process of users, a function on the network involves many interactions between agents. If the delay and success rate issues cannot be well resolved, it will seriously affect the user experience.

To address these issues, we have designed a 0RTT meta-protocol negotiation mechanism and a consensus-based meta-protocol negotiation mechanism.
### 0RTT Meta-Protocol Negotiation Mechanism

In modern communication protocol design, 0RTT communication mechanisms are generally designed to reduce the RTT of the connection process. For example, in TLS1.3, it generates and caches a session ticket during the initial connection, allowing the client to use the ticket and the previously negotiated key to directly send encrypted 0-RTT data in subsequent connections, thereby achieving fast reconnection and instant data transmission.

The 0RTT meta-protocol negotiation mechanism of ANP involves a complete meta-protocol negotiation process during the first connection between two agents. Both parties cache the negotiated protocol, saving the protocol content and the corresponding hash value of the protocol content. The protocol content uses the candidateProtocols field of the protocolNegotiation message when the agreement is reached.

During the second connection, the negotiation result of the first connection can be directly reused for communication. In the design of the handshake message, the connection initiator can carry the result of the previous negotiation in the sourceHello message, mainly using the protocol hash value. The connection receiver confirms the initiator's protocol in the destinationHello message, and both parties can directly skip the negotiation process and use the previously negotiated protocol for communication.

Example of sourceHello message:

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
  // Other fields omitted
}
```

Example of destinationHello message:

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
  // Other fields omitted
}
```
Field Description:
- usedProtocolHash: The hash value of the final agreed protocol content, used to identify the protocol in use. During the second connection, it is used to skip the negotiation process and directly use the protocol for communication. If the receiver does not support this protocol, the usedProtocolHash field is removed in the destinationHello message, indicating that protocol negotiation needs to be redone.

The hash value of the protocol content is generated using the SHA-256 algorithm, resulting in a 64-character hexadecimal string. Example code for generating usedProtocolHash:

```python
import hashlib

candidateProtocols = "..."  # Obtained from the candidateProtocols field in the protocolNegotiation message when the agreement is reached

def generate_protocol_hash(protocol_content):
    return hashlib.sha256(protocol_content.encode('utf-8')).hexdigest()

usedProtocolHash = generate_protocol_hash(candidateProtocols)
```
### Meta-Protocol Negotiation Mechanism Based on Consensus Protocol

Using the 0RTT meta-protocol negotiation mechanism can reduce RTT, but the first connection still requires negotiation. During the negotiation process, AI is still needed to process natural language, which still has issues with time consumption and success rate. In the agent network, there are many communication behaviors with the same or similar needs and functions. If agents can reuse protocols and protocol codes that have already been negotiated by other agents, communication efficiency can be greatly improved.

To this end, we have designed a meta-protocol negotiation mechanism based on consensus protocols.

Consensus protocols are divided into two categories:
- Industry standard protocols formulated by humans: Protocols formulated by industry organizations or standardization bodies, such as protocols formulated by organizations like W3C, IETF, etc.
- Consensus protocols reached by the agent network: Protocols jointly negotiated and elected by agents within the agent network.

We can generate a unique identifier URI for each version of all consensus protocols, and generate corresponding protocol handling code for this version of the protocol. When agents negotiate protocols, they can select one or more consensus protocols as candidate protocols based on their needs and directly initiate a connection request to the other party. The other party selects a protocol it supports and returns it. Then both parties can use this protocol and the corresponding protocol code for communication.

Furthermore, agents can publish the consensus protocols they support in an online document. Other agents can view this online document and negotiate communication protocols with the target agent based on the protocols listed in the document. This further accelerates the protocol negotiation process.

How agents download protocols and corresponding codes based on the URI will be discussed in other specifications.

Example of sourceHello message:

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
  // Other fields omitted
}
```

Example of destinationHello message:

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
  // Other fields omitted
}
```

Field Description:
- selectedProtocol: The protocol selected from candidateProtocols, used to identify the protocol used by both parties.
#### Reaching Consensus Protocols in Agent Networks

How agent networks reach consensus protocols and publish these protocols to the network will be discussed in other specifications.

## Future

This specification mainly discusses the design of the meta-protocol and the design of the meta-protocol negotiation mechanism. We have designed a more flexible and cost-effective agent protocol negotiation specification. Using this specification, agents can autonomously complete negotiation, code generation, debugging, and communication without human intervention, laying a solid foundation for self-organizing and self-negotiating agent networks.

At the same time, we believe that with the support of the meta-protocol, numerous communication protocols achieving consensus among agents will emerge on the agent network, far exceeding the number of protocols formulated by humans.

However, how to design a reasonable protocol election consensus algorithm, how to incentivize agents to report their negotiated consensus protocols, and how to enable agents to easily obtain consensus protocols negotiated by other agents still require further discussion.

## Challenges

If AI cannot effectively integrate protocol code with application business logic and data processing code, and instead only uses protocols to process formats, the role played by the meta-protocol will be much smaller.

## Copyright Notice
Copyright (c) 2024 GaoWei Chang  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
