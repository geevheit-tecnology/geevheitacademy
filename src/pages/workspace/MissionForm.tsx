import { RoutePlanner } from "../../components/RoutePlanner";
import { useMissionRepository } from "../../services/ServicesContext";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  createMission,
  defaults,
  inputSchema,
  routes,
  type MissionInput,
} from "../../domain/mission";
import { useAuth } from "../../features/auth/AuthContext";
import { errorMessage } from "../../features/auth/authService";
import {
  loadSettings,
  saveSettings,
} from "../../repositories/FirestoreMissionRepository";
import { type WorkspaceContext } from "./shared";
type ParameterKey = Exclude<keyof MissionInput, "routePlan">;
const labels: Record<ParameterKey, string> = {
  name: "Nome da missão",
  client: "Cliente",
  origin: "Origem",
  destination: "Destino",
  cargo: "Carga",
  vehicle: "Veículo",
  driver: "Motorista",
  difficulty: "Dificuldade",
  route: "Estratégia de rota",
  freight: "Frete (R$)",
  distance: "Distância (km)",
  speed: "Velocidade média (km/h, máximo educativo 80)",
  consumption: "Consumo (km/l)",
  diesel: "Diesel (R$/l)",
  toll: "Pedágios (R$)",
  driverHourly: "Motorista (R$/h)",
  maintenance: "Manutenção preventiva (R$)",
  daily: "Diária (R$/24h)",
  food: "Alimentação (R$/24h)",
  miscellaneous: "Diversos (R$)",
  loading: "Carregamento (h)",
  unloading: "Descarga (h)",
  pauseEvery: "Pausa a cada (h de direção)",
  pauseDuration: "Duração da pausa (h)",
  shiftHours: "Jornada de direção (h)",
  restHours: "Descanso entre jornadas (h)",
  deadline: "Prazo total (h)",
};
export function MissionForm({ settings = false }: { settings?: boolean }) {
  const { user } = useAuth();
  const missionRepository = useMissionRepository();
  const navigate = useNavigate();
  const { setMessage, reload } = useOutletContext<WorkspaceContext>();
  const [values, setValues] = useState<MissionInput>(defaults);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user)
      void loadSettings(user.uid)
        .then((v) => {
          if (v) {
            const parsed = inputSchema.safeParse(v);
            if (parsed.success) setValues(parsed.data);
          }
        })
        .catch((e) => setMessage(errorMessage(e)));
  }, [user, setMessage]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const parsed = inputSchema.safeParse(values);
      if (!parsed.success)
        throw Error(
          parsed.error.issues
            .map((i) => `${labels[i.path[0] as ParameterKey]}: valor inválido`)
            .join("; "),
        );
      if (!settings && !parsed.data.routePlan)
        throw Error(
          "Configure os trechos e clique em Calcular e aplicar rota antes de criar a missão.",
        );
      if (settings) {
        await saveSettings(user.uid, parsed.data);
        setMessage("Configurações salvas na nuvem.");
      } else {
        const saved = await missionRepository.save(
          user.uid,
          createMission(parsed.data),
        );
        await reload();
        navigate(`/app/operacao/${saved.id}`);
      }
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {settings
              ? "PREFERÊNCIAS DO INSTRUTOR"
              : "PLANEJE SUA PRÓXIMA OPERAÇÃO"}
          </span>
          <h1>{settings ? "Configurações" : "Nova missão"}</h1>
          <p>
            Parâmetros ilustrativos e editáveis. Valores não representam regras
            legais.
          </p>
        </div>
      </div>
      <form className="panel mission-form" onSubmit={submit}>
        <RoutePlanner value={values} onChange={setValues} disabled={busy} />
        <h2>Dados e parâmetros de treinamento</h2>
        <div className="form-grid">
          {(Object.keys(defaults) as ParameterKey[]).map((key) => (
            <label key={key}>
              {labels[key]}
              {key === "route" ? (
                <select
                  value={values.route}
                  onChange={(e) => {
                    const route = e.target.value as MissionInput["route"];
                    const { routePlan: previousPlan, ...rest } = values;
                    void previousPlan;
                    setValues({
                      ...rest,
                      route,
                      ...{
                        distance: values.distance,
                        speed: routes[route].speed,
                        toll: routes[route].toll,
                      },
                    });
                  }}
                >
                  {Object.entries(routes).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              ) : key === "difficulty" ? (
                <select
                  value={values.difficulty}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      difficulty: e.target.value as MissionInput["difficulty"],
                    })
                  }
                >
                  {["Iniciante", "Intermediária", "Avançada"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  readOnly={
                    key === "origin" ||
                    key === "destination" ||
                    key === "distance"
                  }
                  required
                  maxLength={100}
                  type={typeof defaults[key] === "number" ? "number" : "text"}
                  min={typeof defaults[key] === "number" ? 0 : undefined}
                  step="any"
                  value={values[key]}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [key]:
                        typeof defaults[key] === "number"
                          ? e.target.value === ""
                            ? NaN
                            : Number(e.target.value)
                          : e.target.value,
                    })
                  }
                />
              )}
            </label>
          ))}
        </div>
        <div className="notice">
          Os níveis ajustam os exercícios sugeridos: iniciante — fluxo básico;
          intermediário — documento e atraso; avançado — pane, divergência e
          POD. O instrutor registra os eventos na central.
        </div>
        <div className="actions">
          <button className="primary" disabled={busy}>
            {busy
              ? "Salvando…"
              : settings
                ? "Salvar preferências"
                : "Criar e iniciar missão"}{" "}
            <ArrowRight size={18} />
          </button>
          {settings && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (
                  confirm(
                    "Restaurar os valores padrão? Clique em Salvar para sincronizar.",
                  )
                )
                  setValues(defaults);
              }}
            >
              Restaurar padrões
            </button>
          )}
        </div>
      </form>
    </>
  );
}
