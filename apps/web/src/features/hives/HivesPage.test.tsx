import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HivesPage from "./HivesPage";
import { apiClient } from "../../lib/apiClient";
import type { Hive } from "../../types";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

let testQueryClient: QueryClient | null = null;

const renderWithClient = (ui: ReactElement) => {
  const client = createTestQueryClient();
  testQueryClient = client;

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe("HivesPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("renders hive telemetry from the API client", async () => {
    const hives: Hive[] = [
      {
        id: "hive-1",
        name: "Ąžuolas",
        description: null,
        owner: { id: "user-1", email: "owner@example.com", roles: ["keeper"] },
        members: [],
        createdAt: new Date("2025-01-10T09:00:00.000Z").toISOString(),
        updatedAt: new Date("2025-01-12T09:00:00.000Z").toISOString(),
        telemetry: {
          location: "Vilniaus raj.",
          queenStatus: "aktyvi",
          productivityIndex: 87.3,
          lastInspectionAt: "2025-01-11T08:30:00.000Z",
          temperature: 34.2,
          humidity: 57.2
        }
      }
    ];

    const spy = vi.spyOn(apiClient, "get").mockResolvedValue(hives);

    renderWithClient(<HivesPage />);

    await waitFor(() => expect(screen.getByText(/Ąžuolas/)).toBeInTheDocument());
    expect(screen.getByText(/Vilniaus raj\./)).toBeInTheDocument();
    expect(screen.getByText(/87.3/)).toBeInTheDocument();
    expect(screen.getByText(/34.2°C/)).toBeInTheDocument();
    expect(screen.getByText(/57%/)).toBeInTheDocument();
    expect(screen.getByText(/aktyvi/i)).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("/hives");
  });

  it("displays fallbacks when telemetry data is unavailable", async () => {
    const hives: Hive[] = [
      {
        id: "hive-2",
        name: "Liepa",
        description: null,
        owner: { id: "user-2", email: "keeper@example.com", roles: ["keeper"] },
        members: [],
        createdAt: new Date("2025-01-05T09:00:00.000Z").toISOString(),
        updatedAt: new Date("2025-01-05T09:00:00.000Z").toISOString(),
        telemetry: {
          location: null,
          queenStatus: null,
          productivityIndex: null,
          lastInspectionAt: null,
          temperature: null,
          humidity: null
        }
      }
    ];

    vi.spyOn(apiClient, "get").mockResolvedValue(hives);

    renderWithClient(<HivesPage />);

    await waitFor(() => expect(screen.getByText(/Liepa/)).toBeInTheDocument());
    expect(screen.getByText(/Vieta nenustatyta/)).toBeInTheDocument();
    expect(screen.getAllByText(/Nėra duomenų/)).toHaveLength(3);
    expect(screen.getByText(/Nežinomas statusas/)).toBeInTheDocument();
    expect(screen.getByText(/Paskutinė apžiūra nenurodyta/)).toBeInTheDocument();
  });
});
