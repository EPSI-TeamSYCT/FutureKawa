import { z } from "zod";
import { COUNTRIES } from "../config";

export const countrySchema = z.enum(COUNTRIES);

export const lotStatusSchema = z.enum(["conforme", "en_alerte", "perime"]);

export const lotSchema = z.object({
  id: z.string(),
  country: countrySchema,
  exploitation: z.string(),
  warehouse: z.string(),
  storageDate: z.string().datetime(),
  status: lotStatusSchema,
});

export const measureSchema = z.object({
  id: z.string(),
  warehouse: z.string(),
  temperature: z.number(),
  humidity: z.number(),
  timestamp: z.string().datetime(),
});

export const alertSchema = z.object({
  id: z.string(),
  type: z.enum(["conditions", "peremption"]),
  country: countrySchema,
  lotId: z.string().optional(),
  warehouse: z.string().optional(),
  message: z.string(),
  timestamp: z.string().datetime(),
});

export const lotsResponseSchema = z.array(lotSchema);
export const measuresResponseSchema = z.array(measureSchema);
export const alertsResponseSchema = z.array(alertSchema);

export type Lot = z.infer<typeof lotSchema>;
export type Measure = z.infer<typeof measureSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type LotStatus = z.infer<typeof lotStatusSchema>;

export interface CountryPayload {
  lots: Lot[];
  measures: Measure[];
  alerts: Alert[];
}
