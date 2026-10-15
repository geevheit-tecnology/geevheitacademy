import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MissionInput } from "../domain/mission";
import { pointOnRoute, sampleStops, type RoutePlan } from "../domain/route";
import { calculateRoadRoute } from "../services/geography";
const warehouse = `<svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="52" height="52" rx="14" fill="#fff" stroke="#b5c9ae"/><path d="M10 25 28 13 46 25v20H10Z" fill="#dce9cd" stroke="#194c3c" stroke-width="2"/><path d="M21 45V29h14v16M16 24h24M24 33h8M24 37h8M24 41h8" stroke="#194c3c" stroke-width="2" fill="none"/></svg>`;
const truck = `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="62" height="42" rx="12" fill="#194c3c" stroke="#ecf6c3" stroke-width="2"/><path d="M9 12h29v20H9Z" fill="#deeda9"/><path d="M39 19h9l7 8v5H39Z" fill="#fff"/><path d="M42 21h5l4 6h-9Z" fill="#82b9bb"/><circle cx="18" cy="33" r="5" fill="#18352e" stroke="#fff" stroke-width="2"/><circle cx="46" cy="33" r="5" fill="#18352e" stroke="#fff" stroke-width="2"/><path d="M14 16h19M14 20h19M14 24h19" stroke="#acc17d"/></svg>`;
function textLabel(text: string) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}
function textPopup(title: string, detail: string) {
  const div = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  const p = document.createElement("p");
  p.textContent = detail;
  div.append(strong, p);
  return div;
}
export function RouteMap({
  progress = 0,
  input,
}: {
  progress?: number;
  input?: MissionInput;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const vehicle = useRef<L.Marker | null>(null);
  const previousProgress = useRef(progress);
  const [sample, setSample] = useState<RoutePlan>();
  const [error, setError] = useState("");
  const plan = input?.routePlan ?? (!input ? sample : undefined);
  useEffect(() => {
    if (input) return;
    let active = true;
    calculateRoadRoute(sampleStops, "economica")
      .then((p) => {
        if (active) setSample(p);
      })
      .catch(() => {
        if (active)
          setError("Mapa disponível. Rota de exemplo indisponível no momento.");
      });
    return () => {
      active = false;
    };
  }, [input]);
  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([-15.8, -47.9], 4);
    map.current = instance;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      },
    ).addTo(instance);
    let failures = 0;
    tiles.on("tileerror", () => {
      if (++failures >= 4)
        setError(
          "Fundo do mapa indisponível. O percurso salvo continua visível.",
        );
    });
    markers.current = L.layerGroup().addTo(instance);
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
      vehicle.current = null;
      markers.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();
    vehicle.current = null;
    if (!plan) return;
    const coords = plan.geometry.map((p) => L.latLng(p.lat, p.lng));
    L.polyline(coords, { color: "#fff", weight: 9, opacity: 0.9 }).addTo(
      markers.current,
    );
    L.polyline(coords, { color: "#246c53", weight: 5, opacity: 0.95 }).addTo(
      markers.current,
    );
    plan.stops.forEach((stop, i) => {
      L.marker([stop.lat, stop.lng], {
        icon: L.divIcon({
          html: warehouse,
          className: "warehouse-marker",
          iconSize: [50, 50],
          iconAnchor: [25, 45],
        }),
      })
        .bindPopup(
          textPopup(
            i === 0
              ? "Armazém de origem"
              : i === plan.stops.length - 1
                ? "Armazém de destino"
                : `Ponto intermediário ${i}`,
            `${stop.name}/${stop.uf} • instalação de treinamento`,
          ),
        )
        .bindTooltip(textLabel(`${i + 1}. ${stop.name}/${stop.uf}`), {
          permanent: true,
          direction: "top",
          offset: [0, -42],
          className: "warehouse-label",
        })
        .addTo(markers.current!);
    });
    const position = pointOnRoute(plan.geometry, previousProgress.current);
    vehicle.current = L.marker([position.lat, position.lng], {
      zIndexOffset: 1000,
      icon: L.divIcon({
        html: truck,
        className: "truck-marker",
        iconSize: [64, 44],
        iconAnchor: [32, 22],
      }),
    })
      .bindPopup(
        textPopup(
          "Caminhão de treinamento",
          "Posição simulada ao longo do percurso rodoviário.",
        ),
      )
      .addTo(markers.current);
    map.current.fitBounds(L.latLngBounds(coords), {
      padding: [60, 65],
      maxZoom: 11,
      animate: false,
    });
  }, [plan]);
  useEffect(() => {
    if (!plan) return;
    const start = previousProgress.current;
    const end = Math.max(0, Math.min(1, progress));
    let frame = 0;
    const started = performance.now();
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    function move(now: number) {
      const t = reduced ? 1 : Math.min(1, (now - started) / 1800);
      const shown = start + (end - start) * (t * t * (3 - 2 * t));
      previousProgress.current = shown;
      const p = pointOnRoute(plan!.geometry, shown);
      vehicle.current?.setLatLng([p.lat, p.lng]);
      if (t < 1) frame = requestAnimationFrame(move);
    }
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [progress, plan]);
  return (
    <div className="route-map live-route-map">
      <div className="live-map-header">
        <span>
          <i /> MAPA DA OPERAÇÃO
        </span>
        <span>
          {plan
            ? `${plan.stops[0].name} → ${plan.stops.at(-1)!.name}`
            : "Brasil • configure seu percurso"}
        </span>
      </div>
      <div
        ref={host}
        className="leaflet-host"
        role="region"
        aria-label="Mapa interativo da rota com caminhão e armazéns"
      />
      {!plan && input && (
        <div className="map-empty-notice">
          Esta missão ainda não tem trechos geográficos. Use “Configurar
          trechos” antes do transporte.
        </div>
      )}
      {error && (
        <p role="status" className="map-service-notice">
          {error}
        </p>
      )}
      <div className="map-legend">
        <span>
          <i /> Percurso rodoviário
        </span>
        <span>Armazéns de treinamento</span>
        <span>Caminhão • {(progress * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
