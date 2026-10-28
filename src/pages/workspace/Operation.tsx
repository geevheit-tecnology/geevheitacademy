import { trainingModes, difficultyRules } from "../../domain/training";
import { NegotiationScene } from "../../components/NegotiationScene";
import { ProcessRecordForm } from "../../components/ProcessRecordForm";
import { enterpriseWorkflow } from "../../domain/workflow";
import {
  StageNotice,
  type StageNoticeData,
} from "../../components/StageNotice";
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
import { useState, useEffect, useRef, useCallback } from "react";
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
  missionRequirements,
  missionStages,
  missionStageName,
  missionPosition,
  missionMode,
  missionSequence,
  lastMissionStep,
  travelStart,
  podSteps,
  reopenPlanning,
  resolveOccurrence,
  routes,
  score,
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
  const [notice, setNotice] = useState<StageNoticeData | null>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const [lastCompleted, setLastCompleted] = useState("");
  const controlColumn = useRef<HTMLElement>(null);
  useEffect(() => {
    if (controlColumn.current) controlColumn.current.scrollTop = 0;
  }, [mission?.step]);
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
  const stages = missionStages(m);
  const requirements = missionRequirements(m);
  const pod = podSteps(m);
  const calc = calculate(m.input, m.occurrences);
  const result = score(m);
  function transition() {
    try {
      const next = advance(m);
      void save(next).then((success) => {
        if (success) {
          setLastCompleted(missionStageName(m));
          setNotice({
            id: Date.now(),
            step: next.step,
            completed: next.completed,
            schemaVersion: m.schemaVersion,
          });
        }
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
    <div className="operation-page">
      <StageNotice notice={notice} onClose={closeNotice} />
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
      {m.schemaVersion === 2 && (
        <div className="training-summary">
          <b>
            {trainingModes[missionMode(m)].label} · {m.input.difficulty}
          </b>
          <p>{difficultyRules[m.input.difficulty].description}</p>
        </div>
      )}
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
          {m.schemaVersion === 2 &&
            m.step > 5 &&
            m.step < 25 &&
            !m.completed && (
              <div className="actions">
                <span>Replanejar antes da saída:</span>
                {([5, 9, 14] as const)
                  .filter((step) => step < m.step)
                  .map((step) => (
                    <button
                      className="secondary"
                      key={step}
                      disabled={busy || !!pending}
                      onClick={() => {
                        if (
                          confirm(
                            "Retornar a esta etapa? Os registros posteriores precisarão ser refeitos, mantendo as ocorrências e seus impactos.",
                          )
                        )
                          void save(reopenPlanning(m, step));
                      }}
                    >
                      Voltar para {missionStageName(m, step).toLowerCase()}
                    </button>
                  ))}
              </div>
            )}
          {m.step < travelStart(m) && !m.completed && (
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
          {showPlanner && m.step < travelStart(m) && (
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
        <div className="operation-grid compact-operation-grid">
          <section className="operation-map-column">
            {m.schemaVersion === 2 && m.step === 9 ? (
              <NegotiationScene
                key={m.id}
                mission={m}
                disabled={busy || !!pending || m.completed}
                onSave={save}
              />
            ) : (
              <RouteMap input={m.input} progress={missionProgress(m)} />
            )}
          </section>
          <aside ref={controlColumn} className="operation-control-column">
            <StageGuide
              position={missionPosition(m)}
              total={stages.length}
              schemaVersion={m.schemaVersion}
              step={m.step}
              completed={m.completed}
              lastCompleted={lastCompleted}
              onExplain={() =>
                setNotice({
                  id: Date.now(),
                  step: m.step,
                  completed: m.completed,
                  schemaVersion: m.schemaVersion,
                })
              }
            />
            <JourneyControls
              mission={m}
              disabled={busy || !!pending || m.completed}
              onChange={(next) => void save(next)}
            />
            <div className="panel operation-checklist">
              <div className="panel-heading">
                <span className="eyebrow">
                  ETAPA {missionPosition(m) + 1} DE {stages.length}
                </span>
                <span className="tag">
                  {m.completed ? "Concluída" : "Em andamento"}
                </span>
              </div>
              <h2>{missionStageName(m)}</h2>

              {m.schemaVersion === 2 && (
                <ProcessRecordForm
                  key={`${m.id}:${m.step}:${m.step === 9 ? (m.processRecords?.["9"]?.savedAt ?? "") : ""}`}
                  mission={m}
                  disabled={busy || m.completed || !!pending}
                  onSave={save}
                />
              )}
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
                  : m.step === lastMissionStep(m)
                    ? "Concluir treinamento"
                    : "Concluir etapa e avançar"}
                <ArrowRight size={18} />
              </button>
            </div>
            <details className="operation-timeline-details">
              <summary>Ver as {stages.length} etapas</summary>
              <div className="timeline">
                {stages.map((s, i) => (
                  <div
                    className={
                      i === missionPosition(m)
                        ? "current"
                        : i < missionPosition(m) || m.completed
                          ? "done"
                          : ""
                    }
                    key={s}
                  >
                    <span>
                      {i < missionPosition(m) || m.completed ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    {s}
                  </div>
                ))}
              </div>
            </details>
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
                      minLength={m.input.difficulty === "Avançada" ? 20 : 5}
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
            {m.checks[`${pod.acceptance}:0`]
              ? "Aceite fictício registrado"
              : "Pendente"}
          </p>
          <p>
            Veículo vazio:{" "}
            {m.checks[`${pod.empty}:0`] ? "Comunicado" : "Pendente"}
          </p>
          <p>
            Comprovante:{" "}
            {m.checks[`${pod.pod}:0`] &&
            !m.occurrences.some((o) => o.kind === "pod" && !o.resolved)
              ? "Completo — demonstrativo"
              : "Pendente"}
          </p>
          <p>
            Conferência logística:{" "}
            {m.checks[`${pod.audit}:0`] ? "Aprovada" : "Pendente"}
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
          {m.schemaVersion === 2 && (
            <>
              <h3>Registros dos {stages.length} processos</h3>
              <div className="process-history">
                {Object.entries(m.processRecords ?? {}).map(
                  ([step, record]) => (
                    <details key={step}>
                      <summary>
                        {Number(step) + 1}.{" "}
                        {enterpriseWorkflow[Number(step)].name}
                      </summary>
                      <p>
                        Salvo em{" "}
                        {new Date(record.savedAt).toLocaleString("pt-BR")}
                      </p>
                      <dl>
                        {Object.entries(record.values).map(([key, value]) => (
                          <div key={key}>
                            <dt>
                              {enterpriseWorkflow[Number(step)].fields.find(
                                (f) => f.key === key,
                              )?.label ?? key}
                            </dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ),
                )}
              </div>
            </>
          )}
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
                step: missionSequence(m)[0],
                journeyProgress: 0,
                checks: {},
                occurrences: [],
                ...(m.schemaVersion === 2 ? { processRecords: {} } : {}),
              });
          }}
        >
          Reiniciar missão atual
        </button>
        <button disabled={busy} onClick={() => void remove()}>
          Apagar missão
        </button>
      </div>
    </div>
  );
}
