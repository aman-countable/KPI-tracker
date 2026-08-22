"use client";

import type { TabId } from "../lib/types";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "\u25C9" },
  { id: "monthly", label: "Monthly", icon: "\u25A4" },
  { id: "quarterly", label: "Quarterly", icon: "\u25A3" },
  { id: "advanced", label: "Advanced", icon: "\u2699" },
];

type Props = {
  active: TabId;
  onChange: (id: TabId) => void;
};

export function TrackerNav({ active, onChange }: Props) {
  return (
    <nav className="flex gap-1 rounded-xl bg-[var(--color-mist)] p-1">
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              on
                ? "bg-white text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/50"
            }`}
          >
            <span className="text-xs opacity-60">{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
