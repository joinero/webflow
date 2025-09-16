'use client';

import { useState, useEffect } from 'react';
import { message } from 'antd';

interface Country { label: string; value: string; }
interface ForecastRates { CTR: number; CVR: number; CPM: number; CPC: number; }
interface Totals { impressions: { min: number; base: number; max: number }; clicks: { min: number; base: number; max: number }; conversions: { min: number; base: number; max: number }; }
interface ForecastResp { ok: boolean; error?: string; errors?: Record<string, string>; rates?: ForecastRates; daily?: { impressions: number; clicks: number; conversions: number }; totals?: Totals; }

export default function CalculatorPage() {
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'iGaming' | 'Finance'>('iGaming');
  const [country, setCountry] = useState('US');
  const [dailyBudget, setB] = useState('');
  const [days, setDays] = useState('');
  const [mConv, setMConv] = useState('');
  const [mUsers, setMUsers] = useState('');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ForecastResp | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Country[]>([]);

  const API_URL = process.env.NODE_ENV === 'development' ? '/api/proxy-goal-forecast' : 'https://webflow-kappa.vercel.app/api/goal-forecast';

  useEffect(() => {
    async function fetchCountries() {
      try {
        const r = await fetch(API_URL);
        if (!r.ok) throw new Error('Network response was not ok');
        const data = await r.json();
        if (data.countries) {
          const sorted = data.countries.sort((a: Country, b: Country) => a.label.localeCompare(b.label));
          setCountries(sorted);
        } else {
          setCountries([{ label: 'United States (US)', value: 'US' }]);
          message.warning('Using fallback countries data.');
        }
      } catch (err) {
        console.error('Failed to fetch countries', err);
        message.error('Failed to load countries. Please try again.');
        setCountries([{ label: 'United States (US)', value: 'US' }]);
      }
    }
    fetchCountries();
  }, []);

  async function run() {
    setLoading(true);
    setErrors({});
    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website,
          email,
          category,
          country,
          mode: 'CPM',
          dailyBudget: Number(dailyBudget) || 0,
          durationDays: Number(days) || 0,
          monthlyConversionsAvg: Number(mConv) || 0,
          monthlyUniqueUsersAvg: Number(mUsers) || 0,
        }),
      });

      const j: ForecastResp = await r.json();

      if (!r.ok || !j.ok) {
        if (j.errors) setErrors(j.errors);
        else message.error(j.error || 'Invalid input, please check your details');
        return;
      }

      setResp(j);
    } catch (err) {
      console.error(err);
      message.error('Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="calc-wrap">
      <div className="calc-card">
        <h1 className="calc-title">Traffic Calculator</h1>
        <div className="calc-grid" style={{ marginTop: 16 }}>
          <div className="calc-field">
            <label>Website</label>
            <input className="calc-input" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
            {errors.website && <div className="error-text">{errors.website}</div>}
          </div>
          <div className="calc-field">
            <label>Email</label>
            <input className="calc-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>
          <div className="calc-field">
            <label>Category</label>
            <select className="calc-select" value={category} onChange={(e) => setCategory(e.target.value as 'iGaming' | 'Finance')}>
              <option value="iGaming">iGaming</option>
              <option value="Finance">Finance</option>
            </select>
            {errors.category && <div className="error-text">{errors.category}</div>}
          </div>
          <div className="calc-field">
            <label>Country</label>
            <select className="calc-select" value={country} onChange={(e) => setCountry(e.target.value)}>
              {countries.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
            {errors.country && <div className="error-text">{errors.country}</div>}
          </div>
          <div className="calc-field">
            <label>Daily budget (USD)</label>
            <input className="calc-input" type="number" value={dailyBudget} onChange={(e) => setB(e.target.value)} />
            {errors.dailyBudget && <div className="error-text">{errors.dailyBudget}</div>}
          </div>
          <div className="calc-field">
            <label>Duration (days)</label>
            <input className="calc-input" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
            {errors.durationDays && <div className="error-text">{errors.durationDays}</div>}
          </div>
          <div className="calc-field">
            <label>Monthly conversions (avg)</label>
            <input className="calc-input" type="number" value={mConv} onChange={(e) => setMConv(e.target.value)} />
            {errors.monthlyConversionsAvg && <div className="error-text">{errors.monthlyConversionsAvg}</div>}
          </div>
          <div className="calc-field">
            <label>Monthly unique users (avg)</label>
            <input className="calc-input" type="number" value={mUsers} onChange={(e) => setMUsers(e.target.value)} />
            {errors.monthlyUniqueUsersAvg && <div className="error-text">{errors.monthlyUniqueUsersAvg}</div>}
          </div>
        </div>
        <div className="calc-actions">
          <button className="calc-btn" onClick={run} disabled={loading}>
            {loading ? 'Calculating…' : 'Run forecast'}
          </button>
        </div>
        {resp?.ok && resp.totals && (
          <>
            {resp.rates && (
              <div className="result" style={{ marginTop: 12 }}>
                <div className="box"><div className="k">CPM</div><div className="v">{resp.rates.CPM.toFixed(2)}</div></div>
                <div className="box"><div className="k">CPC</div><div className="v">{resp.rates.CPC.toFixed(2)}</div></div>
                <div className="box"><div className="k">CTR</div><div className="v">{(resp.rates.CTR * 100).toFixed(2)}%</div></div>
              </div>
            )}
            <div className="result" style={{ marginTop: 12 }}>
              <div className="box"><div className="k">CVR</div><div className="v">{resp.rates ? (resp.rates.CVR * 100).toFixed(2) : 'N/A'}%</div></div>
              <div className="box"><div className="k">Impressions</div><div className="v">{resp.totals.impressions.base.toFixed(0)}</div></div>
              <div className="box"><div className="k">Clicks</div><div className="v">{resp.totals.clicks.base.toFixed(0)}</div></div>
              {/* <div className="box"><div className="k">Conversions</div><div className="v">{resp.totals.conversions.base.toFixed(0)}</div></div> */}
            </div>
            <div style={{ marginTop: 8, color: '#475569' }}>Estimates based on inputs and benchmarks; actuals may vary.</div>
          </>
        )}
      </div>
    </div>
  );
}