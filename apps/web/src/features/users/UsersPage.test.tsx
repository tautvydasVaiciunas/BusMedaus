import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UsersPage from "./UsersPage";
import { ApiClientError, apiClient } from "../../lib/apiClient";
import type { SafeUser } from "../../types";

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

describe("UsersPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("renders team members returned by the API", async () => {
    const users: SafeUser[] = [
      {
        id: "user-1",
        email: "ada@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        phoneNumber: "+37060000001",
        roles: ["member"],
        isActive: true,
        createdAt: new Date("2024-01-05T08:45:00.000Z").toISOString(),
        updatedAt: new Date("2024-01-10T08:45:00.000Z").toISOString()
      }
    ];

    const spy = vi.spyOn(apiClient, "get").mockResolvedValue(users);

    renderWithClient(<UsersPage />);

    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());

    expect(screen.getByText("Komandos narys")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com • +37060000001")).toBeInTheDocument();
    expect(screen.getByText(/Komandoje nuo/)).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("/users");
  });

  it("shows a friendly access message when the request is forbidden", async () => {
    const error = new ApiClientError("Forbidden", 403, null);
    vi.spyOn(apiClient, "get").mockRejectedValue(error);

    renderWithClient(<UsersPage />);

    await waitFor(() =>
      expect(
        screen.getByText(
          /Ši sritis prieinama tik administratoriams. Susisiekite su sistemos administratoriumi dėl prieigos\./i
        )
      ).toBeInTheDocument()
    );
  });

  it("displays server error messages for other failures", async () => {
    const error = new ApiClientError("Įvyko klaida", 500, null);
    vi.spyOn(apiClient, "get").mockRejectedValue(error);

    renderWithClient(<UsersPage />);

    await waitFor(() => expect(screen.getByText("Įvyko klaida")).toBeInTheDocument());
  });
});
