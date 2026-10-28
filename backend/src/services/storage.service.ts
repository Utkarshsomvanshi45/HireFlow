import fs from "fs";
import path from "path";
import os from "os";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
 * Enabled automatically when STORAGE_BUCKET and cloud credentials are configured.
 */
class S3ObjectStorageService implements StorageService {
  private client: S3Client;
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
    this.client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: process.env.STORAGE_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: Boolean(process.env.STORAGE_ENDPOINT),
    });
  }

  async save(file: Express.Multer.File, ownerId: string): Promise<StoredResume> {
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `resumes/${ownerId}/${timestamp}_${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
      Metadata: {
        ownerId,
        originalFilename: file.originalname,
      },
    });

    await this.client.send(command);

    return {
      key,
      filename: file.originalname,
      size: file.size,
    };
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      if (!response.Body) return null;
      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
    } catch {
      // Ignore if already deleted
    }
  }

  async getDownloadUrl(key: string): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      // Presigned download URL expires in 15 minutes
      return await getSignedUrl(this.client, command, { expiresIn: 900 });
    } catch {
      return null;
    }
  }
}

function createStorageService(): StorageService {
  const remoteBucket = process.env.STORAGE_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (remoteBucket && accessKeyId && secretAccessKey) {
    return new S3ObjectStorageService(remoteBucket);
  }

  return new LocalPrivateStorageService();
}

export const storageService: StorageService = createStorageService();
