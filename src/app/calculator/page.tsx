'use client';

import { useEffect, useMemo, useState } from 'react';

type Mode = 'CPM' | 'CPC' | 'CPA';

type ForecastResp = {
  ok: boolean;
  error?: string;
  mode?: Mode;
  rates?: { CTR:number; CVR:number; CPM:number; CPC:number; CPA:number };
  daily?: { impressions:number; clicks:number; conversions:number };
  totals?: {
    impressions:{min:number;base:number;max:number};
    clicks:{min:number;base:number;max:number};
    conversions:{min:number;base:number;max:number};
  };
  epom?: { status:number; data:any };
};

type Pair = {
  category: string;
  country: { label: string; value: string };
};

export default function CalculatorPage(){
  const [mode, setMode] = useState<Mode>('CPM');
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<{label:string; value:string}[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);

  const [category, setCategory] = useState('');
  const [country, setCountry]   = useState('');
  const [dailyBudget, setB]     = useState(500);
  const [days, setDays]         = useState(90);
  const [mConv, setMConv]       = useState(1000);
  const [mUsers, setMUsers]     = useState(250000);

  const [loading, setLoading]   = useState(false);
  const [resp, setResp]         = useState<ForecastResp| null>(null);

  useEffect(() => {
    async function fetchMeta() {
      const res = await fetch('/api/goal-forecast/meta');
      const data = await res.json();
      setPairs(data.pairs || []);
      setCategories(data.categories || []);
      if (data.categories?.length) {
        const firstCat = data.categories[0];
        setCategory(firstCat);

        const validCountries = (data.pairs || [])
          .filter((p: Pair) => p.category === firstCat)
          .map((p: Pair) => p.country);
        setCountries(validCountries);
        if (validCountries.length > 0) {
          setCountry(validCountries[0].value);
        }
      }
    }
    fetchMeta();
  }, []);

  useEffect(() => {
    if (!category) return;
    const validCountries = pairs
      .filter(p => p.category === category)
      .map(p => p.country);

    setCountries(validCountries);
    if (validCountries.length > 0) {
      setCountry(validCountries[0].value);
    }
  }, [category, pairs]);

  async function run(){
    setLoading(true);
    try{
      const r = await fetch('/api/goal-forecast',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({
          mode,
          dailyBudget: Number(dailyBudget),
          durationDays: Number(days),
          monthlyConversionsAvg: Number(mConv),
          monthlyUniqueUsersAvg: Number(mUsers),
          category,
          countryIso2: country,
          useEpom: false 
        })
      });
      const j = await r.json() as ForecastResp;
      setResp(j);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="calc-wrap">
      <div className="calc-card">
        <h1 className="calc-title">Goal forecast</h1>

        {/* Tabs */}
        <div className="calc-actions" style={{marginTop:0}}>
          {(['CPM','CPC','CPA'] as Mode[]).map(m => (
            <button key={m}
              className="calc-btn"
              style={{background: mode===m ? 'var(--accent)' : '#e5e7eb', color: mode===m ? '#fff' : '#111'}}
              onClick={()=>setMode(m)}
            >{m}</button>
          ))}
        </div>

        <div className="calc-grid" style={{marginTop:16}}>
          <div className="calc-field">
            <label>Categories</label>
            <select className="calc-select" value={category} onChange={e=>setCategory(e.target.value)}>
              {categories.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="calc-field">
            <label>Countries</label>
            <select className="calc-select" value={country} onChange={e=>setCountry(e.target.value)}>
              {countries.map(c=> <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="calc-field">
            <label>Daily budget (USD)</label>
            <input className="calc-input" type="number" value={dailyBudget}
                   onChange={e=>setB(+e.target.value)} />
          </div>

          <div className="calc-field">
            <label>Duration (days)</label>
            <input className="calc-input" type="number" value={days}
                   onChange={e=>setDays(+e.target.value)} />
          </div>

          <div className="calc-field">
            <label>Monthly conversions (avg)</label>
            <input className="calc-input" type="number" value={mConv}
                   onChange={e=>setMConv(+e.target.value)} />
          </div>

          <div className="calc-field">
            <label>Monthly unique users (avg)</label>
            <input className="calc-input" type="number" value={mUsers}
                   onChange={e=>setMUsers(+e.target.value)} />
          </div>
        </div>

        <div className="calc-actions">
          <button className="calc-btn" onClick={run} disabled={loading}>
            {loading ? 'Calculating…' : 'Run forecast'}
          </button>
          {resp?.epom && resp.mode==='CPM' && (
            <div style={{color:'#475569', alignSelf:'center'}}>
              Epom: {resp.epom.status}
            </div>
          )}
        </div>

        {/* Results */}
        {resp?.ok && resp.totals && (
          <>
            {/* Rates summary */}
            {resp.rates && (
              <div className="result" style={{marginTop:12}}>
                {mode === 'CPM' && (
                  <div className="box">
                    <div className="k">CPM</div>
                    <div className="v">{resp.rates.CPM.toLocaleString(undefined,{maximumFractionDigits:4})}</div>
                  </div>
                )}
                {mode === 'CPC' && (
                  <div className="box">
                    <div className="k">CPC</div>
                    <div className="v">{resp.rates.CPC.toLocaleString(undefined,{maximumFractionDigits:4})}</div>
                  </div>
                )}
                {mode === 'CPA' && (
                  <div className="box">
                    <div className="k">CPA</div>
                    <div className="v">{resp.rates.CPA.toLocaleString(undefined,{maximumFractionDigits:4})}</div>
                  </div>
                )}
                <div className="box">
                  <div className="k">CTR</div>
                  <div className="v">{(resp.rates.CTR*100).toFixed(2)}%</div>
                </div>
                <div className="box">
                  <div className="k">CVR</div>
                  <div className="v">{(resp.rates.CVR*100).toFixed(2)}%</div>
                </div>
              </div>
            )}

            <div className="result" style={{marginTop:12}}>
              <div className="box">
                <div className="k">Impressions</div>
                <div className="v">{resp.totals.impressions.base.toLocaleString()}</div>
                <div className="k">Range</div>
                <div>{resp.totals.impressions.min.toLocaleString()} – {resp.totals.impressions.max.toLocaleString()}</div>
              </div>
              <div className="box">
                <div className="k">Clicks</div>
                <div className="v">{resp.totals.clicks.base.toLocaleString()}</div>
                <div className="k">Range</div>
                <div>{resp.totals.clicks.min.toLocaleString()} – {resp.totals.clicks.max.toLocaleString()}</div>
              </div>
              <div className="box">
                <div className="k">Conversions</div>
                <div className="v">{resp.totals.conversions.base.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
                <div className="k">Range</div>
                <div>{resp.totals.conversions.min.toLocaleString(undefined,{maximumFractionDigits:2})} – {resp.totals.conversions.max.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
              </div>
            </div>
            <div style={{marginTop:8,color:'#475569'}}>Estimates based on inputs and benchmarks; actuals may vary.</div>
          </>
        )}

        {resp && !resp.ok && (
          <div style={{marginTop:12,color:'#b91c1c',fontWeight:600}}>
            {resp.error || 'Something went wrong.'}
          </div>
        )}
      </div>
    </div>
  );
}
