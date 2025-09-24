import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import type { Notification, NotificationResponse } from "../../types";
import { formatNotificationTimestamp, mapNotificationResponse } from "./notificationMapper";
import usePushSubscription from "./usePushSubscription";

const PUSH_SUBSCRIPTION_STORAGE_KEY = "busmedaus.pushSubscriptionId";
const PUSH_TOKEN_STORAGE_KEY = "busmedaus.pushToken";

type PermissionState = NotificationPermission | "unsupported";
type SubscriptionStatus = "idle" | "pending" | "success" | "error";
type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const toneMap: Record<Notification["type"], "success" | "warning" | "danger" | "info"> = {
  informacija: "info",
  įspėjimas: "warning",
  kritinis: "danger"
};

const permissionLabelMap: Record<PermissionState, string> = {
  default: "Leidimo dar neprašėme",
  granted: "Leidimas suteiktas",
  denied: "Leidimas atmestas",
  unsupported: "Naršyklė nepalaiko"
};

const permissionToneMap: Record<PermissionState, StatusTone> = {
  default: "warning",
  granted: "success",
  denied: "danger",
  unsupported: "neutral"
};

const subscriptionStatusLabelMap: Record<SubscriptionStatus, string> = {
  idle: "Neaktyvuota",
  pending: "Vykdoma...",
  success: "Prenumerata įjungta",
  error: "Įvyko klaida"
};

const subscriptionStatusToneMap: Record<SubscriptionStatus, StatusTone> = {
  idle: "neutral",
  pending: "info",
  success: "success",
  error: "danger"
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const {
    register,
    revoke,
    status: pushStatus,
    error: pushError,
    permission,
    isSupported,
    isRegistered,
    subscriptionId,
    token
  } = usePushSubscription();

  const [storedSubscriptionId, setStoredSubscriptionId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.localStorage.getItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
    } catch (storageError) {
      console.warn("Nepavyko perskaityti prenumeratos iš localStorage", storageError);
      return null;
    }
  });

  const subscriptionIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (subscriptionId && subscriptionId !== subscriptionIdRef.current) {
      try {
        window.localStorage.setItem(PUSH_SUBSCRIPTION_STORAGE_KEY, subscriptionId);
        setStoredSubscriptionId(subscriptionId);
        subscriptionIdRef.current = subscriptionId;
      } catch (storageError) {
        console.warn("Nepavyko išsaugoti prenumeratos ID", storageError);
      }
      return;
    }

    if (!subscriptionId && subscriptionIdRef.current) {
      try {
        window.localStorage.removeItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
        setStoredSubscriptionId(null);
      } catch (storageError) {
        console.warn("Nepavyko išvalyti prenumeratos ID", storageError);
      }
      subscriptionIdRef.current = null;
    }
  }, [subscriptionId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (token && token !== tokenRef.current) {
      try {
        window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      } catch (storageError) {
        console.warn("Nepavyko išsaugoti pranešimų rakto", storageError);
      }
      tokenRef.current = token;
      return;
    }

    if (!token && tokenRef.current) {
      try {
        window.localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      } catch (storageError) {
        console.warn("Nepavyko išvalyti pranešimų rakto", storageError);
      }
      tokenRef.current = null;
    }
  }, [token]);

  const resolvePushToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") {
      return null;
    }

    const busmedausPush = (window as typeof window & {
      busmedausPush?: {
        getToken?: () => Promise<string | null> | string | null;
      };
    }).busmedausPush;

    if (busmedausPush?.getToken) {
      const value = await busmedausPush.getToken();
      if (value) {
        return value;
      }
    }

    try {
      return window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    } catch (storageError) {
      console.warn("Nepavyko perskaityti pranešimų rakto", storageError);
      return null;
    }
  }, []);

  const handleEnablePush = useCallback(async () => {
    try {
      const metadata: Record<string, unknown> = {
        source: "notifications_page"
      };

      if (typeof navigator !== "undefined") {
        metadata.locale = navigator.language;
        try {
          metadata.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (intlError) {
          console.warn("Nepavyko nustatyti laiko juostos", intlError);
        }
      }

      await register({
        getToken: resolvePushToken,
        metadata
      });
    } catch (registrationError) {
      console.warn("Naršyklės pranešimų registracija nepavyko", registrationError);
    }
  }, [register, resolvePushToken]);

  const handleDisablePush = useCallback(async () => {
    const activeSubscriptionId = subscriptionId ?? storedSubscriptionId;

    if (!activeSubscriptionId) {
      return;
    }

    try {
      await revoke(activeSubscriptionId);

      if (!subscriptionId) {
        setStoredSubscriptionId(null);
        try {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
          }
        } catch (storageError) {
          console.warn("Nepavyko išvalyti prenumeratos ID", storageError);
        }
      }
    } catch (revokeError) {
      console.warn("Nepavyko atšaukti naršyklės pranešimų", revokeError);
    }
  }, [revoke, storedSubscriptionId, subscriptionId]);

  const pushStatusBadgeTone = subscriptionStatusToneMap[pushStatus];
  const pushStatusLabel = subscriptionStatusLabelMap[pushStatus];
  const permissionLabel = permissionLabelMap[permission as PermissionState];
  const permissionTone = permissionToneMap[permission as PermissionState];

  const activeSubscriptionId = subscriptionId ?? storedSubscriptionId;
  const isOptedIn = isRegistered || Boolean(activeSubscriptionId);
  const isActionPending = pushStatus === "pending";

  const toggleDisabled =
    isActionPending || (!isOptedIn && (!isSupported || permission === "denied")) || (isOptedIn && !activeSubscriptionId);

  const toggleLabel = isOptedIn
    ? isActionPending
      ? "Išjungiama..."
      : "Išjungti naršyklės pranešimus"
    : isActionPending
      ? "Jungiama..."
      : "Įjungti naršyklės pranešimus";

  const handleTogglePush = useCallback(async () => {
    if (isOptedIn) {
      await handleDisablePush();
      return;
    }

    await handleEnablePush();
  }, [handleDisablePush, handleEnablePush, isOptedIn]);

  const permissionMessage = useMemo(() => {
    if (!isSupported) {
      return "Ši naršyklė nepalaiko push pranešimų. Pabandykite kitą naršyklę arba atnaujinkite versiją.";
    }

    if (permission === "denied") {
      return "Naršyklė atmetė leidimą. Patikrinkite naršyklės nustatymus ir bandykite dar kartą.";
    }

    return "Įjunkite naršyklės pranešimus, kad gautumėte svarbiausius įspėjimus realiu laiku.";
  }, [isSupported, permission]);

  const {
    data: notificationsList,
    isLoading,
    isError,
    error
  } = useQuery<NotificationResponse[], Error, Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<NotificationResponse[]>("/notifications"),
    staleTime: 15_000,
    select: (data) => data.map(mapNotificationResponse)
  });

  const markAsReadMutation = useMutation<NotificationResponse | undefined, Error, string>({
    mutationFn: (notificationId) =>
      apiClient.patch<NotificationResponse | undefined>(`/notifications/${notificationId}/read`),
    onSuccess: (response, notificationId) => {
      queryClient.setQueryData<Notification[] | undefined>(["notifications"], (previous) => {
        if (!previous) {
          return previous;
        }

        return previous.map((item) => {
          if (item.id !== notificationId) {
            return item;
          }

          if (response) {
            return mapNotificationResponse(response);
          }

          return {
            ...item,
            isRead: true,
            readAt: item.readAt ?? formatNotificationTimestamp(new Date())
          };
        });
      });

      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const items = notificationsList ?? [];

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.reset();
    markAsReadMutation.mutate(notificationId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Įvykių centras</h1>
          <p className="mt-1 text-sm text-slate-400">
            Automatiniai įspėjimai apie aplinkos pokyčius, komandos veiksmus ir sistemos būsenas.
          </p>
        </div>
        <StatusBadge tone="info">24/7 stebėsena</StatusBadge>
      </div>

      <Card
        title="Naršyklės pranešimai"
        subtitle="Valdykite interneto naršyklės prenumeratą ir leidimus."
        accent={<BellAlertIcon className="h-6 w-6 text-sky-300" />}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={permissionTone}>{permissionLabel}</StatusBadge>
            <StatusBadge tone={pushStatusBadgeTone}>{pushStatusLabel}</StatusBadge>
            {activeSubscriptionId ? (
              <span className="inline-flex max-w-full items-center rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                <span className="mr-1 font-semibold uppercase text-slate-400">ID:</span>
                <code className="truncate font-mono">{activeSubscriptionId}</code>
              </span>
            ) : null}
          </div>

          <p className="text-sm text-slate-400">{permissionMessage}</p>

          {pushError ? (
            <p className="text-sm text-rose-300" role="alert">
              {pushError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void handleTogglePush();
              }}
              disabled={toggleDisabled}
              className="rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {toggleLabel}
            </button>
            {isOptedIn ? (
              <span className="text-xs uppercase tracking-wide text-emerald-300">Prenumerata aktyvi</span>
            ) : (
              <span className="text-xs uppercase tracking-wide text-slate-400">Prenumerata išjungta</span>
            )}
          </div>
        </div>
      </Card>

      <Card
        title="Naujausi įrašai"
        subtitle="Duomenys kraunami iš API ir nuolat papildomi naujausiais įvykiais"
        accent={<BellAlertIcon className="h-6 w-6 text-amber-300" />}
      >
        <ul className="space-y-4">
          {isLoading ? (
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
              Kraunama...
            </li>
          ) : isError ? (
            <li className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error instanceof Error ? error.message : "Nepavyko įkelti pranešimų."}
            </li>
          ) : items.length ? (
            items.map((item) => {
              const badgeTone = toneMap[item.type] ?? "neutral";
              const badgeLabel =
                typeof item.type === "string" ? item.type.toUpperCase() : "PRANEŠIMAS";
              const isProcessing =
                markAsReadMutation.isPending && markAsReadMutation.variables === item.id;
              const mutationErrorMessage =
                markAsReadMutation.error?.message ?? "Nepavyko pažymėti pranešimo kaip skaitytą.";
              const isErrorForItem =
                Boolean(markAsReadMutation.error) && markAsReadMutation.variables === item.id;
              const wrapperTone = item.isRead
                ? "border-slate-700 bg-slate-900/40"
                : "border-slate-800 bg-slate-900/60";

              return (
                <li key={item.id} className={`rounded-xl border ${wrapperTone} p-4`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                        </div>
                        <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
                      </div>
                      <div className="mt-3 space-y-1 text-[11px] uppercase tracking-wide">
                        <p className="text-slate-500">Sukurta {item.createdAt}</p>
                        {item.isRead ? (
                          <p className="text-emerald-300">
                            Perskaityta {item.readAt ?? "pažymėta"}
                          </p>
                        ) : null}
                        {isErrorForItem ? (
                          <p className="text-rose-300" role="status">
                            {mutationErrorMessage}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.isRead ? (
                        <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                          Perskaityta
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(item.id)}
                          disabled={isProcessing}
                          className="rounded-md bg-amber-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                          {isProcessing ? "Žymima..." : "Pažymėti kaip skaitytą"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
              Šiuo metu naujų pranešimų nėra.
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
};

export default NotificationsPage;
