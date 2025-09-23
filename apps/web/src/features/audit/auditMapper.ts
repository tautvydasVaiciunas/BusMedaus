import type { AuditLogApiEntry, AuditLogEntry, AuditSeverity } from "../../types";

const TIMESTAMP_FALLBACK = "Nenurodytas laikas";
const ACTION_FALLBACK = "Nežinomas veiksmas";

const auditDateFormatter = new Intl.DateTimeFormat("lt-LT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Vilnius"
});

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const extractLabel = (value: unknown): string | null => {
  const direct = toTrimmedString(value);
  if (direct) {
    return direct;
  }

  if (Array.isArray(value)) {
    for (const candidate of value) {
      const label = extractLabel(candidate);
      if (label) {
        return label;
      }
    }
    return null;
  }

  if (isRecord(value)) {
    const nameLike =
      toTrimmedString(value.name) ??
      toTrimmedString(value.fullName) ??
      toTrimmedString(value.displayName) ??
      toTrimmedString(value.title) ??
      toTrimmedString(value.label) ??
      toTrimmedString(value.email);

    if (nameLike) {
      return nameLike;
    }

    const first = toTrimmedString(value.firstName);
    const last = toTrimmedString(value.lastName);
    if (first || last) {
      return [first, last].filter(Boolean).join(" ") || null;
    }

    const identifier = toTrimmedString(value.id) ?? toTrimmedString(value.identifier);
    if (identifier) {
      return identifier;
    }
  }

  return null;
};

const removeDiacritics = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeSeverityKey = (value: string) => removeDiacritics(value).trim().toLowerCase();

const severityMap: Record<string, AuditSeverity> = {
  aukstas: "aukštas",
  kritinis: "aukštas",
  critical: "aukštas",
  high: "aukštas",
  severe: "aukštas",
  danger: "aukštas",
  emergency: "aukštas",
  vidutinis: "vidutinis",
  medium: "vidutinis",
  moderate: "vidutinis",
  warning: "vidutinis",
  caution: "vidutinis",
  elevated: "vidutinis",
  attention: "vidutinis",
  zemas: "žemas",
  low: "žemas",
  minor: "žemas",
  info: "žemas",
  informational: "žemas",
  notice: "žemas",
  normal: "žemas"
};

const severityFromNumber = (value: number): AuditSeverity => {
  if (value >= 3) {
    return "aukštas";
  }
  if (value >= 2) {
    return "vidutinis";
  }
  return "žemas";
};

const mapSeverityValue = (value: unknown): AuditSeverity | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return severityFromNumber(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = normalizeSeverityKey(trimmed);
    if (severityMap[normalized]) {
      return severityMap[normalized];
    }

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) {
      return severityFromNumber(asNumber);
    }
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const severity = mapSeverityValue(entry);
      if (severity) {
        return severity;
      }
    }
    return null;
  }

  if (isRecord(value)) {
    for (const key of ["severity", "level", "value", "label", "name"]) {
      if (key in value) {
        const severity = mapSeverityValue(value[key]);
        if (severity) {
          return severity;
        }
      }
    }
  }

  const label = extractLabel(value);
  if (label) {
    return mapSeverityValue(label);
  }

  return null;
};

const getNestedValue = (source: Record<string, unknown>, path: string[]): unknown => {
  return path.reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }
    const record = acc as Record<string, unknown>;
    return record[segment];
  }, source);
};

const extractSeverity = (details: Record<string, unknown> | null): AuditSeverity | null => {
  if (!details) {
    return null;
  }

  const candidates: string[][] = [
    ["severity"],
    ["severityLevel"],
    ["level"],
    ["metadata", "severity"],
    ["metadata", "level"],
    ["context", "severity"]
  ];

  for (const path of candidates) {
    const value = getNestedValue(details, path);
    const severity = mapSeverityValue(value);
    if (severity) {
      return severity;
    }
  }

  return null;
};

const extractEntity = (details: Record<string, unknown> | null): string | null => {
  if (!details) {
    return null;
  }

  const directPaths: string[][] = [
    ["entity"],
    ["entityName"],
    ["entityLabel"],
    ["entityDisplayName"],
    ["target"],
    ["targetName"],
    ["resource"],
    ["resourceName"],
    ["metadata", "entity"],
    ["metadata", "target"],
    ["metadata", "resource"],
    ["context", "entity"]
  ];

  for (const path of directPaths) {
    const value = getNestedValue(details, path);
    const label = extractLabel(value);
    if (label) {
      return label;
    }
  }

  const type =
    extractLabel(getNestedValue(details, ["entityType"])) ??
    extractLabel(getNestedValue(details, ["resourceType"]));

  const identifier =
    extractLabel(getNestedValue(details, ["entityId"])) ??
    extractLabel(getNestedValue(details, ["resourceId"])) ??
    extractLabel(getNestedValue(details, ["targetId"]));

  if (type && identifier) {
    return `${type} ${identifier}`;
  }

  return type ?? identifier ?? null;
};

const extractActor = (entry: AuditLogApiEntry, details: Record<string, unknown> | null): string | null => {
  if (details) {
    const actorPaths: string[][] = [
      ["actor"],
      ["user"],
      ["userName"],
      ["username"],
      ["userEmail"],
      ["performedBy"],
      ["initiatedBy"],
      ["createdBy"],
      ["metadata", "actor"],
      ["metadata", "user"],
      ["metadata", "username"],
      ["context", "actor"]
    ];

    for (const path of actorPaths) {
      const value = getNestedValue(details, path);
      const label = extractLabel(value);
      if (label) {
        return label;
      }
    }
  }

  return toTrimmedString(entry.userId);
};

const formatAuditTimestamp = (value: unknown): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return TIMESTAMP_FALLBACK;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return auditDateFormatter.format(parsed);
    }
    return trimmed;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return auditDateFormatter.format(value);
  }

  return TIMESTAMP_FALLBACK;
};

export const mapAuditLogEntry = (entry: AuditLogApiEntry): AuditLogEntry => {
  const details = isRecord(entry.details) ? entry.details : null;

  return {
    id: entry.id,
    actor: extractActor(entry, details),
    action: toTrimmedString(entry.action) ?? ACTION_FALLBACK,
    entity: extractEntity(details),
    severity: extractSeverity(details),
    createdAt: formatAuditTimestamp(entry.createdAt)
  };
};

export const mapAuditLogResponse = (payload: AuditLogApiEntry[] | null | undefined): AuditLogEntry[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map(mapAuditLogEntry);
};
