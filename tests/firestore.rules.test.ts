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
it("salva trechos, valida coordenadas e bloqueia mudança de rota após saída", async () => {
  const db = env.authenticatedContext("routes-user").firestore();
  const routePlan = {
    stops: [
      {
        name: "São Paulo",
        uf: "SP",
        cityId: 3550308,
        lat: -23.55,
        lng: -46.63,
      },
      {
        name: "Rio de Janeiro",
        uf: "RJ",
        cityId: 3304557,
        lat: -22.9,
        lng: -43.17,
      },
    ],
    geometry: [
      { lat: -23.55, lng: -46.63 },
      { lat: -22.9, lng: -43.17 },
    ],
    legs: [{ distanceKm: 450, durationHours: 7 }],
    provider: "OSRM",
    calculatedAt: new Date().toISOString(),
  };
  const m = { ...createMission(defaults), revision: 1 };
  const ref = doc(db, "users/routes-user/missions", m.id);
  await assertSucceeds(setDoc(ref, m));
  await assertSucceeds(
    updateDoc(ref, {
      input: { ...defaults, routePlan, distance: 450 },
      revision: 2,
    }),
  );
  await assertFails(updateDoc(ref, { journeyProgress: 2, revision: 3 }));
  await assertSucceeds(
    updateDoc(ref, { step: 8, journeyProgress: 0, revision: 3 }),
  );
  await assertFails(
    updateDoc(ref, {
      input: { ...defaults, routePlan, distance: 500 },
      revision: 4,
    }),
  );
  await assertSucceeds(updateDoc(ref, { journeyProgress: 1, revision: 4 }));
});
