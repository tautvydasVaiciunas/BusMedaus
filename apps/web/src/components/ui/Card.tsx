import { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  title?: string;
  subtitle?: string;
  accent?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Card = ({ title, subtitle, accent, children, className }: CardProps) => {
  return (
    <div className={clsx("rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/20", className)}>
      {(title || subtitle || accent) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-base font-semibold text-slate-50">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          {accent ? <div className="shrink-0 text-right text-sm text-slate-400">{accent}</div> : null}
        </div>
      )}
      <div className="text-slate-200">{children}</div>
    </div>
  );
};
