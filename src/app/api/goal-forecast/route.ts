import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBench } from "@/lib/benchmarks";

const Mode = z.enum(["CPM", "CPC", "CPA"]);

const Input = z.object({
  mode: Mode,
  dailyBudget: z.number().positive(),
  durationDays: z.number().int().positive(),
  monthlyConversionsAvg: z.number().nonnegative(),
  monthlyUniqueUsersAvg: z.number().positive(),
  category: z.string(),
  countryIso2: z.string().length(2),
});

function withTotals(impDay: number, clkDay: number, convDay: number, D: number) {
  const bump = (v: number, p: number) => ({ min: v * (1 - p), base: v, max: v * (1 + p) });
  return {
    daily: { impressions: impDay, clicks: clkDay, conversions: convDay },
    totals: {
      impressions: bump(impDay * D, 0.2),
      clicks: bump(clkDay * D, 0.2),
      conversions: bump(convDay * D, 0.2),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const i = Input.parse({
      ...raw,
      dailyBudget: Number(raw.dailyBudget),
      durationDays: Number(raw.durationDays),
      monthlyConversionsAvg: Number(raw.monthlyConversionsAvg),
      monthlyUniqueUsersAvg: Number(raw.monthlyUniqueUsersAvg),
    });

    const CVR = i.monthlyConversionsAvg / i.monthlyUniqueUsersAvg;

    const bench = await getBench(i.category, i.countryIso2);
    const CTR = bench?.CTR ?? 0.002;  
    const CPM_bench = bench?.CPM ?? 5; 
    const CPC_bench = bench?.CPC ?? 1; 
    const CPA_bench = bench?.CPA ?? 10; 

    const B = i.dailyBudget;
    const D = i.durationDays;

    const impDay = (B / CPM_bench) * 1000;
    const clkDay = impDay * CTR;
    const convDay = clkDay * CVR;

    const CPM = (B / impDay) * 1000;
    const CPC = clkDay > 0 ? B / clkDay : CPC_bench;
    const CPA = convDay > 0 ? B / convDay : CPA_bench;

    return NextResponse.json({
      ok: true,
      mode: i.mode,
      inputs: i,
      rates: { CTR, CVR, CPM, CPC, CPA },
      ...withTotals(impDay, clkDay, convDay, D),
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ ok: false, error: err.message ?? "Invalid input" }, { status: 400 });
  }
}
