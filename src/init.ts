import prompts, { PromptObject } from 'prompts';
import figlet from 'figlet';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';

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
    privateKey: string;
    rpcUrl?: string;
}

// Ask for credentials
const getInputs = async (): Promise<UserInputs> => {
    const questions: PromptObject[] = [
        {
            type: 'password',
            name: 'moralis',
            message: '🔑 Enter Moralis API Key:( Checkout the link for more info : https://docs.moralis.com/web3-data-api/evm/get-your-api-key )',
            validate: (val: string) =>
                val.trim() === '' ? 'Moralis API Key is required!' : true,
        },
        {
            type: 'password',
            name: 'privateKey',
            message: '🔐 Enter your BSC Wallet Private Key:',
            validate: (val: string) =>
                val.trim() === '' ? 'Private key is required!' : true,
        },
        {
            type: 'text',
            name: 'rpcUrl',
            message: '🌐 Enter your BSC RPC URL (optional):',
        },
    ];

    return await prompts(questions, { onCancel }) as UserInputs;
};

// Generate .env file
const generateEnvFile = async (privateKey: string, rpcUrl?: string, moralis?: string): Promise<void> => {
    const envContent = `WALLET_PRIVATE_KEY=${privateKey}
BSC_RPC_URL=${rpcUrl || ''}
MORALIS_API_KEY=${moralis || ''}
`.trim();

    await fs.writeFile('.env', envContent);
    console.log(yellow('✅ .env file generated.'));
};

// Generate config object
const generateConfig = async (privateKey: string, rpcUrl?: string, moralis?: string): Promise<any> => {
    const indexPath = path.resolve(__dirname, '..', 'build', 'index.js'); // one level up from cli/

    return {
        mcpServers: {
            'bsc-mcp': {
                command: 'node',
                args: [indexPath],
                env: {
                    BSC_WALLET_PRIVATE_KEY: privateKey,
                    BSC_RPC_URL: rpcUrl || '',
                    MORALIS_API_KEY: moralis || ''
                },
                disabled: false,
                autoApprove: []
            }
        }
    };
};

// Configure Claude Desktop
const configureClaude = async (config: object): Promise<boolean> => {
    const userHome = os.homedir();
    const claudePath = path.join(userHome, 'Library/Application Support/Claude/claude_desktop_config.json');

    if (!fs.existsSync(claudePath)) {
        console.log(chalk.red('❌ Claude is not installed or config path not found.'));
        return false;
    }

    await fs.writeJSON(claudePath, config, { spaces: 2 });
    console.log(yellow('✅ BNB Chain MCP configured for Claude Desktop.'));
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

    const { moralis, privateKey, rpcUrl } = await getInputs();
    await generateEnvFile(privateKey, rpcUrl, moralis);

    const config = await generateConfig(privateKey, rpcUrl, moralis);

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