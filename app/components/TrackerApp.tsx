"use client";

import { useMemo, useState } from "react";
import type { DrillRow, Kpi, Snapshot, TabId } from "../lib/types";
import { DrillDrawer } from "./DrillDrawer";
import { MonthlyMatrix } from "./MonthlyMatrix";
import { OverviewDashboard } from "./OverviewDashboard";
import { QuarterlyMatrix } from "./QuarterlyMatrix";
import { TrackerNav } from "./TrackerNav";

type Props = { data: Snapshot };

export function TrackerApp({ data }: Props) {
  const [tab, setTab] = useState<TabId>("monthly");
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

  const filterKpis = (list: Kpi[]) =>
    list.filter((k) => {
      if (teamFilter !== "all" && k.team !== teamFilter) return false;
      if (query && !k.label.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (ragFilter !== "all") {
        const hit = k.cells.some(
          (c) =>
            startedPeriods.some((p) => p.id === c.period_id) &&
            c.rag === ragFilter,
        );
        if (!hit) return false;
      }
      return true;
    });

  const visibleKpis = useMemo(
    () => filterKpis(data.kpis),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.kpis, teamFilter, ragFilter, query, startedPeriods],
  );

  const advancedKpis = useMemo(
    () => filterKpis(data.advanced_kpis || []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.advanced_kpis, teamFilter, ragFilter, query, startedPeriods],
  );

  function onDrill(kpi: Kpi, periodLabel: string, rows: DrillRow[]) {
    setDrawer({ kpi, periodLabel, rows });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-6">
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
          <span>
            {data.visible_count} KPIs · refreshed {data.generated_at}
          </span>
        </div>
      </header>

      <TrackerNav active={tab} onChange={setTab} />

      {tab !== "overview" ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
          >
            <option value="all">All teams</option>
            {data.teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={ragFilter}
            onChange={(e) => setRagFilter(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
          >
            <option value="all">All RAG</option>
            <option value="ok">On Track</option>
            <option value="risk">At Risk</option>
            <option value="behind">Behind</option>
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search metrics…"
            className="min-w-[12rem] flex-1 rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm sm:max-w-xs"
          />
        </div>
      ) : null}

      {tab === "overview" ? <OverviewDashboard data={data} /> : null}

      {tab === "monthly" ? (
        <MonthlyMatrix
          data={data}
          kpis={visibleKpis}
          periods={data.periods}
          onDrill={onDrill}
        />
      ) : null}

      {tab === "quarterly" ? (
        <QuarterlyMatrix data={data} onDrill={onDrill} />
      ) : null}

      {tab === "advanced" ? (
        <div className="space-y-3">
          <p className="text-sm opacity-70">
            Audit / parked metrics (calls, mix, hygiene). Not on Atin&apos;s
            primary dashboard — expand when something breaks.
          </p>
          {advancedKpis.length === 0 ? (
            <p className="text-sm opacity-60">
              No advanced KPIs in snapshot (or filtered out).
            </p>
          ) : (
            <MonthlyMatrix
              data={data}
              kpis={advancedKpis}
              periods={data.periods}
              onDrill={onDrill}
            />
          )}
        </div>
      ) : null}

      {drawer ? (
        <DrillDrawer
          kpiLabel={drawer.kpi.label}
          periodLabel={drawer.periodLabel}
          rows={drawer.rows}
          onClose={() => setDrawer(null)}
        />
      ) : null}
    </div>
  );
}
