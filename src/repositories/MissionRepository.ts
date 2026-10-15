import type { Mission } from "../domain/mission";
export interface MissionRepository {
  get(uid: string, id: string): Promise<Mission | null>;
  list(uid: string, completed?: boolean): Promise<Mission[]>;
  save(uid: string, mission: Mission): Promise<Mission>;
  remove(uid: string, id: string): Promise<void>;
}
