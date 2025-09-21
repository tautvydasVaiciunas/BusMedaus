import { MagnifyingGlassIcon, BellAlertIcon } from "@heroicons/react/24/outline";

export const TopBar = () => {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4">
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
              <p className="font-semibold text-white">Aistė Petrauskaitė</p>
              <p className="text-xs text-slate-400">Vyriausioji bitininkė</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
