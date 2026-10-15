import { missionProgress } from "../../domain/mission";
import { RoutePlanner } from "../../components/RoutePlanner";
import { StageGuide } from "../../components/StageGuide";
import { JourneyControls } from "../../components/JourneyControls";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Download,
} from "lucide-react";
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { RouteMap } from "../../components/RouteMap";
import {
  addOccurrence,
  advance,
  calculate,
  occurrenceTypes,
  requirements,
  resolveOccurrence,
  routes,
  score,
  stages,
  type OccurrenceKind,
} from "../../domain/mission";
import { useAuth } from "../../features/auth/AuthContext";
import { errorMessage } from "../../features/auth/authService";
import { useMissionRepository } from "../../services/ServicesContext";
import { useMissionSync } from "../../hooks/useMissionSync";
import { Metric, money, type WorkspaceContext } from "./shared";

export function Operation() {
  const { user } = useAuth();
  const missionRepository = useMissionRepository();
  const { setMessage, reload } = useOutletContext<WorkspaceContext>();
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.pathname.split("/").at(-1)!;
  const { mission, busy, sync, pending, load, save, clearDraft } =
    useMissionSync(user?.uid, id, setMessage);
  const [showPlanner, setShowPlanner] = useState(false);
  const [lastCompleted, setLastCompleted] = useState("");
  const [tab, setTab] = useState("operacao");
  const [kind, setKind] = useState<OccurrenceKind>("pane");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");
  if (!mission)
    return (
      <div className="panel">
        <h2>Carregando operação</h2>
        <p>{sync}</p>
        <button onClick={() => void load()}>Tentar novamente</button>
      </div>
    );
  const m = mission;
  const calc = calculate(m.input, m.occurrences);
  const result = score(m);
  function transition() {
    try {
      void save(advance(m)).then((success) => {
        if (success) setLastCompleted(stages[m.step]);
      });
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  async function remove() {
    if (
      !user ||
      !confirm(
        "Apagar esta missão e seus resultados? Esta ação não pode ser desfeita.",
      )
    )
      return;
    try {
      await missionRepository.remove(user.uid, id);
      clearDraft();
      await reload();
      navigate("/app");
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            OPERAÇÃO DE TREINAMENTO • {m.input.difficulty.toUpperCase()}
          </span>
          <h1>{m.input.name}</h1>
          <p>
            {m.input.origin} → {m.input.destination} · {m.input.cargo}
          </p>
        </div>
        <div>
          <span className="sync">
            <Cloud size={16} />
            {sync}
          </span>
          <button disabled={busy} onClick={() => void load()}>
            Atualizar da nuvem
          </button>
        </div>
      </div>
      {pending && (
        <div className="notice">
          <b>Existe um rascunho não sincronizado neste navegador.</b>
          <p>
            Não avance antes de decidir. Reenviar pode falhar caso outro
            computador tenha atualizado a missão.
          </p>
          <button disabled={busy} onClick={() => void save(pending)}>
            Reenviar rascunho
          </button>
          <button
            onClick={() => {
              if (
                confirm("Descartar alteração local e usar a versão da nuvem?")
              ) {
                clearDraft();
              }
            }}
          >
            Descartar rascunho
          </button>
        </div>
      )}
      <div className="stats">
        <Metric label="Frete negociado" value={money(m.input.freight)} />
        <Metric label="Custo estimado" value={money(calc.total)} />
        <Metric label="Resultado estimado" value={money(calc.profit)} />
        <Metric
          label="Tempo total previsto"
          value={`${calc.totalHours.toFixed(1)} h`}
        />
      </div>
      <div className="tabs">
        {[
          ["operacao", "Operação"],
          ["ocorrencias", "Ocorrências"],
          ["financeiro", "Financeiro"],
          ["pod", "Comprovante"],
          ["resultado", "Resultado"],
        ].map(([k, l]) => (
          <button
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k)}
            key={k}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "operacao" && (
        <>
          <StageGuide
            step={m.step}
            completed={m.completed}
            lastCompleted={lastCompleted}
          />
          {m.step < 8 && !m.completed && (
            <div className="route-edit-actions">
              <button
                className="secondary"
                disabled={busy || !!pending}
                onClick={() => setShowPlanner(!showPlanner)}
              >
                {showPlanner
                  ? "Fechar configuração de trechos"
                  : "Configurar trechos"}
              </button>
              <span>
                Origem, destino e pontos intermediários • edição disponível
                antes da saída
              </span>
            </div>
          )}
          {showPlanner && m.step < 8 && (
            <div className="panel">
              <RoutePlanner
                value={m.input}
                disabled={busy || !!pending}
                onChange={(input) => void save({ ...m, input })}
              />
            </div>
          )}
        </>
      )}
      {tab === "operacao" && (
        <div className="operation-grid">
          <section>
            <RouteMap input={m.input} progress={missionProgress(m)} />
            <JourneyControls
              mission={m}
              disabled={busy || !!pending || m.completed}
              onChange={(next) => void save(next)}
            />
            <div className="panel">
              <div className="panel-heading">
                <span className="eyebrow">ETAPA {m.step + 1} DE 20</span>
                <span className="tag">
                  {m.completed ? "Concluída" : "Em andamento"}
                </span>
              </div>
              <h2>{stages[m.step]}</h2>
              <p>Confira as condições abaixo antes de registrar o avanço.</p>
              {(requirements[m.step] ?? []).map((r, i) => (
                <label className="check-row" key={r}>
                  <input
                    type="checkbox"
                    checked={!!m.checks[`${m.step}:${i}`]}
                    disabled={busy || m.completed || !!pending}
                    onChange={(e) =>
                      void save({
                        ...m,
                        checks: {
                          ...m.checks,
                          [`${m.step}:${i}`]: e.target.checked,
                        },
                      })
                    }
                  />
                  {r}
                </label>
              ))}
              {m.occurrences.some(
                (o) => !o.resolved && occurrenceTypes[o.kind].blocking,
              ) && (
                <p className="notice">
                  <AlertTriangle size={16} /> Ocorrência impeditiva. Resolva na
                  central antes de avançar.
                </p>
              )}
              <button
                className="primary"
                onClick={transition}
                disabled={busy || m.completed || !!pending}
              >
                {m.completed
                  ? "Treinamento concluído"
                  : m.step === 19
                    ? "Concluir treinamento"
                    : "Concluir etapa e avançar"}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
          <aside className="panel timeline">
            <h3>Linha do tempo</h3>
            {stages.map((s, i) => (
              <div
                className={
                  i === m.step
                    ? "current"
                    : i < m.step || m.completed
                      ? "done"
                      : ""
                }
                key={s}
              >
                <span>
                  {i < m.step || m.completed ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                {s}
              </div>
            ))}
          </aside>
        </div>
      )}
      {tab === "ocorrencias" && (
        <section className="panel">
          <h2>Central de ocorrências</h2>
          <p>
            Impactos são lançados uma única vez e permanecem após a resolução.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                void save(addOccurrence(m, kind, description));
                setDescription("");
              } catch (e) {
                setMessage(errorMessage(e));
              }
            }}
          >
            <div className="form-grid">
              <label>
                Tipo
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as OccurrenceKind)}
                >
                  {Object.entries(occurrenceTypes).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Descrição
                <input
                  value={description}
                  minLength={5}
                  maxLength={500}
                  required
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
            </div>
            <p>
              {money(occurrenceTypes[kind].cost)} · +
              {occurrenceTypes[kind].hours} h · desconto de{" "}
              {occurrenceTypes[kind].penalty} pontos
            </p>
            <button
              className="primary"
              disabled={busy || m.completed || !!pending}
            >
              Registrar ocorrência
            </button>
          </form>
          {m.occurrences.length === 0 && <p>Nenhuma ocorrência registrada.</p>}
          {m.occurrences.map((o) => (
            <article className="occurrence" key={o.id}>
              <span className="tag">
                {o.resolved ? "Resolvida" : "Pendente"} • hora simulada{" "}
                {o.simulatedHour.toFixed(1)}
              </span>
              <h3>{occurrenceTypes[o.kind].label}</h3>
              <p>{o.description}</p>
              <p>
                {money(o.cost)} · +{o.hours} h · −{o.penalty} pontos
              </p>
              {o.resolved ? (
                <p>
                  <b>Ação corretiva:</b> {o.action}
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      void save(resolveOccurrence(m, o.id, action));
                      setAction("");
                    } catch (e) {
                      setMessage(errorMessage(e));
                    }
                  }}
                >
                  <label>
                    Ação corretiva / comunicação
                    <input
                      minLength={5}
                      maxLength={500}
                      required
                      onChange={(e) => setAction(e.target.value)}
                    />
                  </label>
                  <button
                    className="secondary"
                    disabled={busy || m.completed || !!pending}
                  >
                    Registrar resolução
                  </button>
                </form>
              )}
            </article>
          ))}
        </section>
      )}
      {tab === "financeiro" && (
        <section className="panel">
          <h2>Memória de cálculo</h2>
          <div className="cost-list">
            {Object.entries(calc.costs).map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <b>{money(v)}</b>
              </div>
            ))}
            <div>
              <span>Custo total</span>
              <b>{money(calc.total)}</b>
            </div>
            <div>
              <span>Resultado / margem</span>
              <b>
                {money(calc.profit)} / {calc.margin.toFixed(1)}%
              </b>
            </div>
          </div>
          <p>
            Combustível: {m.input.distance} km ÷ {m.input.consumption} km/l ={" "}
            {calc.liters.toFixed(3)} l × {money(m.input.diesel)}.
          </p>
          <p>
            Direção {calc.driving.toFixed(2)} h + pausas{" "}
            {calc.pauses.toFixed(2)} h + descansos {calc.rest.toFixed(2)} h +
            carga {m.input.loading} h + descarga {m.input.unloading} h +
            ocorrências {m.occurrences.reduce((s, o) => s + o.hours, 0)} h.
          </p>
          <p>
            Motorista = tempo total × {money(m.input.driverHourly)}/h.
            Alimentação e diárias por período de 24 h iniciado. Arredondamento
            apenas na exibição.
          </p>
          <p>
            Estratégia: {routes[m.input.route].label}. Prazo: {m.input.deadline}{" "}
            h. Desvio: +{calc.delay.toFixed(2)} h.
          </p>
        </section>
      )}
      {tab === "pod" && (
        <section className="panel pod">
          <span className="eyebrow">SEM VALIDADE FISCAL OU COMERCIAL</span>
          <h2>Comprovante demonstrativo de entrega</h2>
          <p>Missão {m.id}</p>
          <p>
            Cliente: {m.input.client} · Motorista: {m.input.driver}
          </p>
          <p>
            {m.input.origin} → {m.input.destination}
          </p>
          <p>
            Carga: {m.input.cargo} · Veículo: {m.input.vehicle}
          </p>
          <p>
            Recebedor:{" "}
            {m.checks["13:0"] ? "Aceite fictício registrado" : "Pendente"}
          </p>
          <p>Veículo vazio: {m.checks["14:0"] ? "Comunicado" : "Pendente"}</p>
          <p>
            Comprovante:{" "}
            {m.checks["15:0"] &&
            !m.occurrences.some((o) => o.kind === "pod" && !o.resolved)
              ? "Completo — demonstrativo"
              : "Pendente"}
          </p>
          <p>
            Conferência logística: {m.checks["16:0"] ? "Aprovada" : "Pendente"}
          </p>
          <button className="secondary" onClick={() => window.print()}>
            Imprimir comprovante
          </button>
        </section>
      )}
      {tab === "resultado" && (
        <section className="panel">
          <span className="eyebrow">
            {m.completed ? "DEBRIEFING FINAL" : "PRÉVIA DO DESEMPENHO"}
          </span>
          <h2>{result.value} / 100 pontos</h2>
          <p>
            Resultado estimado {money(calc.profit)} · margem{" "}
            {calc.margin.toFixed(1)}% · atraso {calc.delay.toFixed(1)} h.
          </p>
          <h3>Como a pontuação foi calculada</h3>
          <p>
            Base 100 − processo incompleto {result.deductions.process} −
            ocorrências/pendências {result.deductions.decisions} − atraso{" "}
            {result.deductions.deadline} − prejuízo {result.deductions.margin}.
          </p>
          <h3>Decisões e recomendações</h3>
          {m.occurrences.map((o) => (
            <p key={o.id}>
              {occurrenceTypes[o.kind].label}:{" "}
              {o.resolved ? o.action : "Sem ação corretiva registrada."}{" "}
              Consequência: {money(o.cost)}, {o.hours} h e {o.penalty} pontos.
            </p>
          ))}
          <p>
            {calc.profit < 0
              ? "Revise o frete negociado e os custos antes de liberar a próxima operação."
              : "O frete cobre os custos estimados. Compare rotas e preserve a segurança."}
          </p>
          <p>
            {calc.delay > 0
              ? "Inclua pausas, descansos e contingências no prazo negociado."
              : "O prazo planejado comporta os tempos operacionais registrados."}
          </p>
          <button
            className="secondary"
            onClick={() => {
              const blob = new Blob(
                [
                  JSON.stringify(
                    { mission: m, calculation: calc, score: result },
                    null,
                    2,
                  ),
                ],
                { type: "application/json" },
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `relatorio-${m.id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={17} /> Exportar relatório
          </button>
        </section>
      )}
      <div className="actions destructive">
        <Link to="/app/nova">Criar nova missão</Link>
        <button
          disabled={busy || m.completed || !!pending}
          onClick={() => {
            if (
              confirm(
                "Reiniciar etapas e ocorrências? Os parâmetros serão mantidos.",
              )
            )
              void save({
                ...m,
                step: 0,
                journeyProgress: 0,
                checks: {},
                occurrences: [],
              });
          }}
        >
          Reiniciar missão atual
        </button>
        <button disabled={busy} onClick={() => void remove()}>
          Apagar missão
        </button>
      </div>
    </>
  );
}
