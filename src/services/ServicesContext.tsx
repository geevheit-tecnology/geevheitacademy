import { createContext, useContext, type ReactNode } from "react";
import type { MissionRepository } from "../repositories/MissionRepository";
const Context = createContext<MissionRepository | null>(null);
export function ServicesProvider({
  repository,
  children,
}: {
  repository: MissionRepository;
  children: ReactNode;
}) {
  return <Context.Provider value={repository}>{children}</Context.Provider>;
}
export function useMissionRepository() {
  const repository = useContext(Context);
  if (!repository) throw Error("Repositório de missões não fornecido.");
  return repository;
}
