import { fetchLotMeasures, fetchWarehouseMeasures, type BkMeasure } from "./backend";
import { filterByPeriode, mapMesure } from "./mappers";
import type { Mesure, Periode } from "./types";

function toSeries(measures: BkMeasure[], periode: Periode): Mesure[] {
  const mapped = measures.map(mapMesure).filter((m): m is Mesure => m !== null);
  return filterByPeriode(mapped, periode);
}

export function getLotMesures(
  lotId: string,
  periode: Periode = "30j",
  signal?: AbortSignal,
): Promise<Mesure[]> {
  return fetchLotMeasures(lotId, signal).then((measures) => toSeries(measures, periode));
}

export function getEntrepotMesures(
  entrepotId: string,
  periode: Periode = "24h",
  signal?: AbortSignal,
): Promise<Mesure[]> {
  return fetchWarehouseMeasures(entrepotId, signal).then((measures) => toSeries(measures, periode));
}
