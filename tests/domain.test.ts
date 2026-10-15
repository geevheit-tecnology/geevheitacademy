import { describe, it, expect } from "vitest";
import {
  defaults,
  calculate,
  createMission,
  advance,
  requirements,
  addOccurrence,
  resolveOccurrence,
  score,
  routes,
} from "../src/domain/mission";
describe("motor logístico", () => {
  it("calcula combustível sem arredondamento intermediário", () => {
    const c = calculate(defaults);
    expect(c.liters).toBe(485 / 3.5);
    expect(c.costs.combustivel).toBe((485 / 3.5) * 6.1);
    expect(c.costs.pedagios).toBe(90);
    expect(c.total).toBe(Object.values(c.costs).reduce((s, v) => s + v, 0));
    expect(c.profit).toBe(defaults.freight - c.total);
    expect(c.margin).toBe((c.profit / defaults.freight) * 100);
  });
  it("evita divisão por zero e valores não finitos", () => {
    for (const field of [
      "consumption",
      "speed",
      "pauseEvery",
      "shiftHours",
      "distance",
    ])
      expect(() => calculate({ ...defaults, [field]: 0 })).toThrow();
    expect(() => calculate({ ...defaults, freight: -1 })).toThrow();
    expect(() => calculate({ ...defaults, diesel: Infinity })).toThrow();
    expect(() => calculate({ ...defaults, name: "" })).toThrow();
    expect(calculate({ ...defaults, freight: 0 }).margin).toBe(0);
  });
  it("não duplica pausa no limite entre jornadas", () => {
    const c = calculate({
      ...defaults,
      distance: 960,
      speed: 60,
      shiftHours: 8,
      pauseEvery: 4,
    });
    expect(c.driving).toBe(16);
    expect(c.pauses).toBe(1);
    expect(c.rest).toBe(11);
    expect(c.totalHours).toBe(16 + 1 + 11 + 1.5 + 1);
  });
  it("rotas alteram custo e tempo", () => {
    const results = Object.entries(routes).map(([route, r]) =>
      calculate({
        ...defaults,
        route: route as keyof typeof routes,
        distance: r.distance,
        speed: r.speed,
        toll: r.toll,
      }),
    );
    expect(new Set(results.map((r) => r.total)).size).toBe(3);
    expect(new Set(results.map((r) => r.totalHours)).size).toBe(3);
  });
  it("não descansa após chegar no limite exato da jornada", () => {
    const c = calculate({ ...defaults, distance: 480, speed: 60 });
    expect(c.rest).toBe(0);
    expect(c.pauses).toBe(0.5);
  });
});
describe("máquina de estados e consequências", () => {
  it("bloqueia avanço sem checklist", () =>
    expect(() => advance(createMission(defaults))).toThrow("checklist"));
  it("bloqueia pane e mantém custos uma única vez após resolução repetida", () => {
    let m = createMission(defaults);
    m = { ...m, checks: { "0:0": true } };
    m = addOccurrence(m, "pane", "Falha no motor");
    expect(() => advance(m)).toThrow("impeditivas");
    const before = calculate(m.input, m.occurrences);
    m = resolveOccurrence(m, m.occurrences[0].id, "Reparo realizado");
    m = resolveOccurrence(m, m.occurrences[0].id, "Reparo confirmado");
    expect(calculate(m.input, m.occurrences).total).toBe(before.total);
    expect(advance(m).step).toBe(1);
  });
  it("conclui todas as etapas e impede alteração da missão final", () => {
    let m = createMission(defaults);
    for (let step = 0; step < 20; step++) {
      expect(m.step).toBe(step);
      m = {
        ...m,
        checks: {
          ...m.checks,
          ...Object.fromEntries(
            requirements[step].map((_, i) => [`${step}:${i}`, true]),
          ),
        },
      };
      m = advance(m);
    }
    expect(m.completed).toBe(true);
    expect(score(m).value).toBe(100);
    expect(() => advance(m)).toThrow("concluída");
    expect(() => addOccurrence(m, "pane", "Falha tardia")).toThrow();
  });
  it("pontuação explica os descontos e respeita limite inferior", () => {
    let m = createMission({ ...defaults, freight: 0, deadline: 1 });
    for (let i = 0; i < 20; i++) m = addOccurrence(m, "pane", "Falha de teste");
    const s = score(m);
    expect(s.value).toBe(0);
    expect(s.deductions.decisions).toBe(260);
    expect(s.deductions.margin).toBe(10);
    expect(s.deductions.deadline).toBe(15);
  });
});
