import { useEffect, useState, type FormEvent } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { currency, useBilling, type BillingConfig } from "../services/billing";
import { db } from "../services/firebase";
type Payment = {
  id: string;
  uid: string;
  email: string;
  priceCents: number;
  days: number;
  planName: string;
  payerName: string;
  reference: string;
};
export function Admin() {
  const { user } = useAuth();
  const { config, admin, loading, error } = useBilling();
  const [draft, setDraft] = useState<BillingConfig>(config);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(config), [config]);
  useEffect(() => {
    if (!db || !admin) return;
    return onSnapshot(
      query(
        collection(db, "paymentRequests"),
        where("status", "==", "pending"),
      ),
      (snap) =>
        setPayments(
          snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Payment),
        ),
      () => setMessage("Não foi possível carregar pagamentos."),
    );
  }, [admin]);
  if (!user) return <Navigate to="/login" replace />;
  if (loading) return <main className="center">Verificando acesso…</main>;
  if (!admin)
    return (
      <main className="section">
        <h1>Acesso administrativo</h1>
        <p>
          {error || "Esta conta ainda não recebeu permissão de administrador."}
        </p>
        <p>Conta: {user.email}</p>
        <p>
          Identificador da conta: <code>{user.uid}</code>
        </p>
        <p>
          A permissão precisa ser concedida no Firebase por um responsável pelo
          projeto.
        </p>
        <Link to="/app">Voltar à plataforma</Link>
      </main>
    );
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!db) return;
    setBusy(true);
    setMessage("");
    try {
      await setDoc(doc(db, "billing/config"), draft);
      setMessage(
        "Configuração salva. Os novos valores se aplicam aos próximos pagamentos informados.",
      );
    } catch {
      setMessage(
        "Não foi possível salvar. Confira os campos e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function review(payment: Payment, approved: boolean) {
    if (!db || !user) return;
    const database = db;
    setBusy(true);
    setMessage("");
    try {
      await runTransaction(database, async (tx) => {
        const ref = doc(database, "paymentRequests", payment.id);
        const sub = doc(database, "subscriptions", payment.uid);
        const snapshot = await tx.get(ref);
        const current = await tx.get(sub);
        const preferences = await tx.get(
          doc(database, "subscriptionPreferences", payment.uid),
        );
        if (approved && preferences.exists() && preferences.data().canceled)
          throw new Error("subscription-canceled");
        if (!snapshot.exists() || snapshot.data().status !== "pending")
          throw new Error("reviewed");
        const data = snapshot.data();
        if (approved) {
          const previous = current.exists()
            ? current.data().expiresAt.toMillis()
            : 0;
          tx.set(sub, {
            expiresAt: Timestamp.fromMillis(
              Math.max(Date.now(), previous) + data.days * 86400000,
            ),
            paymentId: payment.id,
            updatedAt: serverTimestamp(),
          });
        }
        tx.update(ref, {
          status: approved ? "approved" : "rejected",
          reviewedBy: user.uid,
          reviewedAt: serverTimestamp(),
        });
      });
      setMessage(
        approved
          ? "Recebimento confirmado e assinatura liberada."
          : "Solicitação rejeitada.",
      );
    } catch {
      setMessage(
        "Não foi possível concluir. Atualize e confira se a solicitação já foi revisada.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="section billing-page">
      <Link to="/app">← Voltar à plataforma</Link>
      <h1>Administração</h1>
      <h2>Plano e pagamento por Pix</h2>
      <form className="billing-card billing-form" onSubmit={save}>
        <label>
          Nome do plano
          <input
            required
            maxLength={100}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label>
          Valor em reais
          <input
            type="number"
            min="0.01"
            max="100000"
            step="0.01"
            required
            value={draft.priceCents / 100 || ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                priceCents: Math.round(Number(e.target.value) * 100),
              })
            }
          />
        </label>
        <label>
          Duração do acesso em dias
          <input
            type="number"
            min="1"
            max="366"
            step="1"
            required
            value={draft.days}
            onChange={(e) =>
              setDraft({ ...draft, days: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Chave Pix
          <input
            required
            maxLength={254}
            value={draft.pixKey}
            onChange={(e) =>
              setDraft({ ...draft, pixKey: e.target.value.trim() })
            }
          />
        </label>
        <label>
          Nome do favorecido
          <input
            required
            maxLength={150}
            value={draft.recipient}
            onChange={(e) => setDraft({ ...draft, recipient: e.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
          />{" "}
          Disponibilizar assinatura e exigir acesso vigente para as missões
        </label>
        <p>
          Ao ativar, alunos sem assinatura vigente precisarão pagar para acessar
          as missões. Pagamentos já informados mantêm o valor e o período
          registrados.
        </p>
        <button className="primary" disabled={busy}>
          Salvar configurações
        </button>
      </form>
      <h2>Pagamentos aguardando conferência</h2>
      <p>
        Confira o crédito no extrato bancário antes de confirmar. Cada
        confirmação libera o período contratado, somando ao acesso vigente.
      </p>
      {!payments.length && <p>Nenhum pagamento pendente.</p>}
      {payments.map((p) => (
        <article className="billing-card" key={p.id}>
          <h3>{p.email}</h3>
          <p>
            {p.planName} · {currency(p.priceCents)} · {p.days} dias
          </p>
          <p>Pagador: {p.payerName}</p>
          <p>Transação Pix: {p.reference}</p>
          <p>Solicitação: {p.id}</p>
          <div className="actions">
            <button
              className="primary"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Você conferiu este recebimento no extrato bancário?",
                  )
                )
                  void review(p, true);
              }}
            >
              Confirmar recebimento e liberar
            </button>
            <button
              className="small-button"
              disabled={busy}
              onClick={() => void review(p, false)}
            >
              Rejeitar solicitação
            </button>
          </div>
        </article>
      ))}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </main>
  );
}
