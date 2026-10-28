import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf" && !file.originalname.toLowerCase().endsWith(".pdf")) {
      return cb(new Error("Only PDF files are allowed."));
    }
    cb(null, true);
  },
});

export const resumeUpload = upload.single("resume");

/**
 * Validates that the uploaded file buffer actually starts with PDF magic bytes (%PDF-).
 */
export function validatePdfMagicBytes(req: Request, res: Response, next: NextFunction): void {
  if (!req.file) {
    return next();
  }

  const buffer = req.file.buffer;
  if (!buffer || buffer.length < 5) {
    res.status(400).json({ message: "Corrupted or empty file." });
    return;
  }

  // PDF signature: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d;

  if (!isPdf) {
    res.status(400).json({ message: "Invalid file format. The file is not a valid PDF document." });
    return;
  }

  next();
}

