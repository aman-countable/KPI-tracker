"use client";

import type { TabId } from "../lib/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "advanced", label: "Advanced" },
];

type Props = {
  active: TabId;
  onChange: (id: TabId) => void;
};

export function TrackerNav({ active, onChange }: Props) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-black/10 pb-px">
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition ${
              on
                ? "bg-white text-[var(--color-ink)] shadow-sm"
                : "text-black/55 hover:bg-black/5 hover:text-black/80"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
