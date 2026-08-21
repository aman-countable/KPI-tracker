"use client";

import { useMemo, useState } from "react";
import type { DrillRow } from "../lib/types";
import { formatValue } from "../lib/format";

type Props = {
  kpiLabel: string;
  periodLabel: string;
  rows: DrillRow[];
  onClose: () => void;
};

export function DrillDrawer({ kpiLabel, periodLabel, rows, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortAmt, setSortAmt] = useState(false);

  const channels = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.channel) s.add(r.channel);
    return [...s].sort();
  }, [rows]);

  const priorities = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.priority) s.add(r.priority);
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (channel !== "all" && r.channel !== channel) return false;
      if (priority !== "all" && r.priority !== priority) return false;
      if (query) {
        const q = query.toLowerCase();
        const blob = `${r.name} ${r.owner} ${r.deal_source} ${r.stage} ${r.channel || ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
    if (sortAmt) {
      list = [...list].sort(
        (a, b) => (b.weighted ?? b.amount ?? 0) - (a.weighted ?? a.amount ?? 0),
      );
    }
    return list;
  }, [rows, channel, priority, query, sortAmt]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-[var(--color-paper)] shadow-2xl animate-[slideIn_0.25s_ease-out]">
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
              <p className="mt-1 text-sm opacity-70">
                {filtered.length}
                {filtered.length !== rows.length ? ` / ${rows.length}` : ""}{" "}
                records
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm opacity-70 hover:bg-black/5"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search firm / owner / source…"
              className="min-w-[10rem] flex-1 rounded-md border border-black/15 bg-white px-2 py-1.5 text-xs"
            />
            {channels.length > 0 ? (
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-xs"
              >
                <option value="all">All channels</option>
                {channels.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : null}
            {priorities.length > 0 ? (
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-xs"
              >
                <option value="all">All priorities</option>
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              onClick={() => setSortAmt((v) => !v)}
              className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-xs"
            >
              {sortAmt ? "Sorted by $" : "Sort by $"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-5 py-4">
          {filtered.length === 0 ? (
            <p className="text-sm opacity-70">
              No deal-level backup rows for this filter. The Actual may come from
              a stock metric or a source without a per-deal list yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((r, i) => (
                <li
                  key={`${r.name}-${i}`}
                  className="rounded-lg border border-black/8 bg-white/90 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium leading-snug">
                        {r.name || "—"}
                      </div>
                      <div className="mt-1 text-xs opacity-65">
                        {[r.owner, r.channel || r.deal_source, r.stage, r.priority]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      {r.next_action ? (
                        <div className="mt-1 text-xs text-[var(--color-sea)]">
                          Next: {r.next_action}
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      {r.amount != null ? (
                        <div className="font-semibold tabular-nums">
                          {formatValue(r.amount, "usd")}
                        </div>
                      ) : null}
                      {r.weighted != null ? (
                        <div className="text-xs opacity-60 tabular-nums">
                          wtd {formatValue(r.weighted, "usd")}
                        </div>
                      ) : null}
                    </div>
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
