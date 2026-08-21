"use client";

import { Fragment, useMemo, useState } from "react";
import type { DrillRow, Kpi, Snapshot } from "../lib/types";
import { formatValue, ragLabel } from "../lib/format";
import { DrillDrawer } from "./DrillDrawer";

type Props = { data: Snapshot };

export function TrackerApp({ data }: Props) {
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [ragFilter, setRagFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<{
    kpi: Kpi;
    periodLabel: string;
    rows: DrillRow[];
  } | null>(null);

  const startedPeriods = useMemo(
    () => data.periods.filter((p) => p.started),
    [data.periods],
  );

  const visibleKpis = useMemo(() => {
    return data.kpis.filter((k) => {
      if (teamFilter !== "all" && k.team !== teamFilter) return false;
      if (query && !k.label.toLowerCase().includes(query.toLowerCase())) return false;
      if (ragFilter !== "all") {
        const hit = k.cells.some(
          (c) =>
            startedPeriods.some((p) => p.id === c.period_id) && c.rag === ragFilter,
        );
        if (!hit) return false;
      }
      return true;
    });
  }, [data.kpis, teamFilter, ragFilter, query, startedPeriods]);

  const byTeam = useMemo(() => {
    const order = data.teams;
    const map = new Map<string, Kpi[]>();
    for (const t of order) map.set(t, []);
    for (const k of visibleKpis) {
      if (!map.has(k.team)) map.set(k.team, []);
      map.get(k.team)!.push(k);
    }
    return [...map.entries()].filter(([, rows]) => rows.length > 0);
  }, [visibleKpis, data.teams]);

  function openDrill(kpi: Kpi, periodLabel: string) {
    if (!kpi.kpi_id) return;
    const key = `${kpi.kpi_id}|${periodLabel}`;
    const rows = data.drilldowns[key] || [];
    setDrawer({ kpi, periodLabel, rows });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-8">
        <p
          className="text-sm font-medium tracking-wide"
          style={{ color: "var(--color-sea)" }}
        >
          Countable · Sales
        </p>
        <h1
          className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {data.title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed opacity-80">
          {data.blurb}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs opacity-70">
          <span>{data.fy}</span>
          <span aria-hidden>·</span>
          <span>{data.rag_rule}</span>
          <span aria-hidden>·</span>
          <span>{data.visible_count} metrics</span>
          <span aria-hidden>·</span>
          <span>Refreshed {data.generated_at}</span>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium opacity-70">
          Team
          <select
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">All</option>
            {data.teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium opacity-70">
          Status
          <select
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
            value={ragFilter}
            onChange={(e) => setRagFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="behind">Behind</option>
            <option value="risk">At Risk</option>
            <option value="ok">On Track</option>
          </select>
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-medium opacity-70">
          Search KPI
          <input
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
            placeholder="e.g. meetings booked"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div
        className="overflow-auto rounded-xl border border-black/8 bg-white/80 shadow-sm"
        style={{ maxHeight: "calc(100vh - 220px)" }}
      >
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--color-mist)]">
            <tr>
              <th className="sticky left-0 z-20 bg-[var(--color-mist)] px-3 py-3 font-semibold">
                KPI
              </th>
              {startedPeriods.map((p) => (
                <th
                  key={p.id}
                  className="whitespace-nowrap px-2 py-3 text-center font-semibold"
                >
                  {p.label.replace(" 20", " '")}
                </th>
              ))}
              <th className="px-3 py-3 text-right font-semibold">YTD</th>
            </tr>
          </thead>
          <tbody>
            {byTeam.map(([team, rows]) => (
              <Fragment key={team}>
                <tr>
                  <td
                    colSpan={startedPeriods.length + 2}
                    className="bg-[var(--color-sea)] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    {team}
                  </td>
                </tr>
                {rows.map((kpi) => (
                  <tr
                    key={`${kpi.team}-${kpi.label}`}
                    className="border-t border-black/5 hover:bg-[var(--color-mist)]/40"
                  >
                    <td className="sticky left-0 z-[1] max-w-[260px] bg-white/95 px-3 py-2.5">
                      <div className="font-medium leading-snug">{kpi.label}</div>
                      <div className="mt-0.5 text-[11px] opacity-55">{kpi.notes}</div>
                    </td>
                    {startedPeriods.map((p) => {
                      const cell = kpi.cells.find((c) => c.period_id === p.id);
                      const actual = cell?.actual ?? null;
                      const clickable = actual !== null && Boolean(kpi.kpi_id);
                      return (
                        <td key={p.id} className="px-1 py-1.5 text-center align-middle">
                          <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => openDrill(kpi, p.label)}
                            className={`mx-auto flex min-w-[72px] flex-col items-center rounded-md px-2 py-1.5 transition ${
                              clickable
                                ? "cursor-pointer hover:ring-2 hover:ring-[var(--color-sea)]/40"
                                : "cursor-default opacity-40"
                            }`}
                            title={
                              clickable ? "Open deals behind this number" : undefined
                            }
                          >
                            <span className="font-semibold tabular-nums">
                              {formatValue(actual, kpi.fmt)}
                            </span>
                            {cell?.rag && (
                              <span
                                className="mt-0.5 text-[10px] font-medium"
                                style={{
                                  color:
                                    cell.rag === "ok"
                                      ? "var(--color-ok)"
                                      : cell.rag === "risk"
                                        ? "var(--color-amber)"
                                        : "var(--color-rose)",
                                }}
                              >
                                {ragLabel(cell.rag)}
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatValue(kpi.ytd, kpi.fmt)}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && (
        <DrillDrawer
          kpiLabel={drawer.kpi.label}
          periodLabel={drawer.periodLabel}
          rows={drawer.rows}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
