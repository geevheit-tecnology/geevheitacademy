import { renderHook, waitFor, act, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { ServicesProvider } from "../src/services/ServicesContext";
import { useMissionSync } from "../src/hooks/useMissionSync";
import { createMission, defaults } from "../src/domain/mission";
import type { MissionRepository } from "../src/repositories/MissionRepository";
import type { ReactNode } from "react";
vi.mock("../src/services/firebase", () => ({ auth: null, db: null }));
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it("preserva alteração após falha e reenvia com confirmação da nuvem", async () => {
  const mission = { ...createMission(defaults), revision: 1 };
  const repository: MissionRepository = {
    get: vi.fn().mockResolvedValue(mission),
    list: vi.fn(),
    remove: vi.fn(),
    save: vi.fn(),
  };
  const saved = { ...mission, revision: 2, checks: { "0:0": true } };
  vi.mocked(repository.save)
    .mockRejectedValueOnce(Error("Sem conexão"))
    .mockResolvedValue(saved);
  const onError = vi.fn();
  const { result } = renderHook(
    () => useMissionSync("alice", mission.id, onError),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ServicesProvider repository={repository}>{children}</ServicesProvider>
      ),
    },
  );
  await waitFor(() => expect(result.current.mission?.id).toBe(mission.id));
  const next = { ...mission, checks: { "0:0": true } };
  await act(async () => {
    await result.current.save(next);
  });
  expect(result.current.pending).toEqual(next);
  expect(result.current.sync).toContain("não sincronizada");
  expect(
    localStorage.getItem(`transportsim-draft:alice:${mission.id}`),
  ).toBeTruthy();
  await act(async () => {
    await result.current.save(next);
  });
  expect(result.current.pending).toBeNull();
  expect(result.current.mission?.revision).toBe(2);
  expect(
    localStorage.getItem(`transportsim-draft:alice:${mission.id}`),
  ).toBeNull();
});
