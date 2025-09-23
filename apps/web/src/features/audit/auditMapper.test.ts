import { describe, expect, it } from "vitest";
import { mapAuditLogEntry, mapAuditLogResponse } from "./auditMapper";
import type { AuditLogApiEntry } from "../../types";

describe("mapAuditLogEntry", () => {
  const formatter = new Intl.DateTimeFormat("lt-LT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Vilnius"
  });

  it("maps API payloads into UI entries with derived fields", () => {
    const payload: AuditLogApiEntry = {
      id: "audit-1",
      userId: "user-42",
      action: "PATCH /admin/hives",
      details: {
        entityType: "Hive",
        entityId: "hive-17",
        metadata: { severity: "critical" }
      },
      createdAt: "2024-07-01T12:34:56.000Z"
    };

    const result = mapAuditLogEntry(payload);

    expect(result.id).toBe("audit-1");
    expect(result.actor).toBe("user-42");
    expect(result.action).toBe("PATCH /admin/hives");
    expect(result.entity).toBe("Hive hive-17");
    expect(result.severity).toBe("aukštas");
    expect(result.createdAt).toBe(formatter.format(new Date(payload.createdAt)));
  });

  it("handles missing details gracefully", () => {
    const payload: AuditLogApiEntry = {
      id: "audit-2",
      userId: null,
      action: "  ",
      details: null,
      createdAt: "not-a-date"
    };

    const result = mapAuditLogEntry(payload);

    expect(result.actor).toBeNull();
    expect(result.action).toBe("Nežinomas veiksmas");
    expect(result.entity).toBeNull();
    expect(result.severity).toBeNull();
    expect(result.createdAt).toBe("not-a-date");
  });

  it("derives actor, entity, and severity from nested structures", () => {
    const payload: AuditLogApiEntry = {
      id: "audit-3",
      userId: "user-77",
      action: "DELETE /admin/roles",
      details: {
        actor: { firstName: "Ava", lastName: "Jonaitė" },
        entity: { name: "Sodininkų avilys", id: "hive-5" },
        severityLevel: 2
      },
      createdAt: "2024-08-09T08:00:00.000Z"
    };

    const result = mapAuditLogEntry(payload);

    expect(result.actor).toBe("Ava Jonaitė");
    expect(result.entity).toBe("Sodininkų avilys");
    expect(result.severity).toBe("vidutinis");
  });
});

describe("mapAuditLogResponse", () => {
  it("maps arrays of payload entries", () => {
    const payload: AuditLogApiEntry[] = [
      {
        id: "audit-10",
        userId: "user-1",
        action: "GET /admin/audit",
        details: null,
        createdAt: "2024-07-01T12:34:56.000Z"
      },
      {
        id: "audit-11",
        userId: null,
        action: "POST /admin/tasks",
        details: { severity: "low" },
        createdAt: "2024-07-02T12:34:56.000Z"
      }
    ];

    const result = mapAuditLogResponse(payload);
    expect(result).toHaveLength(2);
    expect(result[1].severity).toBe("žemas");
  });

  it("returns an empty array when payload is not provided", () => {
    expect(mapAuditLogResponse(undefined)).toEqual([]);
  });
});
