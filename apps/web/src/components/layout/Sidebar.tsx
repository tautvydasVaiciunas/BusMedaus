import { SparklesIcon } from "@heroicons/react/24/outline";
import { appRoutes } from "../../routes/routeConfig";
import { SidebarNavLink } from "./SidebarNavLink";
import { StatusBadge } from "../ui/StatusBadge";

type SidebarContentProps = {
  onNavigate?: () => void;
};

export const Sidebar = () => {
  return (
    <aside className="hidden w-72 border-r border-slate-800 bg-slate-950/90 px-6 py-8 lg:flex lg:flex-col">
      <SidebarContent />
    </aside>
  );
};

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-amber-500 text-lg font-semibold text-slate-900 shadow-lg shadow-amber-500/30">
          BM
        </span>
        <div>
          <p className="text-sm font-semibold text-white">BusMedaus Console</p>
          <p className="text-xs text-slate-400">Bitininkystės valdymo platforma</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <SparklesIcon className="h-5 w-5" />
        Naujos realaus laiko analizės bus prieinamos su API integracija.
      </div>

      <nav className="flex-1 space-y-1" aria-label="Pagrindinė navigacija">
        {appRoutes.map((route) => (
          <SidebarNavLink key={route.id} item={route} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
        <p className="mb-3 text-sm font-semibold text-slate-200">Planų limitai</p>
        <ul className="space-y-2">
          <li className="flex items-center justify-between">
            <span>Aviliai</span>
            <StatusBadge tone="info">24 / 40</StatusBadge>
          </li>
          <li className="flex items-center justify-between">
            <span>Komandos nariai</span>
            <StatusBadge tone="success">12 / 15</StatusBadge>
          </li>
          <li className="flex items-center justify-between">
            <span>Debesies saugykla</span>
            <StatusBadge tone="warning">78% naudojama</StatusBadge>
          </li>
        </ul>
      </div>
    </>
  );
};
