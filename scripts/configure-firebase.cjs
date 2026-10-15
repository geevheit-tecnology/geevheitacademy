// Administration of the explicitly authorized project only. No credential output.
const { createRequire } = require("node:module");
const path = require("node:path");
const cliRequire = createRequire(
  path.join(process.env.FIREBASE_CLI_ROOT, "package.json"),
);
const { configstore } = cliRequire("./lib/configstore");
const { getAccessToken } = cliRequire("./lib/auth");
const project = "transportsim360-academy";
async function main() {
  const tokens = configstore.get("tokens");
  const token = await getAccessToken(tokens.refresh_token, [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/firebase",
  ]);
  async function request(url, method = "GET", body) {
    const r = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const d = await r.json();
    if (!r.ok)
      throw Error(`${r.status}: ${d.error?.message || "Requisição rejeitada"}`);
    return d;
  }
  if (process.argv[2] === "enable") {
    for (const service of [
      "firestore.googleapis.com",
      "identitytoolkit.googleapis.com",
    ]) {
      await request(
        `https://serviceusage.googleapis.com/v1/projects/${project}/services/${service}:enable`,
        "POST",
        {},
      );
      console.log(`Ativação solicitada: ${service}`);
    }
  } else if (process.argv[2] === "status") {
    for (const id of [project, "840394415853"]) {
      try {
        const result = await request(
          `https://identitytoolkit.googleapis.com/admin/v2/projects/${id}/config`,
        );
        console.log(
          JSON.stringify({
            id,
            name: result.name,
            emailEnabled: result.signIn?.email?.enabled,
            authorizedDomains: result.authorizedDomains,
          }),
        );
      } catch (error) {
        console.log(JSON.stringify({ id, error: error.message }));
      }
    }
  } else if (process.argv[2] === "auth") {
    const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`;
    const config = await request(base);
    const domains = [
      ...new Set([
        ...(config.authorizedDomains || []),
        "localhost",
        `${project}.firebaseapp.com`,
        ...process.argv.slice(3),
      ]),
    ];
    const result = await request(
      `${base}?updateMask=signIn.email,authorizedDomains`,
      "PATCH",
      {
        signIn: { email: { enabled: true, passwordRequired: true } },
        authorizedDomains: domains,
      },
    );
    console.log(
      JSON.stringify({
        emailEnabled: result.signIn?.email?.enabled,
        authorizedDomains: result.authorizedDomains,
      }),
    );
  } else throw Error("Use enable ou auth.");
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
