// Isolated local Firebase emulators only. No production data or payments.
import { spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";
const project = "demo-transportsim360";
const base = "http://localhost:5176";
const server = spawn(
  "npm",
  ["run", "dev", "--", "--port", "5176", "--strictPort"],
  {
    stdio: "ignore",
    env: {
      ...process.env,
      VITE_FIREBASE_PROJECT_ID: project,
      VITE_FIREBASE_USE_EMULATORS: "true",
    },
  },
);
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({
    executablePath:
      "/Users/getulio/.cache/puppeteer/chrome-headless-shell/mac-146.0.7680.153/chrome-headless-shell-mac-x64/chrome-headless-shell",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await expect(page.locator(".hero-visual")).toHaveCSS("transform", "none");
  await page.screenshot({
    path: "docs/qa/billing-landing-desktop.png",
    fullPage: true,
  });
  const password = "BillingQa12345!";
  const email = "getuliopedromoreirafilho@gmail.com";
  async function register(target, name, address) {
    await target.goto(`${base}/cadastro`);
    await target.getByLabel("Nome", { exact: true }).fill(name);
    await target.getByLabel("E-mail", { exact: true }).fill(address);
    await target.getByLabel("Senha", { exact: true }).fill(password);
    await target.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(target).toHaveURL(
      `${base}/${address === email ? "admin" : "app"}`,
    );
  }
  await register(page, "Administrador QA", email);
  const accounts = await (
    await fetch(
      `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer owner",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: [email] }),
      },
    )
  ).json();
  const uid = accounts.users.find((u) => u.email === email).localId;
  const grant = await fetch(
    `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents/admins/${uid}`,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer owner",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { granted: { booleanValue: true } } }),
    },
  );
  if (!grant.ok) throw Error("Cannot grant emulator admin");
  await page.goto(`${base}/admin`);
  await page.getByRole("button", { name: "Plano e Pix", exact: true }).click();
  await page.getByLabel("Nome do plano").fill("Plano QA");
  await page.getByLabel("Valor em reais").fill("49.90");
  await page.getByLabel("Duração do acesso em dias").fill("30");
  await page.getByLabel("Chave Pix").fill("qa@example.com");
  await page.getByLabel("Nome do favorecido").fill("Favorecido QA");
  await page
    .getByLabel("Disponibilizar contratação e renovação por Pix")
    .check();
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.locator(".admin-main > .notice")).toContainText(
    "Configuração salva",
  );
  const studentContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const student = await studentContext.newPage();
  const studentEmail = `billing-student-${Date.now()}@example.com`;
  await register(student, "Aluno QA", studentEmail);
  const studentAccounts = await (
    await fetch(
      `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer owner",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: [studentEmail] }),
      },
    )
  ).json();
  const studentUid = studentAccounts.users[0].localId;
  await fetch(
    `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents/trials/${studentUid}`,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer owner",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          startedAt: {
            timestampValue: new Date(Date.now() - 4 * 86400000).toISOString(),
          },
        },
      }),
    },
  );
  await student.goto(`${base}/admin`);
  await expect(
    student.getByText("Esta conta ainda não recebeu permissão"),
  ).toBeVisible();
  await student.goto(`${base}/app/nova`);
  await expect(student).toHaveURL(`${base}/app/assinatura`);
  await expect(
    student.getByText("qa@example.com", { exact: true }),
  ).toBeVisible();
  await student.getByLabel("Nome de quem fez o Pix").fill("Aluno QA");
  await student
    .getByLabel("Identificador da transação no comprovante")
    .fill("E-QA-001");
  await student.getByRole("button", { name: "Já paguei" }).click();
  await expect(
    student.getByRole("button", { name: "Pagamento aguardando conferência" }),
  ).toBeDisabled();
  await student.screenshot({
    path: "docs/qa/billing-student-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /^Pagamentos/ }).click();
  await expect(page.getByText("Plano QA ·").first()).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Confirmar recebimento e liberar" })
    .click();
  await expect(page.locator(".admin-main > .notice")).toContainText(
    "assinatura liberada",
  );
  await expect(student.getByText("Acesso liberado até")).toBeVisible();
  await student.goto(`${base}/app/nova`);
  await expect(student).toHaveURL(`${base}/app/nova`);
  await expect(
    student.getByRole("heading", { name: "Minha assinatura", exact: true }),
  ).toHaveCount(0);
  if (errors.length) throw Error(errors.join("\n"));
  await student.goto(`${base}/app/assinatura`);
  student.once("dialog", (dialog) => dialog.accept());
  await student
    .getByRole("button", { name: "Cancelar assinatura", exact: true })
    .click();
  await expect(
    student.getByRole("heading", { name: "Assinatura cancelada", exact: true }),
  ).toBeVisible();
  await expect(student.getByRole("button", { name: "Já paguei" })).toHaveCount(
    0,
  );
  await student.goto(`${base}/app/nova`);
  await expect(student).toHaveURL(`${base}/app/nova`);
  await student.goto(`${base}/app/assinatura`);
  await student.getByRole("button", { name: "Reativar assinatura" }).click();
  await expect(
    student.getByRole("heading", { name: "Você controla sua assinatura" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Alunos e acessos", exact: true })
    .click();
  await page.getByLabel("Buscar por e-mail exato").fill(studentEmail);
  await page
    .getByRole("button", { name: "Buscar alunos", exact: true })
    .click();
  const account = page
    .locator(".admin-student")
    .filter({ hasText: studentEmail });
  await account.getByRole("button", { name: "Gerenciar acesso" }).click();
  await account
    .getByLabel("Motivo da alteração")
    .fill("Liberação para treinamento supervisionado da equipe.");
  await account.getByLabel("Dias de liberação manual").fill("7");
  await account
    .getByRole("button", { name: "Liberar acesso por prazo" })
    .click();
  await expect(page.locator(".admin-main > .notice")).toContainText(
    "Acesso liberado por 7 dias.",
  );
  await student.goto(`${base}/app/assinatura`);
  await expect(
    student.getByText("Liberação administrativa vigente até", { exact: false }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await account
    .getByRole("button", { name: "Bloquear treinamentos", exact: true })
    .click();
  await expect(page.locator(".admin-main > .notice")).toContainText(
    "Acesso aos treinamentos bloqueado.",
  );
  await student.goto(`${base}/app/nova`);
  await expect(student).toHaveURL(`${base}/app/assinatura`);
  await expect(
    student.getByText("Acesso aos treinamentos bloqueado pelo administrador.", {
      exact: true,
    }),
  ).toBeVisible();
  await account
    .getByRole("button", { name: "Desbloquear treinamentos", exact: true })
    .click();
  await expect(page.locator(".admin-main > .notice")).toContainText(
    "Acesso aos treinamentos desbloqueado.",
  );
  await student.goto(`${base}/app/nova`);
  await expect(student).toHaveURL(`${base}/app/nova`);
  await page
    .getByRole("button", { name: "Histórico administrativo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Acesso liberado por prazo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page
    .getByLabel("E-mail de suporte aos alunos")
    .fill("suporte@example.com");
  await page.getByLabel("Pausar treinamentos para manutenção").check();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Salvar controles gerais" }).click();
  await expect(page.locator(".admin-main > .notice")).toContainText(
    "Controles gerais atualizados.",
  );
  await student.goto(`${base}/app/nova`);
  await expect(student).toHaveURL(`${base}/app/assinatura`);
  await expect(
    student.getByText("Os treinamentos estão pausados para manutenção.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByLabel("Pausar treinamentos para manutenção").uncheck();
  await page.getByRole("button", { name: "Salvar controles gerais" }).click();
  await expect(page.locator(".admin-main > .notice")).toContainText(
    "Controles gerais atualizados.",
  );
  await page.screenshot({
    path: "docs/qa/admin-general-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/qa/admin-general-mobile.png",
    fullPage: true,
  });
  if (errors.length) throw Error(errors.join("\n"));
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(`${base}/login`);
  await page.goto(`${base}/login`);
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na plataforma', exact: true }).click();
  await expect(page).toHaveURL(`${base}/admin`);
  await expect(page.getByRole('heading', { name: 'Central do administrador', exact: true })).toBeVisible();
  if (errors.length) throw Error(errors.join('\n'));
  console.log(
    "PASS: aligned landing, admin config, denied student admin, subscription gate, manual Pix request, approval, cancellation, reactivation, general admin, owner logout/login redirect, student grant/block, maintenance, audit and mobile flow",
  );
} finally {
  await browser?.close();
  server.kill();
}
