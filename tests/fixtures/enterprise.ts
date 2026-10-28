import { enterpriseWorkflow } from "../../src/domain/workflow";
import {
  defaults,
  createMission,
  saveProcessRecord,
  advance,
  requirements,
  travelNextLeg,
  stageTravelLimit,
  missionProgress,
  type Mission,
} from "../../src/domain/mission";
import type { RoutePlan } from "../../src/domain/route";
import { sampleStops } from "../../src/domain/route";
export const enterprisePlan: RoutePlan = {
  stops: [...sampleStops],
  geometry: [...sampleStops],
  legs: [{ distanceKm: 485, durationHours: 8 }],
  provider: "OSRM",
  calculatedAt: new Date().toISOString(),
};
export function recordValues(step: number): Record<string, string> {
  const overrides: Record<string, string> = {
    freight: "5200",
    targetMargin: "10",
    creditLimit: "10000",
    weight: "12",
    capacity: "14",
    diesel: "6.1",
    toll: "90",
    maintenance: "120",
    shiftHours: "8",
    deadline: "24",
    packages: "100",
    receivedPackages: "100",
    receivedAmount: "5200",
  };
  return Object.fromEntries(
    enterpriseWorkflow[step].fields.map((field) => [
      field.key,
      overrides[field.key] ??
        field.options?.[0] ??
        (field.type === "number"
          ? String(Math.max(1, field.min ?? 0))
          : `Registro simulado ${field.key}`),
    ]),
  );
}
export function completeStage(mission: Mission) {
  let m = saveProcessRecord(mission, recordValues(mission.step));
  m = {
    ...m,
    checks: {
      ...m.checks,
      ...Object.fromEntries(
        requirements[m.step].map((_, i) => [`${m.step}:${i}`, true]),
      ),
    },
  };
  if (m.step >= 25 && m.step <= 28)
    while (missionProgress(m) < stageTravelLimit(m.step) - 1e-6)
      m = travelNextLeg(m);
  return advance(m);
}
export function missionAt(step: number) {
  let mission = createMission({ ...defaults, routePlan: enterprisePlan });
  while (mission.step < step) mission = completeStage(mission);
  return mission;
}
