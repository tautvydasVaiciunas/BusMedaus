import { describe, expect, it } from "vitest";
import { formatNotificationTimestamp, mapNotificationResponse, mapNotificationSeverity } from "./notificationMapper";
import type { NotificationResponse } from "../../types";

describe("mapNotificationSeverity", () => {
  it.each([
    [{ severity: "CRITICAL" }, "SENT", "kritinis"],
    [{ severity: "Aukštas" }, "READ", "kritinis"],
    [{ severity: "warning" }, "SENT", "įspėjimas"],
    [{ severity: "įspėjimas" }, "SENT", "įspėjimas"],
    [null, "FAILED", "kritinis"],
    [undefined, "PENDING", "įspėjimas"],
    [{}, "SENT", "informacija"]
  ] as const)("returns Lithuanian labels for severity %#", (metadata, status, expected) => {
    expect(mapNotificationSeverity(metadata as Record<string, unknown> | null | undefined, status)).toBe(expected);
  });
});

describe("formatNotificationTimestamp", () => {
  it("formats valid timestamps into Lithuanian locale", () => {
    const value = "2024-07-01T12:34:56.000Z";
    const formatted = formatNotificationTimestamp(value);
    expect(formatted).toBe(
      new Intl.DateTimeFormat("lt-LT", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Vilnius"
      }).format(new Date(value))
    );
  });

  it("falls back to original string when the value cannot be parsed", () => {
    const value = "not-a-date";
    expect(formatNotificationTimestamp(value)).toBe(value);
  });

  it("returns a default label when value is missing", () => {
    expect(formatNotificationTimestamp(null)).toBe("Nenurodytas laikas");
    expect(formatNotificationTimestamp(undefined)).toBe("Nenurodytas laikas");
  });
});

describe("mapNotificationResponse", () => {
  const base: NotificationResponse = {
    id: "n-1",
    title: " Padidėjusi drėgmė ",
    body: " Viršijo ribą ",
    channel: "IN_APP",
    status: "PENDING",
    metadata: { severity: "warning" },
    relatedTaskId: null,
    relatedInspectionId: null,
    relatedHarvestId: null,
    auditEventId: null,
    sentAt: null,
    readAt: null,
    createdAt: "2024-07-01T12:34:56.000Z",
    updatedAt: "2024-07-01T12:34:56.000Z",
    deliveryMetadata: null
  };

  it("maps API payloads into UI notification objects", () => {
    const result = mapNotificationResponse(base);

    expect(result.id).toBe("n-1");
    expect(result.title).toBe("Padidėjusi drėgmė");
    expect(result.description).toBe("Viršijo ribą");
    expect(result.type).toBe("įspėjimas");
    expect(result.readAt).toBeNull();
    expect(result.isRead).toBe(false);
    expect(result.createdAt).toBe(
      new Intl.DateTimeFormat("lt-LT", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Vilnius"
      }).format(new Date(base.createdAt))
    );
  });

  it("applies safe fallbacks for missing data", () => {
    const payload: NotificationResponse = {
      ...base,
      id: "n-2",
      title: " ",
      body: " ",
      status: "SENT",
      metadata: null,
      createdAt: "invalid"
    };

    const result = mapNotificationResponse(payload);
    expect(result.title).toBe("Pranešimas");
    expect(result.description).toBe("Nėra papildomos informacijos.");
    expect(result.type).toBe("informacija");
    expect(result.createdAt).toBe("invalid");
    expect(result.readAt).toBeNull();
    expect(result.isRead).toBe(false);
  });

  it("marks notifications as read when readAt is present", () => {
    const payload: NotificationResponse = {
      ...base,
      id: "n-3",
      readAt: "2024-07-02T09:15:00.000Z"
    };

    const result = mapNotificationResponse(payload);
    expect(result.isRead).toBe(true);
    expect(result.readAt).toBe(
      new Intl.DateTimeFormat("lt-LT", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Vilnius"
      }).format(new Date(payload.readAt!))
    );
  });
});
