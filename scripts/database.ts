import dotenv from "dotenv";
dotenv.config({
  path: process.env.ENV_FILE || [".env.local", ".env"],
  quiet: true,
});
const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const payload = await getPayload({ config });
const action = process.argv[2] || "migrate";
try {
  if (action === "create-migration") {
    await payload.db.createMigration({
      payload,
      migrationName: process.argv[3] || "backend",
      forceAcceptWarning: true,
      skipEmpty: true,
    });
  } else if (action === "migrate") {
    await payload.db.migrate();
  } else if (action === "reset-password") {
    if (
      !process.env.OWNER_EMAIL ||
      !process.env.OWNER_PASSWORD ||
      process.env.OWNER_PASSWORD.length < 12
    )
      throw new Error(
        "Set the owner email and a password of at least 12 characters.",
      );
    const owner = (
      await payload.find({
        collection: "users",
        where: {
          and: [
            { email: { equals: process.env.OWNER_EMAIL } },
            { role: { equals: "owner" } },
          ],
        },
        limit: 1,
      })
    ).docs[0];
    if (!owner) throw new Error("Owner account not found.");
    await payload.update({
      collection: "users",
      id: owner.id,
      data: { password: process.env.OWNER_PASSWORD, sessions: [] },
    });
    console.log(
      "Owner password updated and all sessions revoked. No credentials printed.",
    );
  } else if (action === "init" || action === "seed-demo") {
    const { categories, initialSettings, initialProducts, articles, projects } =
      await import("@/backend/infrastructure/payload/seeds/demo");
    const email = process.env.OWNER_EMAIL;
    const password = process.env.OWNER_PASSWORD;
    if (!email || !password || password.length < 12)
      throw new Error(
        "Set OWNER_EMAIL and OWNER_PASSWORD (12+ characters) in the local configuration.",
      );
    const existing = await payload.find({ collection: "users", limit: 1 });
    if (!existing.totalDocs) {
      await payload.create({
        collection: "users",
        data: {
          name: "Chủ cơ sở",
          email,
          password,
          role: "owner",
          isActive: true,
        },
        overrideAccess: true,
      });
      console.log(
        "Owner account created. Credentials remain in the ignored configuration file.",
      );
    }
    const savedCategories: Record<string, string> = {};
    for (const [index, category] of categories
      .filter((item) => item.id !== "all")
      .entries()) {
      const current = (
        await payload.find({
          collection: "categories",
          where: { key: { equals: category.id } },
          limit: 1,
        })
      ).docs[0];
      const saved =
        current ||
        (await payload.create({
          collection: "categories",
          data: {
            key: category.id,
            name: category.name,
            icon: category.icon,
            sortOrder: index,
            isActive: true,
          },
        }));
      savedCategories[category.id] = String(saved.id);
    }
    const settings = await payload.findGlobal({ slug: "site-settings" });
    if (!settings.name)
      await payload.updateGlobal({
        slug: "site-settings",
        data: { ...initialSettings, isDemo: action === "seed-demo" },
      });
    if (action === "seed-demo") {
      await payload.updateGlobal({
        slug: "site-settings",
        data: { isDemo: true },
      });
      const productIds: Record<string, string> = {};
      for (const product of initialProducts) {
        const current = (
          await payload.find({
            collection: "products",
            where: { publicId: { equals: product.id } },
            limit: 1,
          })
        ).docs[0];
        const { id, status, images, ...fields } = product;
        const saved =
          current ||
          (await payload.create({
            collection: "products",
            data: {
              ...fields,
              publicId: id,
              category: savedCategories[product.category],
              images: images.map((url) => ({ url })),
              _status: status,
            },
          }));
        productIds[id] = String(saved.id);
      }
      for (const article of articles) {
        const current = (
          await payload.find({
            collection: "posts",
            where: { slug: { equals: article.slug } },
            limit: 1,
          })
        ).docs[0];
        if (!current)
          await payload.create({
            collection: "posts",
            data: { ...article, _status: "published" },
          });
      }
      for (const project of projects) {
        const current = (
          await payload.find({
            collection: "projects",
            where: { slug: { equals: project.id } },
            limit: 1,
          })
        ).docs[0];
        if (!current) {
          const { id, products: related, ...fields } = project;
          await payload.create({
            collection: "projects",
            data: {
              ...fields,
              slug: id,
              products: related.map((key) => productIds[key]),
              images: [{ url: project.image }],
              _status: "published",
            },
          });
        }
      }
      console.log(
        "Illustrative content seeded without overwriting existing records.",
      );
    }
    console.log("Database initialization complete.");
  } else throw new Error("Unknown database command.");
} finally {
  await payload.destroy();
}
process.exit(0);
