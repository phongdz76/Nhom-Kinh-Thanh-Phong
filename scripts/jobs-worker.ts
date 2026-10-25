import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
let child: ChildProcess | undefined;
let stopping = false;
function work() {
  if (child || stopping) return;
  child = spawn(process.execPath, ["--import", "tsx", "scripts/jobs.ts"], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", () => {
    child = undefined;
    if (stopping) process.exit(0);
  });
}
const timer = setInterval(work, 60000);
function stop() {
  stopping = true;
  clearInterval(timer);
  if (child) child.kill();
  else process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
work();
