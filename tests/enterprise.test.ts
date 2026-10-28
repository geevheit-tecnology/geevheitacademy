import { describe, expect, it } from "vitest";
import {
  advance,
  reopenPlanning,
  calculate,
  createMission,
  defaults,
  legacyStages,
  missionStages,
  saveProcessRecord,
  score,
  stages,
  travelNextLeg,
} from "../src/domain/mission";
import { enterpriseWorkflow } from "../src/domain/workflow";
import { completeStage, missionAt, recordValues } from "./fixtures/enterprise";
describe("transportadora com 40 processos", () => {
  it("exige registro do processo mesmo com checklist concluído", () => {
    const m = { ...createMission(defaults), checks: { "0:0": true } };
    expect(() => advance(m)).toThrow("Preencha");
    expect(() =>
      saveProcessRecord(m, { ...recordValues(0), unexpected: "x" }),
    ).toThrow("não pertence");
  });
  it("cobre preço, crédito, capacidade e recebimento com consequências", () => {
    const pricing = missionAt(7);
    expect(() =>
      saveProcessRecord(pricing, { ...recordValues(7), freight: "1" }),
    ).toThrow("margem");
    const negotiated = saveProcessRecord(missionAt(9), {
      ...recordValues(9),
      freight: "6000",
    });
    expect(negotiated.input.freight).toBe(6000);
    expect(calculate(negotiated.input).profit).toBe(
      6000 - calculate(negotiated.input).total,
    );
    expect(() =>
      saveProcessRecord(missionAt(10), {
        ...recordValues(10),
        creditLimit: "100",
      }),
    ).toThrow("crédito");
    expect(() =>
      saveProcessRecord(missionAt(14), { ...recordValues(14), capacity: "5" }),
    ).toThrow("Capacidade");
    expect(() =>
      saveProcessRecord(missionAt(37), {
        ...recordValues(37),
        receivedAmount: "100",
      }),
    ).toThrow("quitar");
  });
  it("exige rota aplicada, impede saída atrasada e controla viagem nas etapas corretas", () => {
    const planning = { ...missionAt(5), input: defaults };
    const m = saveProcessRecord(planning, recordValues(5));
    expect(() =>
      advance({ ...m, checks: { ...m.checks, "5:0": true } }),
    ).toThrow("rota");
    let release = saveProcessRecord(missionAt(24), recordValues(24));
    release = {
      ...release,
      input: { ...release.input, deadline: 1 },
      checks: { ...release.checks, "24:0": true },
    };
    expect(() => advance(release)).toThrow("prazo");
    expect(() => travelNextLeg(missionAt(24))).toThrow("Transporte");
    expect(() =>
      advance({ ...missionAt(25), checks: { "25:0": true } }),
    ).toThrow("viagem");
  });
  it("replaneja antes da saída e invalida os registros posteriores", () => {
    const before = missionAt(24);
    const rewound = reopenPlanning(before, 9);
    expect(rewound.step).toBe(9);
    expect(Object.keys(rewound.processRecords!)).toHaveLength(9);
    expect(rewound.processRecords!["8"]).toEqual(before.processRecords!["8"]);
    expect(rewound.processRecords!["9"]).toBeUndefined();
    expect(
      Object.keys(rewound.checks).every((key) => Number(key.split(":")[0]) < 9),
    ).toBe(true);
    expect(() => reopenPlanning(missionAt(25), 9)).toThrow("antes da saída");
  });
  it("completa 40 processos com registros, POD, viagem e nota final, preservando o fluxo antigo", () => {
    let m = createMission(missionAt(0).input);
    expect(enterpriseWorkflow).toHaveLength(40);
    expect(new Set(stages).size).toBe(40);
    expect(missionStages(createMission(defaults, 1))).toBe(legacyStages);
    for (let step = 0; step < 40; step++) {
      expect(m.step).toBe(step);
      m = completeStage(m);
    }
    expect(m.completed).toBe(true);
    expect(m.step).toBe(39);
    expect(Object.keys(m.processRecords!)).toHaveLength(40);
    expect(m.journeyProgress).toBe(1);
    expect(score(m).value).toBe(100);
    expect(() => saveProcessRecord(m, recordValues(39))).toThrow(
      "indisponível",
    );
  });
});
