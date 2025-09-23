export type HiveTelemetry = {
  location?: string | null;
  queenStatus?: string | null;
  productivityIndex?: number | null;
  lastInspectionAt?: string | null;
  temperature?: number | null;
  humidity?: number | null;
};

export type HiveUserSummary = {
  id: string;
  email: string;
  roles: string[];
};

export type SafeUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Hive = {
  id: string;
  name: string;
  description?: string | null;
  owner: HiveUserSummary;
  members: HiveUserSummary[];
  createdAt: string;
  updatedAt: string;
  telemetry: HiveTelemetry;
};

export type Task = {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: "laukiama" | "vykdoma" | "užbaigta" | "kritinė" | "atšaukta";
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

export type Notification = {
  id: string;
  title: string;
  description: string;
  type: "įspėjimas" | "informacija" | "kritinis";
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
};

export type NotificationDeliveryDetail = {
  status: string;
  attempts: number;
  lastAttemptAt: string;
  providerMessageId?: string;
  lastError?: string;
  extra?: Record<string, unknown>;
};

export type NotificationDeliveryMap = Partial<Record<string, NotificationDeliveryDetail>>;

export type NotificationResponse = {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  relatedTaskId?: string | null;
  relatedInspectionId?: string | null;
  relatedHarvestId?: string | null;
  auditEventId?: string | null;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryMetadata?: NotificationDeliveryMap | null;
};

export type MediaItem = {
  id: string;
  hiveId: string;
  capturedAt: string;
  author: string;
  url: string;
  tags: string[];
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  contact: string;
  activeSince: string;
  avatarColor: string;
};

export type AuditSeverity = "žemas" | "vidutinis" | "aukštas";

export type AuditLogApiEntry = {
  id: string;
  userId: string | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  actor: string | null;
  action: string;
  entity: string | null;
  severity: AuditSeverity | null;
  createdAt: string;
};

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendTone: "positive" | "negative" | "neutral";
};
