import { z } from "zod";
import { routePlanSchema, nextLegProgress } from "./route";
export const stages = [
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
  schemaVersion: 1;
  completed: boolean;
  journeyProgress?: number;
}
export const requirements: Record<number, string[]> = {
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
export function createMission(input: MissionInput): Mission {
  return {
    id: crypto.randomUUID(),
    input: inputSchema.parse(input),
    step: 0,
    checks: {},
    occurrences: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revision: 0,
    schemaVersion: 1,
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
  const process = m.completed ? 0 : Math.round(((20 - m.step) / 20) * 20);
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
    m.step >= 8 &&
    m.step <= 11 &&
    missionProgress(m) + 1e-6 < stageTravelLimit(m.step)
  )
    throw Error(
      "Percorra a parte da viagem correspondente a esta etapa antes de avançar.",
    );
  if (!(requirements[m.step] ?? []).every((_, i) => m.checks[`${m.step}:${i}`]))
    throw Error("Conclua o checklist desta etapa.");
  return {
    ...m,
    ...(m.input.routePlan ? { journeyProgress: missionProgress(m) } : {}),
    step: Math.min(19, m.step + 1),
    completed: m.step === 19,
    updatedAt: new Date().toISOString(),
  };
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
          (calculate(m.input, m.occurrences).totalHours * m.step) / 19,
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
  if (action.trim().length < 5) throw Error("Descreva a ação corretiva.");
  return {
    ...m,
    occurrences: m.occurrences.map((o) =>
      o.id === id ? { ...o, resolved: true, action: action.slice(0, 500) } : o,
    ),
  };
}

export function stageTravelLimit(step: number) {
  return step < 8
    ? 0
    : step === 8
      ? 0.4
      : step === 9
        ? 0.7
        : step === 10
          ? 0.9
          : 1;
}
export function missionProgress(m: Mission) {
  if (m.step < 8) return 0;
  return Math.min(
    m.journeyProgress ?? (m.step >= 12 ? 1 : 0),
    stageTravelLimit(m.step),
  );
}
export function travelNextLeg(m: Mission): Mission {
  if (m.completed || m.step < 8 || m.step > 11)
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
  if (m.step === 10 && !m.checks["10:0"])
    throw Error(
      "Confirme a liberação do veículo no checklist antes de continuar a viagem.",
    );
  const progress = missionProgress(m);
  const limit = stageTravelLimit(m.step);
  if (progress >= limit - 1e-6)
    throw Error("O percurso desta etapa já foi concluído.");
  const next = Math.min(
    limit,
    progress + 0.1,
    nextLegProgress(m.input.routePlan, progress),
  );
  return { ...m, journeyProgress: limit - next < 1e-6 ? limit : next };
}
