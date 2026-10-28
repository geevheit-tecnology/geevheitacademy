import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { sampleStops } from "../domain/route";
import { RouteMap } from "./RouteMap";
const preview = {
  stops: [...sampleStops],
  geometry: [
    sampleStops[0],
    { lat: -23.24, lng: -45.89 },
    { lat: -22.92, lng: -45.46 },
    { lat: -22.74, lng: -45.12 },
    { lat: -22.48, lng: -44.45 },
    { lat: -22.53, lng: -44.1 },
    { lat: -22.65, lng: -43.72 },
    sampleStops[1],
  ],
  legs: [{ distanceKm: 485, durationHours: 8 }],
};
export function AnimatedRoutePreview() {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (host.current) observer.observe(host.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    if (paused || !visible || reduced) return;
    const interval = window.setInterval(() => {
      if (!document.hidden)
        setProgress((value) => (value >= 1 ? 0 : Math.min(1, value + 0.003)));
    }, 500);
    return () => window.clearInterval(interval);
  }, [paused, visible, reduced]);
  return (
    <div ref={host} className="animated-route-preview">
      <RouteMap preview={preview} progress={progress} />
      <div className="preview-odometer">
        <div>
          <span>Percurso demonstrativo</span>
          <strong>
            <output aria-label="Quilômetros percorridos na demonstração">
              {(progress * 485).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
                minimumFractionDigits: 1,
              })}
            </output>{" "}
            <small>/ 485 km</small>
          </strong>
        </div>
        <button
          className="small-button"
          type="button"
          disabled={reduced}
          onClick={() => setPaused(!paused)}
          aria-label={
            paused ? "Reproduzir demonstração" : "Pausar demonstração"
          }
        >
          {paused || reduced ? <Play size={16} /> : <Pause size={16} />}
          {reduced ? "Movimento reduzido" : paused ? "Continuar" : "Pausar"}
        </button>
      </div>
      <small className="preview-caption">
        Rota ilustrativa · dados de treinamento · sem rastreamento real
      </small>
    </div>
  );
}
