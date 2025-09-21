import { useCallback } from "react";
import { useMockQuery } from "../../hooks/useMockQuery";
import { mockService } from "../../mocks/mockService";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";

const MediaPage = () => {
  const query = useMockQuery("media", useCallback(() => mockService.getMediaLibrary(), []));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Medijos archyvas</h1>
          <p className="mt-1 text-sm text-slate-400">
            Užfiksuoti momentai iš avilių priežiūros, naudojami diagnostikai ir mokymams.
          </p>
        </div>
        <StatusBadge tone="info">Sinchronizuojama su debesimi</StatusBadge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {query.isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40"
              ></div>
            ))
          : (query.data ?? []).map((item) => (
              <Card
                key={item.id}
                title={`Avilys ${item.hiveId}`}
                subtitle={`${item.capturedAt} • ${item.author}`}
                accent={<StatusBadge tone="neutral">{item.tags.join(", ")}</StatusBadge>}
              >
                <div className="mt-4 overflow-hidden rounded-xl">
                  <img src={item.url} alt={item.id} className="h-52 w-full object-cover" />
                </div>
              </Card>
            ))}
      </div>
    </div>
  );
};

export default MediaPage;
