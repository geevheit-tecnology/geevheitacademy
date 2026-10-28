import { useBilling } from "../services/billing";
import { FooterCredit } from "../components/FooterCredit";
import {
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Monitor,
  Plus,
  Settings,
  Truck,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { type Mission } from "../domain/mission";
import { useAuth } from "../features/auth/AuthContext";
import { errorMessage, logout } from "../features/auth/authService";
import { useMissionRepository } from "../services/ServicesContext";
import type { WorkspaceContext } from "./workspace/shared";
export function Workspace() {
  const missionRepository = useMissionRepository();
  const { user } = useAuth();
  const { admin } = useBilling();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [message, setMessage] = useState("");
  const [presentation, setPresentation] = useState(false);
  const location = useLocation();
  const reload = useCallback(async () => {
    if (!user) return;
    try {
      setMissions(await missionRepository.list(user.uid));
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }, [user, missionRepository]);
  useEffect(() => {
    void reload();
  }, [reload, location.pathname]);
  return (
    <div className={`workspace ${presentation ? "presentation" : ""}`}>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <Truck />
          TransportSim <b>360</b>
        </Link>
        <small>SEU AMBIENTE DE APRENDIZADO</small>
        <nav>
          {[
            {
              to: "/app",
              icon: LayoutDashboard,
              label: "Visão geral",
              end: true,
            },
            { to: "/app/nova", icon: Plus, label: "Nova missão" },
            { to: "/app/historico", icon: History, label: "Histórico" },
            {
              to: "/app/configuracoes",
              icon: Settings,
              label: "Configurações",
            },
            {
              to: "/app/assinatura",
              icon: UserRound,
              label: "Minha assinatura",
            },
            { to: "/app/perfil", icon: UserRound, label: "Meu perfil" },
          ].map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <n.icon size={19} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {admin && <Link to="/admin">Administração</Link>}
          <Link to="/manual">Manual de treinamento</Link>
          <Link to="/ajuda">
            <HelpCircle size={19} /> Central de ajuda
          </Link>
          <button
            onClick={() => {
              void logout().catch((e) => setMessage(errorMessage(e)));
            }}
          >
            <LogOut size={19} /> Sair da conta
          </button>
          <span className="training-tag">AMBIENTE DE TREINAMENTO</span>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <span>
            Academia de logística{" "}
            <span className="muted">/ Central de operações</span>
          </span>
          <div>
            <button
              className="icon-button"
              aria-label="Alternar modo apresentação"
              onClick={() => setPresentation(!presentation)}
            >
              <Monitor size={19} />
            </button>
            <span className="avatar">{(user?.displayName || "U")[0]}</span>
            <span>{user?.displayName || "Operador"}</span>
          </div>
        </header>
        {message && (
          <div className="notice" role="alert">
            {message}
            <button onClick={() => setMessage("")}>Fechar</button>
          </div>
        )}
        <main className="dashboard">
          <Outlet
            context={
              {
                missions,
                reload,
                message,
                setMessage,
              } satisfies WorkspaceContext
            }
          />
        </main>
        <footer className="app-footer">
          <FooterCredit />
        </footer>
      </div>
    </div>
  );
}
