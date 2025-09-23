import { MetricTile } from "../../components/ui/MetricTile";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { BellAlertIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import type { DashboardStat, Notification, Task } from "../../types";

export type DashboardSnapshot = {
  stats: DashboardStat[];
  alerts: Notification[];
  tasks: Task[];
};

type DashboardApiStat = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendTone: "positive" | "negative" | "neutral" | "info";
};

type DashboardApiAlert = {
  id: string;
  title: string;
  description: string;
  type: string;
  createdAt: string;
};

type DashboardApiTask = {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: string;
  priority: string;
};

type DashboardApiSnapshot = {
  stats: DashboardApiStat[];
  alerts: DashboardApiAlert[];
  tasks: DashboardApiTask[];
};

const statusToneMap: Record<string, "success" | "warning" | "danger" | "info"> = {
  įspėjimas: "warning",
  informacija: "info",
  kritinis: "danger"
};

const trendToneToMetricTone: Record<"positive" | "negative" | "neutral", "positive" | "negative" | "neutral"> = {
  positive: "positive",
  negative: "negative",
  neutral: "neutral"
};

const normalizeKey = (value: string) =>
  value
    .toLocaleLowerCase("lt-LT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const TASK_STATUS_MAP: Record<string, Task["status"]> = {
  laukiama: "laukiama",
  vykdoma: "vykdoma",
  uzbaigta: "užbaigta",
  kritine: "kritinė",
  atsaukta: "atšaukta"
};

const TASK_PRIORITY_MAP: Record<string, Task["priority"]> = {
  zema: "žema",
  vidutine: "vidutinė",
  auksta: "aukšta"
};

const mapTrendTone = (tone: DashboardApiStat["trendTone"]): "positive" | "negative" | "neutral" => {
  if (tone === "positive" || tone === "negative") {
    return tone;
  }
  return "neutral";
};

const mapStat = (stat: DashboardApiStat): DashboardStat => ({
  id: stat.id,
  label: stat.label.trim(),
  value: stat.value.trim(),
  trend: stat.trend.trim(),
  trendTone: mapTrendTone(stat.trendTone)
});

const mapAlert = (alert: DashboardApiAlert): Notification => {
  const normalizedType = alert.type.toLocaleLowerCase("lt-LT");
  const type: Notification["type"] =
    normalizedType === "kritinis"
      ? "kritinis"
      : normalizedType === "įspėjimas"
      ? "įspėjimas"
      : "informacija";
  return {
    id: alert.id,
    title: alert.title,
    description: alert.description,
    type,
    createdAt: alert.createdAt
  };
};

const mapTask = (task: DashboardApiTask): Task => {
  const statusKey = normalizeKey(task.status);
  const priorityKey = normalizeKey(task.priority);
  return {
    id: task.id,
    title: task.title,
    assignedTo: task.assignedTo || "Nepriskirta",
    dueDate: task.dueDate || "Nenurodytas terminas",
    status: TASK_STATUS_MAP[statusKey] ?? "laukiama",
    priority: TASK_PRIORITY_MAP[priorityKey] ?? "vidutinė"
  };
};

const mapSnapshot = (payload: DashboardApiSnapshot): DashboardSnapshot => ({
  stats: payload.stats.map(mapStat),
  alerts: payload.alerts.map(mapAlert),
  tasks: payload.tasks.map(mapTask)
});

const DashboardPage = () => {
  const {
    data: snapshot,
    isLoading,
    isError,
    error
  } = useQuery<DashboardApiSnapshot, Error, DashboardSnapshot>({
    queryKey: ["dashboard", "snapshot"],
    queryFn: () => apiClient.get<DashboardApiSnapshot>("/dashboard"),
    staleTime: 30_000,
    select: mapSnapshot
  });

  if (isLoading && !snapshot) {
    return <Card title="Duomenys" subtitle="Įkeliame naujausią suvestinę">Kraunama...</Card>;
  }

  if (isError || !snapshot) {
    const message = error instanceof Error ? error.message : "Nepavyko įkelti suvestinės.";
    return (
      <Card title="Duomenys" subtitle="Įkeliame naujausią suvestinę">
        <p className="text-sm text-rose-300">{message}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.stats.map((stat) => (
          <MetricTile
            key={stat.id}
            label={stat.label}
            value={stat.value}
            trendLabel={stat.trend}
            trendTone={trendToneToMetricTone[stat.trendTone]}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Prioritetinės užduotys"
          subtitle="Greitas žvilgsnis į svarbiausius komandos darbus"
          accent={<span className="text-xs text-slate-400">Atnaujinta prieš 5 minutes</span>}
        >
          <ul className="space-y-4">
            {snapshot.tasks.map((task) => (
              <li key={task.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-900/60 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    <span className="font-medium">{task.assignedTo}</span> • terminas {task.dueDate}
                  </p>
                </div>
                <StatusBadge tone={task.status === "kritinė" ? "danger" : task.status === "vykdoma" ? "info" : "success"}>
                  {task.status.toUpperCase()}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Aktyvūs įspėjimai"
          subtitle="Automatiniai signalai pagal IoT jutiklius ir veiklos įrašus"
          accent={<BellAlertIcon className="h-6 w-6 text-amber-300" />}
        >
          <ul className="space-y-4">
            {snapshot.alerts.map((alert) => (
              <li key={alert.id} className="flex items-start gap-3 rounded-xl bg-slate-900/60 p-3">
                <StatusBadge tone={statusToneMap[alert.type] ?? "warning"}>
                  {alert.type.toUpperCase()}
                </StatusBadge>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{alert.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{alert.description}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">{alert.createdAt}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card
        title="Sistemos parengtis"
        subtitle="Išmanieji sensoriai, srautai ir komandinis darbas"
        accent={
          <span className="inline-flex items-center gap-2 text-xs text-emerald-300">
            <ClipboardDocumentCheckIcon className="h-4 w-4" />
            Visi 12 procesų aktyvūs
          </span>
        }
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-slate-200">IoT infrastruktūra</p>
            <p className="mt-2 text-xs text-slate-400">
              28 iš 30 jutiklių siunčia duomenis. Dvi stotelės veikia autonominiu režimu ir bus atnaujintos
              kartu su API integracija.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-slate-200">Operacijų automatika</p>
            <p className="mt-2 text-xs text-slate-400">
              Automatizuotos užduočių sekos fiksuoja avilių aptarnavimo žurnalus ir paruošia audito įrašus.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-slate-200">Komandos bendradarbiavimas</p>
            <p className="mt-2 text-xs text-slate-400">
              Tiesioginiai pranešimai, failų dalinimasis ir roles paremti leidimai leis komandai veikti greitai, kai
              backend'as bus paleistas.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
export type { DashboardApiSnapshot };
