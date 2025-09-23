import type { Notification, NotificationResponse } from "../../types";

const DEFAULT_NOTIFICATION_TITLE = "Pranešimas";
const DEFAULT_NOTIFICATION_DESCRIPTION = "Nėra papildomos informacijos.";
const DEFAULT_TIMESTAMP_LABEL = "Nenurodytas laikas";

const normalizeKey = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .toLocaleLowerCase("lt-LT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const extractSeverity = (metadata: NotificationResponse["metadata"]): string => {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const value = (metadata as Record<string, unknown>).severity;
  return typeof value === "string" ? value : "";
};

export const mapNotificationSeverity = (
  metadata: NotificationResponse["metadata"],
  status: NotificationResponse["status"]
): Notification["type"] => {
  const severityKey = normalizeKey(extractSeverity(metadata));

  if (severityKey === "critical" || severityKey === "high" || severityKey === "aukstas" || severityKey === "kritinis") {
    return "kritinis";
  }

  if (severityKey === "warning" || severityKey === "medium" || severityKey === "ispejimas") {
    return "įspėjimas";
  }

  const statusKey = normalizeKey(status);

  if (statusKey === "failed") {
    return "kritinis";
  }

  if (statusKey === "pending") {
    return "įspėjimas";
  }

  return "informacija";
};

export const formatNotificationTimestamp = (value: string | Date | null | undefined): string => {
  if (!value) {
    return DEFAULT_TIMESTAMP_LABEL;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" && value.trim() ? value : DEFAULT_TIMESTAMP_LABEL;
  }

  return new Intl.DateTimeFormat("lt-LT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Vilnius"
  }).format(date);
};

export const mapNotificationResponse = (payload: NotificationResponse): Notification => {
  const title = payload.title.trim() || DEFAULT_NOTIFICATION_TITLE;
  const description = payload.body.trim() || DEFAULT_NOTIFICATION_DESCRIPTION;

  return {
    id: payload.id,
    title,
    description,
    type: mapNotificationSeverity(payload.metadata ?? null, payload.status),
    createdAt: formatNotificationTimestamp(payload.createdAt)
  };
};

export { normalizeKey };
