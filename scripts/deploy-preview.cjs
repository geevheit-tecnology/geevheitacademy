// Firebase Web configuration is public; no administrative credentials are sent.
const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const args = [
  "deploy",
  "--target",
  "preview",
  "--yes",
  "--scope",
  "geevheits-projects",
];
for (const line of readFileSync(".env.local", "utf8").split("\n"))
  if (/^VITE_FIREBASE_[A-Z_]+=.+/.test(line)) args.push("--build-env", line);
const result = spawnSync("vercel", args, { stdio: "inherit" });
process.exitCode = result.status || 0;
