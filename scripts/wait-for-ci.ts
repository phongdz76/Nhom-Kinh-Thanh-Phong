import { checkCommitCI } from "./lib/ci-gate";

try {
  if (process.env.NETLIFY === "true") {
    const sha = process.env.COMMIT_REF || "";
    const branch = process.env.BRANCH || "";
    const expires = Date.now() + 10 * 60 * 1000;
    console.log(
      "Waiting for Verify application on this exact commit before building a release.",
    );
    while (true) {
      const state = await checkCommitCI(sha, branch);
      if (state === "passed") {
        console.log("CI verified this commit. Release build may proceed.");
        break;
      }
      if (state === "failed")
        throw new Error(
          "CI failed or was cancelled for this commit. Release blocked.",
        );
      if (Date.now() >= expires)
        throw new Error(
          "CI has not passed within 10 minutes. Release blocked; retry after CI succeeds.",
        );
      await new Promise((resolve) => setTimeout(resolve, 45000));
    }
  } else {
    console.log("Local build: deployment CI gate is only required on Netlify.");
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Could not verify deployment CI.",
  );
  process.exitCode = 1;
}
