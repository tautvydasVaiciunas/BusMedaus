import clsx from "clsx";
import type { ReactNode } from "react";

type MetricTileProps = {
  label: string;
  value: string;
  trendLabel?: string;
  trendTone?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  className?: string;
};

const trendClassMap: Record<NonNullable<MetricTileProps["trendTone"]>, string> = {
  positive: "text-emerald-300",
  negative: "text-rose-300",
  neutral: "text-slate-300"
};

export const MetricTile = ({ label, value, trendLabel, trendTone = "neutral", icon, className }: MetricTileProps) => (
  <div
    className={clsx(
      "flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-black/30",
      className
    )}
  >
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-400">{label}</span>
      {icon ? <span className="text-brand-300">{icon}</span> : null}
    </div>
    <div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      {trendLabel ? (
        <p className={clsx("mt-1 text-xs font-medium", trendClassMap[trendTone])}>{trendLabel}</p>
      ) : null}
    </div>
  </div>
);
