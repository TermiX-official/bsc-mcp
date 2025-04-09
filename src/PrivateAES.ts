import * as crypto from 'crypto';

const algorithm = 'aes-256-gcm';

export function encrypt(text: string, secretKey: string): string {
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

export function decrypt(encrypted: string, secretKey: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':') as [string, string, string];
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}