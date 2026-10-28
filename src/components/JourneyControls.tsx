import { Truck, MapPin, CheckCircle2 } from "lucide-react";
import { legBoundaries } from "../domain/route";
import {
  occurrenceTypes,
  travelStart,
  travelEnd,
  missionProgress,
  stageTravelLimit,
  travelNextLeg,
  type Mission,
} from "../domain/mission";
export function JourneyControls({
  mission,
  onChange,
  disabled,
}: {
  mission: Mission;
  onChange: (m: Mission) => void;
  disabled: boolean;
}) {
  const plan = mission.input.routePlan;
  if (!plan) return null;
  const progress = missionProgress(mission);
  const limit = stageTravelLimit(mission.step, mission.schemaVersion);
  const boundaries = legBoundaries(plan);
  const blocked = mission.occurrences.some(
    (o) => !o.resolved && occurrenceTypes[o.kind].blocking,
  );
  const inspectionPending =
    mission.step === travelStart(mission) + 2 &&
    !mission.checks[`${mission.step}:0`];
  const active = boundaries.findIndex((p) => p > progress + 1e-6);
  return (
    <section className="journey-controls">
      <div className="panel-heading">
        <h3>
          <Truck size={19} /> Viagem por trechos
        </h3>
        <b>{(progress * 100).toFixed(0)}%</b>
      </div>
      <div className="progress">
        <div style={{ width: `${progress * 100}%` }} />
      </div>
      <details className="journey-leg-details">
        <summary>Ver trechos da viagem</summary>
        <div className="route-leg-cards">
          {plan.legs.map((leg, i) => (
            <article
              className={
                progress >= boundaries[i] - 1e-6
                  ? "leg-done"
                  : i === active
                    ? "leg-current"
                    : ""
              }
              key={i}
            >
              {progress >= boundaries[i] - 1e-6 ? (
                <CheckCircle2 size={17} />
              ) : (
                <MapPin size={17} />
              )}
              <b>
                {plan.stops[i].name} → {plan.stops[i + 1].name}
              </b>
              <span>
                {leg.distanceKm.toFixed(1)} km •{" "}
                {progress >= boundaries[i] - 1e-6
                  ? "Concluído"
                  : i === active
                    ? "Próximo trecho"
                    : "A percorrer"}
              </span>
            </article>
          ))}
        </div>
      </details>
      {mission.step >= travelStart(mission) &&
        mission.step <= travelEnd(mission) && (
          <button
            className="primary"
            disabled={
              disabled ||
              blocked ||
              inspectionPending ||
              progress >= limit - 1e-6
            }
            onClick={() => onChange(travelNextLeg(mission))}
          >
            {inspectionPending
              ? "Confirme a liberação no checklist"
              : blocked
                ? "Viagem bloqueada por ocorrência"
                : progress >= limit - 1e-6
                  ? mission.step === travelEnd(mission)
                    ? "Chegada ao destino registrada"
                    : "Percurso desta etapa concluído"
                  : "Avançar na viagem"}
            <Truck size={18} />
          </button>
        )}
      {mission.step >= travelStart(mission) &&
        mission.step <= travelEnd(mission) && (
          <p>
            Limite desta etapa: {(limit * 100).toFixed(0)}% do percurso. A
            chegada completa acontece somente na etapa Chegada ao destino.
          </p>
        )}
      {mission.step < travelStart(mission) && (
        <p>
          O caminhão permanece no armazém de origem até a liberação. A viagem
          começa na etapa Transporte.
        </p>
      )}
    </section>
  );
}
