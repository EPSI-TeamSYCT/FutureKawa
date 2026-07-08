import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CountryProvider } from "./CountryProvider";
import { useCountryFilter } from "./country-context";

function Harness() {
  const { scope, setScope } = useCountryFilter();
  return (
    <div>
      <span data-testid="scope">{scope}</span>
      <button onClick={() => setScope("co")}>colombie</button>
      <button onClick={() => setScope("siege")}>siege</button>
    </div>
  );
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter
      initialEntries={[entry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <CountryProvider>
        <Harness />
      </CountryProvider>
    </MemoryRouter>,
  );
}

describe("useCountryFilter", () => {
  it("defaults to Siège when no pays param is present", () => {
    renderAt("/");
    expect(screen.getByTestId("scope").textContent).toBe("siege");
  });

  it("reads the scope from the URL", () => {
    renderAt("/?pays=br");
    expect(screen.getByTestId("scope").textContent).toBe("br");
  });

  it("falls back to Siège for an invalid pays param", () => {
    renderAt("/?pays=xx");
    expect(screen.getByTestId("scope").textContent).toBe("siege");
  });

  it("updates the scope via setScope", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(screen.getByText("colombie"));
    expect(screen.getByTestId("scope").textContent).toBe("co");
  });
});
