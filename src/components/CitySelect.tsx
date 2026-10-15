import { useEffect, useState } from "react";
import {
  getStates,
  getCities,
  type State,
  type City,
} from "../services/geography";
import type { RouteStop } from "../domain/route";
export type CityChoice = Pick<RouteStop, "name" | "uf" | "cityId">;
export function CitySelect({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: CityChoice;
  onChange: (v: CityChoice) => void;
  disabled?: boolean;
}) {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    getStates()
      .then((v) => {
        if (active) setStates(v);
      })
      .catch(() => {
        if (active) setError("Não foi possível consultar as UFs no IBGE.");
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setCities([]);
    setLoading(true);
    setError("");
    getCities(value.uf)
      .then((v) => {
        if (active) setCities(v);
      })
      .catch(() => {
        if (active) setError("Não foi possível consultar as cidades no IBGE.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [value.uf, retry]);
  return (
    <div className="city-select">
      <label>
        {label} — UF
        <select
          disabled={disabled}
          value={value.uf}
          onChange={(e) =>
            onChange({ uf: e.target.value, name: "", cityId: 0 })
          }
        >
          {!states.length && <option value={value.uf}>{value.uf}</option>}
          {states.map((s) => (
            <option key={s.id} value={s.sigla}>
              {s.nome} ({s.sigla})
            </option>
          ))}
        </select>
      </label>
      <label>
        {label} — cidade
        <select
          disabled={disabled || loading}
          required
          value={value.cityId || ""}
          onChange={(e) => {
            const city = cities.find((c) => c.id === Number(e.target.value));
            if (city) onChange({ ...value, name: city.nome, cityId: city.id });
          }}
        >
          <option value="">
            {loading ? "Consultando IBGE…" : "Selecione a cidade"}
          </option>
          {value.cityId && !cities.some((c) => c.id === value.cityId) && (
            <option value={value.cityId}>{value.name}</option>
          )}
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <div className="notice" role="alert">
          {error}
          <button type="button" onClick={() => setRetry(retry + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
