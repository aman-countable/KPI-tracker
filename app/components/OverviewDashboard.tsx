"use client";

import type { Snapshot, TargetProgress } from "../lib/types";
import { formatValue, ragLabel } from "../lib/format";

type Props = { data: Snapshot };

function Gauge({ item }: { item: TargetProgress }) {
  const pct = Math.min(100, Math.max(0, (item.pct_achv ?? 0) * 100));
  const rag = item.rag || "risk";
  const color =
    rag === "ok" ? "#1e8449" : rag === "risk" ? "#d68910" : "#c0392b";
  return (
    <div className="rounded-xl border border-black/8 bg-white/90 p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{item.label}</h3>
        <span className="text-xs font-medium" style={{ color }}>
          {ragLabel(rag)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/8">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs tabular-nums opacity-75">
        <span>
          {item.actual != null
            ? formatValue(item.actual, item.target >= 1000 ? "usd" : "num")
            : "—"}
        </span>
        <span>
          / {formatValue(item.target, item.target >= 1000 ? "usd" : "num")}
        </span>
      </div>
    </div>
  );
}

export function OverviewDashboard({ data }: Props) {
  const tp = data.targets_progress || {};
  const order = ["firms", "users", "arr", "weighted_pipe", "flex_commit"];
  const items = order.map((k) => tp[k]).filter(Boolean);

  const behind = data.kpis.filter((k) =>
    k.cells.some((c) => c.rag === "behind"),
  ).length;
  const risk = data.kpis.filter((k) =>
    k.cells.some((c) => c.rag === "risk"),
  ).length;
  const ok = data.kpis.filter((k) =>
    k.cells.some((c) => c.rag === "ok"),
  ).length;

  return (
    <div className="space-y-8">
      <section>
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          North Star progress
        </h2>
        <p className="mt-1 text-sm opacity-70">
          200 firms · ~800 users · $1M ARR · $1.8M weighted pipe · $500K Flex
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {items.map((item) => (
            <Gauge key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-black/8 bg-white/90 p-4">
          <div className="text-xs uppercase tracking-wide opacity-60">On track</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: "#1e8449" }}>
            {ok}
          </div>
        </div>
        <div className="rounded-xl border border-black/8 bg-white/90 p-4">
          <div className="text-xs uppercase tracking-wide opacity-60">At risk</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: "#d68910" }}>
            {risk}
          </div>
        </div>
        <div className="rounded-xl border border-black/8 bg-white/90 p-4">
          <div className="text-xs uppercase tracking-wide opacity-60">Behind (&lt;50%)</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: "#c0392b" }}>
            {behind}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 text-sm">
        <strong>Seasonality:</strong> August–November is the volume window
        (~130 firms / BDR ~65). Keep monthly refreshed — quarterly derives
        automatically. Meeting sources include Apollo, Snitcher, Web Scraper,
        and HubSpot Inbound.
        {data.meeting_channels?.length ? (
          <span className="opacity-70">
            {" "}
            Channels: {data.meeting_channels.join(", ")}.
          </span>
        ) : null}
      </section>
    </div>
  );
}
