import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import MessagingPage from "./MessagingPage";
import { ApiClientError, apiClient } from "../../lib/apiClient";

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

  it("renders the conversation timeline for the active task", async () => {
    const now = new Date().toISOString();
    const messageResponse = [
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
        createdAt: now,
        isOwn: false
      }
    ];
    const commentsResponse = [
      {
        id: "comment-1",
        content: "Atliksiu šį darbą rytoj ryte.",
        author: {
          id: "user-3",
          email: "jonas@example.com",
          roles: ["keeper"]
        },
        createdAt: now
      }
    ];

    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (path: string) => {
      if (path === "/messages") {
        return messageResponse as unknown as Promise<unknown>;
      }
      if (path === "/tasks/task-1/comments") {
        return commentsResponse as unknown as Promise<unknown>;
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithClient(<MessagingPage />);

    await waitFor(() => expect(screen.getByText("Ventiliacija")).toBeInTheDocument());
    expect(screen.getByText("Atliksiu šį darbą rytoj ryte.")).toBeInTheDocument();
    expect(screen.getByText("jonas@example.com")).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith("/messages");
    expect(getSpy).toHaveBeenCalledWith("/tasks/task-1/comments");
  });

  it("sends a new comment and clears the composer", async () => {
    const now = new Date("2024-05-01T10:00:00.000Z").toISOString();
    const messageResponse = [
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
        createdAt: now,
        isOwn: false
      }
    ];
    const initialComments = [
      {
        id: "comment-1",
        content: "Atliksiu šį darbą rytoj ryte.",
        author: {
          id: "user-3",
          email: "jonas@example.com",
          roles: ["keeper"]
        },
        createdAt: now
      }
    ];
    const createdComment = {
      id: "comment-2",
      content: "Patikrinau – viskas veikia.",
      author: {
        id: "user-1",
        email: "aš@example.com",
        roles: ["keeper"]
      },
      createdAt: new Date("2024-05-01T12:00:00.000Z").toISOString()
    };

    let commentCalls = 0;
    vi.spyOn(apiClient, "get").mockImplementation(async (path: string) => {
      if (path === "/messages") {
        return messageResponse as unknown as Promise<unknown>;
      }
      if (path === "/tasks/task-1/comments") {
        commentCalls += 1;
        if (commentCalls === 1) {
          return initialComments as unknown as Promise<unknown>;
        }
        return [...initialComments, createdComment] as unknown as Promise<unknown>;
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(createdComment);

    renderWithClient(<MessagingPage />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Atliksiu šį darbą rytoj ryte.")).toBeInTheDocument());

    const textarea = await screen.findByLabelText("Nauja žinutė");
    await user.type(textarea, "Patikrinau – viskas veikia.");
    await user.click(screen.getByRole("button", { name: "Siųsti" }));

    await waitFor(() =>
      expect(postSpy).toHaveBeenCalledWith("/tasks/task-1/comments", { content: "Patikrinau – viskas veikia." })
    );
    await waitFor(() => expect(screen.getByText("Patikrinau – viskas veikia.")).toBeInTheDocument());
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("surfaces validation errors from the messaging service", async () => {
    const now = new Date().toISOString();
    const messageResponse = [
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
        createdAt: now,
        isOwn: false
      }
    ];
    const commentsResponse = [
      {
        id: "comment-1",
        content: "Atliksiu šį darbą rytoj ryte.",
        author: {
          id: "user-3",
          email: "jonas@example.com",
          roles: ["keeper"]
        },
        createdAt: now
      }
    ];

    vi.spyOn(apiClient, "get").mockImplementation(async (path: string) => {
      if (path === "/messages") {
        return messageResponse as unknown as Promise<unknown>;
      }
      if (path === "/tasks/task-1/comments") {
        return commentsResponse as unknown as Promise<unknown>;
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    const postError = new ApiClientError("Žinutė per ilga", 400, null);
    vi.spyOn(apiClient, "post").mockRejectedValue(postError);

    renderWithClient(<MessagingPage />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Atliksiu šį darbą rytoj ryte.")).toBeInTheDocument());

    const textarea = await screen.findByLabelText("Nauja žinutė");
    await user.type(textarea, "{selectall}{backspace}Labai ilga žinutė kuri viršija ribą");
    await user.click(screen.getByRole("button", { name: "Siųsti" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Žinutė per ilga"));
    expect((textarea as HTMLTextAreaElement).value).toBe("Labai ilga žinutė kuri viršija ribą");
  });
});
