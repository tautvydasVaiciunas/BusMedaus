import { renderHook, act, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { PropsWithChildren } from "react";

import { AuthProvider, type TokenResponse } from "./AuthProvider";
import { useAuth } from "../hooks/useAuth";
import { apiClient, API_REFRESH_BUFFER } from "../lib/apiClient";

const createWrapper = (client: QueryClient) => {
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("schedules refresh timers based on expiresIn milliseconds", async () => {
    const queryClient = new QueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAuth(), { wrapper });

    const expiresIn = 5 * 60 * 1000;

    const tokenResponse: TokenResponse = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { id: "1", email: "user@example.com", name: "Test User" },
      expiresIn
    };

    const postMock = vi
      .spyOn(apiClient, "post")
      .mockImplementation(async (path: string, _body?: unknown, _options?: unknown) => {
        if (path === "/auth/login") {
          return tokenResponse;
        }
        throw new Error(`Unexpected path: ${path}`);
      });

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    try {
      await act(async () => {
        await result.current.login({ email: "user@example.com", password: "password" });
      });

      expect(postMock).toHaveBeenCalledWith(
        "/auth/login",
        { email: "user@example.com", password: "password" },
        { withAuth: false }
      );

      const expectedDelay = Math.max(expiresIn - API_REFRESH_BUFFER, 0);
      const matchingCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === expectedDelay);

      expect(matchingCall).toBeDefined();
    } finally {
      queryClient.clear();
    }
  });

  it("keeps authentication active when persisting to localStorage fails", async () => {
    const queryClient = new QueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAuth(), { wrapper });

    const tokenResponse: TokenResponse = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { id: "1", email: "user@example.com", name: "Test User" }
    };

    const postMock = vi
      .spyOn(apiClient, "post")
      .mockImplementation(async (path: string, _body?: unknown, _options?: unknown) => {
        if (path === "/auth/login") {
          return tokenResponse;
        }
        throw new Error(`Unexpected path: ${path}`);
      });

    const setItemMock = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });

    const consoleWarnMock = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await act(async () => {
        await result.current.login({ email: "user@example.com", password: "password" });
      });

      expect(result.current.status).toBe("authenticated");
      expect(result.current.user).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(true);

      if (import.meta.env?.DEV) {
        expect(consoleWarnMock).toHaveBeenCalled();
      }

      expect(setItemMock).toHaveBeenCalledTimes(1);
      const [, persistedPayload] = setItemMock.mock.calls[0];
      expect(typeof persistedPayload).toBe("string");

      if (typeof persistedPayload === "string") {
        const parsedPayload = JSON.parse(persistedPayload);

        expect(parsedPayload).toMatchObject({
          user: tokenResponse.user,
          session: {
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken
          }
        });
        expect(typeof parsedPayload.session.expiresAt).toBe("number");
      }
    } finally {
      queryClient.clear();
    }
  });
});
