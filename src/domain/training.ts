export type TrainingMode = "complete" | "commercial" | "transport";
export const trainingModes = {
  complete: {
    label: "Operação completa",
    summary: "Da captação do cliente ao recebimento e melhoria contínua.",
    count: 40,
    first: 0,
    last: 39,
  },
  commercial: {
    label: "Somente comercial",
    summary: "Cliente, custos, preço, negociação, crédito e contrato.",
    count: 12,
    first: 0,
    last: 11,
  },
  transport: {
    label: "Somente transporte",
    summary: "Viagem, monitoramento, contingências, entrega e comprovante.",
    count: 10,
    first: 25,
    last: 34,
  },
} as const;
export const difficultyRules = {
  Iniciante: {
    description:
      "Orientação completa, sem ocorrências automáticas. Aprenda o fluxo no seu ritmo.",
    requireAllResolved: false,
  },
  Intermediária: {
    description:
      "Pendências programadas de documentos ou prazo. Resolva todos os eventos antes de concluir.",
    requireAllResolved: true,
  },
  Avançada: {
    description:
      "Incidentes combinados de custo, carga, pane ou comprovante. Exige tratamento e justificativa detalhada.",
    requireAllResolved: true,
  },
} as const;
export type Challenge = {
  step: number;
  kind:
    | "documento"
    | "coleta"
    | "entrega"
    | "despesa"
    | "divergencia"
    | "pane"
    | "pod";
  text: string;
};
export function trainingChallenges(
  mode: TrainingMode,
  difficulty: keyof typeof difficultyRules,
): Challenge[] {
  if (difficulty === "Iniciante") return [];
  if (difficulty === "Intermediária")
    return mode === "commercial"
      ? [
          {
            step: 10,
            kind: "documento",
            text: "Cadastro de crédito incompleto: obtenha a confirmação do cliente.",
          },
        ]
      : mode === "transport"
        ? [
            {
              step: 26,
              kind: "entrega",
              text: "Previsão de entrega alterada: comunique o cliente e reprograme o atendimento.",
            },
          ]
        : [
            {
              step: 19,
              kind: "documento",
              text: "Documento divergente: confira carga, veículo e destino.",
            },
            {
              step: 26,
              kind: "entrega",
              text: "Previsão de entrega alterada: comunique o cliente e o destino.",
            },
          ];
  if (mode === "commercial")
    return [
      {
        step: 9,
        kind: "despesa",
        text: "Custo adicional solicitado: reavalie margem e contraproposta.",
      },
      {
        step: 10,
        kind: "documento",
        text: "Análise cadastral pendente: obtenha evidência para aprovar o crédito.",
      },
    ];
  return [
    ...(mode === "complete"
      ? [
          {
            step: 14,
            kind: "divergencia" as const,
            text: "Divergência no dimensionamento: confirme carga e equipamento com o embarcador.",
          },
        ]
      : []),
    {
      step: 26,
      kind: "pane",
      text: "Pane na viagem: acione suporte, trate o reparo e atualize a previsão.",
    },
    {
      step: 33,
      kind: "pod",
      text: "Comprovante incompleto: solicite correção ao recebedor antes da auditoria.",
    },
  ];
}
export function configuredPrice(cost: number, method: string, rate: number) {
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(rate) || rate < 0)
    throw Error("Informe custo e percentual válidos.");
  if (method === "Margem sobre a receita") {
    if (rate >= 100) throw Error("A margem deve ser inferior a 100%.");
    return Math.ceil((cost / (1 - rate / 100)) * 100) / 100;
  }
  if (method === "Acréscimo sobre o custo")
    return Math.ceil(cost * (1 + rate / 100) * 100) / 100;
  throw Error("Escolha um método de cálculo do preço.");
}
