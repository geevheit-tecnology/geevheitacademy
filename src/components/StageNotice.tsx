import { enterpriseWorkflow } from "../domain/workflow";
import { useEffect } from "react";
import { Info, X } from "lucide-react";
import { legacyStages, stages } from "../domain/mission";
import { stageGuidance } from "../domain/stageGuidance";
export interface StageNoticeData {
  id: number;
  step: number;
  completed: boolean;
  schemaVersion?: 1 | 2;
}
export function StageNotice({
  notice,
  onClose,
}: {
  notice: StageNoticeData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [notice, onClose]);
  if (!notice) return null;
  return (
    <div
      className="stage-notice"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Info size={21} />
      <div>
        <strong>
          {notice.completed
            ? "Treinamento concluído"
            : (notice.schemaVersion === 1 ? legacyStages : stages)[notice.step]}
        </strong>
        <p>
          {notice.completed
            ? "Seu resultado foi salvo. Consulte o relatório para revisar as decisões e os aprendizados."
            : notice.schemaVersion === 1
              ? stageGuidance[notice.step][1]
              : enterpriseWorkflow[notice.step].action}
        </p>
      </div>
      <button
        type="button"
        aria-label="Fechar explicação da etapa"
        onClick={onClose}
      >
        <X size={17} />
      </button>
      <span className="stage-notice-timer" key={notice.id} />
    </div>
  );
}
