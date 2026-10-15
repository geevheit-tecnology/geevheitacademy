import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "../src/features/auth/AuthContext";
vi.mock("../src/services/firebase", () => ({ auth: null }));
afterEach(cleanup);
describe("proteção de rotas", () => {
  it("não aceita valor local como autenticação", () => {
    localStorage.setItem("user", "fake-user");
    render(
      <MemoryRouter initialEntries={["/privado"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/privado"
              element={
                <ProtectedRoute>
                  <p>Dados privados</p>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<p>Entrar com Firebase</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Dados privados")).toBeNull();
    expect(screen.getByText("Entrar com Firebase")).toBeTruthy();
  });
});
