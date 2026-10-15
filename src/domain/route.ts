import { z } from "zod";
export const coordinateSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});
export const stopSchema = coordinateSchema.extend({
  name: z.string().min(2).max(100),
  uf: z.string().length(2),
  cityId: z.number().int().positive(),
});
export const routePlanSchema = z
  .object({
    stops: z.array(stopSchema).min(2).max(8),
    geometry: z.array(coordinateSchema).min(2).max(2500),
    legs: z
      .array(
        z.object({
          distanceKm: z.number().finite().positive(),
          durationHours: z.number().finite().nonnegative(),
        }),
      )
      .min(1)
      .max(7),
    provider: z.literal("OSRM"),
    calculatedAt: z.string().max(40),
  })
  .refine(
    (p) => p.legs.length === p.stops.length - 1,
    "Cada trecho deve conectar duas cidades.",
  );
export type Coordinate = z.infer<typeof coordinateSchema>;
export type RouteStop = z.infer<typeof stopSchema>;
export type RoutePlan = z.infer<typeof routePlanSchema>;
export const sampleStops: RouteStop[] = [
  {
    name: "São Paulo",
    uf: "SP",
    cityId: 3550308,
    lat: -23.5505,
    lng: -46.6333,
  },
  {
    name: "Rio de Janeiro",
    uf: "RJ",
    cityId: 3304557,
    lat: -22.9068,
    lng: -43.1729,
  },
];
export function legBoundaries(plan: RoutePlan) {
  const total = plan.legs.reduce((s, l) => s + l.distanceKm, 0);
  let sum = 0;
  return plan.legs.map((l) => (sum += l.distanceKm) / total);
}
export function nextLegProgress(plan: RoutePlan, progress: number) {
  return legBoundaries(plan).find((p) => p > progress + 1e-6) ?? 1;
}
function length(a: Coordinate, b: Coordinate) {
  const radians = Math.PI / 180;
  const lat = ((a.lat + b.lat) / 2) * radians;
  return Math.hypot(
    (b.lat - a.lat) * radians,
    (b.lng - a.lng) * radians * Math.cos(lat),
  );
}
export function pointOnRoute(
  geometry: Coordinate[],
  progress: number,
): Coordinate {
  if (!geometry.length) throw Error("Rota vazia.");
  const lengths = geometry.slice(1).map((p, i) => length(geometry[i], p));
  const target =
    lengths.reduce((s, l) => s + l, 0) * Math.max(0, Math.min(1, progress));
  let traversed = 0;
  for (let i = 0; i < lengths.length; i++) {
    if (traversed + lengths[i] >= target && lengths[i] > 0) {
      const t = (target - traversed) / lengths[i];
      return {
        lat: geometry[i].lat + (geometry[i + 1].lat - geometry[i].lat) * t,
        lng: geometry[i].lng + (geometry[i + 1].lng - geometry[i].lng) * t,
      };
    }
    traversed += lengths[i];
  }
  return geometry.at(-1)!;
}
