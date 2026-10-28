// Public Firebase Web configuration only. No administrative credential enters the build.
const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const production = process.argv.includes("--production");
const holdDomains = production && process.argv.includes("--hold-domains");
const allowed = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_APPCHECK_SITE_KEY",
];
const values = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const match = raw.trim().match(/^([A-Z_]+)=(.*)$/);
  if (!match || !allowed.includes(match[1])) continue;
  values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
}
for (const key of allowed.slice(0, 6))
  if (!values[key])
    throw Error(`Configuração pública obrigatória ausente: ${key}`);
if (values.VITE_FIREBASE_PROJECT_ID !== "transportsim360-academy")
  throw Error("O build precisa apontar para o projeto Firebase autorizado.");
const args = [
  "deploy",
  ...(production ? ["--prod"] : ["--target", "preview"]),
  ...(holdDomains ? ["--skip-domain"] : []),
  "--yes",
  "--scope",
  "geevheits-projects",
];
for (const [key, value] of Object.entries(values))
  args.push("--build-env", `${key}=${value}`);
const result = spawnSync("vercel", args, { stdio: "inherit" });
process.exitCode = result.status ?? 1;
