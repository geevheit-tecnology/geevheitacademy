import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AdminHistory } from "../src/components/admin/AdminHistory";
const { getDocs } = vi.hoisted(() => ({ getDocs: vi.fn() }));
vi.mock("../src/services/firebase", () => ({ db: {} }));
vi.mock("../src/services/billing", () => ({
  currency: (value: number) => String(value),
}));
vi.mock("firebase/firestore", () => ({
  getDocs,
  collection: vi.fn(),
  query: (...args: unknown[]) => args,
  orderBy: (...args: unknown[]) => ({ order: args }),
  limit: (value: number) => ({ limit: value }),
  startAfter: (value: unknown) => ({ after: value }),
}));
const entry = (id: string, details: string) => ({
  id,
  data: () => ({ action: "student.edit", details, targetUid: id }),
});
const page = (docs: ReturnType<typeof entry>[]) => ({
  docs,
  size: docs.length,
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("mostra apenas os cinco recentes e busca também em páginas antigas", async () => {
  getDocs.mockResolvedValueOnce(
    page(
      Array.from({ length: 5 }, (_, i) => entry(`new-${i}`, `Recente ${i}`)),
    ),
  );
  render(<AdminHistory kind="audit" onMessage={vi.fn()} />);
  await screen.findByText("Recente 0");
  expect(document.querySelectorAll("article")).toHaveLength(5);
  expect(getDocs.mock.calls[0][0]).toContainEqual({ limit: 5 });
  expect(getDocs.mock.calls[0][0]).toContainEqual({ order: ["at", "desc"] });
  expect(screen.queryByText("Carregar mais registros")).toBeNull();
  getDocs.mockResolvedValueOnce(
    page(
      Array.from({ length: 100 }, (_, i) => entry(`skip-${i}`, "Outro evento")),
    ),
  );
  getDocs.mockResolvedValueOnce(
    page(
      Array.from({ length: 8 }, (_, i) =>
        entry(`old-${i}`, `Exclusão antiga ${i}`),
      ),
    ),
  );
  fireEvent.change(screen.getByLabelText("Buscar na auditoria"), {
    target: { value: "exclusao" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar registros" }));
  await screen.findByText("Exclusão antiga 0");
  expect(document.querySelectorAll("article")).toHaveLength(5);
  expect(screen.queryByText("Exclusão antiga 5")).toBeNull();
  expect(screen.queryByText("Recente 0")).toBeNull();
  expect(getDocs).toHaveBeenCalledTimes(3);
  getDocs.mockResolvedValueOnce(page([entry("last", "Último evento")]));
  fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
  await screen.findByText("Último evento");
  expect(getDocs.mock.calls[3][0]).toContainEqual({ limit: 5 });
});
