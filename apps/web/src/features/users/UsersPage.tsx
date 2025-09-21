import { useCallback } from "react";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useMockQuery } from "../../hooks/useMockQuery";
import { mockService } from "../../mocks/mockService";

const UsersPage = () => {
  const query = useMockQuery("users", useCallback(() => mockService.getTeamMembers(), []));

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
        {(query.data ?? []).map((member) => (
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
        ))}
      </div>
    </div>
  );
};

export default UsersPage;
