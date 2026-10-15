const { spawnSync } = require("node:child_process");
const endpoint = "/v9/projects/geevheitacademy";
function request(extra = []) {
  const result = spawnSync(
    "vercel",
    ["api", endpoint, "--scope", "geevheits-projects", ...extra],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw Error(result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
try {
  const before = request();
  console.log(
    JSON.stringify({
      project: before.name,
      previewBefore: before.enablePreviewFeedback,
      productionBefore: before.enableProductionFeedback,
    }),
  );
  request([
    "-X",
    "PATCH",
    "-F",
    "enablePreviewFeedback=false",
    "-F",
    "enableProductionFeedback=false",
  ]);
  const after = request();
  console.log(
    JSON.stringify({
      project: after.name,
      preview: after.enablePreviewFeedback,
      production: after.enableProductionFeedback,
    }),
  );
  if (
    after.enablePreviewFeedback !== false ||
    after.enableProductionFeedback !== false
  )
    throw Error("A configuração não foi confirmada.");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
