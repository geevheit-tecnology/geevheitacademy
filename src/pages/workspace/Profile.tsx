import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import {
  errorMessage,
  logout,
  resetPassword,
} from "../../features/auth/authService";
import { type WorkspaceContext } from "./shared";

export function Profile() {
  const { user } = useAuth();
  const { setMessage } = useOutletContext<WorkspaceContext>();
  return (
    <section className="panel">
      <span className="eyebrow">MINHA CONTA</span>
      <h1>{user?.displayName}</h1>
      <p>{user?.email}</p>
      <p>Identificador da conta: {user?.uid}</p>
      <p>Autenticação e sessão gerenciadas pelo Firebase Authentication.</p>
      <button
        className="secondary"
        onClick={() => {
          if (user?.email)
            void resetPassword(user.email)
              .then(() => setMessage("E-mail de recuperação enviado."))
              .catch((e) => setMessage(errorMessage(e)));
        }}
      >
        Enviar recuperação de senha
      </button>
      <button className="secondary" onClick={() => void logout()}>
        Sair
      </button>
    </section>
  );
}
