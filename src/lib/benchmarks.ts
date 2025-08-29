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

interface BenchDataRaw {
  CTR: number[];
  CPM: number[];
  CPC: number[];
  CPA: number[];
}

function normalizeCountry(token: string): string | null {
  const map: Record<string, string> = {
    CAN: "CA",
    USA: "US",
    USE: "US",
    AUS: "AU",
    SU: "RU",
    MB: "MQ",
    WL: "LC",
    UP: "UA",
  };
  if (map[token]) return map[token];
  if (/^[A-Z]{2}$/.test(token)) return token;
  return null;
}

function extractCountry(name: string): string | null {
  const tokens = name.split(/[-_]/).map((t) => t.trim());
  for (const t of tokens) {
    const c = normalizeCountry(t);
    if (c) return c;
  }
  return null;
}

let cachedBench: Record<Key, BenchData> | null = null;

const DEFAULTS: BenchData = {
  CTR: 0.01, 
  CPM: 5,    
  CPC: 1,   
  CPA: 10,   
};

export async function loadBenchmarks(): Promise<Record<Key, BenchData>> {
  if (cachedBench) return cachedBench;

  const files = ["test_1.csv", "Test2.csv"];
  const raw: Record<Key, BenchDataRaw> = {} as Record<Key, BenchDataRaw>;

  for (const file of files) {
    const csvPath = path.join(process.cwd(), "src/data", file);
    if (!fs.existsSync(csvPath)) continue;

    const content = fs.readFileSync(csvPath, "utf8");
    const parsed = Papa.parse<Record<string, string>>(content, { header: true }).data;

    for (const row of parsed) {
      const name = row["campaign_name"];
      const brand = row["client_brand_name"];
      if (!name || !brand) continue;

      const country = extractCountry(name);
      if (!country) continue;

      const ctr = parseFloat(row["ctr"]);
      const cpm = parseFloat(row["cpm"]);
      const cpc = parseFloat(row["cpc"]);
      const cpa = parseFloat(row["cpa"]);

      const key: Key = `${brand.trim()}|${country}`;

      if (!raw[key]) {
        raw[key] = { CTR: [], CPM: [], CPC: [], CPA: [] };
      }

      if (!isNaN(ctr)) raw[key].CTR.push(ctr);
      if (!isNaN(cpm)) raw[key].CPM.push(cpm);
      if (!isNaN(cpc)) raw[key].CPC.push(cpc);
      if (!isNaN(cpa)) raw[key].CPA.push(cpa);
    }
  }

  const averaged: Record<Key, BenchData> = {};
  for (const key of Object.keys(raw) as Key[]) {
    const v = raw[key];
    averaged[key] = {
      CTR: v.CTR.length ? v.CTR.reduce((a, b) => a + b, 0) / v.CTR.length : DEFAULTS.CTR,
      CPM: v.CPM.length ? v.CPM.reduce((a, b) => a + b, 0) / v.CPM.length : DEFAULTS.CPM,
      CPC: v.CPC.length ? v.CPC.reduce((a, b) => a + b, 0) / v.CPC.length : DEFAULTS.CPC,
      CPA: v.CPA.length ? v.CPA.reduce((a, b) => a + b, 0) / v.CPA.length : DEFAULTS.CPA,
    };
  }

  cachedBench = averaged;
  return averaged;
}

export async function getBench(category: string, iso2: string): Promise<BenchData> {
  const all = await loadBenchmarks();
  return all[`${category}|${iso2}`] ?? DEFAULTS;
}
