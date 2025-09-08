import fs from "fs";
import path from "path";
import Papa from "papaparse";
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

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "forecasts.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readData() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

function writeData(data: any) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

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

async function sendForecastEmail(details: any) {
  const countryName = getCountryName(details.country);
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #000; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color:#000; margin-bottom: 8px;">Forecast Results</h2>
      <p style="color:#000;"><b>Website:</b> ${details.website}</p>
      <p style="color:#000;"><b>Email Provided:</b> <span style="color:#000;">${details.email}</span></p>
      <p style="color:#000;"><b>Country:</b> ${countryName}</p>
      <p style="color:#000;"><b>Category:</b> ${details.category}</p>
      <p style="color:#000;"><b>Mode:</b> ${details.mode}</p>
      <p style="color:#000;"><b>Daily Budget:</b> $${details.dailyBudget}</p>
      <p style="color:#000;"><b>Duration:</b> ${details.durationDays} days</p>

      <hr style="margin:20px 0; border: 1px solid #ddd;"/>

      <h3 style="color:#000; margin-bottom: 8px;">📊 Rates</h3>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; color:#000;">
        <thead>
          <tr>
            <th style="text-align:left; border-bottom:2px solid #ddd; padding: 8px; color:#000;">Metric</th>
            <th style="text-align:left; border-bottom:2px solid #ddd; padding: 8px; color:#000;">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px; color:#000;">CTR</td><td style="padding: 8px; color:#000;">${(details.rates.CTR * 100).toFixed(2)}%</td></tr>
          <tr><td style="padding: 8px; color:#000;">CVR</td><td style="padding: 8px; color:#000;">${(details.rates.CVR * 100).toFixed(2)}%</td></tr>
          <tr><td style="padding: 8px; color:#000;">CPM</td><td style="padding: 8px; color:#000;">$${details.rates.CPM.toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; color:#000;">CPC</td><td style="padding: 8px; color:#000;">$${details.rates.CPC.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <h3 style="color:#000; margin-bottom: 8px;">📈 Totals (Estimates)</h3>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; color:#000;">
        <thead>
          <tr>
            <th style="text-align:left; border-bottom:2px solid #ddd; padding: 8px; color:#000;">Metric</th>
            <th style="text-align:left; border-bottom:2px solid #ddd; padding: 8px; color:#000;">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px; color:#000;">Impressions</td><td style="padding: 8px; color:#000;">${details.results.totals.impressions.base.toLocaleString()}</td></tr>
          <tr><td style="padding: 8px; color:#000;">Clicks</td><td style="padding: 8px; color:#000;">${details.results.totals.clicks.base.toLocaleString()}</td></tr>
          <tr><td style="padding: 8px; color:#000;">Conversions</td><td style="padding: 8px; color:#000;">${details.results.totals.conversions.base.toLocaleString()}</td></tr>
        </tbody>
      </table>

      <p style="margin-top:16px; font-size: 13px; color:#000;">
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
  const forecasts = readData();
  const categories = ["iGaming", "Finance"];
  const countries = await getCountriesFromCSV();

  return NextResponse.json({ ok: true, forecasts, categories, countries });
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

    // get benchmarks
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
    }

    if (i.mode === "CPC") {
      clkDay = B / CPC;
      impDay = clkDay / CTR;
      convDay = clkDay * CVR;
    }

    const results = withTotals(impDay, clkDay, convDay, D);
    const rates = { CTR, CVR, CPM, CPC };

    // Save locally
    const prev = readData();
    const entry = { ...i, results, rates, createdAt: new Date().toISOString() };
    prev.push(entry);
    writeData(prev);

    await sendForecastEmail(entry);

    return NextResponse.json({
      ok: true,
      inputs: i,
      rates,
      ...results,
    });
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
