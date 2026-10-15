import type { Mission } from "../../domain/mission";
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n,
  );
export interface WorkspaceContext {
  missions: Mission[];
  reload: () => Promise<void>;
  message: string;
  setMessage: (s: string) => void;
}
export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
