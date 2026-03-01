import multer from "multer";
import path from "path";
import os from "os";

import { config } from "../config";

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/json",
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});
