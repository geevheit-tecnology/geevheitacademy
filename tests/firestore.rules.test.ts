// Executar somente pelo Emulator Suite. Nunca usa projeto real.
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { beforeAll, afterAll, it } from "vitest";
import { createMission, defaults } from "../src/domain/mission";
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-transportsim360",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});
afterAll(async () => {
  await env.cleanup();
});
it("nega não autenticados e acesso a UID alheio", async () => {
  await assertFails(
    getDoc(doc(env.unauthenticatedContext().firestore(), "users/alice")),
  );
  await assertFails(
    getDoc(doc(env.authenticatedContext("bob").firestore(), "users/alice")),
  );
});
it("permite perfil próprio e rejeita campos extras", async () => {
  const db = env.authenticatedContext("alice").firestore();
  await assertSucceeds(
    setDoc(doc(db, "users/alice"), {
      name: "Alice",
      email: "alice@example.com",
      createdAt: new Date().toISOString(),
    }),
  );
  await assertFails(updateDoc(doc(db, "users/alice"), { admin: true }));
});
it("valida missão, revisão e parâmetros imutáveis", async () => {
  const db = env.authenticatedContext("alice").firestore();
  const m = { ...createMission(defaults), revision: 1 };
  const ref = doc(db, "users/alice/missions", m.id);
  await assertSucceeds(setDoc(ref, m));
  await assertFails(updateDoc(ref, { step: 100, revision: 2 }));
  await assertFails(updateDoc(ref, { step: 1, revision: 1 }));
  await assertFails(
    updateDoc(ref, { input: { ...defaults, freight: -10 }, revision: 2 }),
  );
  await assertSucceeds(
    updateDoc(ref, { checks: { "0:0": true }, revision: 2 }),
  );
  await assertFails(
    getDoc(
      doc(
        env.authenticatedContext("bob").firestore(),
        "users/alice/missions",
        m.id,
      ),
    ),
  );
});
