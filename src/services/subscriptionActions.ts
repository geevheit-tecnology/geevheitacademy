import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
export async function startTrial(uid: string) {
  if (!db) throw Error("Serviço indisponível.");
  const ref = doc(db, "trials", uid);
  return runTransaction(db, async (tx) => {
    if ((await tx.get(ref)).exists()) return false;
    tx.set(ref, { startedAt: serverTimestamp() });
    return true;
  });
}
export async function setSubscriptionCanceled(uid: string, canceled: boolean) {
  if (!db) throw Error("Serviço indisponível.");
  if (!canceled) {
    await setDoc(doc(db, "subscriptionPreferences", uid), {
      canceled: false,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const requests = await getDocs(
    query(collection(db, "paymentRequests"), where("uid", "==", uid)),
  );
  const pending = requests.docs.filter(
    (request) => request.data().status === "pending",
  );
  // A customer normally has at most one pending request. Use multiple small batches
  // when needed; the preference blocks approval even if a stale request remains.
  const batch = writeBatch(db);
  batch.set(doc(db, "subscriptionPreferences", uid), {
    canceled: true,
    updatedAt: serverTimestamp(),
  });
  for (const request of pending.slice(0, 400))
    batch.update(request.ref, {
      status: "canceled",
      reviewedAt: serverTimestamp(),
      reviewedBy: uid,
    });
  await batch.commit();
}
