import {
  categorySchema,
  postSchema,
  productSchema,
  projectSchema,
  settingsSchema,
} from "@/domain/schemas";
import type { User } from "@/domain/models";
import type { CatalogRepository } from "./ports";
import { ApplicationError } from "./errors";

export function createCatalogService(repository: CatalogRepository) {
  return {
    publicSite: () => repository.publicSite(),
    findPublicProduct: (id: string) => repository.findPublicProduct(id),
    findPublicContent: repository.findPublicContent.bind(repository),
    adminState: (user: User) => repository.adminState(user),
    async saveProduct(input: unknown, user: User, id?: string) {
      const values = productSchema.parse(input);
      const category = await repository.category(values.category);
      if (!category?.isActive)
        throw new ApplicationError("invalid", "Danh mục chưa hoạt động.");
      if (id) {
        const existing = await repository.product(id, user);
        if (!existing)
          throw new ApplicationError("notFound", "Không tìm thấy sản phẩm.");
        if (values.updatedAt && values.updatedAt !== existing.updatedAt)
          throw new ApplicationError(
            "conflict",
            "Sản phẩm đã được sửa. Tải lại trước khi cập nhật.",
          );
      }
      return repository.saveProduct(values, user, id);
    },
    saveCategory: (input: unknown, user: User) =>
      repository.saveCategory(categorySchema.parse(input), user),
    saveSettings: (input: unknown, user: User) =>
      repository.saveSettings(settingsSchema.parse(input), user),
    saveContent(kind: string, input: unknown, user: User) {
      if (kind === "posts")
        return repository.saveContent(
          { kind, document: postSchema.parse(input) },
          user,
        );
      if (kind === "projects")
        return repository.saveContent(
          { kind, document: projectSchema.parse(input) },
          user,
        );
      throw new ApplicationError("notFound", "Không tìm thấy loại nội dung.");
    },
  };
}
