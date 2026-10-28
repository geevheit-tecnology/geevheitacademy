import { describe, it, expect, vi } from "vitest";
import {
  sampleStops,
  pointOnRoute,
  legBoundaries,
  nextLegProgress,
  routePlanSchema,
  type RoutePlan,
} from "../src/domain/route";
import {
  type Mission,
  createMission,
  defaults,
  advance,
  travelNextLeg,
  addOccurrence,
  missionProgress,
  stageTravelLimit,
} from "../src/domain/mission";
import { calculateRoadRoute } from "../src/services/geography";
export const plan: RoutePlan = {
  stops: [
    sampleStops[0],
    { name: "Resende", uf: "RJ", cityId: 3304201, lat: -22.47, lng: -44.45 },
    sampleStops[1],
  ],
  geometry: [sampleStops[0], { lat: -22.47, lng: -44.45 }, sampleStops[1]],
  legs: [
    { distanceKm: 300, durationHours: 4 },
    { distanceKm: 150, durationHours: 2 },
  ],
  provider: "OSRM",
  calculatedAt: new Date().toISOString(),
};
describe("trechos e movimento", () => {
  it("avança por distância acumulada e chega ao destino", () => {
    expect(legBoundaries(plan)).toEqual([2 / 3, 1]);
    expect(nextLegProgress(plan, 0)).toBe(2 / 3);
    expect(nextLegProgress(plan, 2 / 3)).toBe(1);
    expect(pointOnRoute(plan.geometry, 0)).toEqual({
      lat: sampleStops[0].lat,
      lng: sampleStops[0].lng,
    });
    expect(pointOnRoute(plan.geometry, 1)).toEqual({
      lat: sampleStops[1].lat,
      lng: sampleStops[1].lng,
    });
    expect(
      pointOnRoute(
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 1 },
          { lat: 0, lng: 3 },
        ],
        0.5,
      ),
    ).toEqual({ lat: 0, lng: 1.5 });
  });
  it("distribui a viagem pelas etapas sem chegar antecipadamente", () => {
    let mission = createMission({ ...defaults, routePlan: plan }, 1);
    expect(() => travelNextLeg(mission)).toThrow("Transporte");
    mission = {
      ...mission,
      step: 8,
      checks: { "8:0": true, "9:0": true, "10:0": true, "11:0": true },
    };
    expect(() => advance(mission)).toThrow("viagem");
    expect(() =>
      travelNextLeg(addOccurrence(mission, "pane", "Pane impeditiva")),
    ).toThrow("impeditiva");
    for (const step of [8, 9, 10, 11]) {
      const limit = stageTravelLimit(step, 1);
      while (missionProgress(mission) < limit - 1e-6) {
        const before = missionProgress(mission);
        mission = travelNextLeg(mission);
        expect(missionProgress(mission) - before).toBeLessThanOrEqual(0.100001);
      }
      expect(mission.journeyProgress).toBe(limit);
      if (step < 11) expect(missionProgress(mission)).toBeLessThan(1);
      expect(() => travelNextLeg(mission)).toThrow("concluído");
      const previous = missionProgress(mission);
      mission = advance(mission);
      expect(missionProgress(mission)).toBe(previous);
    }
    expect(mission.step).toBe(12);
    expect(missionProgress(mission)).toBe(1);
  });
  it("não força missões antigas a 100% ao avançar e exige liberação mecânica", () => {
    let mission: Mission = {
      ...createMission({ ...defaults, routePlan: plan }, 1),
      step: 9,
      journeyProgress: 1,
      checks: { "9:0": true },
    };
    expect(missionProgress(mission)).toBe(0.7);
    mission = advance(mission);
    expect(mission.journeyProgress).toBe(0.7);
    expect(() => travelNextLeg(mission)).toThrow("liberação");
  });
  it("valida formato e continuidade de trechos", () => {
    expect(routePlanSchema.safeParse({ ...plan, legs: [] }).success).toBe(
      false,
    );
    expect(
      routePlanSchema.safeParse({
        ...plan,
        stops: [{ ...sampleStops[0], lat: 100 }, sampleStops[1]],
      }).success,
    ).toBe(false);
  });
  it("usa geometria e distância da API para os pontos escolhidos", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        routes: [
          {
            distance: 500000,
            duration: 25000,
            geometry: {
              coordinates: [
                [-46, -23],
                [-45, -22],
                [-43, -22],
              ],
            },
            legs: [
              { distance: 300000, duration: 15000 },
              { distance: 200000, duration: 10000 },
            ],
          },
        ],
      }),
    } as Response);
    try {
      const result = await calculateRoadRoute(plan.stops, "rapida");
      expect(result.legs.reduce((s, l) => s + l.distanceKm, 0)).toBe(500);
      expect(result.geometry[0]).toEqual({ lat: -23, lng: -46 });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "-46.6333,-23.5505;-44.45,-22.47;-43.1729,-22.9068",
        ),
        expect.anything(),
      );
    } finally {
      fetchMock.mockRestore();
    }
  });
});
