import { NavLink } from "react-router-dom";
import type { AppRoute } from "../../routes/routeConfig";
import clsx from "clsx";

type SidebarNavLinkProps = {
  item: AppRoute;
};

export const SidebarNavLink = ({ item }: SidebarNavLinkProps) => {
  return (
    <NavLink
      to={item.path ?? "/"}
      end={item.path === "/"}
      className={({ isActive }) =>
        clsx(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-slate-800/80 text-white shadow-inner shadow-black/40"
            : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
        )
      }
    >
      <item.icon className="h-5 w-5 text-slate-400 group-hover:text-brand-300" />
      <span>{item.label}</span>
    </NavLink>
  );
};
