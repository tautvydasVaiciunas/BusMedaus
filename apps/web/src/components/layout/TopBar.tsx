import { MagnifyingGlassIcon, BellAlertIcon, ArrowRightOnRectangleIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useAuth } from "../../hooks/useAuth";

type TopBarProps = {
  isMobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  mobileNavId: string;
};

export const TopBar = ({ isMobileNavOpen, onToggleMobileNav, mobileNavId }: TopBarProps) => {
  const { user, logout, isProcessing } = useAuth();
  const displayName = user?.name ?? "BusMedaus narys";
  const displayRole = user?.role ?? user?.email ?? "Komandos narys";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-controls={mobileNavId}
            aria-expanded={isMobileNavOpen}
            aria-haspopup="dialog"
            aria-label="Perjungti navigaciją"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-200 transition hover:border-brand-500/60 hover:text-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="hidden flex-col lg:flex">
            <span className="text-xs uppercase tracking-wide text-slate-400">Sveiki sugrįžę</span>
            <span className="text-lg font-semibold text-white">BusMedaus valdymo centras</span>
          </div>
          <div className="relative hidden items-center lg:flex">
            <MagnifyingGlassIcon className="absolute left-3 h-5 w-5 text-slate-500" />
            <input
              className="w-64 rounded-full border border-slate-800 bg-slate-900/60 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              placeholder="Greita paieška (avilių ID, nariai, užduotys)"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-full border border-slate-800 bg-slate-900/70 p-2 text-slate-200 transition hover:border-brand-500/60 hover:text-brand-200"
          >
            <BellAlertIcon className="h-5 w-5" />
            <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-rose-400"></span>
          </button>
          <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5">
            <img
              src="https://avatars.dicebear.com/api/initials/BM.svg"
              alt="Profilio nuotrauka"
              className="h-8 w-8 rounded-full border border-slate-700"
            />
            <div className="hidden text-left text-sm leading-tight sm:block">
              <p className="font-semibold text-white">{displayName}</p>
              <p className="text-xs text-slate-400">{displayRole}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={isProcessing}
            className="hidden rounded-full border border-slate-800 bg-slate-900/70 p-2 text-slate-300 transition hover:border-rose-500/60 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
            aria-label="Atsijungti"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
