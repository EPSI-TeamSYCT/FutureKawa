import { describe, expect, it } from "vitest";
import { getCountry, isCountryScope, scopeName } from "./countries";

describe("getCountry", () => {
  it("resolves a known country", () => {
    expect(getCountry("br").name).toBeTruthy();
  });

  it("throws on an unknown code", () => {
    // @ts-expect-error invalid code on purpose
    expect(() => getCountry("xx")).toThrow(/Unknown country/);
  });
});

describe("scopeName", () => {
  it("maps siege to the HQ label", () => {
    expect(scopeName("siege")).toBe("Siège");
  });

  it("maps a country scope to its name", () => {
    expect(scopeName("br")).toBe(getCountry("br").name);
  });
});

describe("isCountryScope", () => {
  it("accepts valid scopes and rejects the rest", () => {
    expect(isCountryScope("siege")).toBe(true);
    expect(isCountryScope("br")).toBe(true);
    expect(isCountryScope("xx")).toBe(false);
    expect(isCountryScope(null)).toBe(false);
  });
});
