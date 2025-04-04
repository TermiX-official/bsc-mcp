import { type Hex } from "viem";
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { Native, ERC20Token } from "@pancakeswap/sdk";
import { hashPassword } from "./PrivateAES.js";

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

export async function getPassword(isRetry?: boolean): Promise<InputResult> {

  const passwordResp = await showInputBoxWithTerms(isRetry);
  if (!passwordResp.value) {
      throw new Error("You did not enter a password.");
  }
  if (passwordResp.value.length != 6) {
      throw new Error("The password must be 6 characters long");
  }
  const password = passwordResp.value;
  const curPassword = process.env.WALLET_PASSWORD
  if (!curPassword) {
      throw new Error("WALLET_PASSWORD is not defined");
  }
  
  const passwordEncrypt = hashPassword(password)
  if (passwordEncrypt != curPassword) {
    return await getPassword(true);
  }
  return passwordResp;
}

export function showInputBoxWithTerms(isRetry?: boolean): Promise<InputResult> {

  let message = "Enter your Wallet Password:";
  if (isRetry) {
    message = "Wrong password, please try again:";
  }
  return new Promise((resolve, reject) => {

    switch (platform) {
      case 'darwin':
        // For macOS, we use AppleScript to show a dialog with both input and checkbox
        // The AppleScript is more complex but allows for a better UX
        if (isRetry) {
          message = "❌" + message
        }
        const appleScript = `
        tell application "System Events"
        set userPassword to ""
        set buttonPressed to ""
        
        repeat
            try
                set userInput to display dialog "${message}" default answer "" with hidden answer buttons {"cancel", "confirm"} default button "confirm" with icon note
                set userPassword to text returned of userInput
                set buttonPressed to button returned of userInput
                
                if buttonPressed is "cancel" then
                    exit repeat
                end if
                
                if length of userPassword is 6 then
                    exit repeat
                end if
                
                display dialog "Password must be exactly 6 characters." buttons {"confirm"} default button "confirm" with icon caution
            on error
                -- Handle any errors (like when user clicks the red close button)
                exit repeat
            end try
        end repeat
        
        if buttonPressed is not "cancel" then
            set agreeToTerms to button returned of (display dialog "🔒 You will stay signed in for the next hour." buttons {"no", "yes"} default button "no" with icon caution)
            return userPassword & "============" & agreeToTerms
        else
            return "canceled"
        end if
    end tell
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

          if (stdout.trim() === "canceled") {
              reject(new Error("Please enter the password before using ❕"));
              return;
          }
          const [password, agree] = stdout.trim().split("============");
          resolve({
            value: password,
            agreed: agree === "yes"
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
        $label.Text = '${message}'
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
        $checkbox.Text = 'You will stay signed in for the next hour.'
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
        reject(new Error(`Unsupported platform and command-line input is not available: ${platform}`));
    }
  });
}
