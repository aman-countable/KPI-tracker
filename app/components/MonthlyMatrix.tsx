"use client";

import { Fragment } from "react";
import type { DrillRow, Kpi, Period, Snapshot } from "../lib/types";
import { formatValue, ragLabel } from "../lib/format";

type Props = {
  data: Snapshot;
  kpis: Kpi[];
  periods: Period[];
  onDrill: (kpi: Kpi, periodLabel: string, rows: DrillRow[]) => void;
  showYtd?: boolean;
};

function TrendArrow({ cells, periodId, fmt }: { cells: { period_id: string; actual: number | null }[]; periodId: string; fmt: string }) {
  const idx = cells.findIndex((c) => c.period_id === periodId);
  if (idx <= 0) return null;
  const prev = cells[idx - 1]?.actual;
  const curr = cells[idx]?.actual;
  if (prev == null || curr == null || prev === 0) return null;
  const diff = (curr - prev) / Math.abs(prev);
  if (Math.abs(diff) < 0.05) return <span className="text-[var(--color-muted)] ml-0.5">&rarr;</span>;
  if (diff > 0) return <span className="text-[var(--color-ok)] ml-0.5">&uarr;</span>;
  return <span className="text-[var(--color-rose)] ml-0.5">&darr;</span>;
}

function Sparkline({ cells, periodId }: { cells: { period_id: string; actual: number | null }[]; periodId: string }) {
  const idx = cells.findIndex((c) => c.period_id === periodId);
  if (idx < 0) return null;
  // Take last 5 periods up to and including current
  const start = Math.max(0, idx - 4);
  const slice = cells.slice(start, idx + 1);
  const vals = slice.map((c) => c.actual).filter((v): v is number => v != null);
  if (vals.length < 2) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 32;
  const h = 12;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x},${y}`;
  }).join(" ");
  const lastVal = vals[vals.length - 1];
  const firstVal = vals[0];
  const color = lastVal >= firstVal ? "var(--color-ok)" : "var(--color-rose)";
  return (
    <svg width={w} height={h} className="inline-block ml-1.5 opacity-50">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MonthlyMatrix({ data, kpis, periods, onDrill, showYtd = true }: Props) {
  const byTeam = (() => {
    const order = data.teams;
    const map = new Map<string, Kpi[]>();
    for (const t of order) map.set(t, []);
    for (const k of kpis) {
      if (!map.has(k.team)) map.set(k.team, []);
      map.get(k.team)!.push(k);
    }
    return [...map.entries()].filter(([, rows]) => rows.length > 0);
  })();

  const labelById = Object.fromEntries(periods.map((p) => [p.id, p.label]));

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--color-ink)] text-left text-xs text-white">
            <th className="sticky left-0 z-10 bg-[var(--color-ink)] px-4 py-3 font-medium min-w-[260px]">
              Metric
            </th>
            {periods.map((p) => (
              <th key={p.id} className="px-3 py-3 text-center font-medium whitespace-nowrap">
                {p.label}
              </th>
            ))}
            {showYtd && <th className="px-3 py-3 text-center font-medium border-l border-white/20">YTD</th>}
          </tr>
        </thead>
        <tbody>
          {byTeam.map(([team, rows]) => (
            <Fragment key={team}>
              <tr>
                <td
                  colSpan={periods.length + (showYtd ? 2 : 1)}
                  className="bg-[var(--color-sea)]/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-sea)]"
                >
                  {team}
                </td>
              </tr>
              {rows.map((kpi) => (
                <tr key={kpi.row_index} className="border-t border-[var(--color-border)] hover:bg-[var(--color-sea)]/[0.02] transition-colors">
                  <td className="sticky left-0 z-[1] bg-[var(--color-surface)] px-4 py-2.5">
                    <div className="font-medium leading-snug text-[var(--color-ink)]">{kpi.label}</div>
                    {kpi.notes && (
                      <div className="mt-0.5 line-clamp-1 text-[11px] text-[var(--color-muted)]">{kpi.notes}</div>
                    )}
                  </td>
                  {periods.map((p) => {
                    const cell = kpi.cells.find((c) => c.period_id === p.id);
                    if (!cell) {
                      return <td key={p.id} className="px-2 py-2.5 text-center text-[var(--color-muted)]/40">&mdash;</td>;
                    }
                    const clickable = cell.has_drilldown && cell.actual != null && !!kpi.kpi_id;
                    const rag = cell.rag;
                    const ragColor = rag === "ok" ? "var(--color-ok)" : rag === "risk" ? "var(--color-amber)" : rag === "behind" ? "var(--color-rose)" : undefined;
                    return (
                      <td key={p.id} className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          disabled={!clickable}
                          onClick={() => {
                            if (!kpi.kpi_id) return;
                            const plabel = labelById[p.id] || p.label;
                            const key = `${kpi.kpi_id}|${plabel}`;
                            onDrill(kpi, plabel, data.drilldowns[key] || []);
                          }}
                          className={`mx-auto block rounded-lg px-2 py-1.5 tabular-nums ${
                            clickable
                              ? "cursor-pointer hover:bg-black/5 transition"
                              : "cursor-default"
                          }`}
                          title={cell.pct_achv != null ? `${ragLabel(rag)} · ${Math.round(cell.pct_achv * 100)}% of target` : undefined}
                        >
                          <span style={{ color: ragColor }} className="font-medium">
                            {formatValue(cell.actual, kpi.fmt)}
                          </span>
                          {/* Target text */}
                          {cell.target != null && (
                            <span className="block text-[10px] text-[var(--color-muted)]/50 tabular-nums">
                              / {formatValue(cell.target, kpi.fmt)}
                            </span>
                          )}
                        </button>
                        <div className="flex items-center justify-center">
                          <Sparkline cells={kpi.cells} periodId={p.id} />
                          <TrendArrow cells={kpi.cells} periodId={p.id} fmt={kpi.fmt} />
                        </div>
                      </td>
                    );
                  })}
                  {showYtd && (
                    <td className="px-3 py-2.5 text-center tabular-nums font-semibold border-l border-[var(--color-border)]/30">
                      {formatValue(kpi.ytd, kpi.fmt)}
                    </td>
                  )}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
