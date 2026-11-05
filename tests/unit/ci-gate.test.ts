import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkCommitCI,
  matchingRun,
  verificationState,
} from "../../scripts/lib/ci-gate";

test("deployment gate accepts only the verification job, never a deploy status or skipped job", () => {
  assert.equal(
    verificationState([
      {
        name: "Verify application",
        status: "completed",
        conclusion: "success",
      },
    ]),
    "passed",
  );
  for (const conclusion of [
    "failure",
    "cancelled",
    "skipped",
    "neutral",
    "timed_out",
  ]) {
    assert.equal(
      verificationState([
        { name: "Verify application", status: "completed", conclusion },
      ]),
      "failed",
    );
  }
  assert.equal(
    verificationState([
      {
        name: "Deploy verified commit",
        status: "completed",
        conclusion: "success",
      },
    ]),
    "waiting",
  );
  assert.equal(
    verificationState([
      { name: "Verify application", status: "in_progress", conclusion: null },
    ]),
    "waiting",
  );
});

test("deployment gate rejects success from another commit, branch, event or run attempt", async () => {
  const sha = "a".repeat(40);
  const run = {
    id: 9,
    head_sha: sha,
    head_branch: "main",
    event: "push",
    run_attempt: 2,
  };
  assert.equal(
    matchingRun(
      [
        { ...run, head_sha: "b".repeat(40) },
        { ...run, head_branch: "dev" },
        { ...run, event: "pull_request" },
      ],
      sha,
      "main",
    ),
    undefined,
  );
  const requests: string[] = [];
  const request = (async (url: string) => {
    requests.push(url);
    return Response.json(
      url.includes("attempts/2/jobs")
        ? {
            jobs: [
              {
                name: "Verify application",
                status: "completed",
                conclusion: "success",
              },
            ],
          }
        : { workflow_runs: [run] },
    );
  }) as typeof fetch;
  assert.equal(await checkCommitCI(sha, "main", request), "passed");
  assert.equal(requests.length, 2);
  assert.ok(requests[1].includes("/runs/9/attempts/2/jobs"));
  await assert.rejects(checkCommitCI("invalid", "main", request));
  await assert.rejects(
    checkCommitCI(
      sha,
      "main",
      (async () => new Response(null, { status: 403 })) as typeof fetch,
    ),
  );
});
