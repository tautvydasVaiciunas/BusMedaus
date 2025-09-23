import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.getByLabelText("Keisti Patikra būseną")).toBeInTheDocument();
    expect(screen.getByLabelText("Keisti Patikra prioritetą")).toBeInTheDocument();
  });

  it("updates task status through the API and refreshes the query", async () => {
    const payload = [
      {
        id: "task-1",
        title: "Patikra",
        dueDate: null,
        status: "PENDING",
        statusLabel: "Laukiama",
        priority: 2,
        priorityLabel: "Vidutinė",
        hive: { id: "hive-1", name: "A1" },
        assignedTo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    vi.spyOn(apiClient, "get").mockResolvedValue(payload);
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({});

    renderWithClient(<TasksPage />);

    await waitFor(() => expect(screen.getByText("Patikra")).toBeInTheDocument());

    const client = testQueryClient!;
    const invalidateSpy = vi.spyOn(client, "invalidateQueries").mockResolvedValue();

    const statusSelect = screen.getByLabelText("Keisti Patikra būseną");

    await userEvent.selectOptions(statusSelect, "COMPLETED");

    await waitFor(() => expect(patchSpy).toHaveBeenCalledWith("/tasks/task-1/status", { status: "COMPLETED" }));
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["tasks"] }));
  });

  it("updates task priority through the API and refreshes the query", async () => {
    const payload = [
      {
        id: "task-1",
        title: "Patikra",
        dueDate: null,
        status: "IN_PROGRESS",
        statusLabel: "Vykdoma",
        priority: 1,
        priorityLabel: "Žema",
        hive: { id: "hive-1", name: "A1" },
        assignedTo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    vi.spyOn(apiClient, "get").mockResolvedValue(payload);
    const putSpy = vi.spyOn(apiClient, "put").mockResolvedValue({});

    renderWithClient(<TasksPage />);

    await waitFor(() => expect(screen.getByText("Patikra")).toBeInTheDocument());

    const client = testQueryClient!;
    const invalidateSpy = vi.spyOn(client, "invalidateQueries").mockResolvedValue();

    const prioritySelect = screen.getByLabelText("Keisti Patikra prioritetą");

    await userEvent.selectOptions(prioritySelect, "3");

    await waitFor(() => expect(putSpy).toHaveBeenCalledWith("/tasks/task-1", { priority: 3 }));
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["tasks"] }));
  });
});
