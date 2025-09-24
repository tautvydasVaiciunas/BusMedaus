import type { SafeUser, TeamMember } from "../../types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administratorius",
  keeper: "Prižiūrėtojas",
  analyst: "Analitikas",
  inspector: "Inspektorius",
  viewer: "Stebėtojas",
  auditor: "Auditorius",
  manager: "Vadovas",
  member: "Komandos narys"
};

const AVATAR_COLORS = [
  "bg-amber-300",
  "bg-emerald-300",
  "bg-sky-300",
  "bg-fuchsia-300",
  "bg-rose-300",
  "bg-lime-300",
  "bg-cyan-300",
  "bg-violet-300"
] as const;

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const pickPrimaryRole = (roles: string[]) => {
  const primary = roles.find((role) => typeof role === "string" && role.trim().length > 0);
  if (!primary) {
    return "Nenurodyta rolė";
  }

  const normalized = primary.trim().toLowerCase();
  if (ROLE_LABELS[normalized]) {
    return ROLE_LABELS[normalized];
  }

  return toTitleCase(primary.trim());
};

const buildFullName = (firstName: string | null, lastName: string | null, email: string) => {
  const parts = [firstName, lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length > 0));

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return email;
};

const buildContactLabel = (email: string, phoneNumber: string | null) => {
  const phone = phoneNumber?.trim();
  if (phone && phone.length > 0) {
    return `${email} • ${phone}`;
  }

  return email;
};

const formatActiveSince = (timestamp: string) => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "nežinoma";
  }

  return new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium" }).format(parsed);
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const selectAvatarColor = (seed: string) => {
  const safeSeed = seed && seed.trim().length > 0 ? seed : "default";
  const hash = hashString(safeSeed);
  const colorIndex = hash % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
};

export const mapSafeUserToTeamMember = (user: SafeUser): TeamMember => ({
  id: user.id,
  name: buildFullName(user.firstName, user.lastName, user.email),
  role: pickPrimaryRole(user.roles),
  contact: buildContactLabel(user.email, user.phoneNumber),
  activeSince: formatActiveSince(user.createdAt),
  avatarColor: selectAvatarColor(user.id || user.email)
});

export const mapSafeUsersToTeamMembers = (users: SafeUser[]): TeamMember[] =>
  users.map((user) => mapSafeUserToTeamMember(user));

export type { TeamMember };
