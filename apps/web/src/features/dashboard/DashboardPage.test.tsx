import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import DashboardPage from "./DashboardPage";
import { mockService } from "../../mocks/mockService";
import { dashboardStats, notifications, tasks } from "../../mocks/mockData";

vi.mock("../../mocks/mockService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../mocks/mockService")>();
  return {
    ...actual,
    mockService: {
      ...actual.mockService,
      getDashboard: actual.mockService.getDashboard
    }
  };
});

describe("DashboardPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders metrics, tasks and alerts from the mock service", async () => {
    const spy = vi.spyOn(mockService, "getDashboard").mockResolvedValue({
      stats: dashboardStats.slice(0, 2),
      alerts: notifications.slice(0, 1),
      tasks: tasks.slice(0, 1)
    });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText(/Sveikų avilių/i)).toBeInTheDocument());
    expect(screen.getByText(/92%/)).toBeInTheDocument();
    expect(screen.getByText(/Prioritetinės užduotys/)).toBeInTheDocument();
    expect(screen.getByText(/Aktyvūs įspėjimai/)).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
  });
});
