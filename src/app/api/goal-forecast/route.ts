import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCTR } from "@/lib/benchmarks";

const Mode = z.enum(["CPM","CPC","CPA"]);

const Input = z.object({
  mode: Mode,
  dailyBudget: z.number().positive(),           
  durationDays: z.number().int().positive(),
  monthlyConversionsAvg: z.number().nonnegative(),
  monthlyUniqueUsersAvg: z.number().positive(),
  category: z.string(),
  countryIso2: z.string().length(2),
  unitCost: z.number().positive().optional(),    
  ctrOverride: z.number().min(0).max(1).optional(),
  useEpom: z.boolean().optional()
});

function withTotals(impDay:number, clkDay:number, convDay:number, D:number){
  const bump = (v:number,p:number)=>({min:v*(1-p), base:v, max:v*(1+p)});
  return {
    daily: { impressions: impDay, clicks: clkDay, conversions: convDay },
    totals: {
      impressions: bump(impDay*D, 0.2),
      clicks:      bump(clkDay*D, 0.2),
      conversions: bump(convDay*D, 0.2)
    }
  };
}

async function maybeCPMFromEpom(bidfloorCPM:number){
  const EPOM_BID_URL = process.env.EPOM_BID_URL;
  const EPOM_KEY = process.env.EPOM_KEY;
  if (!EPOM_BID_URL || !EPOM_KEY) return { used:false as const };

  const openrtb = {
    id: crypto.randomUUID(),
    at: 1, tmax: 200,
    imp:[{ id:"1", banner:{w:300,h:250}, bidfloor: bidfloorCPM/1000 }],
    site:{ domain:"joinerra.com", page:"https://joinerra.com/calculator" },
    device:{ ua:"Mozilla/5.0", ip:"1.1.1.1" }
  };

  const res = await fetch(`${EPOM_BID_URL}?key=${encodeURIComponent(EPOM_KEY)}`,{
    method:"POST", headers:{ "content-type":"application/json","accept":"application/json" },
    body: JSON.stringify(openrtb)
  });

  const data = await res.json().catch(()=>({}));
  const price = data?.seatbid?.[0]?.bid?.[0]?.price; // CPM
  return (res.ok && typeof price === "number")
    ? { used:true as const, cpm:Number(price), epom:{status:res.status,data} }
    : { used:false as const, epom:{status:res.status,data} };
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
      unitCost: raw.unitCost != null ? Number(raw.unitCost) : undefined,
      ctrOverride: raw.ctrOverride != null ? Number(raw.ctrOverride) : undefined
    });

    const CVR = i.monthlyConversionsAvg / i.monthlyUniqueUsersAvg;    
    const CTR = i.ctrOverride ?? getCTR(i.category, i.countryIso2);
    if (CTR == null) {
      return NextResponse.json(
        { ok:false, error:"No CTR benchmark for this Category/Country. Provide ctrOverride or add to CTR_BENCH." },
        { status:400 }
      );
    }

    const D = i.durationDays, B = i.dailyBudget;
    let epom: any = null;

    if (i.mode === "CPM") {
      let CPM = i.unitCost!;
      if (!CPM && i.useEpom) {
        const ep = await maybeCPMFromEpom( i.unitCost ?? 8 );
        epom = ep.epom ?? null;
        if (ep.used) CPM = ep.cpm;
      }
      if (!CPM) return NextResponse.json({ ok:false, error:"CPM is required (manual or from Epom)." }, { status:400 });

      const impDay = (B / CPM) * 1000;
      const clkDay = impDay * CTR;
      const convDay = clkDay * CVR;

      const CPC = CPM / (1000 * CTR);
      const CPA = CPM / (1000 * CTR * CVR);

      return NextResponse.json({ ok:true,
        mode:"CPM", inputs:i, rates:{ CTR, CVR, CPM, CPC, CPA },
        ...withTotals(impDay, clkDay, convDay, D), epom
      });
    }

    if (i.mode === "CPC") {
      const CPC = i.unitCost!;
      if (!CPC) return NextResponse.json({ ok:false, error:"CPC is required." }, { status:400 });

      const clkDay = B / CPC;
      const impDay = clkDay / CTR;
      const convDay = clkDay * CVR;

      const CPM = CPC * CTR * 1000;
      const CPA = CPC / CVR;

      return NextResponse.json({ ok:true,
        mode:"CPC", inputs:i, rates:{ CTR, CVR, CPM, CPC, CPA },
        ...withTotals(impDay, clkDay, convDay, D)
      });
    }

    // CPA
    const CPA = i.unitCost!;
    if (!CPA) return NextResponse.json({ ok:false, error:"CPA is required." }, { status:400 });

    const convDay = B / CPA;
    const clkDay  = convDay / CVR;
    const impDay  = clkDay / CTR;

    const CPC = CPA * CVR;
    const CPM = CPA * CVR * CTR * 1000;

    return NextResponse.json({ ok:true,
      mode:"CPA", inputs:i, rates:{ CTR, CVR, CPM, CPC, CPA },
      ...withTotals(impDay, clkDay, convDay, D)
    });

  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message ?? "Invalid input" }, { status:400 });
  }
}
