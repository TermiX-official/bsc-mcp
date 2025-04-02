import * as crypto from 'crypto';


const algorithm = 'aes-256-cbc';

export function encrypt(text: string, secretKey: string): string {
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encrypted: string, secretKey: string): string {
    const [ivHex, encryptedText] = encrypted.split(':') as [string, string];
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}