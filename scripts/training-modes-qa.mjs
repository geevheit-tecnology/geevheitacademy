// Local emulators only. No real customer data or payments.
import { spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";
const base = "http://localhost:5178";
const server = spawn(
  "npm",
  ["run", "dev", "--", "--port", "5178", "--strictPort"],
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
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
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
  await page.goto(base);
  const counter = page.getByLabel("Quilômetros percorridos na demonstração");
  await expect
    .poll(async () => Number((await counter.innerText()).replace(",", ".")))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pausar demonstração" }).click();
  const stopped = await counter.innerText();
  await page.waitForTimeout(1100);
  expect(await counter.innerText()).toBe(stopped);
  await page.screenshot({
    path: "docs/qa/correcao-landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/qa/correcao-landing-mobile.png",
    fullPage: true,
  });
  await page.goto(`${base}/manual`);
  await expect(
    page.getByRole("heading", {
      name: "Como conduzir uma sessão com sua equipe",
    }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${base}/cadastro`);
  await page.getByLabel("Nome", { exact: true }).fill("Equipe QA");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`training-${Date.now()}@example.com`);
  await page.getByLabel("Senha", { exact: true }).fill("TrainingQa123!");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(`${base}/app`);
  await page.goto(`${base}/app/assinatura`);
  await expect(
    page.getByRole("heading", { name: "Seu período de teste está ativo" }),
  ).toBeVisible();
  const sync = () =>
    expect(
      page.getByText("Sincronizado com a nuvem", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
  const numeric = {
    "Peso da carga em toneladas": "12",
    "Capacidade útil em toneladas": "14",
    "Diesel em R$/litro": "6.1",
    "Pedágios previstos em R$": "90",
    "Reserva de manutenção em R$": "120",
    "Preço proposto em R$": "5200",
    "Frete final negociado em R$": "5200",
    "Margem mínima desejada em %": "10",
    "Percentual para cálculo do preço": "20",
    "Limite de crédito aprovado em R$": "10000",
    "Horas de direção por jornada planejada": "8",
    "Prazo contratado em horas": "24",
    "Volumes conferidos": "100",
    "Volumes recebidos": "100",
    "Valor recebido de treinamento em R$": "5200",
  };
  for (const mode of ["commercial", "transport"]) {
    await page.goto(`${base}/app/nova`);
    await page
      .getByRole("radio", {
        name:
          mode === "commercial" ? /Somente comercial/ : /Somente transporte/,
      })
      .check();
    await page
      .getByLabel("Nome da missão", { exact: true })
      .fill(`QA modo ${mode}`);
    await page
      .getByLabel("Dificuldade", { exact: true })
      .selectOption(mode === "commercial" ? "Avançada" : "Iniciante");
    await page
      .getByRole("button", { name: "Calcular e aplicar rota", exact: true })
      .click();
    await expect(
      page.getByText(
        "Rota calculada e aplicada. Distância atualizada no orçamento.",
        { exact: true },
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Criar e iniciar missão" }).click();
    await expect(page).toHaveURL(/\/app\/operacao\//);
    const first = mode === "commercial" ? 0 : 25;
    const count = mode === "commercial" ? 12 : 10;
    for (let index = 0; index < count; index++) {
      const step = first + index;
      await expect(
        page.getByText(`ETAPA ${index + 1} DE ${count}`, { exact: true }),
      ).toBeVisible();
      if (step === 9)
        await page.getByRole("button", { name: "Fechar negociação" }).click();
      const form = page.locator(".process-record");
      const inputs = form.locator("input");
      for (let i = 0; i < (await inputs.count()); i++) {
        const input = inputs.nth(i);
        const label = (await input.locator("..").innerText()).trim();
        await input.fill(
          (await input.getAttribute("type")) === "number"
            ? (numeric[label] ?? "1")
            : `Registro de treinamento ${step}`,
        );
      }
      const selects = form.locator("select");
      for (let i = 0; i < (await selects.count()); i++)
        await selects.nth(i).selectOption({ index: 1 });
      if (step === 7) {
        await form
          .getByLabel("Método de precificação")
          .selectOption("Margem sobre a receita");
        await form
          .getByRole("button", { name: "Calcular e aplicar preço" })
          .click();
        expect(
          Number(await form.getByLabel("Preço proposto em R$").inputValue()),
        ).toBeGreaterThan(0);
        await form
          .getByLabel("Método de precificação")
          .selectOption("Preço definido");
        await form.getByLabel("Preço proposto em R$").fill("5200");
      }
      await form
        .getByRole("button", { name: "Salvar registro da etapa" })
        .click();
      await expect(form.getByRole("status")).toHaveText(
        "Registro salvo na missão.",
      );
      await sync();
      if (mode === "commercial" && (step === 9 || step === 10)) {
        await page
          .getByRole("button", { name: "Ocorrências", exact: true })
          .click();
        await expect(page.locator(".occurrence")).not.toHaveCount(0);
        const pending = page.locator(".occurrence form");
        while (await pending.count()) {
          await pending
            .first()
            .getByLabel("Ação corretiva / comunicação")
            .fill(
              "Dados conferidos, custo conciliado e cliente comunicado sobre a solução.",
            );
          await pending
            .first()
            .getByRole("button", { name: "Registrar resolução" })
            .click();
          await sync();
        }
        await page
          .getByRole("button", { name: "Operação", exact: true })
          .click();
      }
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
      }
      if (index === 0)
        await page.screenshot({
          path: `docs/qa/mode-${mode}.png`,
          fullPage: true,
        });
      await page
        .getByRole("button", {
          name:
            index === count - 1
              ? "Concluir treinamento"
              : "Concluir etapa e avançar",
          exact: true,
        })
        .click();
    }
    await expect(
      page.getByRole("button", { name: "Treinamento concluído" }),
    ).toBeVisible();
    await sync();
    await page.getByRole("button", { name: "Resultado", exact: true }).click();
    await expect(page.locator(".process-history details")).toHaveCount(count);
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: animação e pausa, landing desktop/mobile, manual, teste grátis, comercial avançado com desafios e precificação, transporte com 10 etapas e histórico.",
  );
} finally {
  await browser?.close();
  server.kill();
}
