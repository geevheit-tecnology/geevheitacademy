import {
  collection,
  doc,
  getDocs,
  query,
  limit,
  orderBy,
  where,
  runTransaction,
  deleteDoc,
  writeBatch,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import type { Mission } from "../domain/mission";
import { calculate, score } from "../domain/mission";
import type { MissionRepository } from "./MissionRepository";
function database() {
  if (!db) throw Error("Configure o Firebase para persistir os dados.");
  return db;
}
export class FirestoreMissionRepository implements MissionRepository {
  async get(uid: string, id: string) {
    const snapshot = await getDoc(
      doc(database(), "users", uid, "missions", id),
    );
    return snapshot.exists() ? (snapshot.data() as Mission) : null;
  }
  async list(uid: string, completed = false) {
    const snapshot = await getDocs(
      query(
        collection(database(), "users", uid, "missions"),
        where("completed", "==", completed),
        orderBy("updatedAt", "desc"),
        limit(30),
      ),
    );
    return snapshot.docs.map((d) => d.data() as Mission);
  }
  async save(uid: string, mission: Mission) {
    const store = database();
    const ref = doc(store, "users", uid, "missions", mission.id);
    return runTransaction(store, async (tx) => {
      const current = await tx.get(ref);
      if (
        current.exists() &&
        (current.data().revision !== mission.revision ||
          current.data().completed)
      )
        throw Error(
          "Conflito: existe uma versão mais recente ou concluída. Recarregue a missão antes de continuar.",
        );
      const saved = {
        ...mission,
        revision: mission.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      tx.set(ref, saved);
      if (saved.completed) {
        const result = {
          missionId: saved.id,
          name: saved.input.name,
          financial: calculate(saved.input, saved.occurrences),
          score: score(saved),
          completedAt: saved.updatedAt,
        };
        tx.set(doc(store, "users", uid, "results", saved.id), result);
        tx.set(doc(store, "users", uid, "history", saved.id), {
          missionId: saved.id,
          name: saved.input.name,
          score: score(saved).value,
          completedAt: saved.updatedAt,
        });
      }
      return saved;
    });
  }
  async remove(uid: string, id: string) {
    const store = database();
    const batch = writeBatch(store);
    for (const kind of ["missions", "results", "history"])
      batch.delete(doc(store, "users", uid, kind, id));
    await batch.commit();
  }
}
export const missionRepository: MissionRepository =
  new FirestoreMissionRepository();
export async function loadSettings(uid: string) {
  const snap = await getDoc(doc(database(), "users", uid, "settings", "main"));
  return snap.exists() ? snap.data().values : null;
}
export async function saveSettings(
  uid: string,
  values: Record<string, unknown>,
) {
  await setDoc(doc(database(), "users", uid, "settings", "main"), {
    values,
    updatedAt: new Date().toISOString(),
  });
}
export async function historyPage(
  uid: string,
  cursor?: QueryDocumentSnapshot<DocumentData>,
) {
  const clauses = [orderBy("completedAt", "desc"), limit(10)];
  const snap = await getDocs(
    query(
      collection(database(), "users", uid, "history"),
      ...clauses,
      ...(cursor ? [startAfter(cursor)] : []),
    ),
  );
  return { items: snap.docs.map((d) => d.data()), cursor: snap.docs.at(-1) };
}
export async function clearHistory(uid: string) {
  let page = await getDocs(
    query(collection(database(), "users", uid, "history"), limit(100)),
  );
  while (!page.empty) {
    await Promise.all(page.docs.map((d) => deleteDoc(d.ref)));
    page = await getDocs(
      query(collection(database(), "users", uid, "history"), limit(100)),
    );
  }
}
