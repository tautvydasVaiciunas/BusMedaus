import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import type { Notification } from "../../types";

const statusLabelMap: Record<Notification["status"], string> = {
  PENDING: "Laukiama išsiuntimo",
  SENT: "Išsiųsta",
  FAILED: "Pristatymas nepavyko",
  READ: "Perskaityta"
};

const statusToneMap: Record<Notification["status"], "success" | "warning" | "danger" | "info" | "neutral"> = {
  PENDING: "warning",
  SENT: "info",
  FAILED: "danger",
  READ: "success"
};

const channelLabelMap: Record<Notification["channel"], string> = {
  IN_APP: "Programėlė",
  EMAIL: "El. paštas",
  SMS: "SMS",
  PUSH: "Push pranešimas"
};

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("lt-LT", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

const resolveDescription = (notification: Notification) => {
  if (notification.body?.trim()) {
    return notification.body.trim();
  }

  const channelLabel = channelLabelMap[notification.channel] ?? notification.channel;
  return `${channelLabel} pranešimas`;
};

const buildTimelineLabel = (notification: Notification) => {
  const readAt = formatTimestamp(notification.readAt);
  if (notification.status === "READ" && readAt) {
    return `Perskaityta ${readAt}`;
  }

  const sentAt = formatTimestamp(notification.sentAt);
  if (sentAt) {
    return `Išsiųsta ${sentAt}`;
  }

  const createdAt = formatTimestamp(notification.createdAt);
  if (createdAt) {
    return `Sukurta ${createdAt}`;
  }

  return null;
};

const NotificationsPage = () => {
  const {
    data: notificationsList,
    isLoading,
    isError,
    error
  } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<Notification[]>("/notifications"),
    staleTime: 15_000
  });

  const items = notificationsList ?? [];

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
              const statusLabel = statusLabelMap[item.status] ?? item.status;
              const channelLabel = channelLabelMap[item.channel] ?? item.channel;
              const description = resolveDescription(item);
              const timelineLabel = buildTimelineLabel(item);
              const metaLine = [channelLabel, timelineLabel].filter(Boolean).join(" • ");

              return (
                <li key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{description}</p>
                    </div>
                    <StatusBadge tone={statusToneMap[item.status] ?? "neutral"}>
                      {statusLabel.toUpperCase()}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-500">{metaLine}</p>
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
