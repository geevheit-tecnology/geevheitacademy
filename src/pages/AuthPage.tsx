import { ArrowRight, Truck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import {
  errorMessage,
  login,
  register,
  resetPassword,
} from "../features/auth/authService";
import { configured } from "../services/firebase";
export function AuthPage({ mode }: { mode: "login" | "register" | "reset" }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user) return <Navigate to="/app" />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const email = String(data.get("email"));
      const password = String(data.get("password"));
      if (mode === "register")
        await register(String(data.get("name")), email, password);
      else if (mode === "reset") {
        await resetPassword(email);
        setMessage(
          "Se o e-mail estiver cadastrado, você receberá as instruções.",
        );
      } else await login(email, password);
      if (mode !== "reset") navigate("/app");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Link className="brand" to="/">
          <Truck /> TransportSim <b>360</b>
        </Link>
        <span className="eyebrow">ACADEMIA DE LOGÍSTICA</span>
        <h1>Grandes operações começam com boas decisões.</h1>
        <p>
          Aprenda cada etapa do transporte em um ambiente seguro de treinamento.
        </p>
        <div className="story-stat">
          <b>20</b>
          <span>
            etapas conectadas.
            <br />
            Uma visão completa da operação.
          </span>
        </div>
      </section>
      <section className="auth-form">
        <Link to="/">← Voltar ao início</Link>
        <h2>
          {mode === "login"
            ? "Bem-vindo de volta."
            : mode === "register"
              ? "Comece sua jornada."
              : "Recupere seu acesso."}
        </h2>
        <p>
          {mode === "login"
            ? "Entre para continuar suas missões."
            : "Sua evolução na logística começa aqui."}
        </p>
        {!configured && (
          <div className="notice">
            A autenticação está aguardando a configuração do projeto Firebase.
            Nenhuma sessão fictícia será criada.
          </div>
        )}
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Nome
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            E-mail
            <input type="email" name="email" required autoComplete="email" />
          </label>
          {mode !== "reset" && (
            <label>
              Senha
              <input
                type="password"
                name="password"
                minLength={6}
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </label>
          )}
          <button className="primary" disabled={busy || !configured}>
            {busy
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar na plataforma"
                : mode === "register"
                  ? "Criar minha conta"
                  : "Enviar instruções"}
            <ArrowRight size={18} />
          </button>
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
        </form>
        <div className="auth-links">
          <Link to="/login">Entrar</Link>
          <Link to="/cadastro">Criar conta</Link>
          <Link to="/recuperar">Esqueci minha senha</Link>
        </div>
      </section>
    </main>
  );
}
