import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { currency } from "../../services/billing";
export function AdminHistory({
  kind,
  onMessage,
}: {
  kind: "payments" | "audit";
  onMessage: (message: string) => void;
}) {
  const [items, setItems] = useState<DocumentData[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData>>();
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  async function load(next = false) {
    if (!db) return;
    setBusy(true);
    try {
      const snapshots = await getDocs(
        query(
          collection(db, kind === "audit" ? "adminAudit" : "paymentRequests"),
          orderBy(kind === "audit" ? "at" : "createdAt", "desc"),
          ...(next && cursor ? [startAfter(cursor)] : []),
          limit(25),
        ),
      );
      setItems((old) =>
        next
          ? [
              ...old,
              ...snapshots.docs.map((item) => ({
                ...item.data(),
                id: item.id,
              })),
            ]
          : snapshots.docs.map((item) => ({ ...item.data(), id: item.id })),
      );
      setCursor(snapshots.docs.at(-1));
      setMore(snapshots.size === 25);
    } catch {
      onMessage("Não foi possível carregar o histórico.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setItems([]);
    setCursor(undefined);
    void load();
  }, [kind]);
  const statuses: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    canceled: "Cancelado pelo aluno",
  };
  const actions: Record<string, string> = {
    "access.grant": "Acesso liberado por prazo",
    "access.revoke": "Liberação manual removida",
    "access.block": "Treinamentos bloqueados",
    "access.unblock": "Treinamentos desbloqueados",
    "platform.update": "Controles gerais atualizados",
    "billing.update": "Plano e Pix atualizados",
    "payment.approved": "Pagamento aprovado",
    "payment.rejected": "Pagamento rejeitado",
  };
  return (
    <section>
      <div className="panel-heading">
        <h2>
          {kind === "audit"
            ? "Histórico administrativo"
            : "Histórico de pagamentos"}
        </h2>
        <button
          className="text-link"
          disabled={busy}
          onClick={() => void load()}
        >
          Atualizar histórico
        </button>
      </div>
      {!busy && !items.length && <p>Nenhum registro disponível.</p>}
      {items.map((item) => (
        <article className="billing-card" key={item.id}>
          {kind === "audit" ? (
            <>
              <h3>{actions[item.action] ?? item.action}</h3>
              <p>{item.details}</p>
              <small>Conta afetada: {item.targetUid}</small>
              <p>
                {item.at?.toDate().toLocaleString("pt-BR") ?? "Sincronizando…"}
              </p>
            </>
          ) : (
            <>
              <h3>{item.email}</h3>
              <span className="tag">
                {statuses[item.status] ?? item.status}
              </span>
              <p>
                {item.planName} · {currency(item.priceCents)} · {item.days} dias
              </p>
              <p>
                Pagador: {item.payerName} · Transação Pix: {item.reference}
              </p>
              <small>
                {item.createdAt?.toDate().toLocaleString("pt-BR") ??
                  "Data indisponível"}
              </small>
            </>
          )}
        </article>
      ))}
      {busy && <p role="status">Carregando histórico…</p>}
      {more && (
        <button
          className="secondary"
          disabled={busy}
          onClick={() => void load(true)}
        >
          Carregar mais registros
        </button>
      )}
    </section>
  );
}
