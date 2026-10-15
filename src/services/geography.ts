import {
  routePlanSchema,
  type RoutePlan,
  type RouteStop,
} from "../domain/route";
export interface State {
  id: number;
  sigla: string;
  nome: string;
}
export interface City {
  id: number;
  nome: string;
}
const cache = new Map<string, Promise<unknown>>();
async function json<T>(url: string): Promise<T> {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url, { signal: AbortSignal.timeout(20000) })
      .then(async (r) => {
        if (!r.ok)
          throw Error("Serviço de mapas indisponível. Tente novamente.");
        return r.json();
      })
      .catch((e) => {
        cache.delete(url);
        throw e;
      });
    cache.set(url, pending);
  }
  return pending as Promise<T>;
}
export const getStates = () =>
  json<State[]>(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
  );
export const getCities = (uf: string) =>
  json<City[]>(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`,
  );
export async function locateCity(
  city: Pick<RouteStop, "name" | "uf" | "cityId">,
): Promise<RouteStop> {
  const states = await getStates();
  const state = states.find((s) => s.sigla === city.uf);
  if (!state) throw Error("Selecione uma UF válida.");
  const query = encodeURIComponent(`${city.name}, ${state.nome}, Brasil`);
  const data = await json<{
    features: {
      geometry: { coordinates: [number, number] };
      properties: {
        countrycode?: string;
        name?: string;
        city?: string;
        state?: string;
      };
    }[];
  }>(`https://photon.komoot.io/api/?q=${query}&limit=5&bbox=-74,-34,-34,6`);
  const normalize = (text: string | undefined) =>
    (text ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const feature = data.features.find(
    (f) =>
      f.properties.countrycode?.toUpperCase() === "BR" &&
      normalize(f.properties.state) === normalize(state.nome) &&
      (normalize(f.properties.name) === normalize(city.name) ||
        normalize(f.properties.city) === normalize(city.name)),
  );
  if (!feature)
    throw Error(
      `Não foi possível localizar ${city.name}/${city.uf}. Escolha outra cidade ou tente novamente.`,
    );
  const [lng, lat] = feature.geometry.coordinates;
  return { ...city, lat, lng };
}
export async function calculateRoadRoute(
  stops: RouteStop[],
  strategy: "curta" | "economica" | "rapida",
): Promise<RoutePlan> {
  if (stops.length < 2 || stops.length > 8)
    throw Error("Configure origem, destino e até seis pontos intermediários.");
  if (stops.some((s, i) => i > 0 && s.cityId === stops[i - 1].cityId))
    throw Error("Cidades consecutivas devem ser diferentes.");
  const locations = stops.map((s) => `${s.lng},${s.lat}`).join(";");
  const data = await json<{
    code: string;
    routes: {
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
      legs: { distance: number; duration: number }[];
    }[];
  }>(
    `https://router.project-osrm.org/route/v1/driving/${locations}?overview=simplified&geometries=geojson&alternatives=${stops.length === 2 ? "true" : "false"}&steps=false`,
  );
  if (data.code !== "Ok" || !data.routes.length)
    throw Error("Nenhuma rota rodoviária encontrada entre as cidades.");
  const candidates = [...data.routes].sort((a, b) =>
    strategy === "rapida" ? a.duration - b.duration : a.distance - b.distance,
  );
  const selected = candidates[0];
  const coordinates = selected.geometry.coordinates;
  const stride = Math.max(1, Math.ceil(coordinates.length / 2499));
  const geometry = coordinates
    .filter((_, i) => i % stride === 0 || i === coordinates.length - 1)
    .map(([lng, lat]) => ({ lat, lng }));
  return routePlanSchema.parse({
    stops,
    geometry,
    legs: selected.legs.map((l) => ({
      distanceKm: l.distance / 1000,
      durationHours: l.duration / 3600,
    })),
    provider: "OSRM",
    calculatedAt: new Date().toISOString(),
  });
}
