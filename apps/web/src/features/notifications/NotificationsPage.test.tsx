import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotificationsPage from "./NotificationsPage";
import type { NotificationResponse } from "../../types";
import { apiClient } from "../../lib/apiClient";

type TestQueryClient = QueryClient & { invalidateQueries: QueryClient["invalidateQueries"] };

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

let testQueryClient: TestQueryClient | null = null;

const renderWithClient = (ui: ReactElement) => {
  const client = createTestQueryClient() as TestQueryClient;
  testQueryClient = client;

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe("NotificationsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("marks notifications as read and invalidates the list", async () => {
    const user = userEvent.setup();
    const notifications: NotificationResponse[] = [
      {
        id: "n-42",
        title: "Avilio temperatūra",
        body: "Viršijo kritinę ribą",
        channel: "IN_APP",
        status: "PENDING",
        metadata: { severity: "warning" },
        relatedTaskId: null,
        relatedInspectionId: null,
        relatedHarvestId: null,
        auditEventId: null,
        sentAt: null,
        readAt: null,
        createdAt: "2024-07-01T08:00:00.000Z",
        updatedAt: "2024-07-01T08:00:00.000Z",
        deliveryMetadata: null
      }
    ];

    const readResponse: NotificationResponse = {
      ...notifications[0],
      status: "READ",
      readAt: "2024-07-01T08:10:00.000Z"
    };

    vi.spyOn(apiClient, "get").mockResolvedValue(notifications);
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue(readResponse);

    renderWithClient(<NotificationsPage />);

    await waitFor(() => expect(screen.getByText("Avilio temperatūra")).toBeInTheDocument());

    const invalidateSpy = vi.spyOn(testQueryClient!, "invalidateQueries");
    const markButton = screen.getByRole("button", { name: /Pažymėti kaip skaitytą/i });

    await user.click(markButton);

    await waitFor(() =>
      expect(patchSpy).toHaveBeenCalledWith(`/notifications/${notifications[0].id}/read`)
    );

    await waitFor(() => expect(screen.getAllByText(/Perskaityta/i).length).toBeGreaterThan(0));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Pažymėti kaip skaitytą/i })).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notifications"] })
    );
  });

  it("surfaces an inline error when marking as read fails", async () => {
    const user = userEvent.setup();
    const notifications: NotificationResponse[] = [
      {
        id: "n-77",
        title: "Avilio svoris",
        body: "Staigus pokytis",
        channel: "IN_APP",
        status: "PENDING",
        metadata: { severity: "warning" },
        relatedTaskId: null,
        relatedInspectionId: null,
        relatedHarvestId: null,
        auditEventId: null,
        sentAt: null,
        readAt: null,
        createdAt: "2024-07-02T11:00:00.000Z",
        updatedAt: "2024-07-02T11:00:00.000Z",
        deliveryMetadata: null
      }
    ];

    vi.spyOn(apiClient, "get").mockResolvedValue(notifications);
    vi.spyOn(apiClient, "patch").mockRejectedValue(new Error("Serveris nepasiekiamas"));

    renderWithClient(<NotificationsPage />);

    await waitFor(() => expect(screen.getByText("Avilio svoris")).toBeInTheDocument());

    const markButton = screen.getByRole("button", { name: /Pažymėti kaip skaitytą/i });
    await user.click(markButton);

    await waitFor(() => expect(screen.getByText("Serveris nepasiekiamas")).toBeInTheDocument());
    await waitFor(() => expect(markButton).toBeEnabled());
  });
});
