import { useCallback } from "react";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useMockQuery } from "../../hooks/useMockQuery";
import { mockService } from "../../mocks/mockService";
import { BellAlertIcon } from "@heroicons/react/24/outline";

const toneMap: Record<string, "success" | "warning" | "danger" | "info"> = {
  informacija: "info",
  įspėjimas: "warning",
  kritinis: "danger"
};

const NotificationsPage = () => {
  const query = useMockQuery("notifications", useCallback(() => mockService.getNotifications(), []));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Įvykių centras</h1>
          <p className="mt-1 text-sm text-slate-400">
            Automatiniai įspėjimai apie aplinkos pokyčius, komandos veiksmus ir sistemos būsenas.
          </p>
        </div>
        <StatusBadge tone="info">24/7 stebėsena</StatusBadge>
      </div>

      <Card
        title="Naujausi įrašai"
        subtitle="Kai bus prijungtas backend'as, čia atsinaujins visų modulių įvykiai"
        accent={<BellAlertIcon className="h-6 w-6 text-amber-300" />}
      >
        <ul className="space-y-4">
          {query.isLoading ? (
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
              Kraunama...
            </li>
          ) : (
            (query.data ?? []).map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                  </div>
                  <StatusBadge tone={toneMap[item.type] ?? "neutral"}>{item.type.toUpperCase()}</StatusBadge>
                </div>
                <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-500">{item.createdAt}</p>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
};

export default NotificationsPage;
