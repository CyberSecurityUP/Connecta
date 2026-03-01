import fs from "fs";
import path from "path";

import { config } from "../config";
import { prisma } from "../config/database";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export class FileService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(config.upload.dir);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    workspaceId: string,
    uploadedById: string,
    messageId?: string,
  ) {
    const key = `${workspaceId}/${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, key);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Move file to uploads directory
    fs.renameSync(file.path, filePath);

    const url = `/uploads/${key}`;

    // Detect dimensions for images
    let width: number | undefined;
    let height: number | undefined;

    const record = await prisma.file.create({
      data: {
        name: file.originalname,
        key,
        url,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        uploadedById,
        workspaceId,
        messageId,
      },
    });

    return record;
  }

  async getById(fileId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError("File");
    return file;
  }

  async getWorkspaceFiles(
    workspaceId: string,
    cursor?: string,
    limit = 20,
    search?: string,
  ) {
    const files = await prisma.file.findMany({
      where: {
        workspaceId,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, displayName: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = files.length > limit;
    const data = hasMore ? files.slice(0, limit) : files;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  async delete(fileId: string, userId: string, isAdmin = false) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError("File");
    if (file.uploadedById !== userId && !isAdmin) {
      throw new ForbiddenError("You can only delete your own files");
    }

    // Delete physical file
    const filePath = path.join(this.uploadDir, file.key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.file.delete({ where: { id: fileId } });
  }
}

export const fileService = new FileService();
