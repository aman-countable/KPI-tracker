"use client";

import { useMemo, useState } from "react";
import type { DrillRow, Kpi, Snapshot, TabId } from "../lib/types";
import { DrillDrawer } from "./DrillDrawer";
import { MonthlyMatrix } from "./MonthlyMatrix";
import { OverviewDashboard } from "./OverviewDashboard";
import { QuarterlyMatrix } from "./QuarterlyMatrix";
import { TrackerNav } from "./TrackerNav";

type Props = { data: Snapshot };

const TEAM_ORDER = ["all", "Marketing", "SDR", "BDR", "Onboarding", "Flex"];

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
      if (query && !k.label.toLowerCase().includes(query.toLowerCase())) return false;
      if (ragFilter !== "all") {
        const hit = k.cells.some(
          (c) => startedPeriods.some((p) => p.id === c.period_id) && c.rag === ragFilter,
        );
        if (!hit) return false;
      }
      return true;
    });

  const visibleKpis = useMemo(() => filterKpis(data.kpis), [data.kpis, teamFilter, ragFilter, query, startedPeriods]);
  const advancedKpis = useMemo(() => filterKpis(data.advanced_kpis || []), [data.advanced_kpis, teamFilter, ragFilter, query, startedPeriods]);

  function onDrill(kpi: Kpi, periodLabel: string, rows: DrillRow[]) {
    setDrawer({ kpi, periodLabel, rows });
  }

  // RAG summary counts
  const behind = data.kpis.filter((k) => k.cells.some((c) => c.rag === "behind")).length;
  const risk = data.kpis.filter((k) => k.cells.some((c) => c.rag === "risk")).length;
  const ok = data.kpis.filter((k) => k.cells.some((c) => c.rag === "ok")).length;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold tracking-wide text-[var(--color-sea)]">Countable</p>
          <span className="text-[var(--color-border)]">|</span>
          <p className="text-sm text-[var(--color-muted)]">Sales KPI Tracker</p>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          {data.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          {data.blurb}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--color-muted)]">
          <span>{data.fy}</span>
          <span className="text-[var(--color-border)]">|</span>
          <span>{data.rag_rule}</span>
          <span className="text-[var(--color-border)]">|</span>
          <span>{data.visible_count} KPIs</span>
          <span className="text-[var(--color-border)]">|</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ok)]" />{ok} on track
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-amber)]" />{risk} at risk
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-rose)]" />{behind} behind
          </span>
          <span className="text-[var(--color-border)]">|</span>
          <span>Refreshed {new Date(data.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </header>

      <TrackerNav active={tab} onChange={setTab} />

      {tab !== "overview" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Team pill filters */}
          <div className="flex flex-wrap gap-1 rounded-lg bg-[var(--color-mist)] p-1">
            {TEAM_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTeamFilter(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  teamFilter === t
                    ? "bg-white text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>

          <select
            value={ragFilter}
            onChange={(e) => setRagFilter(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs"
          >
            <option value="all">All RAG</option>
            <option value="ok">On Track</option>
            <option value="risk">At Risk</option>
            <option value="behind">Behind</option>
          </select>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search metrics..."
            className="min-w-[10rem] flex-1 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs sm:max-w-[200px] outline-none focus:border-[var(--color-sea)]"
          />
        </div>
      )}

      <div className="mt-4">
        {tab === "overview" && <OverviewDashboard data={data} />}
        {tab === "monthly" && <MonthlyMatrix data={data} kpis={visibleKpis} periods={data.periods} onDrill={onDrill} />}
        {tab === "quarterly" && <QuarterlyMatrix data={data} onDrill={onDrill} />}
        {tab === "advanced" && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-muted)]">Audit / parked metrics (calls, mix, hygiene). Not on Atin&apos;s primary dashboard.</p>
            {advancedKpis.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No advanced KPIs in snapshot (or filtered out).</p>
            ) : (
              <MonthlyMatrix data={data} kpis={advancedKpis} periods={data.periods} onDrill={onDrill} />
            )}
          </div>
        )}
      </div>

      {drawer && (
        <DrillDrawer
          kpiLabel={drawer.kpi.label}
          periodLabel={drawer.periodLabel}
          rows={drawer.rows}
          summary={data.drilldown_summaries?.[`${drawer.kpi.kpi_id}|${drawer.periodLabel}`]}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
