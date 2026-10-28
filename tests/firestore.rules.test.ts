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
  await env.clearFirestore();
  const { Timestamp } = await import("firebase/firestore");
  await env.withSecurityRulesDisabled(async (context) => {
    for (const uid of ["alice", "routes-user", "enterprise", "replan"])
      await setDoc(doc(context.firestore(), "trials", uid), {
        startedAt: Timestamp.now(),
      });
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
  const m = { ...createMission(defaults, 1), revision: 1 };
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
  const m = { ...createMission(defaults, 1), revision: 1 };
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
it("protege configuração comercial, pagamento e liberação de assinatura", async () => {
  const { serverTimestamp, Timestamp } = await import("firebase/firestore");
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "admins/operator"), {
      granted: true,
    });
  });
  const admin = env
    .authenticatedContext("operator", {
      email: "getuliopedromoreirafilho@gmail.com",
    })
    .firestore();
  const student = env
    .authenticatedContext("student", { email: "student@example.com" })
    .firestore();
  const config = {
    enabled: true,
    name: "Mensal",
    priceCents: 4990,
    days: 30,
    pixKey: "pix@example.com",
    recipient: "Academia",
  };
  await assertFails(setDoc(doc(student, "admins/student"), { granted: true }));
  await assertFails(setDoc(doc(student, "billing/config"), config));
  await assertSucceeds(setDoc(doc(admin, "billing/config"), config));
  const payment = {
    uid: "student",
    email: "student@example.com",
    status: "pending",
    priceCents: 4990,
    days: 30,
    planName: "Mensal",
    payerName: "Aluno",
    reference: "E123456789",
    createdAt: serverTimestamp(),
  };
  await assertFails(
    setDoc(doc(student, "paymentRequests/forged"), {
      ...payment,
      priceCents: 1,
    }),
  );
  await assertSucceeds(setDoc(doc(student, "paymentRequests/valid"), payment));
  await assertFails(
    updateDoc(doc(student, "paymentRequests/valid"), { status: "approved" }),
  );
  await assertFails(
    setDoc(doc(student, "subscriptions/student"), {
      expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
      paymentId: "valid",
      updatedAt: serverTimestamp(),
    }),
  );
  const m = { ...createMission(defaults, 1), revision: 1 };
  await assertFails(setDoc(doc(student, "users/student/missions", m.id), m));
  await assertSucceeds(
    updateDoc(doc(admin, "paymentRequests/valid"), {
      status: "approved",
      reviewedBy: "operator",
      reviewedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(admin, "subscriptions/student"), {
      expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
      paymentId: "valid",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(setDoc(doc(student, "users/student/missions", m.id), m));
  await assertFails(
    getDoc(
      doc(
        env.authenticatedContext("stranger").firestore(),
        "paymentRequests/valid",
      ),
    ),
  );
  await assertFails(
    updateDoc(doc(admin, "paymentRequests/valid"), {
      status: "rejected",
      reviewedBy: "operator",
      reviewedAt: serverTimestamp(),
    }),
  );
});
it("reserva a administração exclusivamente ao proprietário, mesmo com outro documento de admin", async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "admins/other-admin"), {
      granted: true,
    });
  });
  const other = env
    .authenticatedContext("other-admin", { email: "other@example.com" })
    .firestore();
  await assertFails(
    updateDoc(doc(other, "billing/config"), { priceCents: 100 }),
  );
  await assertFails(getDoc(doc(other, "paymentRequests/valid")));
  const ungranted = env
    .authenticatedContext("new-owner", {
      email: "getuliopedromoreirafilho@gmail.com",
    })
    .firestore();
  await assertFails(
    updateDoc(doc(ungranted, "billing/config"), { priceCents: 100 }),
  );
});
it("persiste os 40 processos, bloqueia salto e reescrita de registros anteriores", async () => {
  const { recordValues, enterprisePlan, completeStage } =
    await import("./fixtures/enterprise");
  const { saveProcessRecord } = await import("../src/domain/mission");
  await env.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), "billing/config"), {
      enabled: false,
    });
  });
  const db = env.authenticatedContext("enterprise").firestore();
  let m = {
    ...createMission({ ...defaults, routePlan: enterprisePlan }),
    revision: 1,
  };
  const ref = doc(db, "users/enterprise/missions", m.id);
  await assertSucceeds(setDoc(ref, m));
  await assertFails(updateDoc(ref, { schemaVersion: 1, revision: 2 }));
  await assertFails(updateDoc(ref, { step: 2, revision: 2 }));
  for (let step = 0; step < 40; step++) {
    m = {
      ...saveProcessRecord(m, recordValues(step)),
      revision: m.revision + 1,
    };
    await assertSucceeds(setDoc(ref, m));
    const next = completeStage(m);
    m = { ...next, revision: m.revision + 1 };
    await assertSucceeds(setDoc(ref, m));
    if (step === 1)
      await assertFails(
        updateDoc(ref, {
          "processRecords.0.values.company": "Alterado",
          revision: m.revision + 1,
        }),
      );
  }
  await assertFails(updateDoc(ref, { step: 0, revision: m.revision + 1 }));
});
it("permite replanejamento antes da saída, preserva registros e bloqueia retorno após a partida", async () => {
  const { missionAt } = await import("./fixtures/enterprise");
  const { reopenPlanning } = await import("../src/domain/mission");
  let m = { ...missionAt(24), revision: 1 };
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users/replan/missions", m.id), m);
  });
  const db = env.authenticatedContext("replan").firestore();
  const ref = doc(db, "users/replan/missions", m.id);
  const rewind = { ...reopenPlanning(m, 9), revision: 2 };
  await assertFails(
    setDoc(ref, {
      ...rewind,
      processRecords: {
        ...rewind.processRecords,
        "0": {
          values: { company: "Fraude", contact: "Outro" },
          savedAt: new Date().toISOString(),
        },
      },
    }),
  );
  await assertSucceeds(setDoc(ref, rewind));
  m = { ...missionAt(25), id: m.id, revision: 3 };
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users/replan/missions", m.id), m);
  });
  await assertFails(setDoc(ref, { ...rewind, revision: 4 }));
});
it("garante teste de 72 horas no servidor e impede repetir, apagar ou estender o período", async () => {
  const { serverTimestamp, Timestamp, deleteDoc } =
    await import("firebase/firestore");
  const db = env.authenticatedContext("trial-user").firestore();
  const ref = doc(db, "trials/trial-user");
  const m = { ...createMission(defaults), revision: 1 };
  await assertFails(setDoc(doc(db, "users/trial-user/missions", m.id), m));
  await assertFails(
    setDoc(ref, { startedAt: Timestamp.fromMillis(Date.now() + 86400000) }),
  );
  await assertSucceeds(setDoc(ref, { startedAt: serverTimestamp() }));
  await assertSucceeds(setDoc(doc(db, "users/trial-user/missions", m.id), m));
  await assertFails(updateDoc(ref, { startedAt: serverTimestamp() }));
  await assertFails(deleteDoc(ref));
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "trials/trial-user"), {
      startedAt: Timestamp.fromMillis(Date.now() - 4 * 86400000),
    });
  });
  await assertFails(
    updateDoc(doc(db, "users/trial-user/missions", m.id), { revision: 2 }),
  );
});
it("preserva modalidade, dificuldade e quantidade planejada durante a missão", async () => {
  const { enterprisePlan } = await import("./fixtures/enterprise");
  const db = env.authenticatedContext("enterprise").firestore();
  const m = {
    ...createMission({ ...defaults, routePlan: enterprisePlan }, 2, {
      mode: "transport",
      expectedPackages: 100,
    }),
    revision: 1,
  };
  const ref = doc(db, "users/enterprise/missions", m.id);
  await assertSucceeds(setDoc(ref, m));
  await assertFails(updateDoc(ref, { mode: "complete", revision: 2 }));
  await assertFails(
    updateDoc(ref, { "input.difficulty": "Avançada", revision: 2 }),
  );
  await assertFails(updateDoc(ref, { expectedPackages: 99, revision: 2 }));
  await assertFails(
    setDoc(doc(db, "users/enterprise/missions/invalid-transport"), {
      ...m,
      id: "invalid-transport",
      step: 0,
    }),
  );
});
it("permite cancelamento pelo aluno, bloqueia novas aprovações e mantém acesso já pago", async () => {
  const { serverTimestamp, Timestamp, writeBatch } =
    await import("firebase/firestore");
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "subscriptions/cancel-user"), {
      expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
      paymentId: "old-paid",
      updatedAt: Timestamp.now(),
    });
    await setDoc(doc(context.firestore(), "paymentRequests/cancel-pending"), {
      uid: "cancel-user",
      status: "pending",
    });
    await setDoc(doc(context.firestore(), "paymentRequests/cancel-stale"), {
      uid: "cancel-user",
      status: "pending",
    });
  });
  const db = env
    .authenticatedContext("cancel-user", { email: "cancel@example.com" })
    .firestore();
  const admin = env
    .authenticatedContext("operator", {
      email: "getuliopedromoreirafilho@gmail.com",
    })
    .firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, "subscriptionPreferences/cancel-user"), {
    canceled: true,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "paymentRequests/cancel-pending"), {
    status: "canceled",
    reviewedBy: "cancel-user",
    reviewedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
  await assertFails(
    updateDoc(doc(admin, "paymentRequests/cancel-stale"), {
      status: "approved",
      reviewedBy: "operator",
      reviewedAt: serverTimestamp(),
    }),
  );
  const m = { ...createMission(defaults), revision: 1 };
  await assertSucceeds(setDoc(doc(db, "users/cancel-user/missions", m.id), m));
  await assertFails(
    setDoc(doc(db, "subscriptionPreferences/another"), {
      canceled: true,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(db, "subscriptionPreferences/cancel-user"), {
      canceled: false,
      updatedAt: serverTimestamp(),
    }),
  );
});
