import prompts, { PromptObject } from 'prompts';
import figlet from 'figlet';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';
import { encrypt, hashPassword } from './PrivateAES.js';

import dotenv from "dotenv";
dotenv.config();

// Binance Gold Color
const yellow = chalk.hex('#F0B90B');

// ESModule __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cancel handler
const onCancel = () => {
    console.log(chalk.red('\n❌ Configuration cancelled by user (Ctrl+C or ESC). Exiting...'));
    process.exit(0);
};

// Show Banner
const showBanner = () => {
    const banner = figlet.textSync('BNB Chain MCP ', { font: 'Big' });
    console.log(yellow(banner));
    console.log(yellow('🚀 Welcome to the BNB Chain MCP Configurator\n'));
};

// User Input Types
interface UserInputs {
    moralis?: string;
    walletPassword: string;
    privateKey: string;
    rpcUrl?: string;
}

// Ask for credentials
const getInputs = async (): Promise<UserInputs> => {
    const questions: PromptObject[] = [
        {
            type: 'password',
            name: 'walletPassword',
            message: '🔐 Enter your Wallet Password (must be exactly 6 characters):',
            validate: (val: string) => {
                if (val.trim() === '') return 'Wallet Password is required!';
                if (val.length !== 6) return 'Wallet Password must be exactly 6 characters!';
                return true;
            },
        },
        {
            type: 'password',
            name: 'privateKey',
            message: '🔑 Enter your BNB Chain Wallet Private Key:',
            validate: (val: string) =>
                val.trim() === '' ? 'Private key is required!' : true,
        },
        {
            type: 'text',
            name: 'rpcUrl',
            message: '🌐 Enter your BNB Chain RPC URL (optional):',
        },
    ];

    return await prompts(questions, { onCancel }) as UserInputs;
};

// Generate .env file
const generateEnvFile = async (privateKey: string, walletPasswordEncrypt: string, rpcUrl?: string, moralis?: string): Promise<void> => {
    const envContent = `BSC_WALLET_PRIVATE_KEY=${privateKey}
BSC_RPC_URL=${rpcUrl || ''}
WALLET_PASSWORD=${walletPasswordEncrypt || ''}
`.trim();

    await fs.writeFile('.env', envContent);
    console.log(yellow('✅ .env file generated.'));
};

// Generate config object
const generateConfig = async (privateKey: string, walletPasswordEncrypt: string, rpcUrl?: string, moralis?: string): Promise<any> => {
    const indexPath = path.resolve(__dirname, '..', 'build', 'index.js'); // one level up from cli/

    return {
        'bsc-mcp': {
            command: 'node',
            args: [indexPath],
            env: {
                BSC_WALLET_PRIVATE_KEY: privateKey,
                BSC_RPC_URL: rpcUrl || '',
                WALLET_PASSWORD: walletPasswordEncrypt || '',
            },
            disabled: false,
            autoApprove: []
        }
    };
};

// Configure Claude Desktop
const configureClaude = async (config: object): Promise<boolean> => {
    const userHome = os.homedir();
    let claudePath;
    const platform = os.platform();
    if (platform == "darwin") {
        claudePath = path.join(userHome, 'Library/Application Support/Claude/claude_desktop_config.json');
    } else if (platform == "win32") {
        claudePath = path.join(userHome, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
    } else {
        console.log(chalk.red('❌ Unsupported platform.'));
        return false;
    }
    
    if (!fs.existsSync(claudePath)) {
        console.log(chalk.yellow('⚠️ Claude config file not found. Creating a new one with default configuration.'));
        // Create a default configuration object
        const defaultConfig = {
            mcpServers: {}
        };
        // Write the default configuration to the file
        await fs.writeJSON(claudePath, defaultConfig, { spaces: 2 });
    }

    
    const jsonData = fs.readFileSync(claudePath, 'utf8');
    const data = JSON.parse(jsonData);
    
    data.mcpServers = {
        ...data.mcpServers,
        ...config,
    };
    
    await fs.writeJSON(claudePath, data, { spaces: 2 });
    console.log(yellow('✅ BNB Chain MCP configured for Claude Desktop. Please RESTART your Claude to enjoy it 🎉'));
    return true;
};

// Save fallback config file
const saveFallbackConfig = async (config: object): Promise<void> => {
    await fs.writeJSON('config.json', config, { spaces: 2 });
    console.log(yellow('📁 Saved config.json in root project folder.'));
};

// Main logic
const init = async () => {
    showBanner();

    const { moralis, privateKey, rpcUrl, walletPassword } = await getInputs();

    const privateKeyEncrypt = encrypt(privateKey, walletPassword);
    const walletPasswordEncrypt = hashPassword(walletPassword)

    await generateEnvFile(privateKeyEncrypt, walletPasswordEncrypt, rpcUrl, moralis);

    const config = await generateConfig(privateKeyEncrypt, walletPasswordEncrypt, rpcUrl, moralis);

    const { setupClaude } = await prompts({
        type: 'confirm',
        name: 'setupClaude',
        message: '🧠 Do you want to configure in Claude Desktop?',
        initial: true
    }, { onCancel });

    if (setupClaude) {
        const success = await configureClaude(config);
        if (!success) {
            await saveFallbackConfig(config);
        }
    } else {
        await saveFallbackConfig(config);
    }
};

init(); 