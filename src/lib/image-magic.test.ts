import { describe, it, expect } from "vitest";
import { detectImageType, stripJpegMetadata, stripPngMetadata } from "./image-magic";

function pngChunk(type: string, data: number[]): number[] {
  const len = [(data.length >>> 24) & 0xff, (data.length >>> 16) & 0xff, (data.length >>> 8) & 0xff, data.length & 0xff];
  const name = Array.from(type, (c) => c.charCodeAt(0));
  return [...len, ...name, ...data, 0, 0, 0, 0];
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function makePng(withExif: boolean): Uint8Array {
  const ihdr = [0, 0, 0, 1, 0, 0, 0, 1, 8, 0, 0, 0, 0];
  const chunks: number[] = [...PNG_SIG, ...pngChunk("IHDR", ihdr)];
  if (withExif) {
    chunks.push(...pngChunk("tEXt", [...Array.from("Comment", (c) => c.charCodeAt(0)), 0, ...Array.from("secret-gps", (c) => c.charCodeAt(0))]));
  }
  chunks.push(...pngChunk("IEND", []));
  return new Uint8Array(chunks);
}

function makeJpeg(withApp1: boolean): Uint8Array {
  const out: number[] = [0xff, 0xd8];
  if (withApp1) {
    const exif = [...Array.from("Exif\0\0", (c) => c.charCodeAt(0)), 0, 1, 2, 3];
    out.push(0xff, 0xe1, (exif.length + 2) >> 8, (exif.length + 2) & 0xff, ...exif);
  }
  out.push(0xff, 0xc0, 0, 11, 8, 0, 8, 0, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1);
  out.push(0xff, 0xda, 0, 3, 1, 0, 0x3f, 0x00, 0x01, 0x02, 0xff, 0xd9);
  return new Uint8Array(out);
}

describe("detectImageType", () => {
  it("detects PNG, JPEG, GIF, WebP, BMP via magic bytes", () => {
    expect(detectImageType(makePng(false))?.mime).toBe("image/png");
    expect(detectImageType(makeJpeg(true))?.mime).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]))?.mime).toBe("image/gif");
    expect(detectImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))?.mime).toBe("image/webp");
    expect(detectImageType(new Uint8Array([0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))?.mime).toBe("image/bmp");
  });

  it("rejects non-images and short buffers", () => {
    expect(detectImageType(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("hello world, this is not an image."))).toBeNull();
  });
});

describe("stripPngMetadata", () => {
  it("removes tEXt chunks while keeping the signature", () => {
    const out = stripPngMetadata(makePng(true));
    const s = new TextDecoder().decode(out);
    expect(s).not.toContain("secret-gps");
    expect(out[0]).toBe(0x89);
    expect(out[1]).toBe(0x50);
    expect(out[2]).toBe(0x4e);
    expect(out[3]).toBe(0x47);
    expect(out.length).toBeLessThan(makePng(true).length);
  });
});

describe("stripJpegMetadata", () => {
  it("removes the Exif APP1 segment", () => {
    const out = stripJpegMetadata(makeJpeg(true));
    const s = new TextDecoder().decode(out);
    expect(s).not.toContain("Exif");
    expect(out[0]).toBe(0xff);
    expect(out[1]).toBe(0xd8);
  });
});