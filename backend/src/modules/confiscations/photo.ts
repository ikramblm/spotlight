import sharp from "sharp";
import { AppError } from "../../lib/AppError";

/**
 * Validates and re-encodes an uploaded confiscation photo (spec §21 "secure file uploads"):
 * - `sharp` decoding the buffer IS the magic-byte check - it inspects real file signatures,
 *   not the extension/content-type the client claims, so a renamed non-image is rejected here.
 * - Re-encoding to a fresh JPEG strips all embedded metadata (EXIF, including any GPS tag a
 *   phone camera would have written), rather than storing whatever the client uploaded verbatim.
 * The upload's raw size is already capped by multer (see routes.ts) before this ever runs.
 */
export async function processConfiscationPhoto(raw: Buffer): Promise<Buffer> {
  try {
    return await sharp(raw)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    throw AppError.badRequest("Photo could not be read - please upload a valid image");
  }
}
