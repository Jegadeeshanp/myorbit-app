/**
 * AES-256-GCM field-level encryption.
 * Uses only Web Crypto API — works in Node.js, Edge, and browser.
 * No Buffer dependency.
 */

const ALG = 'AES-GCM';
const KEY_LEN = 256;
const IV_LEN = 12;

function getKeyHex(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be set and be exactly 64 hex characters (32 bytes).');
  }
  return key;
}

async function importKey(): Promise<CryptoKey> {
  const hex = getKeyHex();
  const bytes = new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.importKey('raw', bytes, { name: ALG, length: KEY_LEN }, false, ['encrypt', 'decrypt']);
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALG, iv }, key, encoded);
  return `${toHex(iv)}:${toBase64(ciphertext)}`;
}

export async function decrypt(encoded: string): Promise<string> {
  const key = await importKey();
  const [ivHex, ctB64] = encoded.split(':');
  if (!ivHex || !ctB64) throw new Error('Invalid encrypted format');
  const iv = fromHex(ivHex);
  const ciphertext = fromBase64(ctB64);
  const plaintext = await crypto.subtle.decrypt({ name: ALG, iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

export async function encryptNumber(n: number): Promise<string> {
  return encrypt(String(n));
}

export async function decryptNumber(encoded: string): Promise<number> {
  const s = await decrypt(encoded);
  return parseFloat(s);
}
