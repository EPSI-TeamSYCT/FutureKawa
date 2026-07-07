/**
 * Country domain data — the three producing countries plus the consolidated HQ
 * view. Ideal storage conditions and tolerances come straight from the brief.
 */

export type CountryCode = "br" | "ec" | "co";
export type CountryScope = CountryCode | "siege";

export interface Conditions {
  temp: number;
  humidity: number;
}

export interface Country {
  code: CountryCode;
  name: string;
  ideal: Conditions;
  tolerance: Conditions;
}

export const COUNTRIES: Country[] = [
  {
    code: "br",
    name: "Brésil",
    ideal: { temp: 29, humidity: 55 },
    tolerance: { temp: 3, humidity: 2 },
  },
  {
    code: "ec",
    name: "Équateur",
    ideal: { temp: 31, humidity: 60 },
    tolerance: { temp: 3, humidity: 2 },
  },
  {
    code: "co",
    name: "Colombie",
    ideal: { temp: 26, humidity: 80 },
    tolerance: { temp: 3, humidity: 2 },
  },
];

export const SIEGE_LABEL = "Siège";

/** All selectable scopes for the global country selector, HQ first. */
export const SCOPES: { code: CountryScope; name: string }[] = [
  { code: "siege", name: SIEGE_LABEL },
  ...COUNTRIES.map((c) => ({ code: c.code, name: c.name })),
];

export function getCountry(code: CountryCode): Country {
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) throw new Error(`Unknown country code: ${code}`);
  return country;
}

export function scopeName(scope: CountryScope): string {
  return scope === "siege" ? SIEGE_LABEL : getCountry(scope).name;
}

export function isCountryScope(value: string | null): value is CountryScope {
  return value === "siege" || value === "br" || value === "ec" || value === "co";
}
