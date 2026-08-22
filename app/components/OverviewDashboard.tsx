"use client";

import type { Snapshot, TargetProgress } from "../lib/types";
import { formatValue, ragLabel } from "../lib/format";

type Props = { data: Snapshot };

function CircularGauge({ item }: { item: TargetProgress }) {
  const pct = Math.min(1, Math.max(0, item.pct_achv ?? 0));
  const rag = item.rag || "risk";
  const color = rag === "ok" ? "var(--color-ok)" : rag === "risk" ? "var(--color-amber)" : "var(--color-rose)";
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const isCurrency = item.target >= 1000;

  return (
    <div className="flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-mist)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums" style={{ color }}>
            {item.actual != null ? formatValue(item.actual, isCurrency ? "usd" : "num") : "—"}
          </span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-sm font-semibold">{item.label}</div>
        <div className="mt-1 text-xs text-[var(--color-muted)]">
          {formatValue(item.target, isCurrency ? "usd" : "num")} target
        </div>
        <div className="mt-1 text-xs font-medium" style={{ color }}>
          {ragLabel(rag)} · {Math.round(pct * 100)}%
        </div>
      </div>
    </div>
  );
}

export function OverviewDashboard({ data }: Props) {
  const tp = data.targets_progress || {};
  const order = ["firms", "users", "arr", "weighted_pipe", "flex_commit"];
  const items = order.map((k) => tp[k]).filter(Boolean) as TargetProgress[];

  // Behind KPIs list
  const behindKpis = data.kpis.filter((k) =>
    k.cells.some((c) => c.rag === "behind" && data.periods.some((p) => p.id === c.period_id && p.started)),
  );

  return (
    <div className="space-y-8">
      {/* North Star gauges */}
      <section>
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>North Star Progress</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">200 firms · ~800 users · $1M ARR · $1.8M weighted pipe · $500K Flex</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {items.map((item) => (
            <CircularGauge key={item.label} item={item} />
          ))}
        </div>
      </section>

      {/* RAG summary cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">On Track</div>
          <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color: "var(--color-ok)" }}>
            {data.kpis.filter((k) => k.cells.some((c) => c.rag === "ok")).length}
          </div>
          <div className="text-xs text-[var(--color-muted)]">KPIs at 100%+</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">At Risk</div>
          <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color: "var(--color-amber)" }}>
            {data.kpis.filter((k) => k.cells.some((c) => c.rag === "risk")).length}
          </div>
          <div className="text-xs text-[var(--color-muted)]">KPIs at 50–99%</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">Behind (&lt;50%)</div>
          <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color: "var(--color-rose)" }}>
            {data.kpis.filter((k) => k.cells.some((c) => c.rag === "behind")).length}
          </div>
          <div className="text-xs text-[var(--color-muted)]">KPIs below 50%</div>
        </div>
      </section>

      {/* Watch list */}
      {behindKpis.length > 0 && (
        <section className="rounded-xl border border-[var(--color-rose)]/20 bg-[var(--color-rose)]/[0.03] p-5">
          <h3 className="text-sm font-bold text-[var(--color-rose)]">Watch List — KPIs Behind Target</h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">These metrics are below 50% of target in at least one started month.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {behindKpis.slice(0, 12).map((kpi) => {
              const behindCells = kpi.cells.filter((c) => c.rag === "behind");
              const latestBehind = behindCells.find((c) => data.periods.some((p) => p.id === c.period_id && p.started));
              return (
                <div key={kpi.row_index} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{kpi.label}</span>
                    <span className="ml-1.5 text-[10px] text-[var(--color-muted)]">{kpi.team}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--color-rose)" }}>
                    {latestBehind?.pct_achv != null ? `${Math.round(latestBehind.pct_achv * 100)}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Seasonality callout */}
      <section className="rounded-xl border border-[var(--color-amber)]/20 bg-[var(--color-amber)]/[0.03] p-4 text-sm">
        <strong style={{ color: "var(--color-amber)" }}>Seasonality:</strong>{" "}
        <span className="text-[var(--color-muted)]">
          August–November is the volume window (~130 firms / BDR ~65). Keep monthly refreshed — quarterly derives automatically.{" "}
          Meeting sources: {data.meeting_channels?.join(", ") || "Apollo, Snitcher, Web Scraper, HubSpot Inbound, Referral"}.
        </span>
      </section>
    </div>
  );
}
