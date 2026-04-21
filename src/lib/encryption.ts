// Client-side encryption using Web Crypto API (AES-GCM)
// Messages are encrypted before storage and decrypted only in the browser.

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;

// Generate a deterministic encryption key from two user IDs
// The key is the same regardless of who initiates, since IDs are sorted.
async function deriveKeyMaterial(userId1: string, userId2: string): Promise<CryptoKey> {
  const sorted = [userId1, userId2].sort().join(':');
  const encoder = new TextEncoder();
  const keyData = encoder.encode(sorted);

  // Import the combined ID as raw key material for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive a proper AES-GCM key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('atelier-messaging-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Convert ArrayBuffer to base64 string
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 string to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptMessage(
  plaintext: string,
  userId1: string,
  userId2: string
): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKeyMaterial(userId1, userId2);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
  };
}

export async function decryptMessage(
  ciphertext: string,
  ivString: string,
  userId1: string,
  userId2: string
): Promise<string> {
  try {
    const key = await deriveKeyMaterial(userId1, userId2);
    const iv = base64ToBuffer(ivString);
    const data = base64ToBuffer(ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv: new Uint8Array(iv) },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Encrypted Message]';
  }
}
