export function formatValue(value: number | null | undefined, fmt: string): string {
  if (value === null || value === undefined) return "—";
  if (fmt === "pct") return `${(value * 100).toFixed(1)}%`;
  if (fmt === "usd") {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (fmt === "days" || fmt === "mult") return Number(value).toFixed(1);
  if (Number.isInteger(value)) return String(value);
  return Number(value).toFixed(1);
}

export function ragLabel(rag: string | null | undefined): string {
  if (rag === "ok") return "On Track";
  if (rag === "risk") return "At Risk";
  if (rag === "behind") return "Behind";
  return "";
}
