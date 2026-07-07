import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LotStatusBadge } from "./LotStatusBadge";
import type { LotStatut } from "@/api/types";

const CASES: [LotStatut, string][] = [
  ["CONFORME", "CONFORME"],
  ["EN_ALERTE", "EN ALERTE"],
  ["PERIME", "PÉRIMÉ"],
  ["EXPEDIE", "EXPÉDIÉ"],
];

describe("LotStatusBadge", () => {
  it.each(CASES)("renders the label for %s", (statut, label) => {
    render(<LotStatusBadge statut={statut} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("pairs the label with an icon (colour is never alone)", () => {
    const { container } = render(<LotStatusBadge statut="EN_ALERTE" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
