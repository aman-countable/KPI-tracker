"use client";

import type { DrillRow } from "../lib/types";
import { formatValue } from "../lib/format";

type Props = {
  kpiLabel: string;
  periodLabel: string;
  rows: DrillRow[];
  onClose: () => void;
};

export function DrillDrawer({ kpiLabel, periodLabel, rows, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-xl flex-col bg-[var(--color-paper)] shadow-2xl animate-[slideIn_0.25s_ease-out]"
      >
        <header className="border-b border-black/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-60">
                Drill-down · {periodLabel}
              </p>
              <h2
                className="mt-1 text-xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {kpiLabel}
              </h2>
              <p className="mt-1 text-sm opacity-70">{rows.length} records</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm opacity-70 hover:bg-black/5"
            >
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-5 py-4">
          {rows.length === 0 ? (
            <p className="text-sm opacity-70">
              No deal-level backup rows for this cell. The Actual may come from a
              stock metric or a source without a per-deal list yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map((r, i) => (
                <li
                  key={`${r.name}-${i}`}
                  className="rounded-lg border border-black/8 bg-white/90 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium leading-snug">{r.name || "—"}</div>
                      <div className="mt-1 text-xs opacity-65">
                        {[r.owner, r.deal_source, r.stage].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {r.amount != null && (
                      <div className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatValue(r.amount, "usd")}
                      </div>
                    )}
                  </div>
                  {r.hubspot_url ? (
                    <a
                      href={r.hubspot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-medium"
                      style={{ color: "var(--color-sea)" }}
                    >
                      Open in HubSpot →
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
