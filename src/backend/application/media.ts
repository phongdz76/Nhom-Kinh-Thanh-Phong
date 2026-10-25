import type { User } from "@/domain/models";
import type { MediaRepository } from "./ports";
import { ApplicationError } from "./errors";
export function createMediaService(repository: MediaRepository) {
  return {
    uploadImage(file: File, alt: string, user: User) {
      if (
        file.size > 8 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new ApplicationError(
          "invalid",
          "Chọn ảnh JPG, PNG hoặc WebP không quá 8 MB.",
        );
      if (!alt || alt.length > 200)
        throw new ApplicationError(
          "invalid",
          "Vui lòng nhập mô tả ảnh, tối đa 200 ký tự.",
        );
      return repository.upload(file, alt, user);
    },
    getMedia(id: string) {
      if (!/^[a-f0-9-]{36}$/.test(id))
        throw new ApplicationError("notFound", "Không tìm thấy ảnh.");
      return repository.get(id);
    },
  };
}
