import Papa from "papaparse";
import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getBench } from "@/lib/benchmarks";
import { Resend } from "resend";

const InputSchema = z.object({
  website: z.string().min(2, "Website name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  category: z.string().refine((val) => ["iGaming", "Finance"].includes(val), {
    message: "Category must be either iGaming or Finance",
  }),
  mode: z.string().refine((val) => ["CPM", "CPC"].includes(val), {
    message: "Mode must be CPM or CPC",
  }),
  dailyBudget: z.number().positive("Daily budget must be greater than 0"),
  durationDays: z.number().int().positive("Duration must be a positive integer"),
  monthlyConversionsAvg: z.number().nonnegative("Monthly conversions cannot be negative"),
  monthlyUniqueUsersAvg: z.number().positive("Monthly users must be greater than 0"),
});

type InputType = z.infer<typeof InputSchema>;

function withTotals(impDay: number, clkDay: number, convDay: number, D: number) {
  const bump = (v: number, p: number) => ({
    min: v * (1 - p),
    base: v,
    max: v * (1 + p),
  });
  return {
    daily: { impressions: impDay, clicks: clkDay, conversions: convDay },
    totals: {
      impressions: bump(impDay * D, 0.2),
      clicks: bump(clkDay * D, 0.2),
      conversions: bump(convDay * D, 0.2),
    },
  };
}

type ForecastEntry = InputType & {
  results: ReturnType<typeof withTotals>;
  rates: {
    CTR: number;
    CVR: number;
    CPM: number;
    CPC: number;
  };
  createdAt: string;
};

async function getCountriesFromCSV() {
  const csvPath = path.join(process.cwd(), "src/data", "locations-USD_all_time.csv");

  if (!fs.existsSync(csvPath)) {
    console.warn("⚠️ CSV file not found:", csvPath);
    return [];
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  }).data;

  return parsed
    .filter((row) => row.country_code && row.country_name)
    .map((row) => ({
      label: `${row.country_name} (${row.country_code})`,
      value: row.country_code,
    }));
}

const resend = new Resend(process.env.RESEND_API_KEY);

function getCountryName(code: string): string {
  try {
    const display = new Intl.DisplayNames(["en"], { type: "region" });
    return display.of(code) || code;
  } catch {
    return code;
  }
}

async function sendForecastEmail(details: ForecastEntry) {
  const countryName = getCountryName(details.country);
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #000; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color:#000; margin-bottom: 8px;">Forecast Results</h2>
      <p><b>Website:</b> ${details.website}</p>
      <p><b>Email Provided:</b> ${details.email}</p>
      <p><b>Country:</b> ${countryName}</p>
      <p><b>Category:</b> ${details.category}</p>
      <p><b>Mode:</b> ${details.mode}</p>
      <p><b>Daily Budget:</b> $${details.dailyBudget}</p>
      <p><b>Duration:</b> ${details.durationDays} days</p>
      <hr style="margin:20px 0; border: 1px solid #ddd;"/>
      <h3>📊 Rates</h3>
      <ul>
        <li>CTR: ${(details.rates.CTR * 100).toFixed(2)}%</li>
        <li>CVR: ${(details.rates.CVR * 100).toFixed(2)}%</li>
        <li>CPM: $${details.rates.CPM.toFixed(2)}</li>
        <li>CPC: $${details.rates.CPC.toFixed(2)}</li>
      </ul>
      <h3>📈 Totals (Estimates)</h3>
      <ul>
        <li>Impressions: ${details.results.totals.impressions.base.toLocaleString()}</li>
        <li>Clicks: ${details.results.totals.clicks.base.toLocaleString()}</li>
        <li>Conversions: ${details.results.totals.conversions.base.toLocaleString()}</li>
      </ul>
      <p style="margin-top:16px; font-size: 13px;">
        ⚠️ Estimates are based on benchmarks and inputs. Actual results may vary.
      </p>
    </div>
  `;

  const result = await resend.emails.send({
    from: "Forecast Tool <onboarding@resend.dev>",
    to: "chinemeremokpara93@gmail.com",
    subject: `Forecast Results for ${details.website}`,
    html,
  });

  if (result.error) {
    console.error("❌ Resend error:", result.error.message);
  } else {
    console.log("✅ Email sent:", result.data?.id);
  }
}

export async function GET() {
  const categories = ["iGaming", "Finance"];
  const countries = await getCountriesFromCSV();
  return NextResponse.json({ ok: true, categories, countries });
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const i: InputType = InputSchema.parse({
      ...raw,
      dailyBudget: Number(raw.dailyBudget),
      durationDays: Number(raw.durationDays),
      monthlyConversionsAvg: Number(raw.monthlyConversionsAvg),
      monthlyUniqueUsersAvg: Number(raw.monthlyUniqueUsersAvg),
    });

    const bench = await getBench(i.category, i.country);

    const CVR = i.monthlyConversionsAvg / i.monthlyUniqueUsersAvg;
    const CTR = bench.CTR;
    const CPM = bench.CPM;
    const CPC = bench.CPC;

    const B = i.dailyBudget;
    const D = i.durationDays;

    let impDay = 0, clkDay = 0, convDay = 0;
    if (i.mode === "CPM") {
      impDay = (B / CPM) * 1000;
      clkDay = impDay * CTR;
      convDay = clkDay * CVR;
    } else if (i.mode === "CPC") {
      clkDay = B / CPC;
      impDay = clkDay / CTR;
      convDay = clkDay * CVR;
    }

    const results = withTotals(impDay, clkDay, convDay, D);
    const rates = { CTR, CVR, CPM, CPC };
    const entry: ForecastEntry = { ...i, results, rates, createdAt: new Date().toISOString() };

    await sendForecastEmail(entry);

    return NextResponse.json({ ok: true, inputs: i, rates, ...results });
  } catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {};
      err.issues.forEach((e) => {
        errors[e.path.join(".")] = e.message;
      });
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? "Invalid input" },
      { status: 400 }
    );
  }
}
