import { TaskStatus } from "../../../../../src/tasks/task-status.enum";
import type { Task } from "../../types";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type TaskStatusOption = {
  status: TaskStatus;
  label: Task["status"];
  displayLabel: string;
  tone: StatusTone;
};

export type TaskPriorityOption = {
  value: number;
  label: Task["priority"];
  displayLabel: string;
};

const normalizeKey = (value: string) =>
  value
    .toLocaleLowerCase("lt-LT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const TASK_STATUS_OPTIONS: readonly TaskStatusOption[] = [
  {
    status: TaskStatus.PENDING,
    label: "laukiama",
    displayLabel: "Laukiama",
    tone: "warning"
  },
  {
    status: TaskStatus.IN_PROGRESS,
    label: "vykdoma",
    displayLabel: "Vykdoma",
    tone: "info"
  },
  {
    status: TaskStatus.COMPLETED,
    label: "užbaigta",
    displayLabel: "Užbaigta",
    tone: "success"
  },
  {
    status: TaskStatus.BLOCKED,
    label: "kritinė",
    displayLabel: "Kritinė",
    tone: "danger"
  },
  {
    status: TaskStatus.CANCELLED,
    label: "atšaukta",
    displayLabel: "Atšaukta",
    tone: "neutral"
  }
] as const;

export const DEFAULT_STATUS_OPTION = TASK_STATUS_OPTIONS[0];

const STATUS_BY_NORMALIZED_LABEL = new Map<string, TaskStatusOption>();
const STATUS_BY_STATUS = new Map<TaskStatusOption["status"], TaskStatusOption>();

for (const option of TASK_STATUS_OPTIONS) {
  STATUS_BY_NORMALIZED_LABEL.set(normalizeKey(option.label), option);
  STATUS_BY_STATUS.set(option.status, option);
}

export const TASK_PRIORITY_OPTIONS: readonly TaskPriorityOption[] = [
  { value: 1, label: "žema", displayLabel: "Žema" },
  { value: 2, label: "vidutinė", displayLabel: "Vidutinė" },
  { value: 3, label: "aukšta", displayLabel: "Aukšta" }
] as const;

export const DEFAULT_PRIORITY_OPTION = TASK_PRIORITY_OPTIONS[1];

const PRIORITY_BY_NORMALIZED_LABEL = new Map<string, TaskPriorityOption>();
const PRIORITY_BY_VALUE = new Map<number, TaskPriorityOption>();

for (const option of TASK_PRIORITY_OPTIONS) {
  PRIORITY_BY_NORMALIZED_LABEL.set(normalizeKey(option.label), option);
  PRIORITY_BY_VALUE.set(option.value, option);
}

export const getStatusOptionByLabel = (label: string | null | undefined): TaskStatusOption | undefined => {
  if (!label) {
    return undefined;
  }
  return STATUS_BY_NORMALIZED_LABEL.get(normalizeKey(label));
};

export const getStatusOptionByStatus = (
  status: string | null | undefined
): TaskStatusOption | undefined => {
  if (!status) {
    return undefined;
  }
  return STATUS_BY_STATUS.get(status as TaskStatusOption["status"]);
};

export const resolveTaskStatus = (
  statusLabel?: string | null,
  statusCode?: string | null
): Task["status"] => {
  const byLabel = getStatusOptionByLabel(statusLabel);
  if (byLabel) {
    return byLabel.label;
  }
  const byStatus = getStatusOptionByStatus(statusCode);
  if (byStatus) {
    return byStatus.label;
  }
  return DEFAULT_STATUS_OPTION.label;
};

export const getStatusTone = (status: Task["status"]): StatusTone => {
  const option = getStatusOptionByLabel(status);
  return option?.tone ?? DEFAULT_STATUS_OPTION.tone;
};

export const getPriorityOptionByLabel = (
  label: string | null | undefined
): TaskPriorityOption | undefined => {
  if (!label) {
    return undefined;
  }
  return PRIORITY_BY_NORMALIZED_LABEL.get(normalizeKey(label));
};

export const getPriorityOptionByValue = (
  value: number | null | undefined
): TaskPriorityOption | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return PRIORITY_BY_VALUE.get(value);
};

export const resolveTaskPriority = (
  priorityLabel?: string | null,
  priorityValue?: number | null
): Task["priority"] => {
  const byLabel = getPriorityOptionByLabel(priorityLabel);
  if (byLabel) {
    return byLabel.label;
  }
  if (typeof priorityValue === "number") {
    if (priorityValue >= 3) {
      return "aukšta";
    }
    if (priorityValue <= 1) {
      return "žema";
    }
  }
  return DEFAULT_PRIORITY_OPTION.label;
};
