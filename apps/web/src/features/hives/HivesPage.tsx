import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import type { Hive } from "../../types";

const queenToneMap: Record<string, "success" | "warning" | "danger" | "info"> = {
  aktyvi: "success",
  "per žiemą": "info",
  keisti: "danger"
};

const HivesPage = () => {
  const {
    data: hives,
    isLoading,
    isError,
    error
  } = useQuery<Hive[]>({
    queryKey: ["hives"],
    queryFn: () => apiClient.get<Hive[]>("/hives"),
    staleTime: 60_000
  });

  if (isLoading && !hives) {
    return <Card title="Aviliai">Kraunama...</Card>;
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "Nepavyko gauti avilių duomenų.";
    return <Card title="Aviliai">{message}</Card>;
  }

  const hiveList = hives ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Avilių parkas</h1>
          <p className="mt-1 text-sm text-slate-400">
            Išmanūs sensoriai ir periodinės apžiūros leidžia užtikrinti sveikas šeimas.
          </p>
        </div>
        <StatusBadge tone="info">Atnaujinama kas 15 minučių</StatusBadge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hiveList.map((hive) => (
          <Card
            key={hive.id}
            title={`${hive.name}`}
            subtitle={`Paskutinė apžiūra ${hive.lastInspection}`}
            accent={<StatusBadge tone={queenToneMap[hive.queenStatus] ?? "warning"}>{hive.queenStatus}</StatusBadge>}
            className="space-y-4"
          >
            <dl className="grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Avilio ID</dt>
                <dd className="font-semibold text-slate-100">{hive.id}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Vieta</dt>
                <dd>{hive.location}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Produktyvumo indeksas</dt>
                <dd className="font-semibold text-brand-300">{hive.productivityIndex}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Temperatūra</dt>
                <dd>{hive.temperature.toFixed(1)}°C</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Drėgmė</dt>
                <dd>{hive.humidity}%</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HivesPage;
