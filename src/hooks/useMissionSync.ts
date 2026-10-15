import { useCallback, useEffect, useRef, useState } from "react";
import type { Mission } from "../domain/mission";
import { errorMessage } from "../features/auth/authService";
import { useMissionRepository } from "../services/ServicesContext";
export function useMissionSync(
  uid: string | undefined,
  id: string,
  onError: (s: string) => void,
) {
  const repository = useMissionRepository();
  const [mission, setMission] = useState<Mission | null>(null);
  const [busy, setBusy] = useState(false);
  const [sync, setSync] = useState("Carregando…");
  const [pending, setPending] = useState<Mission | null>(null);
  const lock = useRef(false);
  const key = `transportsim-draft:${uid}:${id}`;
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      onError("Não foi possível limpar o cache temporário do navegador.");
    }
    setPending(null);
    setSync("Sincronizado com a nuvem");
  }, [key, onError]);
  const load = useCallback(async () => {
    if (!uid || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const found = await repository.get(uid, id);
      if (!found) throw Error("Missão não encontrada.");
      setMission(found);
      setSync("Sincronizado com a nuvem");
      try {
        const draft = localStorage.getItem(key);
        setPending(draft ? (JSON.parse(draft) as Mission) : null);
        if (draft) setSync("Rascunho local pendente");
      } catch {
        onError(
          "Cache temporário indisponível ou inválido. A versão da nuvem foi preservada.",
        );
      }
    } catch (e) {
      onError(errorMessage(e));
      setSync("Falha ao carregar");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, [uid, id, repository, key, onError]);
  useEffect(() => {
    setMission(null);
    void load();
  }, [load]);
  async function save(next: Mission) {
    if (!uid || lock.current) return;
    lock.current = true;
    setBusy(true);
    setSync("Sincronizando…");
    const previous = mission;
    setMission(next);
    try {
      const saved = await repository.save(uid, next);
      setMission(saved);
      clearDraft();
    } catch (e) {
      setMission(previous);
      setPending(next);
      setSync("Alteração pendente • não sincronizada");
      try {
        localStorage.setItem(key, JSON.stringify(next));
        onError(errorMessage(e));
      } catch {
        onError(
          `${errorMessage(e)} O navegador também bloqueou o cache. Mantenha esta página aberta e reenvie a alteração.`,
        );
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { mission, busy, sync, pending, load, save, clearDraft };
}
