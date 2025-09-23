import { describe, expect, it } from "vitest";
import { TaskStatus } from "../../../../../src/tasks/task-status.enum";
import { formatTaskPriorityLabel, formatTaskStatusLabel } from "../../../../../src/tasks/task.presenter";
import type { Task } from "../../types";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  getPriorityOptionByValue,
  getStatusOptionByStatus,
  resolveTaskPriority,
  resolveTaskStatus
} from "./taskOptions";

describe("taskOptions", () => {
  it("keeps status labels aligned with the backend presenter", () => {
    const backendStatuses = Object.values(TaskStatus);

    for (const status of backendStatuses) {
      const option = getStatusOptionByStatus(status);
      expect(option).toBeDefined();
      const expectedLabel = formatTaskStatusLabel(status);
      expect(option?.label).toBe(expectedLabel as Task["status"]);
    }
  });

  it("resolves status labels from API responses using either label or enum", () => {
    for (const option of TASK_STATUS_OPTIONS) {
      expect(resolveTaskStatus(option.displayLabel, undefined)).toBe(option.label);
      expect(resolveTaskStatus(undefined, option.status)).toBe(option.label);
    }
  });

  it("mirrors backend priority label formatting", () => {
    for (let priority = 1; priority <= 5; priority += 1) {
      const expected = formatTaskPriorityLabel(priority);
      expect(resolveTaskPriority(expected, priority)).toBe(expected as Task["priority"]);
      expect(getPriorityOptionByValue(priority)?.label ?? expected).toBe(expected as Task["priority"]);
    }
  });

  it("exposes priority options for UI controls", () => {
    expect(TASK_PRIORITY_OPTIONS).toHaveLength(3);
    expect(TASK_PRIORITY_OPTIONS.map((option) => option.value)).toEqual([1, 2, 3]);
  });
});
