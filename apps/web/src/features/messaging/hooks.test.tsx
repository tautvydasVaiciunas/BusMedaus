import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, apiClient } from "../../lib/apiClient";
import { mapCommentResponse, ThreadComment, useCommentComposer } from "./hooks";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

describe("useCommentComposer", () => {
  let client: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    client = createQueryClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    client.clear();
  });

  it("adds an optimistic entry and replaces it with the saved comment", async () => {
    const initial = [
      mapCommentResponse({
        id: "comment-1",
        content: "Patikrinsiu vakare.",
        author: { id: "user-2", email: "ieva@example.com", roles: ["keeper"] },
        createdAt: "2024-05-01T08:00:00.000Z"
      })
    ];
    const createdAt = "2024-05-01T09:30:00.000Z";
    const apiResponse = {
      id: "comment-2",
      content: "Jau atlikta.",
      author: { id: "user-1", email: "aš@example.com", roles: ["keeper"] },
      createdAt
    };
    vi.spyOn(apiClient, "post").mockResolvedValue(apiResponse);

    client.setQueryData<ThreadComment[]>(["task-comments", "task-1"], initial);

    const { result } = renderHook(() => useCommentComposer("task-1"), { wrapper });

    await act(async () => {
      const promise = result.current.submit("Jau atlikta.");
      const optimistic = client.getQueryData<ThreadComment[]>(["task-comments", "task-1"]);
      expect(optimistic).toHaveLength(2);
      expect(optimistic?.[1].isOptimistic).toBe(true);
      await promise;
    });

    await waitFor(() => {
      const comments = client.getQueryData<ThreadComment[]>(["task-comments", "task-1"]);
      expect(comments).toHaveLength(2);
      expect(comments?.[1]).toMatchObject({
        id: "comment-2",
        content: "Jau atlikta.",
        authorLabel: "aš@example.com"
      });
      expect(comments?.[1].isOptimistic).toBeUndefined();
    });
  });

  it("rolls back optimistic updates and exposes validation errors", async () => {
    const initial = [
      mapCommentResponse({
        id: "comment-1",
        content: "Patikrinsiu vakare.",
        author: { id: "user-2", email: "ieva@example.com", roles: ["keeper"] },
        createdAt: "2024-05-01T08:00:00.000Z"
      })
    ];
    client.setQueryData<ThreadComment[]>(["task-comments", "task-1"], initial);

    const error = new ApiClientError("Žinutė per trumpa", 400, null);
    vi.spyOn(apiClient, "post").mockRejectedValue(error);

    const { result } = renderHook(() => useCommentComposer("task-1"), { wrapper });

    await expect(result.current.submit("J"))
      .rejects.toThrowError();

    await waitFor(() => expect(result.current.error).toBe("Žinutė per trumpa"));
    const comments = client.getQueryData<ThreadComment[]>(["task-comments", "task-1"]);
    expect(comments).toEqual(initial);
  });
});
