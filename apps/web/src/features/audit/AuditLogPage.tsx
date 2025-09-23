import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import type { AuditLogEntry } from "../../types";

const severityTone: Record<string, "success" | "warning" | "danger" | "info"> = {
  žemas: "info",
  vidutinis: "warning",
  aukštas: "danger"
};

const AuditLogPage = () => {
  const {
    data: entries,
    isLoading,
    isError,
    error
  } = useQuery<AuditLogEntry[]>({
    queryKey: ["audit", "log"],
    queryFn: () => apiClient.get<AuditLogEntry[]>("/audit"),
    staleTime: 45_000
  });

  const auditEntries = entries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Audito žurnalas</h1>
          <p className="mt-1 text-sm text-slate-400">
            Kiekvienas statuso pakeitimas, leidimų korekcija ar kritinis įvykis bus įrašytas čia.
          </p>
        </div>
        <StatusBadge tone="info">Sinchronizuojama kas 5 min.</StatusBadge>
      </div>

      <Card
        title="Paskutiniai įrašai"
        subtitle="Duomenys kol kas imituojami, bet struktūra atitinka planuojamą API atsaką"
      >
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Vartotojas</th>
                <th className="px-4 py-3 text-left font-medium">Veiksmas</th>
                <th className="px-4 py-3 text-left font-medium">Objektas</th>
                <th className="px-4 py-3 text-left font-medium">Kritinumas</th>
                <th className="px-4 py-3 text-left font-medium">Laikas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Kraunama...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-rose-300">
                    {error instanceof Error ? error.message : "Nepavyko įkelti audito žurnalo."}
                  </td>
                </tr>
              ) : auditEntries.length ? (
                auditEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-4 font-semibold text-slate-100">{entry.actor}</td>
                    <td className="px-4 py-4 text-slate-300">{entry.action}</td>
                    <td className="px-4 py-4 text-slate-300">{entry.entity}</td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={severityTone[entry.severity] ?? "neutral"}>
                        {entry.severity.toUpperCase()}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{entry.createdAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Audito įrašų nėra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AuditLogPage;
