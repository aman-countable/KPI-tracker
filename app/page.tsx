import { readFile } from "fs/promises";
import path from "path";
import { TrackerApp } from "./components/TrackerApp";
import type { Snapshot } from "./lib/types";

async function loadSnapshot(): Promise<Snapshot | null> {
  try {
    const file = path.join(process.cwd(), "public", "data", "latest.json");
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

export default async function Page() {
  const data = await loadSnapshot();

  if (!data || !data.visible_count) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Countable Tracker
        </h1>
        <p className="mt-4 text-sm leading-relaxed opacity-80">
          No snapshot yet. From <code>apps/n8n/kpi-pipeline</code> run:
        </p>
        <pre className="mt-4 rounded-lg bg-black/5 p-4 text-left text-xs">
          python -m report.build_report --target web
        </pre>
        <p className="mt-4 text-sm opacity-70">
          That writes <code>public/data/latest.json</code>, then refresh this page.
        </p>
      </main>
    );
  }

  return <TrackerApp data={data} />;
}
