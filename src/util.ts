import { type Hex } from "viem";
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { Native, ERC20Token } from "@pancakeswap/sdk";

/**
 * Cache for PancakeSwap token list data
 */
const pancakeswapTokensCache: {
  tokens: any[];
  lastFetchTime: number;
} = {
  tokens: [],
  lastFetchTime: 0,
};
const platform = os.platform();

/**
 * Fetch tokens from PancakeSwap token list
 * @returns Array of token data
 */
export async function fetchPancakeswapTokens() {
  const now = Math.floor(Date.now() / 1000);
  if (
    pancakeswapTokensCache.lastFetchTime > now - 300 &&
    pancakeswapTokensCache.tokens.length > 0
  ) {
    return pancakeswapTokensCache.tokens;
  }

  try {
    const response = await fetch(
      "https://tokens.pancakeswap.finance/pancakeswap-extended.json"
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch token list: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data || !data.tokens || !Array.isArray(data.tokens)) {
      throw new Error("Invalid token list format");
    }

    pancakeswapTokensCache.tokens = data.tokens;
    pancakeswapTokensCache.lastFetchTime = now;
    return data.tokens;
  } catch (error) {
    console.error("Error fetching PancakeSwap tokens:", error);
    return [];
  }
}

/**
 * Resolve a token input into a currency object.
 * If the token string is "BNB" (native) or a valid address, it is handled directly.
 * Otherwise it is treated as a token symbol or name and looked up from the PancakeSwap token list.
 * @param token - The token input (address, symbol or name)
 * @param defaultChainId - The default chain id to use (e.g. 56 for BSC)
 */
export async function resolveCurrency(
  token: string,
  defaultChainId: number
): Promise<{ currency: any; chainId: number }> {
  if (token.toUpperCase() === "BNB") {
    return {
      currency: Native.onChain(defaultChainId),
      chainId: defaultChainId,
    };
  }
  // If token looks like an address (starts with "0x" and is 42 characters long)
  if (token.startsWith("0x") && token.length === 42) {
    return {
      currency: new ERC20Token(defaultChainId, token as Hex, 18, ""),
      chainId: defaultChainId,
    };
  }
  // Otherwise, assume token is a name or symbol.
  const tokens = await fetchPancakeswapTokens();
  const tokenData = tokens.find(
    (t: any) =>
      t.symbol.toLowerCase() === token.toLowerCase() ||
      t.name.toLowerCase() === token.toLowerCase()
  );
  if (!tokenData) {
    throw new Error(`Token ${token} not found in PancakeSwap token list`);
  }
  return {
    currency: new ERC20Token(
      tokenData.chainId,
      tokenData.address as Hex,
      tokenData.decimals,
      tokenData.symbol
    ),
    chainId: tokenData.chainId,
  };
}


export function bigIntReplacer(key: string, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export interface InputBoxOptions {
  title?: string;
  message?: string;
  defaultValue?: string;
  termsText?: string;
}

export interface InputResult {
  value: string | null;
  agreed: boolean;
}



export function showInputBoxWithTerms(): Promise<InputResult> {
  const title = "wallet password";
  const message = "Please enter your wallet password to complete the operation.";
  const termsText = 'No password required within 1 hour.';

  return new Promise((resolve, reject) => {

    switch (platform) {
      case 'linux':
        // For Linux, we use zenity with two separate dialogs
        // First show the input box
        exec(`zenity --entry --title="${title}" --text="${message}" `, (error, stdout, stderr) => {
          if (error) {
            // User cancelled
            if (error.code === 1 || error.code === 255) {
              resolve({ value: null, agreed: false });
            } else {
              reject(error);
            }
            return;
          }

          const inputValue = stdout.trim();

          // Then show the checkbox
          exec(`zenity --question --title="${title}" --text="${termsText}" --ok-label="同意" --cancel-label="不同意"`, (error2, stdout2, stderr2) => {
            // Exit code 0 means agreed, exit code 1 means not agreed
            resolve({
              value: inputValue,
              agreed: error2 ? false : true
            });
          });
        });
        break;

      case 'darwin':
        // For macOS, we use AppleScript to show a dialog with both input and checkbox
        // The AppleScript is more complex but allows for a better UX
        const appleScript = `
          set theResponse to display dialog "${message}" with title "${title}" with icon note buttons {"cancel", "confirm"} default button "confirm"
          set theText to text returned of theResponse
          set agreedToTerms to display dialog "${termsText}" buttons {"不同意", "同意"} default button "同意" with title "${title}"
          set buttonPressed to button returned of agreedToTerms
          return theText & "||" & buttonPressed
        `;

        exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
          if (error) {
            // User cancelled
            if (error.code === 1 || error.code === 255) {
              resolve({ value: null, agreed: false });
            } else {
              reject(error);
            }
            return;
          }

          const parts = stdout.trim().split('||');
          resolve({
            value: parts[0],
            agreed: parts.length > 1 && parts[1] === '同意'
          });
        });
        break;


      case 'win32':

        const winCommand = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        
        $form = New-Object System.Windows.Forms.Form
        $form.Text = 'wallet password'
        $form.Size = New-Object System.Drawing.Size(450,300)
        $form.StartPosition = 'CenterScreen'
        
        $label = New-Object System.Windows.Forms.Label
        $label.Location = New-Object System.Drawing.Point(10,20)
        $label.Size = New-Object System.Drawing.Size(380,40)
        $label.Text = 'Please enter your wallet password to complete the operation.'
        $form.Controls.Add($label)
        
        # User input label
        $userLabel = New-Object System.Windows.Forms.Label
        $userLabel.Location = New-Object System.Drawing.Point(10,70)
        $userLabel.Size = New-Object System.Drawing.Size(150,20)
        $userLabel.Text = 'Input Password:'
        $form.Controls.Add($userLabel)
        
        # User input textbox
        $passwordTextBox = New-Object System.Windows.Forms.TextBox
        $passwordTextBox.Location = New-Object System.Drawing.Point(160,70)
        $passwordTextBox.Size = New-Object System.Drawing.Size(250,20)
        $passwordTextBox.PasswordChar = '*' 
        $form.Controls.Add($passwordTextBox)
        
        # Error message label
        $errorLabel = New-Object System.Windows.Forms.Label
        $errorLabel.Location = New-Object System.Drawing.Point(160,95)
        $errorLabel.Size = New-Object System.Drawing.Size(250,20)
        $errorLabel.ForeColor = [System.Drawing.Color]::Red
        $errorLabel.Text = ''
        $form.Controls.Add($errorLabel)
        
        $checkbox = New-Object System.Windows.Forms.CheckBox
        $checkbox.Location = New-Object System.Drawing.Point(10,130)
        $checkbox.Size = New-Object System.Drawing.Size(350,20)
        $checkbox.Text = 'No password required within 1 hour.'
        $form.Controls.Add($checkbox)
        
        $button = New-Object System.Windows.Forms.Button
        $button.Location = New-Object System.Drawing.Point(175,190)
        $button.Size = New-Object System.Drawing.Size(100,30)
        $button.Text = 'Confirm'
        $button.Add_Click({
            # Validate password length
            if ($passwordTextBox.Text.Length -ne 6) {
                $errorLabel.Text = 'Password must be exactly 6 characters.'
            } else {
                $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
                $form.Close()
            }
        })
        $form.Controls.Add($button)
        
        $form.AcceptButton = $button
        $form.Add_Shown({$form.Activate()})
        [void]$form.ShowDialog()
        
        if ($form.DialogResult -eq [System.Windows.Forms.DialogResult]::OK) {
            $result = @{
              agreed = $checkbox.Checked
              value = $passwordTextBox.Text
            }
        
            $jsonResult = ConvertTo-Json -InputObject $result
            Write-Output $jsonResult
        }
        exit 0
`

        const tempScriptPath = path.join('.', 'terms_form.ps1');
        fs.writeFileSync(tempScriptPath, winCommand);

        exec(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, (error, stdout, stderr) => {
          fs.unlinkSync(tempScriptPath);

          if (error && error.code !== 1) {
            resolve({
              value: null,
              agreed: false
            });
            return;
          }
          if (!stdout) {
              reject(new Error("Please enter the password before using ❕"));
              return;
          }
          const stdoutJSON = JSON.parse(stdout);
          resolve({
            value: stdoutJSON.value as string,
            agreed: stdoutJSON.agreed as boolean
          });
        });
        break;
      default:
        // Fallback to command line input
        try {
          const prompt = require('prompt-sync')({ sigint: true });
          const input = prompt(`${message} `);
          const agreePrompt = prompt(`${termsText} (y/n)? `);
          resolve({
            value: input,
            agreed: agreePrompt.toLowerCase() === 'y' || agreePrompt.toLowerCase() === 'yes'
          });
        } catch (e) {
          reject(new Error(`Unsupported platform and command-line input is not available: ${platform}`));
        }
    }
  });
}
