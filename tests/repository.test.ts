import { beforeEach, it, expect, vi } from "vitest";
import { createMission, defaults } from "../src/domain/mission";
const fake = vi.hoisted(() => ({
  data: new Map<string, unknown>(),
  offline: false,
  writes: [] as string[],
}));
vi.mock("../src/services/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join("/"),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
  startAfter: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  runTransaction: async (_db: unknown, callback: (tx: unknown) => unknown) => {
    if (fake.offline) throw Error("unavailable");
    return callback({
      get: async (ref: string) => ({
        exists: () => fake.data.has(ref),
        data: () => fake.data.get(ref),
      }),
      set: (ref: string, value: unknown) => {
        fake.data.set(ref, value);
        fake.writes.push(ref);
      },
    });
  },
}));
import { FirestoreMissionRepository } from "../src/repositories/FirestoreMissionRepository";
beforeEach(() => {
  fake.data.clear();
  fake.writes = [];
  fake.offline = false;
});
it("persiste revisão crescente e rejeita sobrescrita antiga", async () => {
  const repo = new FirestoreMissionRepository();
  const m = createMission(defaults);
  const saved = await repo.save("alice", m);
  expect(saved.revision).toBe(1);
  const next = await repo.save("alice", { ...saved, checks: { "0:0": true } });
  expect(next.revision).toBe(2);
  await expect(repo.save("alice", saved)).rejects.toThrow("Conflito");
});
it("conclusão inclui resultado e histórico na mesma transação", async () => {
  const repo = new FirestoreMissionRepository();
  const m = createMission(defaults);
  const saved = await repo.save("alice", { ...m, step: 19, completed: true });
  expect(fake.writes).toEqual([
    `users/alice/missions/${m.id}`,
    `users/alice/results/${m.id}`,
    `users/alice/history/${m.id}`,
  ]);
  await expect(repo.save("alice", saved)).rejects.toThrow("Conflito");
});
it("falha de conexão não é apresentada como gravação concluída", async () => {
  fake.offline = true;
  await expect(
    new FirestoreMissionRepository().save("alice", createMission(defaults)),
  ).rejects.toThrow("unavailable");
  expect(fake.writes).toHaveLength(0);
});
