

https://github.com/user-attachments/assets/b3ed768a-6fd9-4b09-bcdd-dd122965f46e

# BSC MCP Server

## Overview

BSC MCP Server is a backend service designed to execute transactions on the Binance Smart Chain (BSC). It facilitates seamless interaction with the blockchain, including sending native BNB and BEP-20 token transfers. The server utilizes the Model Context Protocol (MCP) framework to ensure secure, structured, and efficient transactions.

### Key Functionalities:

- Retrieve and manage wallet addresses
- Fetch and list wallet balances
- Execute native BNB transfers
- Transfer BEP-20 tokens using contract addresses or symbols
- Call and interact with smart contract functions
- Securely manage BEP-20 tokens
- create bsc memecoin
- create bep20 token

## Features

- **Secure Transactions**: Supports both native BNB and BEP-20 token transfers.
- **Private Key Management**: Uses environment variables to protect sensitive data.
- **Smart Contract Interaction**: Supports function calls to BSC smart contracts.
- **Blockchain Integration**: Built on Viem for reliable BSC blockchain interaction.
- **Customizable RPC Support**: Allows configuration of RPC URLs for optimized performance.
- **Standardized MCP Integration**: Enables structured data interaction for AI-driven automation.

## Requirements

Before setting up the BSC MCP Server, ensure you have the following installed:

- Node.js (v16 or later)
- npm or yarn
- A valid Binance Smart Chain (BSC) wallet private key

## Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/your-repo/bsc-mcp-server.git
cd bsc-mcp-server
npm install  # or yarn install
```

## Configuration

To configure the server, create a `.env` file in the root directory and specify the following variables:

```sh
WALLET_PRIVATE_KEY=your_private_key_here
BSC_RPC_URL=https://bsc-dataseed.binance.org
MORALIS_API_KEY=your_moralis_api_key_here  # Optional: Use your Moralis API key if you want to fetch token balances from Moralis 
```

## Integration with Claude Desktop

Before integrating this MCP server with Claude Desktop, ensure you have the following installed:

- Claude Desktop

Then Build the server using the following command:

```sh
npm run build  
```

To add this MCP server to Claude Desktop:

Create or edit the Claude Desktop configuration file at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
    "mcpServers": {
        "bsc-mcp": {
            "command": "node",
            "args": [
                "/Users/Username/Desktop/bsc-mpc/build/index.js"
            ],
            "env": {
                "BSC_WALLET_PRIVATE_KEY": "BSC_WALLET_PRIVATE_KEY",
                "BSC_RPC_URL": "BSC_RPC_URL",
                "MORALIS_API_KEY": "MORALIS_API_KEY"
            },
            "disabled": false,
            "autoApprove": []
        }
    }
}
```
Make sure to pass the correct location of the `index.js` file in the `command` and `args` fields.

Restart Claude Desktop for the changes to take effect.

## Usage ( For Connecting MCP HOST other than Claude )

### Start the Server

To start the MCP server, run:

```sh
npm start  # or node index.js
```



### Transfer BEP-20 Tokens

Use the `transferBEP20Token` tool to send tokens by specifying the contract address or symbol:

```json
{
  "recipientAddress": "0xRecipientAddress",
  "amount": "10",
  "token": "USDT"
}
```

## Functions

1. **Transfer Native Token (BNB) - `transferNativeToken`**
   ```json
   {
       "recipientAddress": "0xRecipientAddress",
       "amount": "0.1"
   }
   ```

2. **Transfer BEP-20 Token by Symbol or Address - `transferBEP20Token`**
   ```json
   {
       "recipientAddress": "0xRecipientAddress",
       "amount": "10",
       "token": "USDT"
   }
   ```

3. **Swap Tokens via PancakeSwap - `pancakeSwap`**
   ```json
   {
       "inputToken": "TOKEN1",
       "outputToken": "TOKEN2",
       "amount": "100"
   }
   ```

4. **Fetch Native and Token Balances - `getBalance`**
   ```json
   {
       "address": "0xWalletAddress"
   }
   ```

5. **Call a Contract Function - `callContractFunction`**
   ```json
   {
       "abi": "contractABI",
       "contractAddress": "0xContractAddress",
       "functionName": "functionName",
       "functionArgs": "arguments",
       "value": "0"
   }
   ```

6. **Create a Meme Token on Four.Meme - `createFourMeme`**
   ```json
   {
       "name": "TokenName",
       "shortName": "TKN",
       "imgUrl": "https://tokenimage.com",
       "preSale": "1000",
       "desc": "Token Description",
       "twitterUrl": "https://twitter.com/token",
       "telegramUrl": "https://t.me/token",
       "webUrl": "https://tokenwebsite.com"
   }
   ```

7. **Create a BEP-20 Token - `createBEP20Token`**
   ```json
   {
       "name": "TokenName",
       "symbol": "TKN",
       "totalSupply": "1000000"
   }
   ```

## Model Context Protocol (MCP)

The **Model Context Protocol (MCP)** is an open standard designed to enhance the way applications interact with AI models and blockchain-based computational systems. MCP establishes structured context that improves the efficiency of automated transactions and decentralized applications.

### Benefits of MCP:

- **Standardization**: Defines a unified approach for application interactions.
- **Efficiency**: Reduces computational overhead and improves transaction speed.
- **Interoperability**: Supports integration across multiple platforms and blockchain ecosystems.

## Error Handling

When a transaction fails, the server returns an error message with details. Check the console logs for more debugging information. Common error scenarios include:

- Insufficient funds in the wallet
- Invalid recipient address
- Network congestion or RPC issues

## Security Considerations

- **Private Key Protection**: Never expose or hardcode your private key. Use environment variables.
- **RPC Provider Selection**: Choose a trusted and reliable BSC RPC provider to prevent network issues.
- **Transaction Limits**: Implement checks to avoid unintended large transfers.

## License

This project is open-source under the MIT License.

For contributions, bug reports, or feature requests, submit an issue on [GitHub](https://github.com/your-repo/bsc-mcp-server).
