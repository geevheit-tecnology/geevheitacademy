import { expect, it } from "vitest";
import {
  negotiationContext,
  evaluateNegotiation,
} from "../src/domain/negotiation";
import { saveProcessRecord } from "../src/domain/mission";
import { missionAt } from "./fixtures/enterprise";
it("preserva margem, evita proposta acima do orçamento e aplica o acordo ao frete", () => {
  const mission = missionAt(9);
  const context = negotiationContext(mission);
  expect(context.proposal).toBe(5200);
  expect(context.requested).toBe(4784);
  expect(
    evaluateNegotiation(
      mission,
      context.minimum - 0.01,
      "Desconto sem cobertura dos custos",
    ).accepted,
  ).toBe(false);
  expect(
    evaluateNegotiation(mission, 6000, "Aumento do preço originalmente enviado")
      .accepted,
  ).toBe(false);
  const accepted = evaluateNegotiation(
    mission,
    context.requested,
    "Concessão comercial sem alterar escopo ou prazo",
  );
  expect(accepted.accepted).toBe(true);
  const saved = saveProcessRecord(mission, {
    freight: String(context.requested),
    concession: accepted.concession,
  });
  expect(saved.input.freight).toBe(4784);
  expect(saved.processRecords!["9"].values.concession).toContain(
    "Concessão comercial",
  );
});
it("recusa propostas inválidas e argumentos incompletos", () => {
  const mission = missionAt(9);
  expect(() =>
    evaluateNegotiation(mission, NaN, "Condição comercial acordada"),
  ).toThrow("válido");
  expect(() =>
    evaluateNegotiation(mission, 0, "Condição comercial acordada"),
  ).toThrow("válido");
  expect(() => evaluateNegotiation(mission, 5200, "ok")).toThrow("Explique");
});
