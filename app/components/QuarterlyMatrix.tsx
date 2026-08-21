"use client";

import type { DrillRow, Kpi, Snapshot } from "../lib/types";
import { MonthlyMatrix } from "./MonthlyMatrix";

type Props = {
  data: Snapshot;
  onDrill: (kpi: Kpi, periodLabel: string, rows: DrillRow[]) => void;
};

export function QuarterlyMatrix({ data, onDrill }: Props) {
  const q = data.quarterly;
  if (!q?.periods?.length) {
    return (
      <p className="text-sm opacity-70">
        Quarterly view not in this snapshot. Re-run{" "}
        <code>build_report --target web</code>.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm opacity-70">
        Derived from monthly: counts/revenue summed; rates and stocks use
        quarter-end / latest month (never average of percentages).
      </p>
      <MonthlyMatrix
        data={data}
        kpis={q.kpis}
        periods={q.periods}
        onDrill={onDrill}
        showYtd={false}
      />
    </div>
  );
}
