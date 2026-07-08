import { describe, expect, it } from "vitest";
import {
  filterByPeriode,
  indexCodeByCountryId,
  mapAlerte,
  mapEntrepot,
  mapLot,
  mapMesure,
} from "./mappers";
import type { BkAlert, BkCountry, BkLot, BkMeasure, BkWarehouse } from "./backend";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

const bkCountry: BkCountry = {
  id: 1,
  name: "Colombie",
  isoCode: "CO",
  ideal: { temperature: 26, humidity: 80 },
  tolerance: { temperature: 3, humidity: 2 },
  lots: 4,
  alerts: 1,
};

const codeById = indexCodeByCountryId([bkCountry]);

function bkLot(over: Partial<BkLot>): BkLot {
  return {
    id: 10,
    reference: "LOT-1",
    storageDate: daysAgo(10),
    status: "stored",
    countryId: 1,
    country: "Colombie",
    exploitationId: 7,
    exploitation: "Ferme Nord",
    warehouseId: 3,
    warehouse: "Entrepôt A",
    ...over,
  };
}

describe("mapLot", () => {
  it("resolves country/warehouse and derives a recent lot as CONFORME", () => {
    const lot = mapLot(bkLot({ storageDate: daysAgo(10) }), codeById);
    expect(lot).toMatchObject({
      id: "10",
      pays: "co",
      entrepotId: "3",
      entrepotNom: "Entrepôt A",
      statut: "CONFORME",
      conditions: null,
    });
    expect(lot.ageJours).toBeGreaterThanOrEqual(10);
  });

  it("derives an old lot as PERIME and a shipped one as EXPEDIE", () => {
    expect(mapLot(bkLot({ storageDate: daysAgo(600) }), codeById).statut).toBe("PERIME");
    expect(mapLot(bkLot({ status: "shipped" }), codeById).statut).toBe("EXPEDIE");
  });
});

describe("mapAlerte", () => {
  it("maps types, email status, batch and leaves it untreated", () => {
    const base: BkAlert = {
      id: 5,
      type: "temperature",
      message: "hors plage",
      createdAt: daysAgo(1),
      emailSent: true,
      countryId: 1,
      country: "Colombie",
      warehouseId: 3,
      warehouse: "Entrepôt A",
      batchId: 10,
    };
    expect(mapAlerte(base, codeById)).toMatchObject({
      id: "5",
      type: "DERIVE",
      pays: "co",
      lotId: "10",
      emailStatut: "ENVOYE",
      traitee: false,
    });
    expect(
      mapAlerte({ ...base, type: "peremption", emailSent: false, batchId: null }, codeById),
    ).toMatchObject({
      type: "PEREMPTION",
      emailStatut: "EN_ATTENTE",
      lotId: null,
    });
  });
});

describe("mapMesure", () => {
  it("maps a full reading and drops incomplete ones", () => {
    const m: BkMeasure = { id: 1, temperature: 21, humidity: 58, measuredAt: daysAgo(0) };
    expect(mapMesure(m)).toEqual({ timestamp: m.measuredAt, temp: 21, humidity: 58 });
    expect(mapMesure({ ...m, temperature: null })).toBeNull();
    expect(mapMesure({ ...m, humidity: null })).toBeNull();
  });
});

describe("mapEntrepot", () => {
  const base: BkWarehouse = {
    id: 3,
    name: "Entrepôt A",
    countryId: 1,
    country: "Colombie",
    isoCode: "CO",
    ideal: { temperature: 26, humidity: 80 },
    tolerance: { temperature: 3, humidity: 2 },
    latestMeasure: { id: 9, temperature: 27, humidity: 79, measuredAt: daysAgo(0) },
    outOfRange: false,
    lots: 5,
  };

  it("maps a warehouse with a reading to an entrepot status", () => {
    expect(mapEntrepot(base)).toMatchObject({
      id: "3",
      nom: "Entrepôt A",
      pays: "co",
      ville: "",
      ideal: { temp: 26, humidity: 80 },
      horsPlage: false,
      nbLots: 5,
      derniereMesure: { temp: 27, humidity: 79 },
    });
  });

  it("returns null when the warehouse has no live reading", () => {
    expect(mapEntrepot({ ...base, latestMeasure: null })).toBeNull();
  });
});

describe("filterByPeriode", () => {
  const measures = [
    { timestamp: daysAgo(0.1), temp: 20, humidity: 50 },
    { timestamp: daysAgo(3), temp: 21, humidity: 51 },
  ];

  it("keeps everything for 'tout' and cuts old ones for '24h'", () => {
    expect(filterByPeriode(measures, "tout")).toHaveLength(2);
    expect(filterByPeriode(measures, "24h")).toHaveLength(1);
  });
});
