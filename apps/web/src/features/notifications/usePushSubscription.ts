import { useCallback, useMemo, useState } from "react";
import { apiClient } from "../../lib/apiClient";

type PermissionState = NotificationPermission | "unsupported";

type RegisterOptions = {
  token?: string | null;
  getToken?: () => Promise<string | null>;
  metadata?: Record<string, unknown>;
};

type NotificationSubscriptionResponse = {
  id: string;
  token: string;
};

type UsePushSubscriptionResult = {
  subscriptionId: string | null;
  token: string | null;
  status: "idle" | "pending" | "success" | "error";
  error: string | null;
  permission: PermissionState;
  isSupported: boolean;
  isRegistered: boolean;
  register: (options?: RegisterOptions) => Promise<string>;
  revoke: (subscriptionIdOverride?: string | null) => Promise<void>;
};

const resolvePermission = async (
  request: () => NotificationPermission | Promise<NotificationPermission>
): Promise<NotificationPermission> => {
  const result = request();
  if (result instanceof Promise) {
    return result;
  }

  return Promise.resolve(result);
};

const initialPermission: PermissionState =
  typeof window !== "undefined" && typeof window.Notification !== "undefined"
    ? window.Notification.permission
    : "unsupported";

export const usePushSubscription = (): UsePushSubscriptionResult => {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>(initialPermission);

  const ensurePermission = useCallback(async (): Promise<PermissionState> => {
    if (typeof window === "undefined" || typeof window.Notification === "undefined") {
      setPermission("unsupported");
      return "unsupported";
    }

    const current = window.Notification.permission;

    if (current === "granted" || current === "denied") {
      setPermission(current);
      return current;
    }

    if (typeof window.Notification.requestPermission === "function") {
      try {
        const result = await resolvePermission(() => window.Notification.requestPermission());
        setPermission(result);
        return result;
      } catch (requestError) {
        setPermission("denied");
        throw requestError instanceof Error
          ? requestError
          : new Error("Nepavyko gauti naršyklės leidimo pranešimams.");
      }
    }

    setPermission(current);
    return current;
  }, []);

  const register = useCallback<UsePushSubscriptionResult["register"]>(
    async (options) => {
      setStatus("pending");
      setError(null);

      try {
        const permissionResult = await ensurePermission();

        if (permissionResult === "denied") {
          throw new Error("Naršyklė neleido rodyti pranešimų.");
        }

        let resolvedToken = options?.token ?? null;

        if (!resolvedToken && options?.getToken) {
          resolvedToken = await options.getToken();
        }

        if (!resolvedToken) {
          throw new Error("Nepavyko gauti pranešimų rakto.");
        }

        const response = await apiClient.post<NotificationSubscriptionResponse>(
          "/notifications/subscriptions",
          {
            token: resolvedToken,
            metadata: {
              platform: "web",
              permission: permissionResult,
              ...options?.metadata
            }
          }
        );

        setSubscriptionId(response.id);
        setToken(response.token);
        setStatus("success");
        return response.token;
      } catch (registrationError) {
        const message =
          registrationError instanceof Error
            ? registrationError.message
            : "Nepavyko išsaugoti pranešimų prenumeratos.";
        setError(message);
        setStatus("error");
        throw registrationError instanceof Error
          ? registrationError
          : new Error(message);
      }
    },
    [ensurePermission]
  );

  const revoke = useCallback<UsePushSubscriptionResult["revoke"]>(
    async (subscriptionIdOverride) => {
      const activeSubscriptionId = subscriptionIdOverride ?? subscriptionId;

      if (!activeSubscriptionId) {
        const message = "Nėra prenumeratos identifikatoriaus, kurį būtų galima atšaukti.";
        setError(message);
        setStatus("error");
        throw new Error(message);
      }

      setStatus("pending");
      setError(null);

      try {
        await apiClient.delete(
          `/notifications/subscriptions/${encodeURIComponent(activeSubscriptionId)}`
        );
        setSubscriptionId(null);
        setToken(null);
        setStatus("idle");
      } catch (revokeError) {
        const message =
          revokeError instanceof Error
            ? revokeError.message
            : "Nepavyko atšaukti pranešimų prenumeratos.";
        setError(message);
        setStatus("error");
        throw revokeError instanceof Error ? revokeError : new Error(message);
      }
    },
    [subscriptionId]
  );

  return useMemo(
    () => ({
      subscriptionId,
      token,
      status,
      error,
      permission,
      isSupported: permission !== "unsupported",
      isRegistered: Boolean(subscriptionId),
      register,
      revoke
    }),
    [error, permission, register, revoke, status, subscriptionId, token]
  );
};

export default usePushSubscription;
