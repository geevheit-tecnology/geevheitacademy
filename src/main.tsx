import { Manual } from "./pages/Manual";
import React from "react";
import { Admin } from "./pages/Admin";
import { Subscription } from "./pages/workspace/Subscription";
import { SubscriptionGate } from "./features/billing/SubscriptionGate";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./features/auth/AuthContext";
import { Landing } from "./pages/Landing";
import { AuthPage } from "./pages/AuthPage";
import { Help } from "./pages/Help";
import { Workspace } from "./pages/Workspace";
import { Dashboard } from "./pages/workspace/Dashboard";
import { MissionForm } from "./pages/workspace/MissionForm";
import { Operation } from "./pages/workspace/Operation";
import { HistoryPage } from "./pages/workspace/HistoryPage";
import { Profile } from "./pages/workspace/Profile";
import { ServicesProvider } from "./services/ServicesContext";
import { missionRepository } from "./repositories/FirestoreMissionRepository";
import "./styles/global.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ServicesProvider repository={missionRepository}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/cadastro" element={<AuthPage mode="register" />} />
            <Route path="/recuperar" element={<AuthPage mode="reset" />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/manual" element={<Manual />} />
            <Route path="/ajuda" element={<Help />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Workspace />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="assinatura" element={<Subscription />} />
              <Route
                path="nova"
                element={
                  <SubscriptionGate>
                    <MissionForm />
                  </SubscriptionGate>
                }
              />
              <Route path="configuracoes" element={<MissionForm settings />} />
              <Route
                path="operacao/:id"
                element={
                  <SubscriptionGate>
                    <Operation />
                  </SubscriptionGate>
                }
              />
              <Route path="historico" element={<HistoryPage />} />
              <Route path="perfil" element={<Profile />} />
            </Route>
            <Route
              path="*"
              element={
                <main className="center">
                  <h1>Página não encontrada</h1>
                  <a href="/">Voltar ao início</a>
                </main>
              }
            />
          </Routes>
        </AuthProvider>
      </ServicesProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
