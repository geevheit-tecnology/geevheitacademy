import { chromium, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  deleteUser,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  deleteDoc,
  connectFirestoreEmulator,
} from "firebase/firestore";
const baseUrl = process.env.QA_BASE_URL || "http://localhost:5173";
const emulators = process.env.QA_EMULATORS === "1";
const email = `qa-transportsim-${Date.now()}@example.com`;
const password = crypto.randomUUID() + "Qa9!";
const browser = await chromium.launch({
  executablePath:
    "/Users/getulio/.cache/puppeteer/chrome-headless-shell/mac-146.0.7680.153/chrome-headless-shell-mac-x64/chrome-headless-shell",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let created = false,
  missionId;
await mkdir("docs/qa", { recursive: true });
try {
  await page.goto(`${baseUrl}/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "cada decisão",
  );
  await page.screenshot({
    path: "docs/qa/landing-desktop.png",
    fullPage: true,
  });
  for (const url of ["/", "/login", "/ajuda"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}${url}`);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }
  await page.screenshot({ path: "docs/qa/help-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`${baseUrl}/cadastro`);
  await page.getByLabel("Nome", { exact: true }).fill("QA Automatizado");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 30000 });
  created = true;
  await expect(page.getByRole("heading", { name: "Olá, QA." })).toBeVisible({
    timeout: 20000,
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Olá, QA." })).toBeVisible({
    timeout: 20000,
  });
  await page
    .getByRole("link", { name: "Nova missão", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Nome da missão", { exact: true })
    .fill("QA Ciclo completo");
  await page
    .getByRole("button", { name: "Adicionar ponto intermediário", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: /Ponto intermediário 1 — UF/ })
    .selectOption("RJ");
  await expect(
    page.getByRole("combobox", { name: /Ponto intermediário 1 — cidade/ }),
  ).toBeEnabled({ timeout: 25000 });
  await page
    .getByRole("combobox", { name: /Ponto intermediário 1 — cidade/ })
    .selectOption({ label: "Resende" });
  await page
    .getByRole("button", { name: "Calcular e aplicar rota", exact: true })
    .click();
  await expect(
    page.getByText(
      "Rota calculada e aplicada. Distância atualizada no orçamento.",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 45000 });
  await page.getByRole("button", { name: "Criar e iniciar missão" }).click();
  await expect(page).toHaveURL(/\/app\/operacao\//, { timeout: 30000 });
  missionId = page.url().split("/").at(-1);
  await page.getByRole("button", { name: "Ocorrências", exact: true }).click();
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Pane simulada para validação");
  await page
    .getByRole("button", { name: "Registrar ocorrência", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pane mecânica", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Ação corretiva / comunicação")
    .fill("Reparo realizado e motorista comunicado");
  await page.getByRole("button", { name: "Registrar resolução" }).click();
  await expect(
    page.getByText("Resolvida • hora simulada", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Operação", exact: true }).click();
  for (let step = 1; step <= 40; step++) {
    await expect(
      page.getByText(`ETAPA ${step} DE 40`, { exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".stage-guide")).toContainText(
      "O que fazer agora",
    );
    if (step === 10)
      await page.getByRole("button", { name: "Fechar negociação" }).click();
    const record = page.locator(".process-record");
    const numbers = {
      "Peso da carga em toneladas": "12",
      "Capacidade útil em toneladas": "14",
      "Diesel em R$/litro": "6.1",
      "Pedágios previstos em R$": "90",
      "Reserva de manutenção em R$": "120",
      "Preço proposto em R$": "5200",
      "Frete final negociado em R$": "5200",
      "Margem mínima desejada em %": "10",
      "Limite de crédito aprovado em R$": "10000",
      "Horas de direção por jornada planejada": "8",
      "Prazo contratado em horas": "24",
      "Volumes conferidos": "100",
      "Volumes recebidos": "100",
      "Valor recebido de treinamento em R$": "5200",
    };
    const fields = record.locator("input");
    for (let i = 0; i < (await fields.count()); i++) {
      const input = fields.nth(i);
      const label = (await input.locator("..").innerText()).trim();
      await input.fill(
        (await input.getAttribute("type")) === "number"
          ? (numbers[label] ?? "1")
          : `Registro de treinamento ${step}`,
      );
    }
    const choices = record.locator("select");
    for (let i = 0; i < (await choices.count()); i++)
      await choices.nth(i).selectOption({ index: 1 });
    await record
      .getByRole("button", { name: "Salvar registro da etapa" })
      .click();
    await expect(record.getByRole("status")).toHaveText(
      "Registro salvo na missão.",
    );
    const checks = page.locator(".check-row input");
    const count = await checks.count();
    for (let i = 0; i < count; i++) {
      await expect(checks.nth(i)).toBeEnabled();
      await checks.nth(i).check();
      await expect(
        page.getByText("Sincronizado com a nuvem", { exact: true }),
      ).toBeVisible({ timeout: 20000 });
    }
    if (step >= 26 && step <= 29) {
      const move = page.getByRole("button", {
        name: "Avançar na viagem",
        exact: true,
      });
      await expect(move).toBeEnabled({ timeout: 20000 });
      while (await move.count()) {
        await move.click();
        await expect
          .poll(() =>
            page
              .locator(".operation-map-column .leaflet-host")
              .evaluate((el) => {
                const r = el.getBoundingClientRect();
                return r.top >= 0 && r.bottom <= window.innerHeight;
              }),
          )
          .toBe(true);

        await expect(
          page.getByText("Sincronizado com a nuvem", { exact: true }),
        ).toBeVisible({ timeout: 20000 });
      }
      await expect(
        page.getByRole("button", {
          name:
            step === 29
              ? "Chegada ao destino registrada"
              : "Percurso desta etapa concluído",
          exact: true,
        }),
      ).toBeVisible();
      if (step === 26 || step === 29)
        await page.screenshot({
          path: `docs/qa/travel-stage-${step}.png`,
          fullPage: true,
        });
    }
    await page
      .getByRole("button", {
        name: step === 40 ? "Concluir treinamento" : "Concluir etapa e avançar",
        exact: true,
      })
      .click();
    await expect(page.locator(".stage-notice")).toBeVisible({ timeout: 20000 });
    if (step === 1) {
      await expect(page.locator(".stage-notice")).not.toBeVisible({
        timeout: 7000,
      });
      await page
        .getByRole("button", { name: "Explicação rápida", exact: true })
        .click();
      await expect(page.locator(".stage-notice")).toBeVisible();
      await page
        .getByRole("button", { name: "Fechar explicação da etapa" })
        .click();
      await expect(page.locator(".stage-notice")).not.toBeVisible();
    }
  }
  await expect(
    page.getByRole("button", { name: "Treinamento concluído" }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByText("Sincronizado com a nuvem", { exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Resultado", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "92 / 100 pontos" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/qa/result-desktop.png", fullPage: true });
  const second = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const secondPage = await second.newPage();
  await secondPage.goto(`${baseUrl}/login`);
  await secondPage.getByLabel("E-mail", { exact: true }).fill(email);
  await secondPage.getByLabel("Senha", { exact: true }).fill(password);
  await secondPage
    .getByRole("button", { name: "Entrar na plataforma" })
    .click();
  await expect(secondPage).toHaveURL(/\/app$/, { timeout: 30000 });
  await secondPage.goto(`${baseUrl}/app/historico`);
  await secondPage.getByRole("link", { name: /QA Ciclo completo/ }).click();
  await expect(
    secondPage.getByRole("heading", { name: "QA Ciclo completo", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    secondPage.getByRole("button", { name: "Treinamento concluído" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      secondPage.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await secondPage.locator(".operation-checklist").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      secondPage
        .locator(".operation-map-column .leaflet-host")
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight;
        }),
    )
    .toBe(true);
  await secondPage.screenshot({
    path: "docs/qa/operation-mobile.png",
    fullPage: true,
  });
  await second.close();
  await page.goto(`${baseUrl}/app/perfil`);
  await expect(
    page.getByRole("heading", { name: "QA Automatizado" }),
  ).toBeVisible();
  await expect(page.locator(".panel")).not.toContainText(
    /Firebase|Authentication|Identificador da conta/,
  );
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15000 });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    `${emulators ? "EMULADORES" : "FIREBASE REAL"}: ` +
      "PASS: desktop/celular sem overflow; cadastro real; sessão após reload; ocorrência e resolução; 40 processos; relatório; histórico e recuperação em segundo contexto; logout; zero erros JavaScript.",
  );
} catch (error) {
  await page.screenshot({ path: "docs/qa/map-qa-failure.png", fullPage: true });
  console.error("JavaScript errors:", errors);
  console.error(
    await page.locator("select").evaluateAll((nodes) =>
      nodes.map((n) => ({
        label: n.parentElement?.firstChild?.textContent,
        options: n.options.length,
        value: n.value,
      })),
    ),
  );
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  if (created) {
    const env = Object.fromEntries(
      (await readFile(".env.local", "utf8"))
        .trim()
        .split("\n")
        .map((l) => l.split("=")),
    );
    const app = initializeApp(
      {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: emulators
          ? "demo-transportsim360"
          : env.VITE_FIREBASE_PROJECT_ID,
        appId: env.VITE_FIREBASE_APP_ID,
      },
      "qa-cleanup",
    );
    const auth = getAuth(app);
    const db = getFirestore(app);
    if (emulators) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    if (missionId)
      for (const collection of ["missions", "results", "history"])
        await deleteDoc(doc(db, "users", user.uid, collection, missionId));
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(user);
    await deleteApp(app);
    console.log("Conta e dados sintéticos de QA removidos.");
  }
}
