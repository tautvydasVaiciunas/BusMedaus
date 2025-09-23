import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MediaPage from "./MediaPage";
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

describe("MediaPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("formats media cards with localized metadata", async () => {
    const payload = [
      {
        id: "media-1",
        url: "https://example.com/photo.jpg",
        mimeType: "image/jpeg",
        description: "Nuotrauka",
        metadata: { tags: ["profilaktika"] },
        capturedAt: "2025-04-20T00:00:00.000Z",
        hive: { id: "hive-1", name: "A1" },
        uploader: {
          id: "user-1",
          email: "asta@example.com",
          roles: ["keeper"],
          firstName: "Asta",
          lastName: "Bitė",
          displayName: ""
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const spy = vi.spyOn(apiClient, "get").mockResolvedValue(payload);

    renderWithClient(<MediaPage />);

    await waitFor(() => expect(screen.getByText(/Avilys hive-1/i)).toBeInTheDocument());
    expect(screen.getByText(/Asta Bitė/)).toBeInTheDocument();
    expect(screen.getByText(/profilaktika/)).toBeInTheDocument();
    expect(screen.getByText(/2025-04-20/)).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("/media");
  });
});
