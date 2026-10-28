import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useBilling } from "../../services/billing";
export function SubscriptionGate({ children }: { children: ReactNode }) {
  const { admin, active, loading, error } = useBilling();
  if (loading) return <p role="status">Verificando assinatura…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!admin && !active) return <Navigate to="/app/assinatura" replace />;
  return <>{children}</>;
}
