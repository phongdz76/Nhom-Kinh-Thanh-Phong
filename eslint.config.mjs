import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          // Destructuring deliberately excludes private fields from DTOs.
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: [
      "src/frontend/presentation/admin/AdminDashboard.tsx",
      "src/frontend/presentation/hooks/useEstimateEditor.ts",
      "src/frontend/presentation/hooks/useSiteState.ts",
      "src/frontend/presentation/website/ConsultationForm.tsx",
      "src/frontend/presentation/website/Header.tsx",
      "src/frontend/presentation/website/ZaloContact.tsx",
    ],
    rules: {
      // These existing components synchronize URL/server snapshots in effects.
      // Keep the compiler's lifecycle migration outside this style cleanup.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "src/frontend/presentation/admin/AdminDashboard.tsx",
      "src/frontend/presentation/admin/ContentManager.tsx",
      "src/frontend/presentation/website/ZaloContact.tsx",
      "src/frontend/presentation/website/ContactContent.tsx",
      "src/frontend/presentation/metadata/SiteIcon.tsx",
    ],
    rules: {
      // These render original uploaded/QR bytes or ImageResponse markup.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: true,
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*.module.css", "**/*.module.css"],
              message:
                "Use semantic, component-prefixed classes in presentation/styles/globals.css.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    ".next-*/**",
    "out/**",
    "build/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "artifacts/**",
    "var/**",
    "docs/**",
    "next-env.d.ts",
    "payload-types.ts",
    "src/backend/infrastructure/payload/migrations/**",
  ]),
]);
