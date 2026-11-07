import { useEffect, useRef, useState } from "react";
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
const actions: Record<string, string> = {
  "access.grant": "Acesso liberado por prazo",
  "access.revoke": "Liberação manual removida",
  "access.block": "Treinamentos bloqueados",
  "access.unblock": "Treinamentos desbloqueados",
  "platform.update": "Controles gerais atualizados",
  "billing.update": "Plano e Pix atualizados",
  "payment.approved": "Pagamento aprovado",
  "payment.rejected": "Pagamento rejeitado",
  "student.edit": "Dados do aluno atualizados",
  "student.delete": "Aluno excluído",
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function AdminHistory({
  kind,
  onMessage,
}: {
  kind: "payments" | "audit";
  onMessage: (message: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const requestId = useRef(0);
  const [items, setItems] = useState<DocumentData[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData>>();
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  async function load(next = false, filter = applied) {
    if (!db) return;
    const currentRequest = ++requestId.current;
    setBusy(true);
    if (kind === "audit") setItems([]);
    try {
      if (kind === "audit") {
        const matches: DocumentData[] = [];
        const term = normalize(filter.trim());
        let after: QueryDocumentSnapshot<DocumentData> | undefined;
        // Search older pages too; Firestore has no substring search operator.
        do {
          const page = await getDocs(
            query(
              collection(db, "adminAudit"),
              orderBy("at", "desc"),
              ...(after ? [startAfter(after)] : []),
              limit(term ? 100 : 5),
            ),
          );
          if (currentRequest !== requestId.current) return;
          for (const entry of page.docs) {
            const item = entry.data();
            const searchable = [
              item.action,
              actions[item.action],
              item.details,
              item.targetUid,
              item.actorUid,
            ]
              .filter(Boolean)
              .join(" ");
            if (!term || normalize(searchable).includes(term))
              matches.push({ ...item, id: entry.id });
            if (matches.length === 5) break;
          }
          after = page.docs.at(-1);
          if (!term || page.size < 100 || !after) break;
        } while (matches.length < 5);
        setItems(matches);
        setMore(false);
        return;
      }
      const snapshots = await getDocs(
        query(
          collection(db, "paymentRequests"),
          orderBy("createdAt", "desc"),
          ...(next && cursor ? [startAfter(cursor)] : []),
          limit(25),
        ),
      );
      if (currentRequest !== requestId.current) return;
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
      if (currentRequest === requestId.current)
        onMessage("Não foi possível carregar o histórico.");
    } finally {
      if (currentRequest === requestId.current) setBusy(false);
    }
  }
  useEffect(() => {
    setItems([]);
    setCursor(undefined);
    setSearch("");
    setApplied("");
    void load(false, "");
    return () => {
      requestId.current++;
    };
  }, [kind]);
  const statuses: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    canceled: "Cancelado pelo aluno",
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
      {kind === "audit" && (
        <>
          <form
            className="admin-search"
            onSubmit={(event) => {
              event.preventDefault();
              setApplied(search.trim());
              void load(false, search.trim());
            }}
          >
            <label>
              Buscar na auditoria
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ação, descrição ou identificador da conta"
              />
            </label>
            <button className="secondary" disabled={busy}>
              Buscar registros
            </button>
            <button
              className="text-link"
              type="button"
              disabled={busy}
              onClick={() => {
                setSearch("");
                setApplied("");
                void load(false, "");
              }}
            >
              Limpar busca
            </button>
          </form>
          <p>
            {applied
              ? "Até 5 resultados da busca, do mais recente ao mais antigo."
              : "Últimos 5 registros por ordem de chegada. Use a busca para consultar os anteriores."}
          </p>
        </>
      )}
      {!busy && !items.length && <p>Nenhum registro encontrado.</p>}
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
      {kind === "payments" && more && (
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
