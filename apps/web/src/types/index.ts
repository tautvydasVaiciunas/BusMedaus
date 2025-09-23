export type Hive = {
  id: string;
  name: string;
  queenStatus: "aktyvi" | "per žiemą" | "keisti";
  productivityIndex: number;
  lastInspection: string;
  location: string;
  temperature: number;
  humidity: number;
};

export type Task = {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: "laukiama" | "vykdoma" | "užbaigta" | "kritinė";
  priority: "žema" | "vidutinė" | "aukšta";
};

export type Message = {
  id: string;
  sender: string;
  preview: string;
  sentAt: string;
  channel: "programa" | "sms" | "el.paštas";
  unread?: boolean;
};

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "PUSH";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";

export type NotificationDeliveryDetail = {
  status: NotificationStatus;
  attempts: number;
  lastAttemptAt: string;
  providerMessageId?: string;
  lastError?: string;
  extra?: Record<string, unknown>;
};

export type NotificationDeliveryMap = Partial<Record<NotificationChannel, NotificationDeliveryDetail>>;

export type Notification = {
  id: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  metadata: Record<string, unknown> | null;
  relatedTaskId?: string;
  relatedInspectionId?: string;
  relatedHarvestId?: string;
  auditEventId?: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryMetadata: NotificationDeliveryMap | null;
};

export type MediaItem = {
  id: string;
  hiveId: string;
  capturedAt: string;
  author: string;
  url: string;
  tags: string[];
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  type: "įspėjimas" | "informacija" | "kritinis";
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  severity: "žemas" | "vidutinis" | "aukštas";
  createdAt: string;
};

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendTone: "positive" | "negative" | "neutral";
};
