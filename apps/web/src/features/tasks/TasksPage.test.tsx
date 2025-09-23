import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TasksPage from "./TasksPage";
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

describe("TasksPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("maps API data into Lithuanian labels", async () => {
    const payload = [
      {
        id: "task-1",
        title: "Patikra",
        dueDate: "2025-09-22T00:00:00.000Z",
        status: "IN_PROGRESS",
        statusLabel: "Vykdoma",
        priority: 2,
        priorityLabel: "Vidutinė",
        hive: { id: "hive-1", name: "A1" },
        assignedTo: {
          id: "user-1",
          email: "rokas@example.com",
          roles: ["keeper"],
          firstName: "Rokas",
          lastName: "Bitė",
          displayName: "Rokas"
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const spy = vi.spyOn(apiClient, "get").mockResolvedValue(payload);

    renderWithClient(<TasksPage />);

    await waitFor(() => expect(screen.getByText("Patikra")).toBeInTheDocument());
    expect(screen.getByText("Rokas")).toBeInTheDocument();
    expect(screen.getByText("2025-09-22")).toBeInTheDocument();
    expect(screen.getByText("VIDUTINĖ")).toBeInTheDocument();
    expect(screen.getByText("VYKDOMA")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("/tasks");
  });
});
