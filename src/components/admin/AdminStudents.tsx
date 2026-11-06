import { useEffect, useState, type FormEvent } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import {
  changeStudentAccess,
  deleteStudent,
  editStudentProfile,
  studentPage,
  type StudentAccount,
} from "../../services/adminControl";
import { UserCog, Trash2, Edit3 } from "lucide-react";
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
  const [editingUid, setEditingUid] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [deletingUid, setDeletingUid] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
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
              <div
                className="student-actions-row"
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  className={selected === student.uid ? "primary" : "secondary"}
                  onClick={() => {
                    setSelected(selected === student.uid ? "" : student.uid);
                    setEditingUid("");
                    setDeletingUid("");
                    setReason("");
                  }}
                >
                  <UserCog size={15} /> Gerenciar acesso
                </button>
                <button
                  type="button"
                  className={editingUid === student.uid ? "primary" : "secondary"}
                  onClick={() => {
                    setEditingUid(editingUid === student.uid ? "" : student.uid);
                    setEditName(student.name);
                    setEditEmail(student.email);
                    setSelected("");
                    setDeletingUid("");
                  }}
                >
                  <Edit3 size={15} /> Editar dados
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    setDeletingUid(deletingUid === student.uid ? "" : student.uid);
                    setDeleteReason("");
                    setSelected("");
                    setEditingUid("");
                  }}
                >
                  <Trash2 size={15} /> Excluir aluno
                </button>
              </div>
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
            {editingUid === student.uid && (
              <form
                className="admin-access-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  try {
                    await editStudentProfile(ownerUid, student, {
                      name: editName,
                      email: editEmail,
                    });
                    onMessage("Dados do aluno atualizados com sucesso.");
                    setEditingUid("");
                    await load();
                  } catch (err) {
                    onMessage(
                      err instanceof Error
                        ? err.message
                        : "Erro ao atualizar os dados do aluno.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <h4>Editar dados do aluno</h4>
                <label>
                  Nome completo
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </label>
                <label>
                  E-mail do aluno
                  <input
                    type="email"
                    required
                    maxLength={254}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </label>
                <div className="actions" style={{ marginTop: "10px" }}>
                  <button type="submit" className="primary" disabled={busy}>
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    disabled={busy}
                    onClick={() => setEditingUid("")}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
            {deletingUid === student.uid && (
              <form
                className="admin-access-form delete-warning"
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    !window.confirm(
                      `ATENÇÃO: Confirma a exclusão definitiva do aluno "${student.name}" (${student.email})? Esta ação não pode ser desfeita.`
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    await deleteStudent(ownerUid, student, deleteReason);
                    onMessage(`Aluno ${student.name} excluído com sucesso.`);
                    setDeletingUid("");
                    await load();
                  } catch (err) {
                    onMessage(
                      err instanceof Error
                        ? err.message
                        : "Erro ao excluir o aluno.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <h4 style={{ color: "#991b1b", margin: "0 0 6px" }}>
                  Excluir aluno permanentemente
                </h4>
                <p
                  style={{
                    color: "#7f1d1d",
                    fontSize: "13px",
                    margin: "0 0 12px",
                  }}
                >
                  Esta ação removerá o perfil do aluno e todos os seus acessos
                  na plataforma.
                </p>
                <label>
                  Motivo da exclusão (obrigatório para auditoria)
                  <textarea
                    required
                    minLength={5}
                    maxLength={300}
                    placeholder="Informe o motivo da exclusão"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                  />
                </label>
                <div className="actions" style={{ marginTop: "12px" }}>
                  <button
                    type="submit"
                    className="button-danger"
                    disabled={busy || deleteReason.trim().length < 5}
                  >
                    <Trash2 size={16} /> Confirmar exclusão do aluno
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    disabled={busy}
                    onClick={() => setDeletingUid("")}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
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
