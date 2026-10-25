import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const files = fs
  .readdirSync(sourceRoot, { recursive: true })
  .filter((name): name is string => typeof name === "string")
  .map((name) => path.join(sourceRoot, name))
  .filter((name) => /\.(?:[jt]sx?)$/.test(name));
const violations: string[] = [];
const posix = (name: string) => name.replaceAll("\\", "/");

for (const directory of ["scripts", "tests"]) {
  const target = path.join(root, directory);
  if (!fs.existsSync(target)) continue;
  for (const name of fs.readdirSync(target, { recursive: true })) {
    if (typeof name === "string" && /\.(?:[cm]?js|jsx)$/.test(name))
      violations.push(
        `${directory}/${posix(name)}: Scripts and tests must use TypeScript.`,
      );
  }
}

for (const filename of files) {
  const relative = posix(path.relative(sourceRoot, filename));
  const source = fs.readFileSync(filename, "utf8");
  const domain = relative.startsWith("domain/");
  const application = /^(frontend|backend)\/application\//.test(relative);
  const presentation = relative.startsWith("frontend/presentation/");
  const infrastructure = /^(frontend|backend)\/infrastructure\//.test(relative);
  const entry =
    relative.startsWith("app/") || relative.startsWith("backend/interfaces/");
  const report = (message: string) =>
    violations.push(`${relative}: ${message}`);
  if (/\.jsx?$/.test(filename))
    report("Application source must use .ts or .tsx.");
  if (
    relative.startsWith("app/") &&
    /\b(?:function|return|className|fetch)\b|=>/.test(source)
  )
    report(
      "App files must only declare or re-export Next.js entry points; move rendering and handlers to frontend/backend.",
    );
  if (
    relative.startsWith("app/api/") &&
    relative !== "app/api/[...path]/route.ts"
  )
    report(
      "API routing belongs in backend/interfaces/http/router.ts; keep one catch-all entry in app.",
    );

  function checkImport(specifier: string) {
    const dependency = specifier.startsWith("@/")
      ? specifier.slice(2)
      : specifier.startsWith(".")
        ? posix(
            path.relative(
              sourceRoot,
              path.resolve(path.dirname(filename), specifier),
            ),
          )
        : null;
    if (specifier.startsWith("@payload-config")) {
      if (!infrastructure) report("Payload config belongs to infrastructure.");
      return;
    }
    if (dependency) {
      if (domain && !dependency.startsWith("domain/"))
        report(`Domain cannot import ${specifier}.`);
      if (
        application &&
        !dependency.startsWith("domain/") &&
        !dependency.startsWith(relative.split("/")[0] + "/application/")
      )
        report(
          `Application cannot import ${specifier}; inject a port instead.`,
        );
      if (
        presentation &&
        /^(backend\/|frontend\/infrastructure\/|frontend\/composition\/server\/)/.test(
          dependency,
        )
      )
        report(
          `Presentation cannot import ${specifier}; use composition and application services.`,
        );
      if (
        infrastructure &&
        /^(app\/|frontend\/presentation\/|(?:frontend|backend)\/composition\/|backend\/interfaces\/)/.test(
          dependency,
        )
      )
        report(`Infrastructure cannot import ${specifier}.`);
      if (entry && /^(?:frontend|backend)\/infrastructure\//.test(dependency))
        report(
          `Entry points must obtain adapters through composition: ${specifier}.`,
        );
      const target = path.join(sourceRoot, dependency);
      if (
        ![
          target,
          ...[".ts", ".tsx", ".json", "/index.ts", "/index.tsx"].map(
            (extension) => target + extension,
          ),
          target.replace(/\.js$/, ".ts"),
        ].some((candidate) => fs.existsSync(candidate))
      )
        report(`Unresolved local import ${specifier}.`);
    } else if ((domain || application) && specifier !== "zod")
      report(`Core layers cannot depend on ${specifier}.`);
  }
  // Covers static imports, re-exports, side-effect imports and literal dynamic
  // imports. Computed imports cannot declare a stable architectural dependency.
  for (const match of source.matchAll(
    /\b(?:from\s*|import\s*(?:\(\s*)?)["']([^"']+)["']/g,
  ))
    checkImport(match[1]);
  if ((presentation || application) && /\bfetch\s*\(/.test(source))
    report("Move HTTP requests to an infrastructure gateway.");
  if ((presentation || application) && /["'`]\/api\//.test(source))
    report("Keep API paths in infrastructure/http/api-paths.ts.");
}
if (violations.length) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else
  console.log(`Architecture checks passed for ${files.length} source modules.`);
