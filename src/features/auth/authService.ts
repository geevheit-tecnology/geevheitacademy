import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
function service() {
  if (!auth)
    throw Error(
      "Firebase ainda não configurado. Consulte a documentação de configuração.",
    );
  return auth;
}
export async function register(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(
    service(),
    email,
    password,
  );
  await updateProfile(credential.user, { displayName: name });
  if (db) {
    const batch = writeBatch(db);
    batch.set(doc(db, "users", credential.user.uid), {
      name,
      email,
      createdAt: new Date().toISOString(),
    });
    batch.set(doc(db, "trials", credential.user.uid), {
      startedAt: serverTimestamp(),
    });
    await batch.commit();
  }
}
export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(service(), email, password);
export const resetPassword = (email: string) =>
  sendPasswordResetEmail(service(), email);
export const logout = () => signOut(service());
export function errorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/configuration-not-found":
      "O administrador precisa ativar E-mail/senha no projeto Firebase TransportSim 360.",
    "auth/operation-not-allowed":
      "Login por e-mail e senha ainda não habilitado no Firebase.",
    "auth/unauthorized-domain":
      "Este domínio precisa ser autorizado no Firebase Authentication.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/user-disabled": "Esta conta foi desativada. Contate o administrador.",
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "Utilize uma senha com pelo menos 6 caracteres.",
    "auth/network-request-failed":
      "Sem conexão. Verifique sua rede e tente novamente.",
    "auth/too-many-requests":
      "Muitas tentativas. Aguarde antes de tentar novamente.",
    "permission-denied": "Acesso negado. Verifique as regras do Firebase.",
    unavailable: "Serviço indisponível. Tente novamente.",
    "resource-exhausted":
      "Cota do serviço atingida. Tente novamente mais tarde.",
  };
  return (
    (code && messages[code]) ||
    (error instanceof Error
      ? error.message
      : "Não foi possível concluir a operação.")
  );
}
