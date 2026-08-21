export type Rag = "ok" | "risk" | "behind" | null;

export type Period = {
  id: string;
  label: string;
  year?: number;
  month?: number;
  months?: string[];
  started: boolean;
};

export type Cell = {
  period_id: string;
  target: number | null;
  actual: number | null;
  pct_achv: number | null;
  rag: Rag;
  has_drilldown: boolean;
};

export type Kpi = {
  row_index: number;
  team: string;
  category: string;
  label: string;
  direction: string;
  fmt: string;
  notes: string;
  kpi_id: string | null;
  scope: string | null;
  owner: string | null;
  cells: Cell[];
  ytd: number | null;
  weekly?: number | null;
  monthly: number | null;
  quarterly: number | null;
  annual: number | null;
  parked?: boolean;
};

export type DrillRow = {
  kpi: string;
  period: string;
  name: string;
  stage: string;
  owner: string;
  deal_source: string;
  channel?: string;
  amount: number | null;
  probability: number | null;
  weighted: number | null;
  priority?: string;
  next_action?: string;
  hubspot_url: string;
};

export type TargetProgress = {
  label: string;
  target: number;
  actual: number | null;
  pct_achv: number | null;
  rag: Rag;
};

export type Snapshot = {
  generated_at: string;
  title: string;
  fy: string;
  rag_rule: string;
  blurb: string;
  visible_count: number;
  periods: Period[];
  kpis: Kpi[];
  quarterly?: {
    periods: Period[];
    kpis: Kpi[];
  };
  targets_progress?: Record<string, TargetProgress>;
  advanced_kpis?: Kpi[];
  drilldowns: Record<string, DrillRow[]>;
  teams: string[];
  meeting_channels?: string[];
};

export type TabId = "overview" | "monthly" | "quarterly" | "advanced";
