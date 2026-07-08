/**
 * Low-level access to the real HQ backend (the aggregator BFF). Reached through
 * the `/hq` reverse proxy so the SPA stays same-origin (no CORS). These return
 * the backend's own shapes; `mappers.ts` turns them into the frontend types.
 */
import { apiGet, type QueryParams } from "./client";

const HQ = "/hq";

export interface BkCountry {
  id: number;
  name: string;
  isoCode: string;
  ideal: { temperature: number; humidity: number };
  tolerance: { temperature: number; humidity: number };
  lots: number;
  alerts: number;
}

export interface BkLot {
  id: number;
  reference: string;
  storageDate: string;
  status: string;
  countryId: number | null;
  country: string | null;
  exploitationId: number;
  exploitation: string | null;
  warehouseId: number;
  warehouse: string | null;
}

export interface BkMeasure {
  id: number;
  temperature: number | null;
  humidity: number | null;
  measuredAt: string;
}

export interface BkAlert {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  emailSent: boolean;
  countryId: number | null;
  country: string | null;
  warehouseId: number;
  warehouse: string | null;
  batchId: number | null;
}

export interface BkWarehouse {
  id: number;
  name: string;
  countryId: number | null;
  country: string | null;
  isoCode: string | null;
  ideal: { temperature: number; humidity: number } | null;
  tolerance: { temperature: number; humidity: number } | null;
  latestMeasure: BkMeasure | null;
  outOfRange: boolean;
  lots: number;
}

export function fetchCountries(signal?: AbortSignal): Promise<BkCountry[]> {
  return apiGet<{ countries: BkCountry[] }>(`${HQ}/countries`, undefined, signal).then(
    (r) => r.countries,
  );
}

export function fetchLots(params?: QueryParams, signal?: AbortSignal): Promise<BkLot[]> {
  return apiGet<{ lots: BkLot[] }>(`${HQ}/lots`, params, signal).then((r) => r.lots);
}

export function fetchLot(id: string, signal?: AbortSignal): Promise<BkLot> {
  return apiGet<{ lot: BkLot }>(`${HQ}/lots/${encodeURIComponent(id)}`, undefined, signal).then(
    (r) => r.lot,
  );
}

export function fetchLotMeasures(id: string, signal?: AbortSignal): Promise<BkMeasure[]> {
  return apiGet<{ measures: BkMeasure[] }>(
    `${HQ}/lots/${encodeURIComponent(id)}/measures`,
    undefined,
    signal,
  ).then((r) => r.measures);
}

export function fetchAlerts(params?: QueryParams, signal?: AbortSignal): Promise<BkAlert[]> {
  return apiGet<{ alerts: BkAlert[] }>(`${HQ}/alerts`, params, signal).then((r) => r.alerts);
}

export function fetchWarehouses(signal?: AbortSignal): Promise<BkWarehouse[]> {
  return apiGet<{ warehouses: BkWarehouse[] }>(`${HQ}/warehouses`, undefined, signal).then(
    (r) => r.warehouses,
  );
}

export function fetchWarehouse(id: string, signal?: AbortSignal): Promise<BkWarehouse> {
  return apiGet<{ warehouse: BkWarehouse }>(
    `${HQ}/warehouses/${encodeURIComponent(id)}`,
    undefined,
    signal,
  ).then((r) => r.warehouse);
}

export function fetchWarehouseMeasures(id: string, signal?: AbortSignal): Promise<BkMeasure[]> {
  return apiGet<{ measures: BkMeasure[] }>(
    `${HQ}/warehouses/${encodeURIComponent(id)}/measures`,
    undefined,
    signal,
  ).then((r) => r.measures);
}
