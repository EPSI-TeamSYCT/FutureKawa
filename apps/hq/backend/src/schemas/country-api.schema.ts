import { z } from "zod";

export const rawCountrySchema = z.object({
  id: z.number(),
  name: z.string(),
  isoCode: z.string(),
  idealTemp: z.number(),
  idealHumidity: z.number(),
  toleranceTemp: z.number(),
  toleranceHumidity: z.number(),
});

export const rawExploitationSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
});

export const rawWarehouseSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
});

export const rawBatchSchema = z.object({
  id: z.number(),
  ref: z.string(),
  storageDate: z.string(),
  status: z.string(),
  exploitation: z.string(),
  warehouse: z.string(),
});

export const rawMeasureSchema = z.object({
  id: z.number(),
  temperature: z.number().nullable(),
  humidity: z.number().nullable(),
  measuredAt: z.string(),
});

export const rawAlertSchema = z.object({
  id: z.number(),
  type: z.string(),
  message: z.string(),
  createdAt: z.string(),
  emailSent: z.boolean(),
  warehouse: z.string(),
  // API Platform omits a null relation entirely (undefined), so accept absent too.
  batch: z.string().nullable().optional(),
});
