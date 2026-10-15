import { BookOpen, Target, Lightbulb, CheckCircle2 } from "lucide-react";
import { stageGuidance } from "../domain/stageGuidance";
import { stages } from "../domain/mission";
export function StageGuide({
  step,
  completed,
  lastCompleted,
}: {
  step: number;
  completed: boolean;
  lastCompleted: string;
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
      <div className="guide-cards">
        <article>
          <Target size={20} />
          <div>
            <b>O que fazer agora</b>
            <p>{action}</p>
          </div>
        </article>
        <article>
          <Lightbulb size={20} />
          <div>
            <b>Por que este passo importa</b>
            <p>{impact}</p>
          </div>
        </article>
      </div>
    </section>
  );
}
