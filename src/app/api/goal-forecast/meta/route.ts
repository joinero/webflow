import { NextResponse } from "next/server";
import { loadBenchmarks } from "@/lib/benchmarks";

function getCountryLabel(code: string): string {
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
}

export async function GET() {
  const bench = await loadBenchmarks();

  const pairs = Object.keys(bench).map((k) => {
    const [category, iso2] = k.split("|");
    return {
      category,
      country: {
        label: `${getCountryLabel(iso2)} (${iso2})`,
        value: iso2,
      },
    };
  });

  const categories = Array.from(new Set(pairs.map((p) => p.category))).sort();
  const countries = Array.from(
    new Map(pairs.map((p) => [p.country.value, p.country])).values()
  ).sort((a, b) => a.label.localeCompare(b.label));

  return NextResponse.json({ categories, countries, pairs });
}
