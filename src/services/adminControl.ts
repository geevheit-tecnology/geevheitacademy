import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
export type AccessControl = {
  blocked: boolean;
  manualExpiresAt: Timestamp;
  reason: string;
};
export type StudentAccount = {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  trialEndsAt: number;
  paidEndsAt: number;
  canceled: boolean;
  access: AccessControl | null;
};
function database() {
  if (!db) throw Error("Serviço indisponível.");
  return db;
}
export function auditDocument() {
  return doc(collection(database(), "adminAudit"));
}
export function auditEntry(
  actorUid: string,
  action: string,
  targetUid: string,
  details: string,
) {
  return { actorUid, action, targetUid, details, at: serverTimestamp() };
}
export async function loadStudent(
  data: DocumentData,
  uid: string,
): Promise<StudentAccount> {
  const store = database();
  const [trial, subscription, preference, access] = await Promise.all(
    ["trials", "subscriptions", "subscriptionPreferences", "userAccess"].map(
      (kind) => getDoc(doc(store, kind, uid)),
    ),
  );
  return {
    uid,
    name: String(data.name ?? "Sem nome"),
    email: String(data.email ?? ""),
    createdAt: String(data.createdAt ?? ""),
    trialEndsAt: trial.exists()
      ? (trial.data().startedAt?.toMillis() ?? 0) + 3 * 86400000
      : 0,
    paidEndsAt: subscription.exists()
      ? subscription.data().expiresAt.toMillis()
      : 0,
    canceled: preference.exists() && preference.data().canceled,
    access: access.exists() ? (access.data() as AccessControl) : null,
  };
}
export async function studentPage(
  email = "",
  cursor?: QueryDocumentSnapshot<DocumentData>,
) {
  const store = database();
  const snapshot = await getDocs(
    query(
      collection(store, "users"),
      ...(email
        ? [where("email", "==", email)]
        : [orderBy("createdAt", "desc")]),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(25),
    ),
  );
  const students = await Promise.all(
    snapshot.docs.map((profile) => loadStudent(profile.data(), profile.id)),
  );
  return { students, cursor: snapshot.docs.at(-1), more: snapshot.size === 25 };
}
export async function adminSummary() {
  const store = database();
  const [users, pending, approved, canceled] = await Promise.all([
    getCountFromServer(collection(store, "users")),
    getCountFromServer(
      query(
        collection(store, "paymentRequests"),
        where("status", "==", "pending"),
      ),
    ),
    getCountFromServer(
      query(
        collection(store, "paymentRequests"),
        where("status", "==", "approved"),
      ),
    ),
    getCountFromServer(
      query(
        collection(store, "subscriptionPreferences"),
        where("canceled", "==", true),
      ),
    ),
  ]);
  return {
    users: users.data().count,
    pending: pending.data().count,
    approved: approved.data().count,
    canceled: canceled.data().count,
  };
}
export async function changeStudentAccess(
  actorUid: string,
  student: StudentAccount,
  action: "grant" | "revoke" | "block" | "unblock",
  reason: string,
  days = 30,
) {
  if (actorUid === student.uid)
    throw Error(
      "A conta do administrador geral não pode ser bloqueada por este painel.",
    );
  if (reason.trim().length < 5 || reason.trim().length > 300)
    throw Error("Informe o motivo com 5 a 300 caracteres.");
  if (!Number.isInteger(days) || days < 1 || days > 366)
    throw Error("Escolha entre 1 e 366 dias.");
  const access = {
    blocked: student.access?.blocked ?? false,
    manualExpiresAt: student.access?.manualExpiresAt ?? Timestamp.fromMillis(0),
    reason: reason.trim(),
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };
  if (action === "grant") {
    access.blocked = false;
    access.manualExpiresAt = Timestamp.fromMillis(Date.now() + days * 86400000);
  }
  if (action === "revoke") access.manualExpiresAt = Timestamp.fromMillis(0);
  if (action === "block" || action === "unblock")
    access.blocked = action === "block";
  const batch = writeBatch(database());
  batch.set(doc(database(), "userAccess", student.uid), access);
  batch.set(
    auditDocument(),
    auditEntry(
      actorUid,
      `access.${action}`,
      student.uid,
      `${reason.trim()}${action === "grant" ? ` · ${days} dias` : ""}`,
    ),
  );
  await batch.commit();
}
