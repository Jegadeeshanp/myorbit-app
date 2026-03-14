/**
 * AES-256-GCM field-level encryption for sensitive financial data.
 * Key comes from ENCRYPTION_KEY env var (64 hex chars = 32 bytes).
 */

const ALG = 'AES-GCM';
const KEY_LEN = 256;
const IV_LEN = 12; // 96-bit IV recommended for GCM

function getKeyMaterial(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be set and be exactly 64 hex characters (32 bytes).');
  }
  return key;
}

async function importKey(): Promise<CryptoKey> {
  const hex = getKeyMaterial();
  const bytes = new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.importKey('raw', bytes, { name: ALG, length: KEY_LEN }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALG, iv }, key, encoded);
  // Format: hex(iv):base64(ciphertext)
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const ctB64 = Buffer.from(ciphertext).toString('base64');
  return `${ivHex}:${ctB64}`;
}

export async function decrypt(encoded: string): Promise<string> {
  const key = await importKey();
  const [ivHex, ctB64] = encoded.split(':');
  if (!ivHex || !ctB64) throw new Error('Invalid encrypted format');
  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const ciphertext = Buffer.from(ctB64, 'base64');
  const plaintext = await crypto.subtle.decrypt({ name: ALG, iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

/** Encrypt a number (stored as string in DB) */
export async function encryptNumber(n: number): Promise<string> {
  return encrypt(String(n));
}

/** Decrypt back to number */
export async function decryptNumber(encoded: string): Promise<number> {
  const s = await decrypt(encoded);
  return parseFloat(s);
}
