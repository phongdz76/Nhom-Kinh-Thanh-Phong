# Code conventions

Use `dev` for development commits. Promote a checked batch to `main` with a merge; do not duplicate the same changes with cherry-picks. Push both branches after verification.

Environment files are private and are never committed, including `.env.example` and test credentials. `npm run setup` can generate a private local environment when none exists. Enable the staged secret guard with `git config core.hooksPath .githooks`. Run `npm run check:secrets:history` before pushing to scan the index and reachable history without printing secret values.

- Use `.ts` for logic, scripts and tests; use `.tsx` for React components. Keep framework configuration in its supported file format.
- Keep `src/app` as thin Next.js entry points. Domain and application code must stay independent of presentation and infrastructure.
- Call the application services from UI code. HTTP clients, gateways and API paths belong to infrastructure.
- Use semantic classes in `src/frontend/presentation/styles/globals.css`. Prefix component-specific classes, for example `about-story-*`, to avoid collisions.
- Use `next/link` for internal navigation. Full document navigation after session revocation and into the print document has explicit lint exceptions.
- Import types at the top of the file with `import type`; do not use inline `import("...")` type annotations.
- Run `npm run format` to format code, and `npm run lint:fix` for safe lint fixes.
- Run `npm run check` before submitting changes. It checks lint, formatting, architecture, TypeScript and unit tests.
- Run `npm run test:setup`, build with `NEXT_DIST_DIR=.next-verify` and the test environment, then run `npm run test:ui` for Playwright tests against the dedicated test database.

Generated files, migration history, media, environment files and build output are excluded from automatic formatting. ESLint exceptions for existing effect synchronization and original image/QR rendering are listed explicitly in `eslint.config.mjs`; new components use the default rules.

TypeScript is pinned to `6.0.x`, which is supported by the installed `typescript-eslint` parser. Upgrade the compiler and lint parser together. ESLint uses the [official Next.js configuration](https://nextjs.org/docs/app/api-reference/config/eslint), with [Prettier](https://prettier.io/docs/install) handling formatting separately.

The product catalog displays 12 items per page from the existing site snapshot. `category`, `q`, `opening`, `sort` and `page` are restored from the URL; changing a filter resets the page. Filtering and page selection belong to `frontend/application/catalog.ts`, with browser history handled by `useCatalog`. The backend snapshot still has a 500-product cap; database pagination is a separate future change. Catalog E2E fixtures are restricted to the local `thanhphong_test` database and are removed after the tests.
