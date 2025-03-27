
## 📦 BNBChain MCP – Binance Smart Chain Tool Server (CLI Configurable)

> **A plug-and-play CLI server for executing transactions, interacting with smart contracts, and deploying tokens on the Binance Smart Chain (BSC) using the Model Context Protocol (MCP).**

---

### 🚀 Features

- ⚡ One-line CLI initialization (`npm run init`)
- 🔐 Secure `.env` generation with private key management
- 🪙 Supports native BNB and BEP-20 token transfers
- 🧠 Claude Desktop & MCP compatible
- 🔄 PancakeSwap integration for token swapping
- 🔥 Launch meme tokens or BEP-20 tokens in seconds

---

### 📦 Installation

```bash
npm install -g bnbchain-mcp
# or if using locally:
git clone https://github.com/TermiX-official/bsc-mcp.git
cd bsc-mcp
npm install
```

---

### ⚙️ Configuration (via CLI)

Run the setup wizard:

```bash
npm run init
# or
yarn init
```

This will prompt you to input:

1. **Moralis API Key** *(optional)* – used to fetch wallet balances  
2. **Wallet Private Key** *(required)* – your BSC wallet private key  
3. **BSC RPC URL** *(optional)* – defaults to:
   ```
   https://bsc-dataseed.binance.org
   ```

✅ Automatically generates `.env` and `config.json`  
✅ Optionally integrates into **Claude Desktop**

---

### 🔑 Getting Your Moralis API Key

Visit: [https://docs.moralis.com/2.0/web3-data-api/evm/get-your-api-key](https://docs.moralis.com/2.0/web3-data-api/evm/get-your-api-key)

Steps:
1. Sign up at [https://moralis.io](https://moralis.io)
2. Go to the Web3 Data → API Keys section
3. Copy your EVM-compatible API key and paste it during CLI setup

---

### 🧠 Claude Desktop Integration

After CLI setup, the tool can auto-integrate into Claude Desktop by modifying:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

📍 On success, you'll see:

```
✅ BSC MCP configured for Claude Desktop.
```

---

### 🧪 Running the MCP Server

After setup, start the server manually if needed:

```bash
npm start
# or
node build/index.js
```

---

### 🔨 Supported Tools

- `transferNativeToken` – Send BNB
- `transferBEP20Token` – Send BEP-20 tokens
- `pancakeSwap` – Swap tokens via PancakeSwap
- `createFourMeme` – Launch meme tokens on Four.Meme
- `createBEP20Token` – Deploy a custom BEP-20 token
- `getBalance` – Get token and native balances
- `callContractFunction` – Interact with smart contracts

---

### 📁 Example `.env` (auto-generated)

```env
WALLET_PRIVATE_KEY=0xYourPrivateKeyHere
BSC_RPC_URL=https://bsc-dataseed.binance.org
MORALIS_API_KEY=YourMoralisApiKey
```

---

### 📘 MCP Protocol Compatibility

This CLI server follows the **Model Context Protocol (MCP)** standard, enabling it to:

- Work with Claude Desktop
- Be used in tool-calling agents (OpenAI, LangChain, etc.)
- Support structured tool definitions with predictable inputs/outputs

---

### 🛡️ Security Notes

- Your private key is stored in `.env` – never share it
- Use trusted RPC endpoints
- Consider rotating your keys frequently if using hot wallets

---

### 📄 License

MIT License — Free for personal or commercial use.

