"use client";

import { Fragment } from "react";
import type { Cell, DrillRow, Kpi, Period, Snapshot } from "../lib/types";
import { formatValue, ragLabel } from "../lib/format";

type Props = {
  data: Snapshot;
  kpis: Kpi[];
  periods: Period[];
  onDrill: (kpi: Kpi, periodLabel: string, rows: DrillRow[]) => void;
  showYtd?: boolean;
};

/** The target a cumulative figure should be measured against, and its cadence.
 *
 * Atin asked to see progress toward the annual goals (200 firms / 800 users /
 * $1M / $1.8M / $500K), so the annual target is preferred. Rows that are only
 * ever scored per quarter or per month fall back to those, labelled, rather
 * than silently comparing a year of activity to a monthly number — which is
 * exactly how Total Users came to read 791% of target.
 */
function goalFor(kpi: Kpi): { value: number; cadence: string } | null {
  if (kpi.annual != null) return { value: kpi.annual, cadence: "yr" };
  if (kpi.quarterly != null) return { value: kpi.quarterly, cadence: "qtr" };
  if (kpi.monthly != null) return { value: kpi.monthly, cadence: "mo" };
  return null;
}

/** Remaining distance to the goal, signed by whether higher or lower is better. */
function gapTo(kpi: Kpi, actual: number | null, goal: number): number | null {
  if (actual == null) return null;
  return kpi.direction === "L" ? actual - goal : goal - actual;
}

function startedCells(kpi: Kpi, periods: Period[]): Cell[] {
  const started = new Set(periods.filter((p) => p.started).map((p) => p.id));
  return kpi.cells.filter((c) => started.has(c.period_id));
}

function RowSparkline({ kpi, periods }: { kpi: Kpi; periods: Period[] }) {
  const vals = startedCells(kpi, periods)
    .map((c) => c.actual)
    .filter((v): v is number => v != null);
  if (vals.length < 2) return <span className="text-[var(--color-muted)]/40">&mdash;</span>;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 52;
  const h = 16;
  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - 2 - ((v - min) / range) * (h - 4);
      return `${x},${y}`;
    })
    .join(" ");
  const rising = vals[vals.length - 1] >= vals[0];
  const better = kpi.direction === "L" ? !rising : rising;
  const color = better ? "var(--color-ok)" : "var(--color-rose)";
  const lastX = w;
  const lastY = h - 2 - ((vals[vals.length - 1] - min) / range) * (h - 4);
  return (
    <svg width={w} height={h} className="inline-block align-middle" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}

const ragColor = (rag: string | null | undefined) =>
  rag === "ok"
    ? "var(--color-ok)"
    : rag === "risk"
      ? "var(--color-amber)"
      : rag === "behind"
        ? "var(--color-rose)"
        : undefined;

export function MonthlyMatrix({ data, kpis, periods, onDrill, showYtd = true }: Props) {
  const byTeam = (() => {
    const map = new Map<string, Kpi[]>();
    for (const t of data.teams) map.set(t, []);
    for (const k of kpis) {
      if (!map.has(k.team)) map.set(k.team, []);
      map.get(k.team)!.push(k);
    }
    return [...map.entries()].filter(([, rows]) => rows.length > 0);
  })();

  const labelById = Object.fromEntries(periods.map((p) => [p.id, p.label]));
  const lastStarted = [...periods].reverse().find((p) => p.started)?.id;
  const trailingCols = showYtd ? 5 : 1;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--color-ink)] text-left text-xs text-white">
            <th className="sticky left-0 z-10 bg-[var(--color-ink)] px-4 py-3 font-medium min-w-[260px]">
              Metric
            </th>
            {periods.map((p) => (
              <th
                key={p.id}
                className={`px-3 py-3 text-center font-medium whitespace-nowrap ${
                  p.started ? "" : "text-white/40"
                }`}
              >
                {p.label}
              </th>
            ))}
            <th className="px-3 py-3 text-center font-medium border-l border-white/20">
              Trend
            </th>
            {showYtd && (
              <>
                <th className="px-3 py-3 text-center font-medium">FY to date</th>
                <th className="px-3 py-3 text-center font-medium">Target</th>
                <th className="px-3 py-3 text-center font-medium">% of Target</th>
                <th className="px-3 py-3 text-center font-medium">Gap</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {byTeam.map(([team, rows]) => (
            <Fragment key={team}>
              <tr>
                <td
                  colSpan={periods.length + trailingCols + 1}
                  className="bg-[var(--color-accent)]/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]"
                >
                  {team}
                </td>
              </tr>
              {rows.map((kpi) => {
                const goal = goalFor(kpi);
                const gap = goal ? gapTo(kpi, kpi.ytd, goal.value) : null;
                const pct = goal && kpi.ytd != null ? kpi.ytd / goal.value : null;
                const goalRag =
                  pct == null
                    ? null
                    : kpi.direction === "L"
                      ? pct <= 1
                        ? "ok"
                        : pct <= 1.25
                          ? "risk"
                          : "behind"
                      : pct >= 1
                        ? "ok"
                        : pct >= 0.5
                          ? "risk"
                          : "behind";
                return (
                  <tr
                    key={kpi.row_index}
                    className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-accent)]/[0.03]"
                  >
                    <td className="sticky left-0 z-[1] bg-[var(--color-surface)] px-4 py-2.5">
                      <div className="font-medium leading-snug text-[var(--color-ink)]">
                        {kpi.label}
                      </div>
                      {kpi.notes && (
                        <div className="mt-0.5 line-clamp-1 text-[11px] text-[var(--color-muted)]">
                          {kpi.notes}
                        </div>
                      )}
                    </td>

                    {periods.map((p) => {
                      const cell = kpi.cells.find((c) => c.period_id === p.id);
                      if (!cell) {
                        return (
                          <td
                            key={p.id}
                            className="px-2 py-2.5 text-center text-[var(--color-muted)]/40"
                          >
                            &mdash;
                          </td>
                        );
                      }
                      const clickable =
                        cell.has_drilldown && cell.actual != null && !!kpi.kpi_id;
                      const colour = ragColor(cell.rag);
                      return (
                        <td key={p.id} className="px-1 py-1.5 text-center">
                          <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => {
                              if (!kpi.kpi_id) return;
                              const plabel = labelById[p.id] || p.label;
                              const rawDrill = data.drilldowns[`${kpi.kpi_id}|${plabel}`] || [];
                              const filteredDrill = kpi.scope_owner_name
                                ? rawDrill.filter((r) => r.owner === kpi.scope_owner_name)
                                : rawDrill;
                              onDrill(kpi, plabel, filteredDrill);
                            }}
                            title={
                              cell.pct_achv != null
                                ? `${ragLabel(cell.rag)} · ${Math.round(cell.pct_achv * 100)}% of target${clickable ? " · click for records" : ""}`
                                : undefined
                            }
                            className={`mx-auto block rounded-md border-l-2 px-2 py-1 tabular-nums ${
                              clickable
                                ? "cursor-pointer hover:bg-black/[0.04] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)]"
                                : "cursor-default"
                            }`}
                            style={{
                              borderLeftColor: colour ?? "transparent",
                            }}
                          >
                            <span style={{ color: colour }} className="font-medium">
                              {formatValue(cell.actual, kpi.fmt)}
                            </span>
                            {cell.target != null && (
                              <span className="block text-[10px] tabular-nums text-[var(--color-muted)]/60">
                                / {formatValue(cell.target, kpi.fmt)}
                              </span>
                            )}
                            {p.id === lastStarted && cell.actual != null && (
                              <TrendMark kpi={kpi} periods={periods} />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    <td className="border-l border-[var(--color-border)]/30 px-3 py-2.5 text-center">
                      <RowSparkline kpi={kpi} periods={periods} />
                    </td>

                    {showYtd && (
                      <>
                        <td className="px-3 py-2.5 text-center font-semibold tabular-nums">
                          {formatValue(kpi.ytd, kpi.fmt)}
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-[var(--color-muted)]">
                          {goal ? (
                            <>
                              {formatValue(goal.value, kpi.fmt)}
                              <span className="ml-1 text-[10px] opacity-60">
                                /{goal.cadence}
                              </span>
                            </>
                          ) : (
                            <span className="opacity-40" title="No target — see the row's basis">
                              &mdash;
                            </span>
                          )}
                        </td>
                        <td
                          className="px-3 py-2.5 text-center font-semibold tabular-nums"
                          style={{ color: ragColor(goalRag) }}
                        >
                          {pct == null ? (
                            <span className="text-[var(--color-muted)]/40">&mdash;</span>
                          ) : (
                            `${Math.round(pct * 100)}%`
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">
                          {gap == null ? (
                            <span className="text-[var(--color-muted)]/40">&mdash;</span>
                          ) : gap <= 0 ? (
                            <span style={{ color: "var(--color-ok)" }}>met</span>
                          ) : (
                            <span className="text-[var(--color-muted)]">
                              {formatValue(gap, kpi.fmt)}
                            </span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendMark({ kpi, periods }: { kpi: Kpi; periods: Period[] }) {
  const vals = startedCells(kpi, periods)
    .map((c) => c.actual)
    .filter((v): v is number => v != null);
  if (vals.length < 2) return null;
  const prev = vals[vals.length - 2];
  const curr = vals[vals.length - 1];
  if (prev === 0) return null;
  const diff = (curr - prev) / Math.abs(prev);
  if (Math.abs(diff) < 0.05) {
    return <span className="block text-[10px] text-[var(--color-muted)]">&rarr;</span>;
  }
  const up = diff > 0;
  const good = kpi.direction === "L" ? !up : up;
  return (
    <span
      className="block text-[10px]"
      style={{ color: good ? "var(--color-ok)" : "var(--color-rose)" }}
    >
      {up ? "↑" : "↓"} {Math.abs(Math.round(diff * 100))}%
    </span>
  );
}
