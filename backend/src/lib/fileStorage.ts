import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk stand-in for real object storage (see OBJECT_STORAGE_* in .env.example) - good
 * enough for development, same key-based interface a real S3-backed implementation would use.
 * Swap this module out, not its callers, when object storage is actually wired up.
 */
const UPLOAD_DIR = path.resolve(__dirname, "../../storage/uploads");

const KEY_PATTERN = /^[a-f0-9]{32}\.[a-z0-9]+$/;

function assertValidKey(key: string): void {
  if (!KEY_PATTERN.test(key)) {
    throw new Error(`Refusing to use a malformed storage key: ${key}`);
  }
}

export function generateKey(extension: string): string {
  return `${crypto.randomBytes(16).toString("hex")}.${extension}`;
}

export async function saveFile(key: string, buffer: Buffer): Promise<void> {
  assertValidKey(key);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, key), buffer);
}

export async function readFile(key: string): Promise<Buffer> {
  assertValidKey(key);
  return fs.readFile(path.join(UPLOAD_DIR, key));
}
