import { Truck, MapPin, CheckCircle2 } from "lucide-react";
import { legBoundaries } from "../domain/route";
import {
  occurrenceTypes,
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
  const progress = mission.step > 8 ? 1 : (mission.journeyProgress ?? 0);
  const boundaries = legBoundaries(plan);
  const blocked = mission.occurrences.some(
    (o) => !o.resolved && occurrenceTypes[o.kind].blocking,
  );
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
      {mission.step === 8 && (
        <button
          className="primary"
          disabled={disabled || blocked || progress >= 1}
          onClick={() => onChange(travelNextLeg(mission))}
        >
          {blocked
            ? "Viagem bloqueada por ocorrência"
            : progress >= 1
              ? "Todos os trechos percorridos"
              : "Percorrer próximo trecho"}
          <Truck size={18} />
        </button>
      )}
      {mission.step < 8 && (
        <p>
          O caminhão permanece no armazém de origem até a liberação. A viagem
          começa na etapa Transporte.
        </p>
      )}
    </section>
  );
}
