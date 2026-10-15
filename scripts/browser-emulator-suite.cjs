const { spawn } = require("node:child_process");
async function main() {
  const base = "http://localhost:5174";
  const server = spawn("npm", ["run", "dev", "--", "--port", "5174"], {
    stdio: "ignore",
    env: {
      ...process.env,
      VITE_FIREBASE_USE_EMULATORS: "true",
      VITE_FIREBASE_PROJECT_ID: "demo-transportsim360",
    },
  });
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        const response = await fetch(base);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!ready) throw Error("Servidor de QA não iniciou.");
    const child = spawn("node", ["scripts/browser-qa.mjs"], {
      stdio: "inherit",
      env: { ...process.env, QA_BASE_URL: base, QA_EMULATORS: "1" },
    });
    const code = await new Promise((r) => child.on("exit", r));
    process.exitCode = code || 0;
  } finally {
    server.kill();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
