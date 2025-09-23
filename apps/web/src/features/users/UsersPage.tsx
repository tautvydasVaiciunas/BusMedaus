import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { ApiClientError, apiClient } from "../../lib/apiClient";
import type { SafeUser, TeamMember } from "../../types";
import { mapSafeUsersToTeamMembers } from "./userMapper";

const UsersPage = () => {
  const {
    data: teamMembers = [],
    isLoading,
    isError,
    error
  } = useQuery<SafeUser[], ApiClientError, TeamMember[]>({
    queryKey: ["users"],
    queryFn: () => apiClient.get<SafeUser[]>("/users"),
    select: (users) => mapSafeUsersToTeamMembers(users),
    staleTime: 60_000,
    retry: (failureCount, err) => {
      if (err instanceof ApiClientError && err.status === 403) {
        return false;
      }
      return failureCount < 1;
    }
  });

  const isForbidden = isError && error instanceof ApiClientError && error.status === 403;
  const friendlyError = isForbidden
    ? "Ši sritis prieinama tik administratoriams. Susisiekite su sistemos administratoriumi dėl prieigos."
    : error instanceof Error
      ? error.message
      : "Nepavyko įkelti komandos narių.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Komandos nariai</h1>
          <p className="mt-1 text-sm text-slate-400">
            Rolėmis paremtos prieigos užtikrins, kad kiekvienas matys tik jam skirtus modulius.
          </p>
        </div>
        <StatusBadge tone="success">Visa komanda aktyvi</StatusBadge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Kraunama komandos informacija...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
            {friendlyError}
          </div>
        ) : (
          teamMembers.map((member) => (
            <Card
              key={member.id}
              title={member.name}
              subtitle={`Komandoje nuo ${member.activeSince}`}
              accent={<span className="text-xs text-slate-400">{member.contact}</span>}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-slate-900 ${member.avatarColor}`}>
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{member.role}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Prisijungimų statistika ir aktyvumo žemėlapis bus pasiekiami integravus autentifikaciją.
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersPage;
