import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../../lib/apiClient";

let usePushSubscription: typeof import("./usePushSubscription").default;

describe("usePushSubscription", () => {
  beforeAll(async () => {
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        permission: "granted",
        requestPermission: vi.fn()
      }
    });

    ({ default: usePushSubscription } = await import("./usePushSubscription"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    const notification = window.Notification as unknown as {
      permission: NotificationPermission;
      requestPermission: ReturnType<typeof vi.fn>;
    };
    notification.permission = "granted";
    notification.requestPermission = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Notification;
  });

  it("stores the subscription identifier returned by the API", async () => {
    const subscriptionResponse = {
      id: "sub-123",
      token: "token-abc"
    };

    const postSpy = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(subscriptionResponse);

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.register({
        token: "token-abc",
        metadata: { locale: "lt-LT" }
      });
    });

    expect(postSpy).toHaveBeenCalledWith(
      "/notifications/subscriptions",
      {
        token: "token-abc",
        metadata: {
          platform: "web",
          permission: "granted",
          locale: "lt-LT"
        }
      }
    );

    await waitFor(() => expect(result.current.subscriptionId).toBe("sub-123"));
    expect(result.current.token).toBe("token-abc");
    expect(result.current.isRegistered).toBe(true);
  });

  it("revokes subscriptions using the stored identifier", async () => {
    const subscriptionResponse = {
      id: "sub-456",
      token: "token-xyz"
    };

    vi.spyOn(apiClient, "post").mockResolvedValue(subscriptionResponse);
    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue(undefined);

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.register({ token: "token-xyz" });
    });

    await act(async () => {
      await result.current.revoke();
    });

    expect(deleteSpy).toHaveBeenCalledWith(
      `/notifications/subscriptions/${encodeURIComponent(subscriptionResponse.id)}`
    );
    await waitFor(() => expect(result.current.subscriptionId).toBeNull());
    expect(result.current.token).toBeNull();
    expect(result.current.isRegistered).toBe(false);
  });
});
