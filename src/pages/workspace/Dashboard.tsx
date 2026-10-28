import { trainingModes } from "../../domain/training";
import { missionProgress } from "../../domain/mission";
import { ArrowRight, Plus } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { RouteMap } from "../../components/RouteMap";
import {
  missionStages,
  missionPosition,
  missionStageName,
  missionMode,
} from "../../domain/mission";
import { useAuth } from "../../features/auth/AuthContext";
import { Metric, type WorkspaceContext } from "./shared";

export function Dashboard() {
  const { missions } = useOutletContext<WorkspaceContext>();
  const { user } = useAuth();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SUA EVOLUÇÃO COMEÇA AQUI</span>
          <h1>Olá, {user?.displayName?.split(" ")[0] || "operador"}.</h1>
          <p>Pronto para tomar as próximas decisões da operação?</p>
        </div>
        <Link className="primary" to="/app/nova">
          <Plus size={18} /> Nova missão
        </Link>
      </div>
      <div className="stats">
        <Metric label="Missões em andamento" value={String(missions.length)} />
        <Metric label="Etapas do treinamento" value="40" />
        <Metric label="Estratégias de rota" value="3" />
        <Metric label="Persistência" value="Nuvem" />
      </div>
      <div className="panel-heading">
        <h2>Central de operações</h2>
        <span className="tag">Dados de treinamento</span>
      </div>
      {missions.length === 0 ? (
        <div className="empty-state">
          <RouteMap />
          <h2>Sua próxima operação começa aqui.</h2>
          <p>
            Crie uma missão, planeje a rota e acompanhe cada etapa até o
            resultado.
          </p>
          <Link className="primary" to="/app/nova">
            Criar primeira missão <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="mission-grid">
          {missions.map((m) => (
            <Link
              className="panel mission-card"
              to={`/app/operacao/${m.id}`}
              key={m.id}
            >
              <span className="tag">
                {m.input.difficulty} ·{" "}
                {m.schemaVersion === 1
                  ? "Fluxo original"
                  : trainingModes[missionMode(m)].label}
              </span>
              <h3>{m.input.name}</h3>
              <p>
                {m.input.origin} → {m.input.destination}
              </p>
              <RouteMap input={m.input} progress={missionProgress(m)} />
              <div className="progress">
                <div
                  style={{
                    width: `${(missionPosition(m) / missionStages(m).length) * 100}%`,
                  }}
                />
              </div>
              <div className="panel-heading">
                <span>{missionStageName(m)}</span>
                <b>
                  {missionPosition(m) + 1}/{missionStages(m).length} →
                </b>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
