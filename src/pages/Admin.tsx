import { FooterCredit } from "../components/FooterCredit";
import { AdminStudents } from "../components/admin/AdminStudents";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminHistory } from "../components/admin/AdminHistory";
import { auditDocument, auditEntry } from "../services/adminControl";
import { Truck, ShieldCheck, LogOut } from "lucide-react";
import { logout } from "../features/auth/authService";
import { useEffect, useState, type FormEvent } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
  limit,
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
  const { config, admin, maintenance, supportEmail, loading, error } =
    useBilling();
  const [draft, setDraft] = useState<BillingConfig>(config);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("overview");
  const [historyRevision, setHistoryRevision] = useState(0);
  useEffect(() => setDraft(config), [config]);
  useEffect(() => {
    if (!db || !admin) return;
    return onSnapshot(
      query(
        collection(db, "paymentRequests"),
        where("status", "==", "pending"),
        limit(100),
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
      const batch = writeBatch(db);
      batch.set(doc(db, "billing/config"), draft);
      batch.set(
        auditDocument(),
        auditEntry(
          user!.uid,
          "billing.update",
          user!.uid,
          `${draft.name}: ${currency(draft.priceCents)} por ${draft.days} dias; contratação ${draft.enabled ? "ativa" : "desativada"}`,
        ),
      );
      await batch.commit();
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
        tx.set(
          auditDocument(),
          auditEntry(
            user.uid,
            approved ? "payment.approved" : "payment.rejected",
            payment.uid,
            `${payment.planName} · ${currency(payment.priceCents)} · pedido ${payment.id}`,
          ),
        );
        tx.update(ref, {
          status: approved ? "approved" : "rejected",
          reviewedBy: user.uid,
          reviewedAt: serverTimestamp(),
        });
      });
      setHistoryRevision((value) => value + 1);
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
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" to="/">
          <Truck /> TransportSim <b>360</b>
        </Link>
        <span className="admin-role">
          <ShieldCheck size={18} /> ADMINISTRADOR GERAL
        </span>
        <nav aria-label="Navegação administrativa">
          {[
            ["overview", "Visão geral"],
            ["students", "Alunos e acessos"],
            ["plan", "Plano e Pix"],
            ["payments", "Pagamentos"],
            ["audit", "Histórico administrativo"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={view === key ? "active" : ""}
              aria-current={view === key ? "page" : undefined}
              onClick={() => {
                setView(key);
                setMessage("");
              }}
            >
              {label}
              {key === "payments" && payments.length > 0
                ? ` (${payments.length})`
                : ""}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/app">Abrir ambiente de treinamento</Link>
          <Link to="/manual">Manual da plataforma</Link>
          <button
            onClick={() =>
              void logout().catch(() =>
                setMessage("Não foi possível sair da conta."),
              )
            }
          >
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">CONTROLE EXCLUSIVO DO PROPRIETÁRIO</span>
            <h1>Central do administrador</h1>
          </div>
          <span>{user.email}</span>
        </header>
        <main className="admin-main">
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          {view === "overview" && (
            <AdminOverview
              ownerUid={user.uid}
              maintenance={maintenance}
              supportEmail={supportEmail}
              onMessage={setMessage}
            />
          )}
          {view === "students" && (
            <AdminStudents ownerUid={user.uid} onMessage={setMessage} />
          )}
          {view === "audit" && (
            <AdminHistory kind="audit" onMessage={setMessage} />
          )}
          {view === "plan" && (
            <section>
              <h2>Plano e pagamento por Pix</h2>
              <form className="billing-card billing-form" onSubmit={save}>
                <label>
                  Nome do plano
                  <input
                    required
                    maxLength={100}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setDraft({ ...draft, recipient: e.target.value })
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) =>
                      setDraft({ ...draft, enabled: e.target.checked })
                    }
                  />{" "}
                  Disponibilizar contratação e renovação por Pix
                </label>
                <p>
                  O teste gratuito dura 3 dias. Depois, o aluno precisa de
                  período pago ou liberação manual para treinar. Ao ativar a
                  contratação, o preço aparece na página inicial. Pagamentos já
                  informados mantêm o valor e o período registrados.
                </p>
                <button className="primary" disabled={busy}>
                  Salvar configurações
                </button>
              </form>
            </section>
          )}
          {view === "payments" && (
            <section>
              <h2>Pagamentos aguardando conferência</h2>
              <p>
                Confira o crédito no extrato bancário antes de confirmar. Cada
                confirmação libera o período contratado, somando ao acesso
                vigente.
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
              <AdminHistory
                key={historyRevision}
                kind="payments"
                onMessage={setMessage}
              />
            </section>
          )}
        </main>
        <footer className="app-footer">
          <FooterCredit />
        </footer>
      </div>
    </div>
  );
}
