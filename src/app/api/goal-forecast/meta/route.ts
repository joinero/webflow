import { NextResponse } from "next/server";
import { loadBenchmarks } from "@/lib/benchmarks";

function getCountryLabel(code: string): string {
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
}

export async function GET() {
  const categories = ["iGaming", "Finance"];

  const all = await loadBenchmarks();
  const uniqueCountries = new Set(
    Object.keys(all).map((key) => key.split("|")[1])
  );

  const countries = Array.from(uniqueCountries).map((code) => ({
    label: `${getCountryLabel(code)} (${code})`,
    value: code,
  }));

  return NextResponse.json({ categories, countries });
}
