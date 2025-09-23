import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardPage, { type DashboardApiSnapshot } from "./DashboardPage";
import { apiClient } from "../../lib/apiClient";

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

describe("DashboardPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("renders metrics, tasks and alerts from the API client", async () => {
    const payload: DashboardApiSnapshot = {
      stats: [
        {
          id: "hive-health",
          label: "Sveikų avilių",
          value: "92%",
          trend: "+4.1% nuo praėjusios savaitės",
          trendTone: "info"
        }
      ],
      alerts: [
        {
          id: "alert-1",
          title: "Padidėjusi drėgmė",
          description: "Viršijo 65% ribą per 4 valandas.",
          type: "įspėjimas",
          createdAt: "prieš 9 min."
        }
      ],
      tasks: [
        {
          id: "task-1",
          title: "Avilio patikra",
          assignedTo: "Rokas",
          dueDate: "2025-09-22",
          status: "laukiama",
          priority: "aukšta"
        }
      ]
    };

    const spy = vi.spyOn(apiClient, "get").mockResolvedValue(payload);

    renderWithClient(<DashboardPage />);

    await waitFor(() => expect(screen.getByText(/Sveikų avilių/i)).toBeInTheDocument());
    expect(screen.getByText(/92%/)).toBeInTheDocument();
    expect(screen.getByText(/Prioritetinės užduotys/)).toBeInTheDocument();
    expect(screen.getByText(/Aktyvūs įspėjimai/)).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("/dashboard");
  });
});
