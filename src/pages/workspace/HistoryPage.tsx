import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { errorMessage } from "../../features/auth/authService";
import {
  clearHistory,
  historyPage,
} from "../../repositories/FirestoreMissionRepository";
import { type WorkspaceContext } from "./shared";

export function HistoryPage() {
  const { user } = useAuth();
  const { setMessage } = useOutletContext<WorkspaceContext>();
  const [items, setItems] = useState<DocumentData[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData>>();
  const [more, setMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const fetchPage = useCallback(
    async (next = false) => {
      if (!user) return;
      setBusy(true);
      try {
        const page = await historyPage(user.uid, next ? cursor : undefined);
        setItems((old) => (next ? [...old, ...page.items] : page.items));
        setCursor(page.cursor);
        setMore(page.items.length === 10);
      } catch (e) {
        setMessage(errorMessage(e));
      } finally {
        setBusy(false);
      }
    },
    [user, cursor, setMessage],
  );
  useEffect(() => {
    void fetchPage(); /* initial page only */
  }, [user]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU CAMINHO ATÉ AQUI</span>
          <h1>Histórico de missões</h1>
          <p>Operações concluídas e resultados do treinamento.</p>
        </div>
      </div>
      <section className="panel">
        {items.length === 0 && <p>Nenhuma missão concluída.</p>}
        {items.map((i) => (
          <Link
            className="history-row"
            to={`/app/operacao/${i.missionId}`}
            key={i.missionId}
          >
            <span>
              {i.name}
              <small>{new Date(i.completedAt).toLocaleString("pt-BR")}</small>
            </span>
            <b>{i.score} pontos →</b>
          </Link>
        ))}
        {more && (
          <button disabled={busy} onClick={() => void fetchPage(true)}>
            Carregar mais
          </button>
        )}
        <button
          className="danger"
          disabled={busy}
          onClick={() => {
            if (
              user &&
              confirm(
                "Apagar todo o histórico resumido? As missões e relatórios serão mantidos.",
              )
            )
              void clearHistory(user.uid)
                .then(() => {
                  setItems([]);
                  setMore(false);
                })
                .catch((e) => setMessage(errorMessage(e)));
          }}
        >
          Apagar histórico
        </button>
      </section>
    </>
  );
}
