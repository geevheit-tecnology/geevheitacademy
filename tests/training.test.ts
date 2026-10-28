import { expect, it } from "vitest";
import {
  createMission,
  defaults,
  advance,
  requirements,
  saveProcessRecord,
  missionPosition,
  missionStages,
  resolveOccurrence,
  addOccurrence,
} from "../src/domain/mission";
import { configuredPrice } from "../src/domain/training";
import { enterprisePlan, recordValues } from "./fixtures/enterprise";
function step(m: ReturnType<typeof createMission>) {
  const prepared = saveProcessRecord(m, recordValues(m.step));
  return advance({
    ...prepared,
    checks: {
      ...prepared.checks,
      ...Object.fromEntries(
        requirements[m.step].map((_, i) => [`${m.step}:${i}`, true]),
      ),
    },
  });
}
it("comercial conclui no contrato em 12 processos e transporte começa no mapa em 10", () => {
  let commercial = createMission(
    { ...defaults, routePlan: enterprisePlan },
    2,
    { mode: "commercial" },
  );
  for (let i = 0; i < 12; i++) {
    expect(missionPosition(commercial)).toBe(i);
    commercial = step(commercial);
  }
  expect(commercial.completed).toBe(true);
  expect(commercial.step).toBe(11);
  expect(missionStages(commercial)).toHaveLength(12);
  const transport = createMission(
    { ...defaults, routePlan: enterprisePlan },
    2,
    { mode: "transport", expectedPackages: 100 },
  );
  expect(transport.step).toBe(25);
  expect(missionPosition(transport)).toBe(0);
  expect(missionStages(transport)).toHaveLength(10);
  expect(() =>
    createMission(defaults, 2, { mode: "transport", expectedPackages: 100 }),
  ).toThrow("rota");
});
it("intermediário gera desafio uma vez e exige resolução de todos os eventos para encerrar", () => {
  let m = createMission(
    { ...defaults, difficulty: "Intermediária", routePlan: enterprisePlan },
    2,
    { mode: "commercial" },
  );
  while (m.step < 10) m = step(m);
  expect(m.occurrences).toHaveLength(1);
  expect(() => step(m)).toThrow("impeditivas");
  m = resolveOccurrence(
    m,
    m.occurrences[0].id,
    "Cadastro conferido com o cliente",
  );
  m = step(m);
  m = addOccurrence(m, "despesa", "Custo adicional identificado");
  expect(() => step(m)).toThrow("todas as ocorrências");
  m = resolveOccurrence(
    m,
    m.occurrences.at(-1)!.id,
    "Custo conciliado e aprovado",
  );
  expect(step(m).completed).toBe(true);
});
it("avançado exige justificativa detalhada e iniciante não recebe incidentes automáticos", () => {
  let beginner = createMission({ ...defaults, routePlan: enterprisePlan });
  for (let i = 0; i < 11; i++) beginner = step(beginner);
  expect(beginner.occurrences).toHaveLength(0);
  let advanced = createMission(
    { ...defaults, difficulty: "Avançada", routePlan: enterprisePlan },
    2,
    { mode: "commercial" },
  );
  while (advanced.step < 9) advanced = step(advanced);
  expect(advanced.occurrences[0].kind).toBe("despesa");
  expect(() =>
    resolveOccurrence(advanced, advanced.occurrences[0].id, "feito"),
  ).toThrow("20 caracteres");
  expect(
    resolveOccurrence(
      advanced,
      advanced.occurrences[0].id,
      "Despesa conciliada com o cliente e custo aprovado",
    ).occurrences[0].resolved,
  ).toBe(true);
});
it("configura margem sobre receita e acréscimo sobre custo com fórmulas diferentes", () => {
  expect(configuredPrice(1000, "Margem sobre a receita", 20)).toBe(1250);
  expect(configuredPrice(1000, "Acréscimo sobre o custo", 20)).toBe(1200);
  expect(() => configuredPrice(1000, "Margem sobre a receita", 100)).toThrow(
    "inferior",
  );
});
it('conclui transporte em 10 processos com volumes, movimento e comprovante', async () => {
  const { travelNextLeg, missionProgress, stageTravelLimit } = await import('../src/domain/mission');
  let m = createMission({ ...defaults, routePlan: enterprisePlan }, 2, { mode: 'transport', expectedPackages: 100 });
  for (let index = 0; index < 10; index++) {
    expect(missionPosition(m)).toBe(index);
    m = saveProcessRecord(m, recordValues(m.step));
    m = { ...m, checks: { ...m.checks, ...Object.fromEntries(requirements[m.step].map((_, i) => [`${m.step}:${i}`, true])) } };
    if (m.step <= 28) while (missionProgress(m) < stageTravelLimit(m.step) - 1e-6) m = travelNextLeg(m);
    m = advance(m);
  }
  expect(m.step).toBe(34); expect(m.completed).toBe(true); expect(Object.keys(m.processRecords!)).toHaveLength(10); expect(m.journeyProgress).toBe(1);
});
