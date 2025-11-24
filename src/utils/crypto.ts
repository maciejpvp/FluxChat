import { abToBase64, base64ToAb } from "./common";

const CIPHER_ALGO = "AES-GCM";
const KEY_EXCHANGE_ALGO = "ECDH";
const CURVE_NAME = "P-256";

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: KEY_EXCHANGE_ALGO,
      namedCurve: CURVE_NAME,
    },
    true, // extractable
    ["deriveKey"],
  );
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: KEY_EXCHANGE_ALGO,
      namedCurve: CURVE_NAME,
    },
    true,
    [],
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return window.crypto.subtle.exportKey("jwk", key);
}

export async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    {
      name: KEY_EXCHANGE_ALGO,
      public: publicKey,
    },
    privateKey,
    {
      name: CIPHER_ALGO,
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptMessage(
  msg: string,
  key: CryptoKey,
): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(msg);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: CIPHER_ALGO, iv },
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
    { name: CIPHER_ALGO, iv },
    key,
    data,
  );

  return new TextDecoder().decode(decrypted);
}
