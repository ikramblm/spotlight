import sharp from "sharp";
import { AppError } from "../../lib/AppError";
import { processConfiscationPhoto } from "./photo";

describe("processConfiscationPhoto", () => {
  it("re-encodes a valid image to JPEG", async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer();

    const jpeg = await processConfiscationPhoto(png);

    // JPEG magic bytes: FF D8 FF
    expect(jpeg[0]).toBe(0xff);
    expect(jpeg[1]).toBe(0xd8);
    expect(jpeg[2]).toBe(0xff);
  });

  it("downsizes an oversized image to the 1200px width cap", async () => {
    const wide = await sharp({ create: { width: 3000, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer();

    const jpeg = await processConfiscationPhoto(wide);
    const metadata = await sharp(jpeg).metadata();

    expect(metadata.width).toBeLessThanOrEqual(1200);
  });

  it("never upscales a small image past its original size", async () => {
    const small = await sharp({ create: { width: 50, height: 50, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer();

    const jpeg = await processConfiscationPhoto(small);
    const metadata = await sharp(jpeg).metadata();

    expect(metadata.width).toBe(50);
  });

  it("rejects data that isn't a real image (the magic-byte check)", async () => {
    const notAnImage = Buffer.from("this is definitely not image data, just plain text padding it out");
    await expect(processConfiscationPhoto(notAnImage)).rejects.toThrow(AppError);
  });

  it("rejects an empty buffer", async () => {
    await expect(processConfiscationPhoto(Buffer.alloc(0))).rejects.toThrow(AppError);
  });
});
