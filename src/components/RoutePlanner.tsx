import { useEffect, useState } from "react";
import { Plus, Route, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { CitySelect, type CityChoice } from "./CitySelect";
import { sampleStops, type RouteStop } from "../domain/route";
import type { MissionInput } from "../domain/mission";
import { locateCity, calculateRoadRoute } from "../services/geography";
import { RouteMap } from "./RouteMap";
export function RoutePlanner({
  value,
  onChange,
  disabled = false,
}: {
  value: MissionInput;
  onChange: (value: MissionInput) => void;
  disabled?: boolean;
}) {
  const [stops, setStops] = useState<CityChoice[]>(
    value.routePlan?.stops ?? sampleStops.map((s) => ({ ...s })),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (value.routePlan) {
      setStops(value.routePlan.stops);
      setDirty(false);
    }
  }, [value.routePlan]);
  function update(next: CityChoice[]) {
    setStops(next);
    setDirty(true);
    setMessage("Trechos alterados. Calcule e aplique a nova rota.");
  }
  async function calculate() {
    setBusy(true);
    setMessage("Localizando cidades e calculando o percurso…");
    try {
      const resolved: RouteStop[] = [];
      for (const stop of stops) {
        if (!stop.cityId) throw Error("Selecione a cidade de todos os pontos.");
        const known =
          value.routePlan?.stops.find((s) => s.cityId === stop.cityId) ??
          sampleStops.find((s) => s.cityId === stop.cityId);
        resolved.push(known ?? (await locateCity(stop)));
      }
      const plan = await calculateRoadRoute(resolved, value.route);
      onChange({
        ...value,
        origin: `${plan.stops[0].name}, ${plan.stops[0].uf}`,
        destination: `${plan.stops.at(-1)!.name}, ${plan.stops.at(-1)!.uf}`,
        distance: plan.legs.reduce((sum, leg) => sum + leg.distanceKm, 0),
        routePlan: plan,
      });
      setDirty(false);
      setMessage(
        "Rota calculada e aplicada. Distância atualizada no orçamento.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível calcular a rota.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="route-planner">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CIDADES, ARMAZÉNS E TRECHOS</span>
          <h2>Configure o percurso</h2>
        </div>
        <Route />
      </div>
      <p>
        Escolha origem, destino e pontos intermediários. A ordem abaixo define
        os trechos da viagem.
      </p>
      <ol className="route-stops">
        {stops.map((stop, i) => (
          <li key={i}>
            <span className="stop-number">{i + 1}</span>
            <div>
              <CitySelect
                label={
                  i === 0
                    ? "Origem"
                    : i === stops.length - 1
                      ? "Destino"
                      : `Ponto intermediário ${i}`
                }
                value={stop}
                disabled={busy || disabled}
                onChange={(v) => update(stops.map((s, j) => (j === i ? v : s)))}
              />
            </div>
            <div className="stop-actions">
              <button
                type="button"
                aria-label={`Mover ponto ${i + 1} para cima`}
                disabled={i === 0 || busy || disabled}
                onClick={() => {
                  const next = [...stops];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  update(next);
                }}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                aria-label={`Mover ponto ${i + 1} para baixo`}
                disabled={i === stops.length - 1 || busy || disabled}
                onClick={() => {
                  const next = [...stops];
                  [next[i + 1], next[i]] = [next[i], next[i + 1]];
                  update(next);
                }}
              >
                <ArrowDown size={15} />
              </button>
              {stops.length > 2 && (
                <button
                  type="button"
                  aria-label={`Remover ponto ${i + 1}`}
                  disabled={busy || disabled}
                  onClick={() => update(stops.filter((_, j) => j !== i))}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="actions">
        <button
          type="button"
          className="secondary"
          disabled={stops.length >= 8 || busy || disabled}
          onClick={() =>
            update([
              ...stops.slice(0, -1),
              { name: "", uf: stops[0].uf, cityId: 0 },
              stops.at(-1)!,
            ])
          }
        >
          <Plus size={16} /> Adicionar ponto intermediário
        </button>
        <button
          type="button"
          className="primary"
          disabled={busy || disabled}
          onClick={() => void calculate()}
        >
          {busy ? "Calculando rota…" : "Calcular e aplicar rota"}
        </button>
      </div>
      {message && (
        <p className={dirty ? "notice" : "route-feedback"} role="status">
          {message}
        </p>
      )}
      {value.routePlan && (
        <>
          <RouteMap input={value} />
          <div className="route-leg-cards">
            {value.routePlan.legs.map((leg, i) => (
              <article key={i}>
                <small>TRECHO {i + 1}</small>
                <b>
                  {value.routePlan!.stops[i].name} →{" "}
                  {value.routePlan!.stops[i + 1].name}
                </b>
                <span>
                  {leg.distanceKm.toFixed(1)} km •{" "}
                  {leg.durationHours.toFixed(1)} h de referência
                </span>
              </article>
            ))}
          </div>
        </>
      )}
      <small>
        Centros municipais de referência, não endereços reais dos armazéns.
        Rotas OSRM para automóveis: não consideram restrições de caminhões nem
        pedágios. Custos e jornada permanecem parâmetros de treinamento.
      </small>
    </section>
  );
}
