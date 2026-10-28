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
  if (process.argv[2] === "verify-admin") {
    const email = "getuliopedromoreirafilho@gmail.com";
    const result = await request(
      `https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,
      "POST",
      { email: [email] },
    );
    const user = result.users?.find(
      (user) => user.email?.toLowerCase() === email,
    );
    if (!user || user.disabled)
      throw Error("A conta autorizada não está disponível.");
    const grant = await request(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/admins/${encodeURIComponent(user.localId)}`,
    );
    const release = await request(
      `https://firebaserules.googleapis.com/v1/projects/${project}/releases/cloud.firestore`,
    );
    const ruleset = await request(
      `https://firebaserules.googleapis.com/v1/${release.rulesetName}`,
    );
    const { readFileSync } = require("node:fs");
    const { createHash } = require("node:crypto");
    const local = readFileSync("firestore.rules", "utf8").trim();
    const active = ruleset.source?.files
      ?.find((file) => file.name.endsWith("firestore.rules"))
      ?.content?.trim();
    const authConfig = await request(`https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`);
    const verified = {
      project,
      email,
      adminGranted: grant.fields?.granted?.booleanValue === true,
      emailSignInEnabled: authConfig.signIn?.email?.enabled === true,
      primaryDomainAuthorized: authConfig.authorizedDomains?.includes("geevheitacademy.vercel.app") === true,
      firestoreRulesMatchLocal: active === local,
      rulesetName: release.rulesetName,
      rulesUpdatedAt: release.updateTime,
      localRulesSha256: createHash("sha256").update(local).digest("hex"),
    };
    console.log(JSON.stringify(verified));
    if (!verified.adminGranted || !verified.firestoreRulesMatchLocal || !verified.emailSignInEnabled || !verified.primaryDomainAuthorized)
      process.exitCode = 1;
  } else if (process.argv[2] === "grant-admin") {
    const email = process.argv[3];
    if (email !== "getuliopedromoreirafilho@gmail.com")
      throw Error("A administração é exclusiva da conta do proprietário.");
    const result = await request(
      `https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,
      "POST",
      { email: [email] },
    );
    const user = result.users?.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!user)
      throw Error(
        "Conta não encontrada. Crie a conta na plataforma antes de conceder acesso.",
      );
    if (user.disabled) throw Error("A conta está desativada.");
    const target = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/admins/${encodeURIComponent(user.localId)}`;
    await request(target, "PATCH", {
      fields: { granted: { booleanValue: true } },
    });
    const saved = await request(target);
    if (!saved.fields?.granted?.booleanValue)
      throw Error("Permissão não confirmada.");
    console.log(JSON.stringify({ project, email, adminGranted: true }));
  } else if (process.argv[2] === "enable") {
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
