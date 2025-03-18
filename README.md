
# BSC MCP Server



https://github.com/user-attachments/assets/b48caf37-2a0f-49c8-86f8-3aadbb986714



[![npm version](https://img.shields.io/npm/v/base-mcp.svg)](https://www.npmjs.com/package/base-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview
BSC MCP Server is a backend service for executing Binance Smart Chain (BSC) transactions, including native BNB transfers and ERC-20 token transfers. It leverages the Model Context Protocol (MCP) framework to facilitate secure and efficient blockchain interactions.

- Retrieve wallet addresses
- List wallet balances
- Transfer funds between wallets
- Call contract functions 
- Manage BEP20 tokens

## Features
- Transfer native BNB tokens to specified addresses.
- Transfer BEP-20 (ERC-20 equivalent) tokens using their contract address or symbol.
- Secure private key management using environment variables.
- Uses Viem for interacting with the BSC blockchain.

## Requirements
Ensure you have the following installed:
- 

Node.js (v16 or later)
- npm or yarn
- A valid BSC wallet private key

## Installation
Clone the repository and install dependencies:
```sh
git clone https://github.com/your-repo/bsc-mcp-server.git
cd bsc-mcp-server
npm install  # or yarn install
```

## Configuration
Create a `.env` file in the root directory and configure the following variables:
```sh
WALLET_PRIVATE_KEY=your_private_key_here
BSC_RPC_URL=https://bsc-dataseed.binance.org  # Optional, use a custom RPC URL if needed
```

## Usage
### Start the Server
Run the following command to start the MCP server:
```sh
npm start  # or node index.js
```

### Transfer BNB
Use the `transferNativeToken` tool with the following parameters:
```json
{
  "recipientAddress": "0xRecipientAddress",
  "amount": "0.1"
}
```

### Transfer BEP-20 Tokens
Use the `transferBEP20Token` tool with the following parameters:
```json
{
  "recipientAddress": "0xRecipientAddress",
  "amount": "10",
  "token": "USDT"
}
```

## Model Context Protocol (MCP)
The Model Context Protocol (MCP) is an open standard that allows applications to provide structured context to AI models and computational agents. MCP helps systems interact more efficiently with various data sources, enabling seamless integration between blockchain transactions and AI-driven automation.

### Benefits of MCP
- **Standardization**: Establishes a unified method for applications to interact with AI models and computational agents.
- **Efficiency**: Reduces overhead by offering a common interface for AI and transactional systems.
- **Interoperability**: Supports cross-platform compatibility, enabling broader application use cases.

## Error Handling
If a transaction fails, the server returns an error message with details. Check the console logs for further debugging.

## License
This project is open-source under the MIT License.

---

