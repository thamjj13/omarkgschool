import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { config } from "./config";
import { ApiError } from "./api/errors";

/* ── validation policy ──────────────────────────────────────────────────── */

const ALLOWED: Record<string, { kind: string; maxBytes: number; mime: string[] }> = {
  ".jpg": { kind: "image", maxBytes: 10 * 1024 * 1024, mime: ["image/jpeg"] },
  ".jpeg": { kind: "image", maxBytes: 10 * 1024 * 1024, mime: ["image/jpeg"] },
  ".png": { kind: "image", maxBytes: 10 * 1024 * 1024, mime: ["image/png"] },
  ".webp": { kind: "image", maxBytes: 10 * 1024 * 1024, mime: ["image/webp"] },
  ".gif": { kind: "image", maxBytes: 10 * 1024 * 1024, mime: ["image/gif"] },
  ".pdf": { kind: "pdf", maxBytes: 20 * 1024 * 1024, mime: ["application/pdf"] },
  ".mp4": { kind: "video", maxBytes: 100 * 1024 * 1024, mime: ["video/mp4"] },
  ".webm": { kind: "video", maxBytes: 100 * 1024 * 1024, mime: ["video/webm"] },
  ".doc": { kind: "other", maxBytes: 20 * 1024 * 1024, mime: ["application/msword"] },
  ".docx": { kind: "other", maxBytes: 20 * 1024 * 1024, mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  ".xls": { kind: "other", maxBytes: 20 * 1024 * 1024, mime: ["application/vnd.ms-excel"] },
  ".xlsx": { kind: "other", maxBytes: 20 * 1024 * 1024, mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] },
  ".ppt": { kind: "other", maxBytes: 20 * 1024 * 1024, mime: ["application/vnd.ms-powerpoint"] },
  ".pptx": { kind: "other", maxBytes: 20 * 1024 * 1024, mime: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"] },
  ".txt": { kind: "other", maxBytes: 5 * 1024 * 1024, mime: ["text/plain"] },
  ".zip": { kind: "other", maxBytes: 20 * 1024 * 1024, mime: ["application/zip"] },
};

function extOf(name: string): string {
  return path.extname(name).toLowerCase();
}

export function isAllowedUpload(name: string): boolean {
  return Boolean(ALLOWED[extOf(name)]);
}

export interface StoredFile {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  storagePath: string; // relative to uploadDir
  kind: string;
}

/* ── storage ────────────────────────────────────────────────────────────── */

function randomName(ext: string): string {
  return `${crypto.randomUUID()}${ext}`;
}

function relativePathFor(name: string): string {
  const d = new Date();
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return path.posix.join(y, m, name);
}

export function absolutePath(relPath: string): string {
  const abs = path.resolve(config.uploadDir, relPath);
  if (!abs.startsWith(path.resolve(config.uploadDir))) {
    throw new ApiError(400, "Invalid file path", "INVALID_PATH");
  }
  return abs;
}

export function thumbPath(relPath: string): string {
  const parsed = path.parse(relPath);
  return path.posix.join(parsed.dir, `${parsed.name}-thumb.webp`);
}

async function processImage(
  buffer: Buffer,
  relPath: string
): Promise<{ width: number; height: number }> {
  let img = sharp(buffer, { failOn: "error" }).rotate();
  const meta = await img.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  // Generate a square-ish thumbnail for grids/cards.
  try {
    const thumb = await sharp(buffer)
      .rotate()
      .resize(640, 640, { fit: "cover", position: "attention" })
      .webp({ quality: 72 })
      .toBuffer();
    fs.writeFileSync(absolutePath(thumbPath(relPath)), thumb);
  } catch {
    // thumbnails are a best-effort optimisation
  }

  // Downsize very large originals to keep storage reasonable.
  if (width > 2600) {
    const ext = path.extname(relPath).toLowerCase();
    const format = ext === ".png" ? "png" : ext === ".webp" ? "webp" : "jpeg";
    const resized = await img
      .resize({ width: 2600, withoutEnlargement: true })
      .toFormat(format, { quality: 85 })
      .toBuffer();
    fs.writeFileSync(absolutePath(relPath), resized);
  }
  return { width, height };
}

/** Validate, store and (for images) optimise an uploaded file. */
export async function storeFile(
  file: File
): Promise<StoredFile> {
  const originalName = file.name || "upload";
  const ext = extOf(originalName);
  const policy = ALLOWED[ext];
  if (!policy) {
    throw new ApiError(415, "File type is not allowed", "INVALID_FILE_TYPE");
  }
  if (file.size > policy.maxBytes) {
    throw new ApiError(
      413,
      `File is too large (max ${Math.round(policy.maxBytes / 1024 / 1024)} MB)`,
      "FILE_TOO_LARGE"
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Content verification — never trust the extension alone.
  if (policy.kind === "image") {
    try {
      await sharp(buffer, { failOn: "error" }).metadata();
    } catch {
      throw new ApiError(415, "File is not a valid image", "INVALID_FILE_TYPE");
    }
  } else if (policy.kind === "pdf") {
    if (buffer.subarray(0, 5).toString() !== "%PDF-") {
      throw new ApiError(415, "File is not a valid PDF", "INVALID_FILE_TYPE");
    }
  }

  const filename = randomName(ext);
  const relPath = relativePathFor(filename);
  const abs = absolutePath(relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  let width: number | null = null;
  let height: number | null = null;

  if (policy.kind === "image") {
    fs.writeFileSync(abs, buffer);
    try {
      const dims = await processImage(buffer, relPath);
      width = dims.width;
      height = dims.height;
    } catch {
      // keep original even if processing failed
    }
  } else {
    fs.writeFileSync(abs, buffer);
  }

  return {
    filename,
    originalName,
    mimeType: policy.mime[0],
    sizeBytes: buffer.length,
    width,
    height,
    storagePath: relPath,
    kind: policy.kind,
  };
}

export function deleteStoredFile(relPath: string): void {
  try {
    fs.unlinkSync(absolutePath(relPath));
  } catch {
    /* ignore */
  }
  try {
    fs.unlinkSync(absolutePath(thumbPath(relPath)));
  } catch {
    /* ignore */
  }
}

export function fileExists(relPath: string): boolean {
  try {
    return fs.existsSync(absolutePath(relPath));
  } catch {
    return false;
  }
}
