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

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const formatInspectionSubtitle = (isoDate: string | null | undefined) => {
  if (!isoDate) {
    return "Paskutinė apžiūra nenurodyta";
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Paskutinė apžiūra nenurodyta";
  }

  return `Paskutinė apžiūra ${parsed.toLocaleString("lt-LT", {
    dateStyle: "short",
    timeStyle: "short"
  })}`;
};

const formatLocation = (value: string | null | undefined) => {
  if (!value) {
    return "Vieta nenustatyta";
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : "Vieta nenustatyta";
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
        {hiveList.map((hive) => {
          const telemetry = hive.telemetry;
          const queenStatusRaw = typeof telemetry.queenStatus === "string" ? telemetry.queenStatus.trim() : "";
          const queenStatusToneKey = queenStatusRaw.toLowerCase();
          const queenStatusTone = queenToneMap[queenStatusToneKey] ?? "warning";
          const queenStatusLabel = queenStatusRaw || "Nežinomas statusas";
          const locationText = formatLocation(telemetry.location);
          const productivityText = isFiniteNumber(telemetry.productivityIndex)
            ? telemetry.productivityIndex.toFixed(1)
            : "Nėra duomenų";
          const temperatureText = isFiniteNumber(telemetry.temperature)
            ? `${telemetry.temperature.toFixed(1)}°C`
            : "Nėra duomenų";
          const humidityText = isFiniteNumber(telemetry.humidity)
            ? `${Math.round(telemetry.humidity)}%`
            : "Nėra duomenų";
          const subtitle = formatInspectionSubtitle(telemetry.lastInspectionAt);

          return (
            <Card
              key={hive.id}
              title={`${hive.name}`}
              subtitle={subtitle}
              accent={<StatusBadge tone={queenStatusTone}>{queenStatusLabel}</StatusBadge>}
              className="space-y-4"
            >
              <dl className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Avilio ID</dt>
                  <dd className="font-semibold text-slate-100">{hive.id}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Vieta</dt>
                  <dd>{locationText}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Produktyvumo indeksas</dt>
                  <dd className="font-semibold text-brand-300">{productivityText}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Temperatūra</dt>
                  <dd>{temperatureText}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Drėgmė</dt>
                  <dd>{humidityText}</dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HivesPage;
