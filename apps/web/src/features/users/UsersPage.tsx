import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import type { User } from "../../types";

const avatarPalette = [
  "bg-amber-400 text-amber-950",
  "bg-sky-400 text-sky-950",
  "bg-emerald-400 text-emerald-950",
  "bg-rose-400 text-rose-950",
  "bg-indigo-400 text-indigo-50",
  "bg-lime-300 text-lime-900"
];

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0; // keep a 32bit value
  }

  return Math.abs(hash);
};

const resolveAvatarColor = (seed: string) => {
  const paletteIndex = hashString(seed) % avatarPalette.length;
  return avatarPalette[paletteIndex];
};

const getFullName = (user: User) => {
  const first = user.firstName?.trim() ?? "";
  const last = user.lastName?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  return combined || user.email;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
};

const formatContact = (user: User) => user.phoneNumber?.trim() || user.email;

const formatActiveSince = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("lt-LT", {
    dateStyle: "long"
  }).format(date);
};

const formatRoles = (roles: string[]) => {
  if (!roles.length) {
    return "Rolė nenurodyta";
  }

  return roles.join(", ");
};

const UsersPage = () => {
  const {
    data: currentUser,
    isLoading: isLoadingMe,
    isError: isErrorMe,
    error: errorMe
  } = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: () => apiClient.get<User>("/users/me"),
    staleTime: 60_000
  });

  const isAdmin = Boolean(currentUser?.roles.includes("admin"));

  const {
    data: directory,
    isLoading: isLoadingDirectory,
    isError: isDirectoryError,
    error: directoryError
  } = useQuery<User[]>({
    queryKey: ["users", "directory"],
    queryFn: () => apiClient.get<User[]>("/users"),
    enabled: isAdmin,
    staleTime: 60_000
  });

  const isLoading = isLoadingMe || (isAdmin && isLoadingDirectory && !directory);

  const members = !isAdmin
    ? currentUser
      ? [currentUser]
      : []
    : directory
    ? directory
    : currentUser
    ? [currentUser]
    : [];

  const directoryErrorMessage =
    (isErrorMe && (errorMe instanceof Error ? errorMe.message : "Nepavyko įkelti profilio.")) ||
    (isAdmin && isDirectoryError
      ? directoryError instanceof Error
        ? directoryError.message
        : "Nepavyko įkelti komandos narių."
      : "");

  const hasMembers = members.length > 0;
  const allActive = hasMembers && members.every((member) => member.isActive);

  const statusBadgeTone: "success" | "warning" | "danger" | "info" | "neutral" = isLoading
    ? "neutral"
    : !hasMembers
    ? "neutral"
    : allActive
    ? "success"
    : "warning";

  const statusBadgeLabel = isLoading
    ? "Kraunama..."
    : !hasMembers
    ? "Komandos duomenų nėra"
    : allActive
    ? "Visa komanda aktyvi"
    : "Yra neaktyvių narių";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Komandos nariai</h1>
          <p className="mt-1 text-sm text-slate-400">
            Rolėmis paremtos prieigos užtikrins, kad kiekvienas matys tik jam skirtus modulius.
          </p>
        </div>
        <StatusBadge tone={statusBadgeTone}>{statusBadgeLabel}</StatusBadge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Kraunama komandos informacija...
          </div>
        ) : (
          <>
            {directoryErrorMessage ? (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
                <p>{directoryErrorMessage}</p>
                {hasMembers ? (
                  <p className="mt-2 text-xs text-rose-100/80">
                    Rodomi paskutiniai turimi komandos duomenys.
                  </p>
                ) : null}
              </div>
            ) : null}

            {hasMembers ? (
              members.map((member) => {
                const fullName = getFullName(member);
                const initials = getInitials(fullName);
                const avatarColor = resolveAvatarColor(member.id ?? fullName);
                const contact = formatContact(member);
                const activeSince = formatActiveSince(member.createdAt);
                const subtitle = activeSince ? `Komandoje nuo ${activeSince}` : "Komandos nario informacija";

                return (
                  <Card
                    key={member.id}
                    title={fullName}
                    subtitle={subtitle}
                    accent={
                      <span className="text-xs text-slate-400">
                        {contact || "Kontaktinė informacija nenurodyta"}
                      </span>
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ${avatarColor}`}
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{formatRoles(member.roles)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {member.isActive
                            ? "Aktyvus narys su pilna prieiga."
                            : "Prieiga išjungta administratoriaus."}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : !directoryErrorMessage ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
                Komandos narių dar nėra.
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
