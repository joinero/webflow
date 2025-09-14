import fs from "fs";
import path from "path";
import Papa from "papaparse";

export type Key = `${string}|${string}`;

export interface BenchData {
  CTR: number;
  CPM: number;
  CPC: number;
  CPA: number;
}

let cachedBench: Record<string, BenchData> | null = null;

const DEFAULTS: BenchData = {
  CTR: 0.01,
  CPM: 5,
  CPC: 1,
  CPA: 10,
};

export async function loadBenchmarks(): Promise<Record<string, BenchData>> {
  if (cachedBench) return cachedBench;

  const csvPath = path.join(process.cwd(), "src/data", "locations-USD_all_time.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn("⚠️ Benchmarks file not found:", csvPath);
    return {};
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  }).data;

  const bench: Record<string, BenchData> = {};

  for (const row of parsed) {
    const code = row["country_code"];
    const name = row["country_name"];

    if (!code || !name) continue;

    const ctr = parseFloat(row["ctr"]);
    const cpm = parseFloat(row["cpm"]);
    const cpc = parseFloat(row["cpc"]);
    const cpa = parseFloat(row["cpa"]);

    const key = `ALL|${code}`;

    bench[key] = {
      CTR: !isNaN(ctr) ? ctr : DEFAULTS.CTR,
      CPM: !isNaN(cpm) ? cpm : DEFAULTS.CPM,
      CPC: !isNaN(cpc) ? cpc : DEFAULTS.CPC,
      CPA: !isNaN(cpa) ? cpa : DEFAULTS.CPA,
    };
  }

  cachedBench = bench;
  return bench;
}

export async function getBench(category: string, iso2: string): Promise<BenchData> {
  const all = await loadBenchmarks();

  return all[`ALL|${iso2}`] ?? DEFAULTS;
}
