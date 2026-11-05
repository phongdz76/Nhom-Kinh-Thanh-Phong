type Run = {
  id: number;
  head_sha: string;
  head_branch: string;
  event: string;
  run_attempt: number;
};
type Job = { name: string; status: string; conclusion: string | null };
export type CIState = "waiting" | "passed" | "failed";

export function matchingRun(runs: Run[], sha: string, branch: string) {
  return runs
    .filter(
      (run) =>
        run.head_sha === sha &&
        run.head_branch === branch &&
        run.event === "push",
    )
    .sort((a, b) => b.id - a.id)[0];
}
export function verificationState(jobs: Job[]): CIState {
  const verify = jobs.filter((job) => job.name === "Verify application");
  if (verify.length !== 1) return "waiting";
  if (verify[0].status !== "completed") return "waiting";
  return verify[0].conclusion === "success" ? "passed" : "failed";
}

export async function checkCommitCI(
  sha: string,
  branch: string,
  request: typeof fetch = fetch,
): Promise<CIState> {
  if (!/^[a-f0-9]{40}$/.test(sha) || !["main", "dev"].includes(branch))
    throw new Error(
      "A full commit SHA and main/dev branch are required for deployment.",
    );
  const repository =
    "https://api.github.com/repos/phongdz76/Nhom-Kinh-Thanh-Phong";
  const headers = {
    "User-Agent": "ThanhPhong-deployment-gate",
    Accept: "application/vnd.github+json",
  };
  async function get(path: string) {
    const response = await request(repository + path, {
      headers,
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (!response.ok)
      throw new Error(
        `GitHub CI status is unavailable (HTTP ${response.status}); deployment stays blocked.`,
      );
    return response.json();
  }
  const { workflow_runs: runs } = await get(
    `/actions/workflows/ci.yml/runs?head_sha=${sha}&event=push&per_page=100`,
  );
  const run = matchingRun(runs, sha, branch);
  if (!run) return "waiting";
  const { jobs } = await get(
    `/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`,
  );
  return verificationState(jobs);
}
