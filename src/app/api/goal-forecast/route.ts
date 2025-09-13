import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getBench } from "@/lib/benchmarks";
import { Resend } from "resend";

// Statically defined countries data (replacing CSV file access)
const countriesData = [
  { label: "Afghanistan (AF)", value: "AF" },
  { label: "Albania (AL)", value: "AL" },
  { label: "Algeria (DZ)", value: "DZ" },
  { label: "Andorra (AD)", value: "AD" },
  { label: "Angola (AO)", value: "AO" },
  { label: "Antigua and Barbuda (AG)", value: "AG" },
  { label: "Argentina (AR)", value: "AR" },
  { label: "Armenia (AM)", value: "AM" },
  { label: "Australia (AU)", value: "AU" },
  { label: "Austria (AT)", value: "AT" },
  { label: "Azerbaijan (AZ)", value: "AZ" },
  { label: "Bahamas (BS)", value: "BS" },
  { label: "Bahrain (BH)", value: "BH" },
  { label: "Bangladesh (BD)", value: "BD" },
  { label: "Barbados (BB)", value: "BB" },
  { label: "Belarus (BY)", value: "BY" },
  { label: "Belgium (BE)", value: "BE" },
  { label: "Belize (BZ)", value: "BZ" },
  { label: "Benin (BJ)", value: "BJ" },
  { label: "Bhutan (BT)", value: "BT" },
  { label: "Bolivia (BO)", value: "BO" },
  { label: "Bosnia and Herzegovina (BA)", value: "BA" },
  { label: "Botswana (BW)", value: "BW" },
  { label: "Brazil (BR)", value: "BR" },
  { label: "Brunei (BN)", value: "BN" },
  { label: "Bulgaria (BG)", value: "BG" },
  { label: "Burkina Faso (BF)", value: "BF" },
  { label: "Burundi (BI)", value: "BI" },
  { label: "Cabo Verde (CV)", value: "CV" },
  { label: "Cambodia (KH)", value: "KH" },
  { label: "Cameroon (CM)", value: "CM" },
  { label: "Canada (CA)", value: "CA" },
  { label: "Central African Republic (CF)", value: "CF" },
  { label: "Chad (TD)", value: "TD" },
  { label: "Chile (CL)", value: "CL" },
  { label: "China (CN)", value: "CN" },
  { label: "Colombia (CO)", value: "CO" },
  { label: "Comoros (KM)", value: "KM" },
  { label: "Congo (CG)", value: "CG" },
  { label: "Costa Rica (CR)", value: "CR" },
  { label: "Croatia (HR)", value: "HR" },
  { label: "Cuba (CU)", value: "CU" },
  { label: "Cyprus (CY)", value: "CY" },
  { label: "Czechia (CZ)", value: "CZ" },
  { label: "Denmark (DK)", value: "DK" },
  { label: "Djibouti (DJ)", value: "DJ" },
  { label: "Dominica (DM)", value: "DM" },
  { label: "Dominican Republic (DO)", value: "DO" },
  { label: "Ecuador (EC)", value: "EC" },
  { label: "Egypt (EG)", value: "EG" },
  { label: "El Salvador (SV)", value: "SV" },
  { label: "Equatorial Guinea (GQ)", value: "GQ" },
  { label: "Eritrea (ER)", value: "ER" },
  { label: "Estonia (EE)", value: "EE" },
  { label: "Eswatini (SZ)", value: "SZ" },
  { label: "Ethiopia (ET)", value: "ET" },
  { label: "Fiji (FJ)", value: "FJ" },
  { label: "Finland (FI)", value: "FI" },
  { label: "France (FR)", value: "FR" },
  { label: "Gabon (GA)", value: "GA" },
  { label: "Gambia (GM)", value: "GM" },
  { label: "Georgia (GE)", value: "GE" },
  { label: "Germany (DE)", value: "DE" },
  { label: "Ghana (GH)", value: "GH" },
  { label: "Greece (GR)", value: "GR" },
  { label: "Grenada (GD)", value: "GD" },
  { label: "Guatemala (GT)", value: "GT" },
  { label: "Guinea (GN)", value: "GN" },
  { label: "Guinea-Bissau (GW)", value: "GW" },
  { label: "Guyana (GY)", value: "GY" },
  { label: "Haiti (HT)", value: "HT" },
  { label: "Honduras (HN)", value: "HN" },
  { label: "Hungary (HU)", value: "HU" },
  { label: "Iceland (IS)", value: "IS" },
  { label: "India (IN)", value: "IN" },
  { label: "Indonesia (ID)", value: "ID" },
  { label: "Iran (IR)", value: "IR" },
  { label: "Iraq (IQ)", value: "IQ" },
  { label: "Ireland (IE)", value: "IE" },
  { label: "Israel (IL)", value: "IL" },
  { label: "Italy (IT)", value: "IT" },
  { label: "Jamaica (JM)", value: "JM" },
  { label: "Japan (JP)", value: "JP" },
  { label: "Jordan (JO)", value: "JO" },
  { label: "Kazakhstan (KZ)", value: "KZ" },
  { label: "Kenya (KE)", value: "KE" },
  { label: "Kiribati (KI)", value: "KI" },
  { label: "Korea, North (KP)", value: "KP" },
  { label: "Korea, South (KR)", value: "KR" },
  { label: "Kuwait (KW)", value: "KW" },
  { label: "Kyrgyzstan (KG)", value: "KG" },
  { label: "Laos (LA)", value: "LA" },
  { label: "Latvia (LV)", value: "LV" },
  { label: "Lebanon (LB)", value: "LB" },
  { label: "Lesotho (LS)", value: "LS" },
  { label: "Liberia (LR)", value: "LR" },
  { label: "Libya (LY)", value: "LY" },
  { label: "Liechtenstein (LI)", value: "LI" },
  { label: "Lithuania (LT)", value: "LT" },
  { label: "Luxembourg (LU)", value: "LU" },
  { label: "Madagascar (MG)", value: "MG" },
  { label: "Malawi (MW)", value: "MW" },
  { label: "Malaysia (MY)", value: "MY" },
  { label: "Maldives (MV)", value: "MV" },
  { label: "Mali (ML)", value: "ML" },
  { label: "Malta (MT)", value: "MT" },
  { label: "Marshall Islands (MH)", value: "MH" },
  { label: "Mauritania (MR)", value: "MR" },
  { label: "Mauritius (MU)", value: "MU" },
  { label: "Mexico (MX)", value: "MX" },
  { label: "Micronesia (FM)", value: "FM" },
  { label: "Moldova (MD)", value: "MD" },
  { label: "Monaco (MC)", value: "MC" },
  { label: "Mongolia (MN)", value: "MN" },
  { label: "Montenegro (ME)", value: "ME" },
  { label: "Morocco (MA)", value: "MA" },
  { label: "Mozambique (MZ)", value: "MZ" },
  { label: "Myanmar (MM)", value: "MM" },
  { label: "Namibia (NA)", value: "NA" },
  { label: "Nauru (NR)", value: "NR" },
  { label: "Nepal (NP)", value: "NP" },
  { label: "Netherlands (NL)", value: "NL" },
  { label: "New Zealand (NZ)", value: "NZ" },
  { label: "Nicaragua (NI)", value: "NI" },
  { label: "Niger (NE)", value: "NE" },
  { label: "Nigeria (NG)", value: "NG" },
  { label: "North Macedonia (MK)", value: "MK" },
  { label: "Norway (NO)", value: "NO" },
  { label: "Oman (OM)", value: "OM" },
  { label: "Pakistan (PK)", value: "PK" },
  { label: "Palau (PW)", value: "PW" },
  { label: "Panama (PA)", value: "PA" },
  { label: "Papua New Guinea (PG)", value: "PG" },
  { label: "Paraguay (PY)", value: "PY" },
  { label: "Peru (PE)", value: "PE" },
  { label: "Philippines (PH)", value: "PH" },
  { label: "Poland (PL)", value: "PL" },
  { label: "Portugal (PT)", value: "PT" },
  { label: "Qatar (QA)", value: "QA" },
  { label: "Romania (RO)", value: "RO" },
  { label: "Russia (RU)", value: "RU" },
  { label: "Rwanda (RW)", value: "RW" },
  { label: "Saint Kitts and Nevis (KN)", value: "KN" },
  { label: "Saint Lucia (LC)", value: "LC" },
  { label: "Saint Vincent and the Grenadines (VC)", value: "VC" },
  { label: "Samoa (WS)", value: "WS" },
  { label: "San Marino (SM)", value: "SM" },
  { label: "Sao Tome and Principe (ST)", value: "ST" },
  { label: "Saudi Arabia (SA)", value: "SA" },
  { label: "Senegal (SN)", value: "SN" },
  { label: "Serbia (RS)", value: "RS" },
  { label: "Seychelles (SC)", value: "SC" },
  { label: "Sierra Leone (SL)", value: "SL" },
  { label: "Singapore (SG)", value: "SG" },
  { label: "Slovakia (SK)", value: "SK" },
  { label: "Slovenia (SI)", value: "SI" },
  { label: "Solomon Islands (SB)", value: "SB" },
  { label: "Somalia (SO)", value: "SO" },
  { label: "South Africa (ZA)", value: "ZA" },
  { label: "South Sudan (SS)", value: "SS" },
  { label: "Spain (ES)", value: "ES" },
  { label: "Sri Lanka (LK)", value: "LK" },
  { label: "Sudan (SD)", value: "SD" },
  { label: "Suriname (SR)", value: "SR" },
  { label: "Sweden (SE)", value: "SE" },
  { label: "Switzerland (CH)", value: "CH" },
  { label: "Syria (SY)", value: "SY" },
  { label: "Taiwan (TW)", value: "TW" },
  { label: "Tajikistan (TJ)", value: "TJ" },
  { label: "Tanzania (TZ)", value: "TZ" },
  { label: "Thailand (TH)", value: "TH" },
  { label: "Timor-Leste (TL)", value: "TL" },
  { label: "Togo (TG)", value: "TG" },
  { label: "Tonga (TO)", value: "TO" },
  { label: "Trinidad and Tobago (TT)", value: "TT" },
  { label: "Tunisia (TN)", value: "TN" },
  { label: "Turkey (TR)", value: "TR" },
  { label: "Turkmenistan (TM)", value: "TM" },
  { label: "Tuvalu (TV)", value: "TV" },
  { label: "Uganda (UG)", value: "UG" },
  { label: "Ukraine (UA)", value: "UA" },
  { label: "United Arab Emirates (AE)", value: "AE" },
  { label: "United Kingdom (GB)", value: "GB" },
  { label: "United States (US)", value: "US" },
  { label: "Uruguay (UY)", value: "UY" },
  { label: "Uzbekistan (UZ)", value: "UZ" },
  { label: "Vanuatu (VU)", value: "VU" },
  { label: "Vatican City (VA)", value: "VA" },
  { label: "Venezuela (VE)", value: "VE" },
  { label: "Vietnam (VN)", value: "VN" },
  { label: "Yemen (YE)", value: "YE" },
  { label: "Zambia (ZM)", value: "ZM" },
  { label: "Zimbabwe (ZW)", value: "ZW" }
];

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
  return countriesData;
}

function getCountryName(code: string): string {
  try {
    const display = new Intl.DisplayNames(["en"], { type: "region" });
    return display.of(code) || code;
  } catch {
    return code;
  }
}

async function sendForecastEmail(resend: Resend, details: ForecastEntry) {
  const countryName = getCountryName(details.country);
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #000; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color:#000; margin-bottom: 8px;">Forecast Results</h2>
      <p><b>Website:</b> ${details.website}</p>
      <p><b>Email Provided:</b> ${details.email}</p>
      <p><b>Country:</b> ${countryName}</p>
      <p><b>Category:</b> ${details.category}</p>
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
    from: "Joinero Forecast <sales@joinero.co>",
    to: "sales@joinero.co",
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

    // Initialize Resend here, only when needed
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing Resend API key");
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    await sendForecastEmail(resend, entry);

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