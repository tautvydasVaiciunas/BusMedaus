import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { Task } from "../../types";

const filters = [
  { id: "visi", label: "Visos" },
  { id: "laukiama", label: "Laukiama" },
  { id: "vykdoma", label: "Vykdomos" },
  { id: "užbaigta", label: "Užbaigtos" },
  { id: "kritinė", label: "Kritinės" }
] as const;

type FilterId = (typeof filters)[number]["id"];

const statusTone: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  laukiama: "warning",
  vykdoma: "info",
  užbaigta: "success",
  kritinė: "danger"
};

const TasksPage = () => {
  const [activeFilter, setActiveFilter] = useState<FilterId>("visi");
  const {
    data: taskList,
    isLoading,
    isError,
    error
  } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => apiClient.get<Task[]>("/tasks"),
    staleTime: 30_000
  });

  const tasks = useMemo(() => {
    const items = taskList ?? [];
    if (activeFilter === "visi") return items;
    return items.filter((task) => task.status === activeFilter);
  }, [activeFilter, taskList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Darbo srautas</h1>
          <p className="mt-1 text-sm text-slate-400">Automatizuotas paskyrų ir patvirtinimų sekimas.</p>
        </div>
        <div className="flex gap-2 rounded-full border border-slate-800 bg-slate-900/60 p-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                activeFilter === filter.id
                  ? "bg-brand-500 text-slate-900 shadow"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <Card
        title="Užduočių sąrašas"
        subtitle="Kai API bus aktyvus, čia matysite realaus laiko progresą ir komentarus"
      >
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Užduotis</th>
                <th className="px-4 py-3 text-left font-medium">Priskirta</th>
                <th className="px-4 py-3 text-left font-medium">Terminas</th>
                <th className="px-4 py-3 text-left font-medium">Prioritetas</th>
                <th className="px-4 py-3 text-left font-medium">Būsena</th>
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
                    {error instanceof Error ? error.message : "Nepavyko įkelti užduočių."}
                  </td>
                </tr>
              ) : tasks.length ? (
                tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-4 py-4 font-semibold text-slate-100">{task.title}</td>
                    <td className="px-4 py-4 text-slate-300">{task.assignedTo}</td>
                    <td className="px-4 py-4 text-slate-400">{task.dueDate}</td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={task.priority === "aukšta" ? "danger" : task.priority === "vidutinė" ? "info" : "neutral"}>
                        {task.priority.toUpperCase()}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={statusTone[task.status] ?? "neutral"}>{task.status.toUpperCase()}</StatusBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Pagal pasirinktą filtrą užduočių nerasta.
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

export default TasksPage;
