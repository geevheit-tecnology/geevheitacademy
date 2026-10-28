import { useEffect, useState, type FormEvent } from "react";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import {
  adminSummary,
  auditDocument,
  auditEntry,
} from "../../services/adminControl";
import { db } from "../../services/firebase";
export function AdminOverview({
  ownerUid,
  maintenance,
  supportEmail,
  onMessage,
}: {
  ownerUid: string;
  maintenance: boolean;
  supportEmail: string;
  onMessage: (text: string) => void;
}) {
  const [counts, setCounts] =
    useState<Awaited<ReturnType<typeof adminSummary>>>();
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(maintenance);
  const [email, setEmail] = useState(supportEmail);
  useEffect(() => {
    setPaused(maintenance);
    setEmail(supportEmail);
  }, [maintenance, supportEmail]);
  async function refresh() {
    setLoading(true);
    try {
      setCounts(await adminSummary());
    } catch {
      onMessage("Não foi possível atualizar os indicadores.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!db) return;
    if (
      paused &&
      !window.confirm(
        "Pausar os treinamentos dos alunos? Seu acesso de administrador permanece disponível.",
      )
    )
      return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "platform/config"), {
        maintenance: paused,
        supportEmail: email.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: ownerUid,
      });
      batch.set(
        auditDocument(),
        auditEntry(
          ownerUid,
          "platform.update",
          ownerUid,
          `Treinamentos ${paused ? "pausados" : "liberados"}; contato ${email.trim()}`,
        ),
      );
      await batch.commit();
      onMessage("Controles gerais atualizados.");
    } catch {
      onMessage("Não foi possível salvar os controles gerais.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <section>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SUA CENTRAL DE CONTROLE</span>
          <h2>Visão geral do sistema</h2>
        </div>
        <button
          className="secondary"
          disabled={loading}
          onClick={() => void refresh()}
        >
          Atualizar indicadores
        </button>
      </div>
      <div className="admin-metrics">
        {[
          ["Contas cadastradas", counts?.users],
          ["Pagamentos pendentes", counts?.pending],
          ["Pagamentos aprovados", counts?.approved],
          ["Assinaturas canceladas", counts?.canceled],
        ].map(([label, value]) => (
          <article key={String(label)}>
            <small>{label}</small>
            <strong>{value ?? "—"}</strong>
          </article>
        ))}
      </div>
      <form className="billing-card billing-form" onSubmit={save}>
        <h3>Controles gerais</h3>
        <label>
          E-mail de suporte aos alunos
          <input
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={paused}
            onChange={(event) => setPaused(event.target.checked)}
          />{" "}
          Pausar treinamentos para manutenção
        </label>
        <p>
          Com a pausa ativa, alunos mantêm acesso à própria conta e assinatura.
          Os treinamentos ficam indisponíveis. A conta do administrador geral
          continua liberada.
        </p>
        <button className="primary" disabled={loading}>
          Salvar controles gerais
        </button>
      </form>
      <div className="admin-guide">
        <h3>Como administrar</h3>
        <p>
          <b>Alunos e acessos:</b> consulte períodos de teste e pagamento,
          libere acesso por prazo ou bloqueie os treinamentos.
        </p>
        <p>
          <b>Plano e Pix:</b> defina preço, duração e dados do favorecido. Ative
          a contratação quando os dados estiverem prontos.
        </p>
        <p>
          <b>Pagamentos:</b> confira os recebimentos no extrato e aprove ou
          rejeite as solicitações. As decisões ficam registradas.
        </p>
        <p>
          <b>Histórico administrativo:</b> acompanhe as alterações feitas pela
          sua conta. Somente o proprietário tem acesso à central.
        </p>
      </div>
    </section>
  );
}
