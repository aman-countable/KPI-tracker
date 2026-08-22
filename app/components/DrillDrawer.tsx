"use client";

import { useMemo, useState } from "react";
import type { DrillRow, DrillSummary } from "../lib/types";
import { formatValue } from "../lib/format";

type Props = {
  kpiLabel: string;
  periodLabel: string;
  rows: DrillRow[];
  summary?: DrillSummary;
  onClose: () => void;
};

type SortKey = "name" | "owner" | "channel" | "amount" | "weighted" | "priority";

export function DrillDrawer({ kpiLabel, periodLabel, rows, summary, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  const dealSources = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.deal_source) s.add(r.deal_source);
    return [...s].sort();
  }, [rows]);

  const priorities = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.priority && r.priority !== "Unassigned") s.add(r.priority);
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (channel !== "all" && r.deal_source !== channel) return false;
      if (priority !== "all" && r.priority !== priority) return false;
      if (query) {
        const q = query.toLowerCase();          const blob = `${r.name} ${r.owner} ${r.deal_source} ${r.stage} ${r.sub_owner || ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va: number | string, vb: number | string;
        switch (sortKey) {
          case "amount": va = a.amount ?? 0; vb = b.amount ?? 0; break;
          case "weighted": va = a.weighted ?? 0; vb = b.weighted ?? 0; break;
          case "priority": {
            const order: Record<string, number> = { High: 0, Medium: 1, Low: 2, Unassigned: 3 };
            va = order[a.priority ?? "Unassigned"] ?? 3;
            vb = order[b.priority ?? "Unassigned"] ?? 3;
            break;
          }
          default: va = String((a as Record<string, unknown>)[sortKey] ?? ""); vb = String((b as Record<string, unknown>)[sortKey] ?? "");
        }
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [rows, channel, priority, query, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) { setSortAsc(!sortAsc); }
    else { setSortKey(key); setSortAsc(false); }
  }

  const totalAmount = summary?.total_amount ?? filtered.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalWeighted = summary?.total_weighted ?? filtered.reduce((s, r) => s + (r.weighted ?? 0), 0);
  const byDealSource = summary?.by_deal_source ?? {};

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " \u2191" : " \u2193") : "";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-5xl flex-col bg-[var(--color-surface)] shadow-2xl animate-[slideIn_0.2s_ease-out]">
        <header className="shrink-0 border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">Drill-down</p>
              <h2 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{kpiLabel}</h2>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">{periodLabel}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-mist)] transition">Close</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold tabular-nums">{filtered.length.toLocaleString()}</span>
            <span className="text-[var(--color-muted)]">records</span>
            {totalAmount > 0 && (<><span className="text-[var(--color-border)]">|</span><span className="text-[var(--color-muted)]">Total:</span><span className="font-semibold tabular-nums">{formatValue(totalAmount, "usd")}</span></>)}
            {totalWeighted > 0 && (<><span className="text-[var(--color-border)]">|</span><span className="text-[var(--color-muted)]">Weighted:</span><span className="font-semibold tabular-nums">{formatValue(totalWeighted, "usd")}</span></>)}
          </div>
          {Object.keys(byDealSource).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(byDealSource).sort((a, b) => b[1] - a[1]).map(([src, count]) => (
                <span key={src} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-sea)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-sea)]">
                  {src} <span className="tabular-nums opacity-70">{count}</span>
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search firm / owner / source..." className="min-w-[12rem] flex-1 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-sea)] focus:ring-1 focus:ring-[var(--color-sea)]/30 transition" />
            {dealSources.length > 0 && (<select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"><option value="all">All sources</option>{dealSources.map((c) => (<option key={c} value={c}>{c}</option>))}</select>)}
            {priorities.length > 0 && (<select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"><option value="all">All priorities</option>{priorities.map((p) => (<option key={p} value={p}>{p}</option>))}</select>)}
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (<div className="px-6 py-12 text-center text-sm text-[var(--color-muted)]">No records match your filters.</div>) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--color-mist)]">
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  <th className="px-6 py-3 min-w-[220px]">Deal / Firm</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Sub-owner</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="cursor-pointer select-none px-4 py-3 text-right hover:text-[var(--color-ink)]" onClick={() => toggleSort("amount")}>Amount{sortArrow("amount")}</th>
                  <th className="cursor-pointer select-none px-4 py-3 text-right hover:text-[var(--color-ink)]" onClick={() => toggleSort("weighted")}>Weighted{sortArrow("weighted")}</th>
                  <th className="cursor-pointer select-none px-4 py-3 text-center hover:text-[var(--color-ink)]" onClick={() => toggleSort("priority")}>Priority{sortArrow("priority")}</th>
                  <th className="px-4 py-3 text-center w-12">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((r, i) => (
                  <tr key={`${r.name}-${i}`} className="hover:bg-[var(--color-sea)]/[0.03] transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-medium text-[var(--color-ink)] truncate max-w-[300px]">{r.name || "\u2014"}</div>
                      {r.next_action && (<div className="mt-0.5 text-xs text-[var(--color-muted)] truncate max-w-[300px]" title={`Next: ${r.next_action}`}>{"\u2192"} {r.next_action}</div>)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)] whitespace-nowrap">{r.stage || "\u2014"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.owner || "\u2014"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-muted)]">{r.sub_owner || "\u2014"}</td>
                    <td className="px-4 py-3">{r.channel ? (<span className="inline-block rounded-full bg-[var(--color-sea)]/8 px-2 py-0.5 text-xs font-medium text-[var(--color-sea)]">{r.channel}</span>) : "\u2014"}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap">{r.amount != null ? formatValue(r.amount, "usd") : "\u2014"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--color-muted)] whitespace-nowrap">{r.weighted != null ? formatValue(r.weighted, "usd") : "\u2014"}</td>
                    <td className="px-4 py-3 text-center">{r.priority && r.priority !== "Unassigned" ? (<span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${r.priority === "High" ? "bg-[var(--color-rose)]/10 text-[var(--color-rose)]" : r.priority === "Medium" ? "bg-[var(--color-amber)]/10 text-[var(--color-amber)]" : "bg-gray-100 text-gray-500"}`}>{r.priority}</span>) : "\u2014"}</td>
                    <td className="px-4 py-3 text-center">{r.hubspot_url ? (<a href={r.hubspot_url} target="_blank" rel="noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-sea)] opacity-60 hover:opacity-100 hover:bg-[var(--color-sea)]/10 transition" title="Open in HubSpot"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg></a>) : "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </aside>
    </div>
  );
}
