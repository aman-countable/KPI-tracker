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

export function MonthlyMatrix({
  data,
  kpis,
  periods,
  onDrill,
  showYtd = true,
}: Props) {
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
    <div className="overflow-x-auto rounded-xl border border-black/10 bg-white/80 shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--color-ink)] text-left text-xs text-white">
            <th className="sticky left-0 z-10 bg-[var(--color-ink)] px-3 py-2.5 font-medium">
              Metric
            </th>
            {periods.map((p) => (
              <th key={p.id} className="px-2 py-2.5 text-center font-medium whitespace-nowrap">
                {p.label}
              </th>
            ))}
            {showYtd ? (
              <th className="px-2 py-2.5 text-center font-medium">YTD</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {byTeam.map(([team, rows]) => (
            <Fragment key={team}>
              <tr>
                <td
                  colSpan={periods.length + (showYtd ? 2 : 1)}
                  className="bg-[var(--color-sea)]/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
                >
                  {team}
                </td>
              </tr>
              {rows.map((kpi) => (
                <tr key={kpi.row_index} className="border-t border-black/5 hover:bg-black/[0.02]">
                  <td className="sticky left-0 z-[1] max-w-[240px] bg-[var(--color-paper)] px-3 py-2">
                    <div className="font-medium leading-snug">{kpi.label}</div>
                    {kpi.notes ? (
                      <div className="mt-0.5 line-clamp-1 text-[11px] opacity-55">
                        {kpi.notes}
                      </div>
                    ) : null}
                  </td>
                  {periods.map((p) => {
                    const cell = kpi.cells.find((c) => c.period_id === p.id);
                    if (!cell) {
                      return (
                        <td key={p.id} className="px-2 py-2 text-center text-black/30">
                          —
                        </td>
                      );
                    }
                    const clickable =
                      cell.has_drilldown && cell.actual != null && !!kpi.kpi_id;
                    const rag = cell.rag;
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
                          className={`mx-auto block min-w-[4.5rem] rounded-md px-1.5 py-1 tabular-nums ${
                            clickable
                              ? "cursor-pointer underline decoration-dotted underline-offset-2 hover:bg-black/5"
                              : "cursor-default"
                          }`}
                          style={{
                            color:
                              rag === "ok"
                                ? "#1e8449"
                                : rag === "risk"
                                  ? "#b9770e"
                                  : rag === "behind"
                                    ? "#c0392b"
                                    : undefined,
                          }}
                          title={
                            cell.pct_achv != null
                              ? `${ragLabel(rag)} · ${Math.round(cell.pct_achv * 100)}% of target`
                              : undefined
                          }
                        >
                          {formatValue(cell.actual, kpi.fmt)}
                        </button>
                      </td>
                    );
                  })}
                  {showYtd ? (
                    <td className="px-2 py-2 text-center tabular-nums opacity-80">
                      {formatValue(kpi.ytd, kpi.fmt)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
