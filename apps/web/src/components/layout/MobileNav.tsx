import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { SidebarContent } from "./Sidebar";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  menuId: string;
};

export const MobileNav = ({ isOpen, onClose, menuId }: MobileNavProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `${menuId}-title`;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousFocusedElement = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    if (panel) {
      const focusable = getFocusableElements(panel);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        panel.focus({ preventScroll: true });
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(panelRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const isShiftPressed = event.shiftKey;
      const activeElement = document.activeElement as HTMLElement | null;

      if (isShiftPressed) {
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusedElement?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      <div
        className="fixed inset-0 bg-slate-950/80"
        aria-hidden="true"
        onClick={onClose}
        role="presentation"
      />
      <div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative ml-auto flex h-full w-80 max-w-[calc(100%-3rem)] flex-col border-l border-slate-800 bg-slate-950 shadow-xl focus:outline-none"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p id={titleId} className="text-sm font-semibold text-white">
              Navigacija
            </p>
            <p className="text-xs text-slate-400">Pasirinkite sekciją</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-800 bg-slate-900/70 p-2 text-slate-300 transition hover:border-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Uždaryti meniu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex h-full flex-col overflow-y-auto px-6 pb-6">
          <SidebarContent onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
};

const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
};

