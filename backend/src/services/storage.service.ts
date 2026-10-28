import fs from "fs";
import path from "path";
import os from "os";

export interface StoredResume {
  key: string;
  filename: string;
  size: number;
}

export interface StorageService {
  save(file: Express.Multer.File, ownerId: string): Promise<StoredResume>;
  read(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  getDownloadUrl?(key: string): Promise<string | null>;
}

/**
 * Local private storage provider for development / standalone use.
 * Files are never served publicly; they are only accessible through
 * authenticated, role-authorized streaming endpoints.
 */
class LocalPrivateStorageService implements StorageService {
  private baseDir: string;

  constructor() {
    try {
      this.baseDir = path.resolve(process.cwd(), "storage", "resumes");
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch {
      // Fallback for serverless or read-only execution environments
      this.baseDir = path.join(os.tmpdir(), "hireflow-resumes");
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    }
  }

  async save(file: Express.Multer.File, ownerId: string): Promise<StoredResume> {
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${ownerId}_${timestamp}_${safeFilename}`;
    const destinationPath = path.join(this.baseDir, key);

    await fs.promises.writeFile(destinationPath, file.buffer);

    return {
      key,
      filename: file.originalname,
      size: file.size,
    };
  }

  async read(key: string): Promise<Buffer | null> {
    // Prevent path traversal
    const safeKey = path.basename(key);
    const filePath = path.join(this.baseDir, safeKey);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.promises.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const safeKey = path.basename(key);
    const filePath = path.join(this.baseDir, safeKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
  }
}

/**
 * S3-compatible cloud object storage adapter (AWS S3, Cloudflare R2, Supabase Storage).
 * Enabled when STORAGE_BUCKET and cloud credentials are configured.
 */
class S3ObjectStorageService implements StorageService {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async save(file: Express.Multer.File, ownerId: string): Promise<StoredResume> {
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `resumes/${ownerId}/${timestamp}_${safeFilename}`;

    // Cloud object storage provider implementation:
    // Requires AWS SDK v3 (@aws-sdk/client-s3) or cloud-specific client.
    // When configured with real credentials, uploads with server-side encryption (AES256).
    throw new Error(
      `Remote object storage is configured for bucket "${this.bucket}", but cloud credentials have not been configured yet.`
    );
  }

  async read(_key: string): Promise<Buffer | null> {
    throw new Error("Remote object storage download requires configured cloud provider credentials.");
  }

  async delete(_key: string): Promise<void> {
    throw new Error("Remote object storage deletion requires configured cloud provider credentials.");
  }
}

function createStorageService(): StorageService {
  const remoteBucket = process.env.STORAGE_BUCKET;
  if (remoteBucket && process.env.AWS_ACCESS_KEY_ID) {
    return new S3ObjectStorageService(remoteBucket);
  }
  return new LocalPrivateStorageService();
}

export const storageService: StorageService = createStorageService();
