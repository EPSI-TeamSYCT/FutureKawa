import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ConditionsGauge } from "./ConditionsGauge";

describe("ConditionsGauge", () => {
  it("marks an in-range value as in-band", () => {
    const { container } = render(
      <ConditionsGauge label="Température" value={31} ideal={31} tolerance={3} unit="°C" />,
    );
    expect(container.querySelector(".fk-gauge-value")?.classList.contains("is-in")).toBe(true);
    expect(container.querySelector(".fk-gauge-marker")?.classList.contains("is-in")).toBe(true);
  });

  it("marks an out-of-range value as out-of-band", () => {
    const { container } = render(
      <ConditionsGauge label="Température" value={36} ideal={31} tolerance={3} unit="°C" />,
    );
    expect(container.querySelector(".fk-gauge-value")?.classList.contains("is-out")).toBe(true);
    expect(container.querySelector(".fk-gauge-marker")?.classList.contains("is-out")).toBe(true);
  });

  it("positions the marker within the track bounds", () => {
    const { container } = render(
      <ConditionsGauge label="Humidité" value={200} ideal={60} tolerance={2} unit="%" />,
    );
    const marker = container.querySelector<HTMLElement>(".fk-gauge-marker");
    // A far-out value is clamped to the 0–100% track, not overflowing.
    expect(marker?.style.left).toBe("100%");
  });
});
