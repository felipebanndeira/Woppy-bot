import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "c3ab89f71b3e944d567123456789abcdef0123456789abcdef0123456789abcdef";
  // Si la clave es hex de 64 caracteres, la convertimos a Buffer de 32 bytes
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }
  // De lo contrario generamos hash sha256 de 32 bytes
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Cifra un texto en plano usando AES-256-GCM.
 * Devuelve el formato IV:TAG:ENCRYPTED_DATA en base64.
 */
export function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Descifra un texto cifrado en formato IV:TAG:ENCRYPTED_DATA.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      // Si no tiene el formato esperado, retornamos tal cual (fallback defensivo)
      return encryptedText;
    }

    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(dataB64, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Error al descifrar secreto:", error);
    return "";
  }
}

/**
 * Enmascara un token para mostrar solo los primeros y últimos caracteres en el panel.
 */
export function maskToken(token: string | null | undefined): string {
  if (!token) return "No configurado";
  if (token.length <= 8) return "••••••••";
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}
