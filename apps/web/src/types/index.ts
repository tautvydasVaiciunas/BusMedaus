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

export type Notification = {
  id: string;
  title: string;
  description: string;
  type: "įspėjimas" | "informacija" | "kritinis";
  createdAt: string;
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
