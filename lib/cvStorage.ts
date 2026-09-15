import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put, del } from "@vercel/blob";

export type StoredCv = {
  originalName: string;
  storedName: string;
  path: string;
  storageType: "blob" | "local";
  mimeType: string;
  size: number;
};

export type CvDownload = {
  body: BodyInit;
  contentType: string;
};

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function localStorageDir() {
  return process.env.CV_STORAGE_DIR
    ? path.resolve(/* turbopackIgnore: true */ process.env.CV_STORAGE_DIR)
    : path.join(process.cwd(), "storage", "cvs");
}

export async function storeCv(file: File): Promise<StoredCv> {
  const originalName = file.name || "cv.pdf";
  const storedName = `cvs/${Date.now()}-${randomUUID()}-${safeFileName(originalName)}`;
  const mimeType = file.type || "application/pdf";

  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL) {
    const blob = await put(storedName, file, {
      access: "private",
      contentType: mimeType,
    });

    return {
      originalName,
      storedName,
      path: blob.pathname,
      storageType: "blob",
      mimeType,
      size: file.size,
    };
  }

  const storageDir = localStorageDir();
  const localName = storedName.replaceAll("/", "-");
  const localPath = path.join(storageDir, localName);

  await mkdir(storageDir, { recursive: true });
  await writeFile(localPath, Buffer.from(await file.arrayBuffer()));

  return {
    originalName,
    storedName: localName,
    path: localPath,
    storageType: "local",
    mimeType,
    size: file.size,
  };
}

export async function readStoredCv(storageType: string, cvPath: string): Promise<CvDownload> {
  if (storageType === "blob") {
    const result = await get(cvPath, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) {
      throw new Error("CV introuvable.");
    }

    return {
      body: result.stream,
      contentType: result.blob.contentType || "application/pdf",
    };
  }

  return {
    body: await readFile(cvPath),
    contentType: "application/pdf",
  };
}

export async function deleteStoredCv(storageType: string, cvPath: string) {
  if (storageType === "blob") {
    await del(cvPath).catch(() => undefined);
    return;
  }

  await unlink(cvPath).catch(() => undefined);
}
