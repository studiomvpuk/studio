import { randomUUID } from "crypto";
import { r2Configured, r2Put } from "./r2";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "image/gif": "gif",
};

export type Uploaded = { key: string; mime: string };
export type UploadError = { error: string; status: number };

export function isUploadError(x: Uploaded | UploadError | null): x is UploadError {
  return !!x && "error" in x;
}

/** Validate a base64 data-URL image and upload it to R2. Returns null when no image given. */
export async function uploadImage(dataUrl: unknown): Promise<Uploaded | UploadError | null> {
  if (!dataUrl) return null;
  if (!r2Configured) return { error: "Image uploads aren't set up yet.", status: 503 };

  const m = /^data:([^;]+);base64,(.+)$/s.exec(String(dataUrl));
  if (!m) return { error: "Unsupported image format.", status: 400 };
  const mime = m[1].toLowerCase();
  if (!EXT[mime]) return { error: "Only PNG, JPG, WEBP or GIF images are allowed.", status: 400 };

  const buf = Buffer.from(m[2], "base64");
  if (!buf.length) return { error: "That image was empty.", status: 400 };
  if (buf.length > MAX_BYTES) return { error: "Image is too large (max 8MB).", status: 400 };

  const key = `tasks/${randomUUID()}.${EXT[mime]}`;
  await r2Put(key, buf, mime);
  return { key, mime };
}
