import { payloadActor } from "../actor";
import "server-only";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { cms } from "../client";
import { ApplicationError } from "@/backend/application/errors";
import type { MediaRepository } from "@/backend/application/ports";
import {
  mediaURL,
  objectStorage,
} from "@/backend/infrastructure/storage/config";
export const mediaRepository: MediaRepository = {
  async upload(file, alt, user) {
    let data: Buffer;
    try {
      const image = sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 25000000,
      });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format || ""))
        throw new Error("Unsupported image");
      data = await image
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new ApplicationError(
        "invalid",
        "Không đọc được ảnh hoặc kích thước ảnh quá lớn.",
      );
    }
    const payload = await cms();
    const media = await payload.create({
      collection: "media",
      user: payloadActor(user),
      overrideAccess: false,
      data: { alt },
      file: {
        data,
        mimetype: "image/webp",
        name: `${randomUUID()}.webp`,
        size: data.length,
      },
    });
    return { id: String(media.id), url: `/api/media/${media.id}`, alt };
  },
  async get(id) {
    const payload = await cms();
    const media = await payload.findByID({
      collection: "media",
      id,
      depth: 0,
      overrideAccess: false,
    });
    if (!media.filename || path.basename(media.filename) !== media.filename)
      throw new ApplicationError("notFound", "Không tìm thấy ảnh.");
    const storage = objectStorage(process.env);
    if (storage)
      return {
        redirect: mediaURL(storage, media.filename),
      };
    const file = path.resolve(
      process.env.MEDIA_DIR || "./var/media",
      media.filename,
    );
    try {
      return {
        data: new Uint8Array(await readFile(file)),
        mimeType: "image/webp",
      };
    } catch {
      throw new ApplicationError("notFound", "Không tìm thấy ảnh.");
    }
  },
};
