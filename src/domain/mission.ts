import {
  trainingModes,
  trainingChallenges,
  difficultyRules,
  type TrainingMode,
} from "./training";
import {
  enterpriseStages,
  enterpriseWorkflow,
  type ProcessRecord,
} from "./workflow";
import { z } from "zod";
import { routePlanSchema, nextLegProgress } from "./route";
export const legacyStages = [
  "Comercial",
  "Planejamento",
  "Documentação",
  "Manutenção",
  "Motorista",
  "Coleta",
  "Carregamento",
  "Liberação",
  "Transporte",
  "Monitoramento",
  "Manutenção corretiva",
  "Chegada ao destino",
  "Descarga",
  "Aceite do recebedor",
  "Veículo vazio",
  "POD",
  "Conferência logística",
  "Financeiro",
  "Encerramento",
  "Debriefing",
] as const;
export const routes = {
  curta: { label: "Curta", distance: 430, speed: 58, toll: 185 },
  economica: { label: "Econômica", distance: 485, speed: 62, toll: 90 },
  rapida: { label: "Rápida", distance: 460, speed: 70, toll: 245 },
};
export const inputSchema = z.object({
  name: z.string().trim().min(3).max(100),
  client: z.string().trim().min(2).max(100),
  origin: z.string().trim().min(2).max(100),
  destination: z.string().trim().min(2).max(100),
  cargo: z.string().trim().min(2).max(100),
  vehicle: z.string().min(2).max(100),
  driver: z.string().trim().min(2).max(100),
  difficulty: z.enum(["Iniciante", "Intermediária", "Avançada"]),
  route: z.enum(["curta", "economica", "rapida"]),
  freight: z.number().finite().nonnegative(),
  distance: z.number().finite().positive().max(10000),
  speed: z.number().finite().min(1).max(80),
  consumption: z.number().finite().positive().max(30),
  diesel: z.number().finite().positive().max(100),
  toll: z.number().finite().nonnegative(),
  driverHourly: z.number().finite().nonnegative(),
  maintenance: z.number().finite().nonnegative(),
  daily: z.number().finite().nonnegative(),
  food: z.number().finite().nonnegative(),
  miscellaneous: z.number().finite().nonnegative(),
  loading: z.number().finite().nonnegative(),
  unloading: z.number().finite().nonnegative(),
  pauseEvery: z.number().finite().min(0.25),
  pauseDuration: z.number().finite().nonnegative(),
  shiftHours: z.number().finite().min(0.25),
  restHours: z.number().finite().nonnegative(),
  deadline: z.number().finite().positive(),
  routePlan: routePlanSchema.optional(),
});
export type MissionInput = z.infer<typeof inputSchema>;
export const defaults: MissionInput = {
  name: "Expresso Sudeste",
  client: "Distribuidora Horizonte",
  origin: "São Paulo, SP",
  destination: "Rio de Janeiro, RJ",
  cargo: "Carga seca • 12 toneladas",
  vehicle: "Truck • 14 toneladas",
  driver: "Marcos Silva",
  difficulty: "Iniciante",
  route: "economica",
  freight: 4200,
  distance: 485,
  speed: 62,
  consumption: 3.5,
  diesel: 6.1,
  toll: 90,
  driverHourly: 28,
  maintenance: 120,
  daily: 85,
  food: 65,
  miscellaneous: 0,
  loading: 1.5,
  unloading: 1,
  pauseEvery: 4,
  pauseDuration: 0.5,
  shiftHours: 8,
  restHours: 11,
  deadline: 24,
};
export const occurrenceTypes = {
  pane: {
    label: "Pane mecânica",
    cost: 650,
    hours: 3,
    penalty: 8,
    blocking: true,
  },
  coleta: {
    label: "Atraso na coleta",
    cost: 80,
    hours: 2,
    penalty: 3,
    blocking: false,
  },
  documento: {
    label: "Documento pendente",
    cost: 0,
    hours: 0.5,
    penalty: 5,
    blocking: true,
  },
  divergencia: {
    label: "Divergência de carga",
    cost: 120,
    hours: 1,
    penalty: 6,
    blocking: true,
  },
  avaria: { label: "Avaria", cost: 300, hours: 1, penalty: 8, blocking: true },
  entrega: {
    label: "Atraso na entrega",
    cost: 90,
    hours: 2,
    penalty: 4,
    blocking: false,
  },
  parada: {
    label: "Parada adicional",
    cost: 50,
    hours: 0.5,
    penalty: 2,
    blocking: false,
  },
  pedagio: {
    label: "Pedágio adicional",
    cost: 45,
    hours: 0,
    penalty: 1,
    blocking: false,
  },
  despesa: {
    label: "Despesa extraordinária",
    cost: 150,
    hours: 0,
    penalty: 2,
    blocking: false,
  },
  pod: {
    label: "POD incompleto",
    cost: 0,
    hours: 0.5,
    penalty: 5,
    blocking: true,
  },
};
export type OccurrenceKind = keyof typeof occurrenceTypes;
export interface Occurrence {
  id: string;
  kind: OccurrenceKind;
  description: string;
  simulatedHour: number;
  cost: number;
  hours: number;
  penalty: number;
  resolved: boolean;
  action: string;
}
export interface Mission {
  id: string;
  input: MissionInput;
  step: number;
  checks: Record<string, boolean>;
  occurrences: Occurrence[];
  createdAt: string;
  updatedAt: string;
  revision: number;
  schemaVersion: 1 | 2;
  mode?: TrainingMode;
  expectedPackages?: number;
  processRecords?: Record<string, ProcessRecord>;
  completed: boolean;
  journeyProgress?: number;
}
export const legacyRequirements: Record<number, string[]> = {
  0: ["Contrato negociado"],
  1: ["Rota e orçamento aprovados"],
  2: [
    "CT-e simulado conferido",
    "MDF-e simulado conferido",
    "Nota de treinamento conferida",
  ],
  3: ["Pneus, freios e iluminação conferidos"],
  4: ["Motorista disponível e jornada planejada"],
  5: ["Chegada à coleta registrada"],
  6: ["Carga conferida e aceite registrado"],
  7: ["Liberação operacional autorizada"],
  8: ["Viagem realizada com pausas planejadas"],
  9: ["Comunicação e monitoramento registrados"],
  10: ["Veículo liberado após inspeção"],
  11: ["Horário de chegada registrado"],
  12: ["Descarga conferida"],
  13: ["Recebedor confirmou aceite"],
  14: ["Motorista comunicou veículo vazio"],
  15: ["Comprovante demonstrativo completo"],
  16: ["Logística aprovou comprovante"],
  17: ["Custos e receita conferidos"],
  18: ["Relatório revisado"],
  19: ["Lições aprendidas revisadas"],
};
export const stages = enterpriseStages;
export const requirements: Record<number, string[]> = Object.fromEntries(
  enterpriseWorkflow.map((stage, index) => [index, stage.checks]),
);
export const missionMode = (m: Mission): TrainingMode => m.mode ?? "complete";
export const missionSequence = (m: Mission) =>
  m.schemaVersion === 1
    ? legacyStages.map((_, index) => index)
    : Array.from(
        { length: trainingModes[missionMode(m)].count },
        (_, index) => index + trainingModes[missionMode(m)].first,
      );
export const missionStageName = (m: Mission, step = m.step) =>
  (m.schemaVersion === 1 ? legacyStages : stages)[step];
export const missionStages = (m: Mission) =>
  m.schemaVersion === 1
    ? legacyStages
    : missionMode(m) === "complete"
      ? stages
      : missionSequence(m).map((step) => stages[step]);
export const missionPosition = (m: Mission) =>
  missionSequence(m).indexOf(m.step);
export const lastMissionStep = (m: Mission) => missionSequence(m).at(-1)!;
export const missionRequirements = (m: Mission) =>
  m.schemaVersion === 1 ? legacyRequirements : requirements;
export const travelStart = (m: Mission) => (m.schemaVersion === 1 ? 8 : 25);
export const travelEnd = (m: Mission) => travelStart(m) + 3;
export const podSteps = (m: Mission) =>
  m.schemaVersion === 1
    ? { acceptance: 13, empty: 14, pod: 15, audit: 16 }
    : { acceptance: 31, empty: 32, pod: 33, audit: 34 };
export function createMission(
  input: MissionInput,
  schemaVersion: 1 | 2 = 2,
  options: { mode?: TrainingMode; expectedPackages?: number } = {},
): Mission {
  const mode = options.mode ?? "complete";
  if (!(mode in trainingModes))
    throw Error("Modalidade de treinamento inválida.");
  if (
    mode === "transport" &&
    (!input.routePlan ||
      !Number.isInteger(options.expectedPackages) ||
      options.expectedPackages! <= 0 ||
      options.expectedPackages! > 1000000)
  )
    throw Error(
      "Para treinar transporte, aplique a rota e informe os volumes previstos (1 a 1.000.000).",
    );
  return {
    id: crypto.randomUUID(),
    input: inputSchema.parse(input),
    step: schemaVersion === 1 ? 0 : trainingModes[mode].first,
    checks: {},
    occurrences: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revision: 0,
    schemaVersion,
    ...(schemaVersion === 2
      ? {
          processRecords: {},
          mode,
          ...(mode === "transport"
            ? { expectedPackages: options.expectedPackages }
            : {}),
        }
      : {}),
    completed: false,
  };
}
export function calculate(input: MissionInput, occurrences: Occurrence[] = []) {
  const p = inputSchema.parse(input);
  const driving = p.distance / p.speed;
  // Rest replaces a scheduled short pause at a shift boundary; no duplicate interval.
  const shifts = Math.max(0, Math.ceil(driving / p.shiftHours) - 1);
  const boundaries = Math.max(0, Math.ceil(driving / p.pauseEvery) - 1);
  let overlap = 0;
  for (let i = 1; i <= boundaries; i++)
    if (
      Math.abs(
        (i * p.pauseEvery) / p.shiftHours -
          Math.round((i * p.pauseEvery) / p.shiftHours),
      ) < 1e-9
    )
      overlap++;
  const pauses = (boundaries - overlap) * p.pauseDuration;
  const rest = shifts * p.restHours;
  const incidentHours = occurrences.reduce((s, o) => s + o.hours, 0);
  const totalHours =
    driving + pauses + rest + p.loading + p.unloading + incidentHours;
  const liters = p.distance / p.consumption;
  const costs = {
    combustivel: liters * p.diesel,
    pedagios: p.toll,
    motorista: totalHours * p.driverHourly,
    manutencao: p.maintenance,
    diarias: Math.ceil(totalHours / 24) * p.daily,
    alimentacao: Math.ceil(totalHours / 24) * p.food,
    diversos: p.miscellaneous,
    ocorrencias: occurrences.reduce((s, o) => s + o.cost, 0),
  };
  const total = Object.values(costs).reduce((s, c) => s + c, 0);
  const profit = p.freight - total;
  return {
    liters,
    driving,
    pauses,
    rest,
    totalHours,
    costs,
    total,
    profit,
    margin: p.freight > 0 ? (profit / p.freight) * 100 : 0,
    delay: Math.max(0, totalHours - p.deadline),
  };
}
export function score(m: Mission) {
  const c = calculate(m.input, m.occurrences);
  const process = m.completed
    ? 0
    : Math.round(
        ((missionStages(m).length - missionPosition(m)) /
          missionStages(m).length) *
          20,
      );
  const decisions = m.occurrences.reduce(
    (s, o) => s + o.penalty + (o.resolved ? 0 : 5),
    0,
  );
  const deadline = Math.min(15, Math.ceil(c.delay));
  const margin = c.profit < 0 ? 10 : 0;
  return {
    value: Math.max(0, 100 - process - decisions - deadline - margin),
    deductions: { process, decisions, deadline, margin },
  };
}
export function advance(m: Mission): Mission {
  if (m.completed) throw Error("Missão já concluída. Crie uma nova missão.");
  if (
    m.occurrences.some((o) => !o.resolved && occurrenceTypes[o.kind].blocking)
  )
    throw Error("Resolva as ocorrências impeditivas antes de avançar.");
  if (
    m.input.routePlan &&
    m.step >= travelStart(m) &&
    m.step <= travelEnd(m) &&
    missionProgress(m) + 1e-6 < stageTravelLimit(m.step, m.schemaVersion)
  )
    throw Error(
      "Percorra a parte da viagem correspondente a esta etapa antes de avançar.",
    );
  if (
    !(missionRequirements(m)[m.step] ?? []).every(
      (_, i) => m.checks[`${m.step}:${i}`],
    )
  )
    throw Error("Conclua o checklist desta etapa.");
  if (m.schemaVersion === 2) {
    validateProcessRecord(m, m.processRecords?.[String(m.step)]?.values ?? {});
    if (m.step === 5 && !m.input.routePlan)
      throw Error("Calcule e aplique a rota antes de concluir o planejamento.");
    if (m.step === 24) validateDeparture(m);
    if (missionMode(m) === "commercial" && m.step === 11) {
      const calculation = calculate(m.input, m.occurrences);
      if (calculation.delay > 0)
        throw Error(
          "O prazo contratado não comporta a operação planejada. Revise o prazo antes de fechar.",
        );
      if (
        calculation.margin + 0.000001 <
        Number(m.processRecords?.["7"]?.values.targetMargin ?? 0)
      )
        throw Error(
          "A margem atual está abaixo do mínimo. Retorne à negociação antes de fechar o contrato.",
        );
    }
  }
  if (
    m.schemaVersion === 2 &&
    m.step === lastMissionStep(m) &&
    difficultyRules[m.input.difficulty].requireAllResolved &&
    m.occurrences.some((o) => !o.resolved)
  )
    throw Error(
      "Neste nível, resolva todas as ocorrências antes de concluir o treinamento.",
    );
  const next: Mission = {
    ...m,
    ...(m.input.routePlan ? { journeyProgress: missionProgress(m) } : {}),
    step: missionSequence(m)[missionPosition(m) + 1] ?? m.step,
    completed: m.step === lastMissionStep(m),
    updatedAt: new Date().toISOString(),
  };
  return applyDifficultyChallenges(next);
}
export function addOccurrence(
  m: Mission,
  kind: OccurrenceKind,
  description: string,
): Mission {
  if (m.completed) throw Error("Missão concluída não pode ser alterada.");
  if (description.trim().length < 5)
    throw Error("Descreva a ocorrência com pelo menos 5 caracteres.");
  if (m.occurrences.length >= 100)
    throw Error("Limite de 100 ocorrências por missão.");
  const t = occurrenceTypes[kind];
  return {
    ...m,
    occurrences: [
      ...m.occurrences,
      {
        id: crypto.randomUUID(),
        kind,
        description: description.slice(0, 500),
        simulatedHour:
          (calculate(m.input, m.occurrences).totalHours * missionPosition(m)) /
          (missionStages(m).length - 1),
        cost: t.cost,
        hours: t.hours,
        penalty: t.penalty,
        resolved: false,
        action: "",
      },
    ],
  };
}
export function resolveOccurrence(
  m: Mission,
  id: string,
  action: string,
): Mission {
  if (m.completed) throw Error("Missão concluída não pode ser alterada.");
  const minimum =
    m.schemaVersion === 2 && m.input.difficulty === "Avançada" ? 20 : 5;
  if (action.trim().length < minimum)
    throw Error(
      `Descreva a ação corretiva com pelo menos ${minimum} caracteres.`,
    );
  return {
    ...m,
    occurrences: m.occurrences.map((o) =>
      o.id === id ? { ...o, resolved: true, action: action.slice(0, 500) } : o,
    ),
  };
}

export function stageTravelLimit(step: number, schemaVersion: 1 | 2 = 2) {
  const start = schemaVersion === 1 ? 8 : 25;
  return step < start
    ? 0
    : step === start
      ? 0.4
      : step === start + 1
        ? 0.7
        : step === start + 2
          ? 0.9
          : 1;
}
export function missionProgress(m: Mission) {
  if (m.step < travelStart(m)) return 0;
  return Math.min(
    m.journeyProgress ?? (m.step > travelEnd(m) ? 1 : 0),
    stageTravelLimit(m.step, m.schemaVersion),
  );
}
export function travelNextLeg(m: Mission): Mission {
  if (m.completed || m.step < travelStart(m) || m.step > travelEnd(m))
    throw Error(
      "A movimentação só é permitida de Transporte até Chegada ao destino.",
    );
  if (
    m.occurrences.some((o) => !o.resolved && occurrenceTypes[o.kind].blocking)
  )
    throw Error(
      "Resolva a ocorrência impeditiva antes de movimentar o caminhão.",
    );
  if (!m.input.routePlan)
    throw Error("Configure os trechos antes de iniciar a viagem.");
  if (m.step === travelStart(m) + 2 && !m.checks[`${m.step}:0`])
    throw Error(
      "Confirme a liberação do veículo no checklist antes de continuar a viagem.",
    );
  const progress = missionProgress(m);
  const limit = stageTravelLimit(m.step, m.schemaVersion);
  if (progress >= limit - 1e-6)
    throw Error("O percurso desta etapa já foi concluído.");
  const next = Math.min(
    limit,
    progress + 0.1,
    nextLegProgress(m.input.routePlan, progress),
  );
  return { ...m, journeyProgress: limit - next < 1e-6 ? limit : next };
}

export function validateProcessRecord(
  m: Mission,
  values: Record<string, string>,
) {
  const stage = enterpriseWorkflow[m.step];
  if (!stage) throw Error("Etapa de processo inválida.");
  if (
    Object.keys(values).some(
      (key) => !stage.fields.some((field) => field.key === key),
    )
  )
    throw Error("Campo não pertence à etapa.");
  for (const field of stage.fields) {
    const value = values[field.key]?.trim();
    if (!value && field.optional) continue;
    if (!value || value.length > 500)
      throw Error(
        `Preencha ${field.label} (até 500 caracteres) e salve o registro da etapa.`,
      );
    if (
      field.type === "number" &&
      (!Number.isFinite(Number(value)) ||
        Number(value) < (field.min ?? 0) ||
        Number(value) > (field.max ?? 1000000000))
    )
      throw Error(`Valor inválido: ${field.label}.`);
    if (field.options && !field.options.includes(value))
      throw Error(`Selecione ${field.label}.`);
  }
  const record = (step: number, key: string) =>
    m.processRecords?.[String(step)]?.values[key];
  if (m.step === 7 || m.step === 9) {
    const target =
      m.step === 7
        ? Number(values.targetMargin)
        : Number(record(7, "targetMargin"));
    const calculation = calculate(
      { ...m.input, freight: Number(values.freight) },
      m.occurrences,
    );
    if (!Number.isFinite(target) || calculation.margin + 0.000001 < target)
      throw Error(
        `Frete abaixo da margem mínima de ${target}%. Revise o preço.`,
      );
  }
  if (
    m.step === 10 &&
    values.paymentMode === "A prazo" &&
    Number(values.creditLimit) < m.input.freight
  )
    throw Error("Limite de crédito insuficiente para o frete contratado.");
  if (m.step === 14 && Number(values.capacity) < Number(record(3, "weight")))
    throw Error("Capacidade do veículo inferior ao peso da carga.");
  if (
    m.step === 30 &&
    Number(values.receivedPackages) !==
      Number(m.expectedPackages ?? record(21, "packages")) &&
    !m.occurrences.some((o) => o.kind === "divergencia" && o.resolved)
  )
    throw Error(
      "Volumes divergentes: registre e resolva uma ocorrência de divergência de carga.",
    );
  if (
    m.step === 37 &&
    Math.abs(Number(values.receivedAmount) - m.input.freight) > 0.005
  )
    throw Error(
      "O recebimento simulado deve quitar o frete contratado antes da baixa.",
    );
}
export function saveProcessRecord(
  m: Mission,
  values: Record<string, string>,
): Mission {
  if (m.completed || m.schemaVersion !== 2)
    throw Error("Registro indisponível nesta missão.");
  validateProcessRecord(m, values);
  const cleaned = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value.trim().length > 0)
      .map(([key, value]) => [key, value.trim()]),
  );
  const input = { ...m.input };
  for (const field of enterpriseWorkflow[m.step].fields) {
    if (field.inputKey)
      Object.assign(input, {
        [field.inputKey]:
          field.type === "number"
            ? Number(cleaned[field.key])
            : cleaned[field.key],
      });
  }
  return {
    ...m,
    input: inputSchema.parse(input),
    processRecords: {
      ...m.processRecords,
      [String(m.step)]: { values: cleaned, savedAt: new Date().toISOString() },
    },
  };
}
function validateDeparture(m: Mission) {
  if (Object.keys(m.processRecords ?? {}).length < 25)
    throw Error("Conclua os registros anteriores à liberação.");
  const c = calculate(m.input, m.occurrences);
  const target = Number(m.processRecords?.["7"]?.values.targetMargin ?? 0);
  if (c.margin + 0.000001 < target)
    throw Error(
      "Os custos atualizados reduziram a margem abaixo do mínimo. Retorne à negociação para revisar o frete.",
    );
  if (c.delay > 0)
    throw Error(
      "O prazo não comporta a operação planejada. Revise o planejamento antes de liberar.",
    );
}

export function reopenPlanning(m: Mission, step: 5 | 9 | 14): Mission {
  if (
    m.schemaVersion !== 2 ||
    m.completed ||
    m.step >= 25 ||
    m.step <= step ||
    !missionSequence(m).includes(step)
  )
    throw Error(
      "O replanejamento está disponível antes da saída e retorna apenas a etapas anteriores.",
    );
  return {
    ...m,
    step,
    journeyProgress: 0,
    checks: Object.fromEntries(
      Object.entries(m.checks).filter(
        ([key]) => Number(key.split(":")[0]) < step,
      ),
    ),
    processRecords: Object.fromEntries(
      Object.entries(m.processRecords ?? {}).filter(
        ([key]) => Number(key) < step,
      ),
    ),
  };
}

function applyDifficultyChallenges(m: Mission): Mission {
  if (m.schemaVersion !== 2 || m.completed) return m;
  let next = m;
  for (const challenge of trainingChallenges(
    missionMode(m),
    m.input.difficulty,
  )) {
    const description = `[Desafio ${challenge.step}] ${challenge.text}`;
    if (
      m.step === challenge.step &&
      !next.occurrences.some((o) => o.description === description)
    )
      next = addOccurrence(next, challenge.kind, description);
  }
  return next;
}
