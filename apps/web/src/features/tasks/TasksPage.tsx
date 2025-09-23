import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { Task } from "../../types";
import {
  DEFAULT_PRIORITY_OPTION,
  DEFAULT_STATUS_OPTION,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  getPriorityOptionByLabel,
  getStatusOptionByLabel,
  getStatusTone,
  resolveTaskPriority,
  resolveTaskStatus
} from "./taskOptions";

type TaskApiUser = {
  id: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  displayName?: string;
};

type TaskApiItem = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  statusLabel?: string;
  priority: number;
  priorityLabel?: string;
  hive: { id: string; name: string };
  assignedTo?: TaskApiUser | null;
  createdAt: string;
  updatedAt: string;
};

const filters = [
  { id: "visi", label: "Visos" },
  { id: "laukiama", label: "Laukiama" },
  { id: "vykdoma", label: "Vykdomos" },
  { id: "užbaigta", label: "Užbaigtos" },
  { id: "kritinė", label: "Kritinės" },
  { id: "atšaukta", label: "Atšauktos" }
] as const;

type FilterId = (typeof filters)[number]["id"];

const formatDisplayName = (user?: TaskApiUser | null): string => {
  if (!user) {
    return "Nepriskirta";
  }
  if (user.displayName && user.displayName.trim()) {
    return user.displayName;
  }
  const parts = [user.firstName, user.lastName].filter((part) => part && part.trim());
  if (parts.length) {
    return parts.join(" ");
  }
  return user.email;
};

const formatDueDate = (value: string | null): string => {
  if (!value) {
    return "Nenurodytas terminas";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Nenurodytas terminas";
  }
  return new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium" }).format(date);
};

const mapTaskResponse = (item: TaskApiItem): Task => ({
  id: item.id,
  title: item.title,
  assignedTo: formatDisplayName(item.assignedTo ?? null),
  dueDate: formatDueDate(item.dueDate ?? null),
  status: resolveTaskStatus(item.statusLabel, item.status),
  priority: resolveTaskPriority(item.priorityLabel, item.priority)
});

const TasksPage = () => {
  const [activeFilter, setActiveFilter] = useState<FilterId>("visi");
  const queryClient = useQueryClient();
  const {
    data: taskList,
    isLoading,
    isError,
    error
  } = useQuery<TaskApiItem[], Error, Task[]>({
    queryKey: ["tasks"],
    queryFn: () => apiClient.get<TaskApiItem[]>("/tasks"),
    staleTime: 30_000,
    select: (items) => items.map(mapTaskResponse)
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: (typeof DEFAULT_STATUS_OPTION)["status"] }) =>
      apiClient.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const priorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: number }) =>
      apiClient.put(`/tasks/${id}`, { priority }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
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
                <th className="px-4 py-3 text-left font-medium">Veiksmai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Kraunama...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-rose-300">
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
                      <StatusBadge
                        tone={
                          task.priority === "aukšta"
                            ? "danger"
                            : task.priority === "vidutinė"
                            ? "info"
                            : "neutral"
                        }
                      >
                        {task.priority.toUpperCase()}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={getStatusTone(task.status)}>{task.status.toUpperCase()}</StatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2 text-xs text-slate-300 sm:flex-row sm:items-center">
                        <label className="sr-only" htmlFor={`task-status-${task.id}`}>
                          Keisti {task.title} būseną
                        </label>
                        <select
                          id={`task-status-${task.id}`}
                          aria-label={`Keisti ${task.title} būseną`}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={(getStatusOptionByLabel(task.status) ?? DEFAULT_STATUS_OPTION).status}
                          onChange={(event) =>
                            statusMutation.mutate({ id: task.id, status: event.target.value as (typeof DEFAULT_STATUS_OPTION)["status"] })
                          }
                          disabled={statusMutation.isPending}
                        >
                          {TASK_STATUS_OPTIONS.map((option) => (
                            <option key={option.status} value={option.status}>
                              {option.displayLabel}
                            </option>
                          ))}
                        </select>
                        <label className="sr-only" htmlFor={`task-priority-${task.id}`}>
                          Keisti {task.title} prioritetą
                        </label>
                        <select
                          id={`task-priority-${task.id}`}
                          aria-label={`Keisti ${task.title} prioritetą`}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={(getPriorityOptionByLabel(task.priority) ?? DEFAULT_PRIORITY_OPTION).value}
                          onChange={(event) =>
                            priorityMutation.mutate({ id: task.id, priority: Number(event.target.value) })
                          }
                          disabled={priorityMutation.isPending}
                        >
                          {TASK_PRIORITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.displayLabel}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
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
