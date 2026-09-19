/**
 * Pure image helpers used by the upload pipeline.
 * Kept free of server-only / fs imports so they are unit-testable.
 */

export type DetectedImage = { mime: string; ext: string };

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF = [0x47, 0x49, 0x46, 0x38];
const BMP = [0x42, 0x4d];

export function detectImageType(buffer: Uint8Array): DetectedImage | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }
  if (PNG.every((b, i) => buffer[i] === b)) {
    return { mime: "image/png", ext: ".png" };
  }
  if (GIF.every((b, i) => buffer[i] === b)) {
    return { mime: "image/gif", ext: ".gif" };
  }
  if (BMP.every((b, i) => buffer[i] === b)) {
    return { mime: "image/bmp", ext: ".bmp" };
  }
  if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return { mime: "image/webp", ext: ".webp" };
  }
  const brand = buffer.subarray(4, 12);
  if ((buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) || brand.length) {
    const ascii = (start: number, len: number) =>
      Array.from(buffer.subarray(start, start + len))
        .map((b) => String.fromCharCode(b))
        .join("");
    const type = ascii(4, 4);
    const minor = ascii(8, 4);
    if (type === "ftyp" && (minor === "avif" || minor === "avis" || minor === "av01")) {
      return { mime: "image/avif", ext: ".avif" };
    }
  }
  return null;
}

function toUint8(buffer: Uint8Array): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

/**
 * Strips metadata (EXIF, GPS, XMP, PNG text chunks) from JPEG and PNG
 * buffers. Other formats are returned unchanged. Pure JS — no native deps.
 */
export function stripImageMetadata(input: Uint8Array, mime?: string): Uint8Array {
  const buf = toUint8(input);
  if (mime === "image/jpeg" || isJpeg(buf)) return stripJpegMetadata(buf);
  if (mime === "image/png" || isPng(buf)) return stripPngMetadata(buf);
  return buf;
}

function isJpeg(buf: Uint8Array): boolean {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPng(buf: Uint8Array): boolean {
  return buf.length > 8 && PNG.every((b, i) => buf[i] === b);
}

/**
 * Removes APP1 (Exif) / APP2 (XMP/Flash) segments from a JPEG stream.
 */
export function stripJpegMetadata(buf: Uint8Array): Uint8Array {
  if (!isJpeg(buf)) return buf;
  const out: number[] = [];
  let i = 0;
  while (i < buf.length) {
    if (buf[i] !== 0xff || buf[i + 1] === undefined) {
      out.push(buf[i]);
      i++;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      // Standalone markers: SOI, RSTn, TEM
      out.push(buf[i], buf[i + 1]);
      i += 2;
      continue;
    }
    const len = (buf[i + 2] << 8) | buf[i + 3];
    if (len === 0 || i + 2 + len > buf.length) {
      out.push(buf[i]);
      i++;
      continue;
    }
    if (marker === 0xe1 || marker === 0xe2 || marker === 0xed) {
      // APP1 (Exif), APP2 (XMP/Flashpix), APP13 (IPTC) — drop
      i += 2 + len;
      continue;
    }
    out.push(buf[i], buf[i + 1]);
    for (let k = 2; k < len; k++) out.push(buf[i + k]);
    i += 2 + len;
    if (marker === 0xda) {
      // Start of scan — copy everything after, done.
      for (let k = i; k < buf.length; k++) out.push(buf[k]);
      break;
    }
  }
  return new Uint8Array(out);
}

/**
 * Removes ancillary PNG chunks: tEXt, zTXt, iTXt, eXIf.
 */
export function stripPngMetadata(buf: Uint8Array): Uint8Array {
  if (!isPng(buf)) return buf;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out: Uint8Array[] = [buf.subarray(0, 8)];
  let pos = 8;
  const readAscii = (p: number, len: number) =>
    Array.from(buf.subarray(p, p + len))
      .map((b) => String.fromCharCode(b))
      .join("");
  while (pos + 12 <= buf.length) {
    const length = view.getUint32(pos);
    const type = readAscii(pos + 4, 4);
    const start = pos + 12;
    const end = start + length;
    if (end + 4 > buf.length) break;
    if (type === "tEXt" || type === "zTXt" || type === "iTXt" || type === "eXIf") {
      pos = end + 4;
      continue;
    }
    out.push(buf.subarray(pos, end + 4));
    pos = end + 4;
  }
  const len = out.reduce((a, c) => a + c.length, 0);
  const result = new Uint8Array(len);
  let off = 0;
  for (const seg of out) {
    result.set(seg, off);
    off += seg.length;
  }
  return result;
}