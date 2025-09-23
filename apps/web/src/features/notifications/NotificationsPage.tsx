import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import type { Notification, NotificationResponse } from "../../types";
import { formatNotificationTimestamp, mapNotificationResponse } from "./notificationMapper";

const toneMap: Record<Notification["type"], "success" | "warning" | "danger" | "info"> = {
  informacija: "info",
  įspėjimas: "warning",
  kritinis: "danger"
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();

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
        title="Naujausi įrašai"
        subtitle="Kai bus prijungtas backend'as, čia atsinaujins visų modulių įvykiai"
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
