import { useEffect, useState, type FormEvent } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import {
  changeStudentAccess,
  studentPage,
  type StudentAccount,
} from "../../services/adminControl";
const date = (value: number) =>
  value ? new Date(value).toLocaleString("pt-BR") : "Não disponível";
export function AdminStudents({
  ownerUid,
  onMessage,
}: {
  ownerUid: string;
  onMessage: (text: string) => void;
}) {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData>>();
  const [more, setMore] = useState(false);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  async function load(email = applied, next = false) {
    setBusy(true);
    try {
      const page = await studentPage(email, next ? cursor : undefined);
      setStudents((current) =>
        next ? [...current, ...page.students] : page.students,
      );
      setCursor(page.cursor);
      setMore(page.more);
    } catch {
      onMessage("Não foi possível carregar os alunos. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load("");
  }, []);
  function searchStudents(event: FormEvent) {
    event.preventDefault();
    const email = search.trim();
    setApplied(email);
    setSelected("");
    void load(email);
  }
  async function change(
    student: StudentAccount,
    action: "grant" | "revoke" | "block" | "unblock",
  ) {
    if (
      action === "block" &&
      !window.confirm(`Bloquear o acesso aos treinamentos de ${student.email}?`)
    )
      return;
    setBusy(true);
    try {
      await changeStudentAccess(ownerUid, student, action, reason, days);
      onMessage(
        action === "grant"
          ? `Acesso liberado por ${days} dias.`
          : action === "revoke"
            ? "Liberação manual removida. Teste e períodos pagos permanecem válidos."
            : action === "block"
              ? "Acesso aos treinamentos bloqueado."
              : "Acesso aos treinamentos desbloqueado.",
      );
      await load();
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o acesso.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="panel-heading">
        <div>
          <h2>Alunos e acessos</h2>
          <p>
            Gerencie o acesso aos treinamentos sem alterar o histórico ou a
            identidade do aluno.
          </p>
        </div>
      </div>
      <form className="admin-search" onSubmit={searchStudents}>
        <label>
          Buscar por e-mail exato
          <input
            type="email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="aluno@empresa.com"
          />
        </label>
        <button className="secondary" disabled={busy}>
          Buscar alunos
        </button>
        <button
          className="text-link"
          type="button"
          disabled={busy}
          onClick={() => {
            setSearch("");
            setApplied("");
            void load("");
          }}
        >
          Mostrar todos
        </button>
      </form>
      {!busy && !students.length && <p>Nenhum aluno encontrado.</p>}
      {busy && <p role="status">Atualizando alunos…</p>}
      {students.map((student) => {
        const currentEnd = Math.max(
          student.paidEndsAt,
          student.trialEndsAt,
          student.access?.manualExpiresAt.toMillis() ?? 0,
        );
        const blocked = student.access?.blocked;
        const isOwner = student.uid === ownerUid;
        return (
          <article className="billing-card admin-student" key={student.uid}>
            <div className="panel-heading">
              <div>
                <h3>{student.name}</h3>
                <p>{student.email}</p>
              </div>
              <span className="tag">
                {isOwner
                  ? "Administrador geral"
                  : blocked
                    ? "Treinamentos bloqueados"
                    : currentEnd > Date.now()
                      ? "Acesso vigente"
                      : "Sem acesso vigente"}
              </span>
            </div>
            <dl className="admin-access-dates">
              <div>
                <dt>Teste gratuito até</dt>
                <dd>{date(student.trialEndsAt)}</dd>
              </div>
              <div>
                <dt>Período pago até</dt>
                <dd>{date(student.paidEndsAt)}</dd>
              </div>
              <div>
                <dt>Liberação manual até</dt>
                <dd>{date(student.access?.manualExpiresAt.toMillis() ?? 0)}</dd>
              </div>
              <div>
                <dt>Assinatura</dt>
                <dd>
                  {student.canceled
                    ? "Cancelada pelo aluno"
                    : "Disponível para renovação"}
                </dd>
              </div>
            </dl>
            {!isOwner && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setSelected(selected === student.uid ? "" : student.uid);
                  setReason("");
                }}
              >
                Gerenciar acesso
              </button>
            )}
            {selected === student.uid && (
              <div className="admin-access-form">
                <label>
                  Motivo da alteração
                  <textarea
                    required
                    minLength={5}
                    maxLength={300}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <label>
                  Dias de liberação manual
                  <input
                    type="number"
                    min="1"
                    max="366"
                    step="1"
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                  />
                </label>
                <p>
                  A liberação manual não representa pagamento. Bloquear impede
                  os treinamentos mesmo com teste ou período pago vigente.
                </p>
                {student.access?.reason && (
                  <p>Último motivo registrado: {student.access.reason}</p>
                )}
                <div className="actions">
                  <button
                    className="primary"
                    disabled={busy || reason.trim().length < 5}
                    onClick={() => void change(student, "grant")}
                  >
                    Liberar acesso por prazo
                  </button>
                  <button
                    className="secondary"
                    disabled={busy || reason.trim().length < 5}
                    onClick={() =>
                      void change(student, blocked ? "unblock" : "block")
                    }
                  >
                    {blocked
                      ? "Desbloquear treinamentos"
                      : "Bloquear treinamentos"}
                  </button>
                  <button
                    className="text-link"
                    disabled={busy || reason.trim().length < 5}
                    onClick={() => void change(student, "revoke")}
                  >
                    Remover liberação manual
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
      {more && (
        <button
          className="secondary"
          disabled={busy}
          onClick={() => void load(applied, true)}
        >
          Carregar mais alunos
        </button>
      )}
    </section>
  );
}
