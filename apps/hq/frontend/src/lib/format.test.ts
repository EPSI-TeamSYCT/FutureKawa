import { describe, expect, it } from "vitest";
import { formatDateTime, relativeTime } from "./format";

describe("relativeTime", () => {
  const now = new Date("2026-07-07T12:00:00Z").getTime();

  it('renders "à l\'instant" under a minute', () => {
    expect(relativeTime("2026-07-07T11:59:45Z", now)).toBe("à l'instant");
  });

  it("renders minutes", () => {
    expect(relativeTime("2026-07-07T11:45:00Z", now)).toBe("il y a 15 min");
  });

  it("renders hours", () => {
    expect(relativeTime("2026-07-07T09:00:00Z", now)).toBe("il y a 3 h");
  });

  it("renders days", () => {
    expect(relativeTime("2026-07-04T12:00:00Z", now)).toBe("il y a 3 j");
  });
});

describe("formatDateTime", () => {
  it("formats an ISO date to fr-FR day/month and hour:minute", () => {
    const out = formatDateTime("2026-07-07T08:05:00Z");
    expect(out).toMatch(/07\/07/);
    expect(out).toMatch(/\d{2}:\d{2}/);
  });
});
