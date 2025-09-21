import type { ReactNode } from "react";
import clsx from "clsx";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
};

const toneMap: Record<StatusTone, string> = {
  success: "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/30",
  danger: "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/30",
  info: "bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-500/30",
  neutral: "bg-slate-500/10 text-slate-300 ring-1 ring-inset ring-slate-500/30"
};

export const StatusBadge = ({ tone = "neutral", children, className }: StatusBadgeProps) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      toneMap[tone],
      className
    )}
  >
    {children}
  </span>
);
