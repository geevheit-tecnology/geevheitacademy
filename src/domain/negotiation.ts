import { calculate, type Mission } from "./mission";
export const negotiationMoney = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function negotiationContext(mission: Mission) {
  const costs = calculate(mission.input, mission.occurrences).total;
  const targetMargin = Number(
    mission.processRecords?.["7"]?.values.targetMargin ?? 0,
  );
  const proposal = Number(
    mission.processRecords?.["7"]?.values.freight ?? mission.input.freight,
  );
  const minimum = Math.ceil((costs / (1 - targetMargin / 100)) * 100) / 100;
  return {
    costs,
    targetMargin,
    proposal,
    minimum,
    requested: Math.round(proposal * 0.92 * 100) / 100,
  };
}
export function evaluateNegotiation(
  mission: Mission,
  price: number,
  argument: string,
) {
  const context = negotiationContext(mission);
  const margin = price > 0 ? ((price - context.costs) / price) * 100 : 0;
  if (!Number.isFinite(price) || price <= 0)
    throw Error("Informe um valor de frete válido.");
  if (argument.trim().length < 10 || argument.trim().length > 300)
    throw Error("Explique sua proposta em 10 a 300 caracteres.");
  if (price + 0.000001 < context.minimum)
    return {
      accepted: false,
      margin,
      reply:
        "Esse valor compromete a operação. Revise os custos e apresente uma contraproposta que preserve a margem mínima.",
      concession: "",
    };
  if (price > context.proposal + 0.005)
    return {
      accepted: false,
      margin,
      reply:
        "Esse valor está acima da proposta que recebi. Preciso que você mantenha o preço apresentado ou negocie uma condição melhor.",
      concession: "",
    };
  return {
    accepted: true,
    margin,
    reply: `Com essa justificativa, podemos fechar em ${negotiationMoney(price)}. Mantenha o prazo e as condições da proposta no contrato.`,
    concession: `Frete aceito: ${negotiationMoney(price)}. ${argument.trim()}`,
  };
}
