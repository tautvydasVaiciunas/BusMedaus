import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

const MOBILE_NAV_ID = "mobile-navigation";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleToggleMobileNav = () => {
    setIsMobileNavOpen((previous) => !previous);
  };

  const handleCloseMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar
          isMobileNavOpen={isMobileNavOpen}
          onToggleMobileNav={handleToggleMobileNav}
          mobileNavId={MOBILE_NAV_ID}
        />
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 lg:p-10">
          <div className="mx-auto max-w-7xl space-y-8">{children}</div>
        </main>
      </div>
      <MobileNav isOpen={isMobileNavOpen} onClose={handleCloseMobileNav} menuId={MOBILE_NAV_ID} />
    </div>
  );
};
