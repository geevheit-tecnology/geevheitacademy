// Complete enterprise workflow against local emulators, with deterministic road routing.
import { spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";
const base = "http://localhost:5177";
const server = spawn(
  "npm",
  ["run", "dev", "--", "--port", "5177", "--strictPort"],
  {
    stdio: "ignore",
    env: {
      ...process.env,
      VITE_FIREBASE_PROJECT_ID: "demo-transportsim360",
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
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/route/v1/driving/**", (route) =>
    route.fulfill({
      json: {
        code: "Ok",
        routes: [
          {
            distance: 485000,
            duration: 28000,
            geometry: {
              coordinates: [
                [-46.6333, -23.5505],
                [-45.3, -22.8],
                [-43.1729, -22.9068],
              ],
            },
            legs: [{ distance: 485000, duration: 28000 }],
          },
        ],
      },
    }),
  );
  const email = `enterprise-${Date.now()}@example.com`;
  const password = "EnterpriseQa123!";
  await page.goto(`${base}/cadastro`);
  await page.getByLabel("Nome", { exact: true }).fill("Operador Empresa");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(`${base}/app`);
  await page.goto(`${base}/admin`);
  await expect(
    page.getByText("Esta conta ainda não recebeu permissão"),
  ).toBeVisible();
  await page.goto(`${base}/app/nova`);
  await page
    .getByLabel("Nome da missão", { exact: true })
    .fill("Transportadora de grande porte QA");
  await page.getByRole("button", { name: "Criar e iniciar missão" }).click();
  await expect(page).toHaveURL(/\/app\/operacao\//);
  const missionUrl = page.url();
  const numeric = {
    "Peso da carga em toneladas": "12",
    "Capacidade útil em toneladas": "14",
    "Diesel em R$/litro": "6.1",
    "Pedágios previstos em R$": "90",
    "Reserva de manutenção em R$": "120",
    "Preço proposto em R$": "5200",
    "Frete final negociado em R$": "5200",
    "Margem mínima desejada em %": "10",
    "Limite de crédito aprovado em R$": "10000",
    "Prazo contratado em horas": "24",
    "Horas de direção por jornada planejada": "8",
    "Volumes conferidos": "100",
    "Volumes recebidos": "100",
    "Valor recebido de treinamento em R$": "5200",
  };
  const sync = () =>
    expect(
      page.getByText("Sincronizado com a nuvem", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
  for (let step = 0; step < 40; step++) {
    await expect(
      page.getByText(`ETAPA ${step + 1} DE 40`, { exact: true }),
    ).toBeVisible();
    if (step === 9) {
      const negotiation = page.getByRole("dialog", {
        name: "Negocie com o cliente",
      });
      await expect(negotiation).toBeVisible();
      await expect(negotiation.getByRole("log")).toContainText(
        "Recebi a proposta",
      );
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await negotiation.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await negotiation.getByLabel("Sua contraproposta em R$").fill("1");
      await negotiation
        .getByLabel("Como você justifica essa condição?")
        .fill("Ofereço desconto para fechar a operação.");
      await negotiation
        .getByRole("button", { name: "Apresentar contraproposta" })
        .click();
      await expect(negotiation.getByRole("log")).toContainText(
        "compromete a operação",
      );
      await negotiation
        .getByRole("button", { name: "Defender o valor da proposta" })
        .click();
      await expect(
        negotiation.getByText("Com essa justificativa", { exact: false }),
      ).toBeVisible();
      await negotiation.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({
        path: "docs/qa/negotiation-mobile.png",
        fullPage: false,
      });
      await page.setViewportSize({ width: 1366, height: 900 });
      await negotiation.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({
        path: "docs/qa/negotiation-desktop.png",
        fullPage: false,
      });
      await negotiation
        .getByRole("button", { name: "Registrar acordo na missão" })
        .click();
      await expect(negotiation).not.toBeVisible();
      await sync();
      await expect(
        page
          .locator(".process-record")
          .getByLabel("Frete final negociado em R$"),
      ).toHaveValue("5200");
      await page.reload();
      await expect(page.locator(".negotiation-scene")).toContainText(
        "Acordo registrado",
      );
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await page.getByRole("button", { name: "Reabrir negociação" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
    if (step === 25) {
      await expect(page.locator(".negotiation-scene")).toHaveCount(0);
      await expect(
        page.locator(".operation-map-column .leaflet-host"),
      ).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    if (step === 5) {
      await page
        .getByRole("button", { name: "Configurar trechos", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Calcular e aplicar rota", exact: true })
        .click();
      await expect(
        page.getByText(
          "Rota calculada e aplicada. Distância atualizada no orçamento.",
          { exact: true },
        ),
      ).toBeVisible();
      await sync();
      await page
        .getByRole("button", {
          name: "Fechar configuração de trechos",
          exact: true,
        })
        .click();
    }
    const form = page.locator(".process-record");
    const inputs = form.locator("input");
    for (let i = 0; i < (await inputs.count()); i++) {
      const input = inputs.nth(i);
      const label = (await input.locator("..").innerText()).trim();
      const type = await input.getAttribute("type");
      await input.fill(
        type === "number"
          ? (numeric[label] ?? "1")
          : `Registro de treinamento ${step + 1}`,
      );
    }
    const selects = form.locator("select");
    for (let i = 0; i < (await selects.count()); i++)
      await selects.nth(i).selectOption({ index: 1 });
    if (step === 7 || step === 14 || step === 37) {
      const label =
        step === 7
          ? "Preço proposto em R$"
          : step === 14
            ? "Capacidade útil em toneladas"
            : "Valor recebido de treinamento em R$";
      await form.getByLabel(label, { exact: true }).fill("1");
      await form
        .getByRole("button", { name: "Salvar registro da etapa" })
        .click();
      await expect(form.getByRole("alert")).toBeVisible();
      await form.getByLabel(label, { exact: true }).fill(numeric[label]);
    }
    await form
      .getByRole("button", { name: "Salvar registro da etapa" })
      .click();
    await expect(form.getByRole("status")).toHaveText(
      "Registro salvo na missão.",
    );
    await sync();
    const checks = page.locator(".check-row input");
    for (let i = 0; i < (await checks.count()); i++) {
      await checks.nth(i).check();
      await sync();
    }
    if (step >= 25 && step <= 28) {
      const move = page.getByRole("button", {
        name: "Avançar na viagem",
        exact: true,
      });
      for (let i = 0; i < 12 && (await move.count()); i++) {
        await move.click();
        await sync();
      }
      await expect(
        page.getByRole("button", {
          name:
            step === 28
              ? "Chegada ao destino registrada"
              : "Percurso desta etapa concluído",
          exact: true,
        }),
      ).toBeVisible();
    }
    if (step === 0 || step === 14 || step === 25 || step === 37) {
      await page.setViewportSize({
        width: step === 14 ? 390 : 1366,
        height: 900,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `docs/qa/enterprise-stage-${step + 1}.png`,
        fullPage: true,
      });
      await page.setViewportSize({ width: 1366, height: 900 });
    }
    if (step === 14) {
      await page.reload();
      await expect(
        page.locator(".process-record").getByRole("status"),
      ).toHaveText("Registro salvo na missão.");
    }
    await page
      .getByRole("button", {
        name: step === 39 ? "Concluir treinamento" : "Concluir etapa e avançar",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("button", { name: "Treinamento concluído" }),
  ).toBeVisible();
  await sync();
  await page.getByRole("button", { name: "Resultado", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "100 / 100 pontos" }),
  ).toBeVisible();
  await expect(page.locator(".process-history details")).toHaveCount(40);
  await page.reload();
  await page.getByRole("button", { name: "Resultado", exact: true }).click();
  await expect(page.locator(".process-history details")).toHaveCount(40);
  await page.goto(`${base}/app/historico`);
  await expect(
    page.getByRole("link", { name: /Transportadora de grande porte QA/ }),
  ).toBeVisible();
  const other = await browser.newPage();
  await other.goto(`${base}/login`);
  await other.getByLabel("E-mail", { exact: true }).fill(email);
  await other.getByLabel("Senha", { exact: true }).fill(password);
  await other.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(other).toHaveURL(`${base}/app`);
  await other.goto(missionUrl);
  await expect(
    other.getByRole("button", { name: "Treinamento concluído" }),
  ).toBeVisible();
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: negociação em diálogo desktop/mobile, acordo persistido, mapa no transporte; 40 processos, registros obrigatórios, preço/margem, capacidade, recebimento, viagem, retomada, histórico, segundo navegador e mobile sem overflow.",
  );
} finally {
  await browser?.close();
  server.kill();
}
