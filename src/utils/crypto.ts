import { abToBase64, base64ToAb } from "./common";

const ALGO_NAME = "AES-GCM";

export async function generateKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    { name: ALGO_NAME, length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return window.crypto.subtle.exportKey("jwk", key);
}

export async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey("jwk", jwk, { name: ALGO_NAME }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptMessage(
  msg: string,
  key: CryptoKey,
): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(msg);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: ALGO_NAME, iv },
    key,
    encoded,
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return abToBase64(combined.buffer);
}

export async function decryptMessage(
  encryptedBase64: string,
  key: CryptoKey,
): Promise<string> {
  const combined = new Uint8Array(base64ToAb(encryptedBase64));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: ALGO_NAME, iv },
    key,
    data,
  );

  return new TextDecoder().decode(decrypted);
}
