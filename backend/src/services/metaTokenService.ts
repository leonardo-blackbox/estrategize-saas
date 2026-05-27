/**
 * metaTokenService — encrypt/decrypt de access tokens Meta
 *
 * Estratégia: AES-256-GCM no Node usando crypto builtin.
 * Tokens armazenados como bytea opaco (iv || tag || ciphertext concatenados).
 * Key vem de META_TOKEN_ENCRYPTION_KEY (env, hex 64 chars = 32 bytes).
 *
 * Decrypt SÓ no backend. NUNCA logar o resultado de decryptToken().
 */
import crypto from 'crypto';
import { logger } from '../lib/logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env['META_TOKEN_ENCRYPTION_KEY'];
  if (!hex) {
    throw new Error('META_TOKEN_ENCRYPTION_KEY is not configured');
  }
  if (hex.length !== 64) {
    throw new Error(
      `META_TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Got ${hex.length}. ` +
        'Generate with: openssl rand -hex 32',
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encripta token via AES-256-GCM.
 * Output: Buffer com [iv (12 bytes) | tag (16 bytes) | ciphertext (n bytes)]
 */
export function encryptToken(token: string): Buffer {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

/**
 * Decripta token. NUNCA logar o output.
 */
export function decryptToken(encrypted: Buffer): string {
  const key = getKey();
  if (encrypted.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Encrypted buffer too short');
  }
  const iv = encrypted.subarray(0, IV_LENGTH);
  const tag = encrypted.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = encrypted.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  try {
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch (err) {
    logger.error('decryptToken failed', { err: (err as Error).message });
    throw new Error('Failed to decrypt token — key mismatch or corrupted data');
  }
}

/**
 * Mascara token para logs (mostra apenas primeiros e últimos 4 chars).
 */
export function maskToken(token: string): string {
  if (token.length < 12) return '***';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/**
 * Round-trip self-test (chamar no startup em dev).
 */
export function selfTestEncryption(): void {
  if (process.env['NODE_ENV'] === 'production') return;
  try {
    const sample = 'test-token-' + Date.now();
    const encrypted = encryptToken(sample);
    const decrypted = decryptToken(encrypted);
    if (decrypted !== sample) {
      throw new Error('Round-trip mismatch');
    }
    logger.info('[metaTokenService] AES-256-GCM round-trip OK');
  } catch (err) {
    logger.warn('[metaTokenService] Self-test skipped:', (err as Error).message);
  }
}
