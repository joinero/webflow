"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Forecast {
  website: string;
  email: string;
  country: string;
  category: string;
  mode: string;
  dailyBudget: number;
  durationDays: number;
  monthlyConversionsAvg: number;
  monthlyUniqueUsersAvg: number;
  results: {
    totals: {
      impressions: { base: number };
      clicks: { base: number };
      conversions: { base: number };
    };
  };
  rates: {
    CTR: number;
    CVR: number;
    CPM: number;
    CPC: number;
  };
}

export default function ForecastsPage() {
  const router = useRouter();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Protect page
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetch("/api/goal-forecast")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) setForecasts(data.forecasts);
        })
        .finally(() => setLoading(false));
    }
  }, [router]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Saved Forecasts</h1>

      {forecasts.length === 0 ? (
        <p>No forecasts saved yet.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            background: "#fff",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <thead style={{ background: "#f3f4f6", color: "#000000" }}>
            <tr>
              <th style={{ padding: "12px" }}>Website</th>
              <th style={{ padding: "12px" }}>Email</th>
              <th style={{ padding: "12px" }}>Country</th>
              <th style={{ padding: "12px" }}>Category</th>
              <th style={{ padding: "12px" }}>Mode</th>
              <th style={{ padding: "12px" }}>Daily Budget</th>
              <th style={{ padding: "12px" }}>Duration (days)</th>
              <th style={{ padding: "12px" }}>Monthly Conversions</th>
              <th style={{ padding: "12px" }}>Monthly Users</th>
              <th style={{ padding: "12px" }}>Impressions</th>
              <th style={{ padding: "12px" }}>Clicks</th>
              <th style={{ padding: "12px" }}>Conversions</th>
              <th style={{ padding: "12px" }}>CTR</th>
              <th style={{ padding: "12px" }}>CVR</th>
              <th style={{ padding: "12px" }}>CPM</th>
              <th style={{ padding: "12px" }}>CPC</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map((f, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  color: "#000000",
                }}
              >
                <td style={{ padding: "12px" }}>{f.website}</td>
                <td style={{ padding: "12px" }}>{f.email}</td>
                <td style={{ padding: "12px" }}>{f.country}</td>
                <td style={{ padding: "12px" }}>{f.category}</td>
                <td style={{ padding: "12px" }}>{f.mode}</td>
                <td style={{ padding: "12px" }}>${f.dailyBudget}</td>
                <td style={{ padding: "12px" }}>{f.durationDays}</td>
                <td style={{ padding: "12px" }}>{f.monthlyConversionsAvg}</td>
                <td style={{ padding: "12px" }}>{f.monthlyUniqueUsersAvg}</td>
                <td style={{ padding: "12px" }}>
                  {f.results?.totals.impressions.base.toLocaleString()}
                </td>
                <td style={{ padding: "12px" }}>
                  {f.results?.totals.clicks.base.toLocaleString()}
                </td>
                <td style={{ padding: "12px" }}>
                  {f.results?.totals.conversions.base.toLocaleString()}
                </td>
                <td style={{ padding: "12px" }}>
                  {(f.rates?.CTR * 100).toFixed(2)}%
                </td>
                <td style={{ padding: "12px" }}>
                  {(f.rates?.CVR * 100).toFixed(2)}%
                </td>
                <td style={{ padding: "12px" }}>{f.rates?.CPM.toFixed(2)}</td>
                <td style={{ padding: "12px" }}>{f.rates?.CPC.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
