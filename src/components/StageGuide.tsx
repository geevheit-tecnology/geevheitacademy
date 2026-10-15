import { BookOpen, Target, Lightbulb, CheckCircle2 } from "lucide-react";
import { stageGuidance } from "../domain/stageGuidance";
import { stages } from "../domain/mission";
export function StageGuide({
  step,
  completed,
  lastCompleted,
  onExplain,
}: {
  step: number;
  completed: boolean;
  lastCompleted: string;
  onExplain: () => void;
}) {
  const [title, action, impact] = stageGuidance[step];
  return (
    <section className="stage-guide" key={step} aria-live="polite">
      {lastCompleted && (
        <div className="step-success">
          <CheckCircle2 size={17} />
          {lastCompleted} concluído e salvo.
        </div>
      )}
      <span className="eyebrow">
        <BookOpen size={15} /> PASSO {step + 1} / 20 • {stages[step]}
      </span>
      <h2>{completed ? "Treinamento concluído" : title}</h2>
      <button
        type="button"
        className="stage-explain-button"
        onClick={onExplain}
      >
        Explicação rápida
      </button>
      <div className="guide-cards">
        <article>
          <Target size={20} />
          <div>
            <b>O que fazer agora</b>
            <p>{action}</p>
          </div>
        </article>
        <details className="guide-explanation">
          <summary>
            <Lightbulb size={15} />
            Por que este passo importa
          </summary>
          <p>{impact}</p>
        </details>
      </div>
    </section>
  );
}
