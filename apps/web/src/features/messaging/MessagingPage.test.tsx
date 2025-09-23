import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MessagingPage from "./MessagingPage";
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

describe("MessagingPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("shows localized messaging entries", async () => {
    const payload = [
      {
        id: "msg-1",
        task: { id: "task-1", title: "Ventiliacija", hiveId: "hive-1", hiveName: "A1" },
        author: {
          id: "user-2",
          email: "ieva@example.com",
          roles: ["keeper"],
          firstName: "Ieva",
          lastName: "Medune",
          displayName: ""
        },
        content: "Patikrinkite ventiliaciją asap",
        createdAt: new Date().toISOString(),
        isOwn: false
      }
    ];

    const spy = vi.spyOn(apiClient, "get").mockResolvedValue(payload);

    renderWithClient(<MessagingPage />);

    await waitFor(() => expect(screen.getByText("Ieva Medune")).toBeInTheDocument());
    expect(screen.getByText(/Patikrinkite ventiliaciją asap/)).toBeInTheDocument();
    expect(screen.getByText(/Programėlė/)).toBeInTheDocument();
    expect(screen.getByText(/nauja/i)).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("/messages");
  });
});
