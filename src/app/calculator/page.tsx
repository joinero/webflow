'use client';

import { useMemo, useState } from 'react';

type Mode = 'CPM'|'CPC'|'CPA';
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

const CATEGORIES = [
  'Gambling - Online gambling',
  // add more as needed
];

const COUNTRIES = [
  { label: 'Nigeria (NG)', value:'NG' },
  { label: 'Sweden (SE)',  value:'SE' },
];

export default function CalculatorPage(){
  const [mode, setMode] = useState<Mode>('CPM');

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [country, setCountry]   = useState('NG');
  const [dailyBudget, setB]     = useState(500);
  const [days, setDays]         = useState(90);
  const [mConv, setMConv]       = useState(1000);
  const [mUsers, setMUsers]     = useState(250000);
  const [unitCost, setUnitCost] = useState(8);    
  const [ctrOverride, setCtr]   = useState<string>('');

  const [loading, setLoading]   = useState(false);
  const [resp, setResp]         = useState<ForecastResp| null>(null);

  const unitLabel = useMemo(()=>(
    mode==='CPM' ? 'CPM (USD)' : mode==='CPC' ? 'CPC (USD)' : 'CPA (USD)'
  ),[mode]);

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
          category, countryIso2: country,
          unitCost: Number(unitCost),
          ctrOverride: ctrOverride ? Number(ctrOverride) : undefined,
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
              {CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="calc-field">
            <label>Countries</label>
            <select className="calc-select" value={country} onChange={e=>setCountry(e.target.value)}>
              {COUNTRIES.map(c=> <option key={c.value} value={c.value}>{c.label}</option>)}
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

          <div className="calc-field">
            <label>{unitLabel}</label>
            <input className="calc-input" type="number" step="0.01" value={unitCost}
                   onChange={e=>setUnitCost(+e.target.value)} />
          </div>

          <div className="calc-field">
            <label>CTR override (0–1) (optional)</label>
            <input className="calc-input" type="number" step="0.001" value={ctrOverride}
                   onChange={e=>setCtr(e.target.value)} placeholder="Leave blank to use benchmark" />
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
                {(['CPM','CPC','CPA'] as const).map(k=>(
                  <div className="box" key={k}>
                    <div className="k">{k}</div>
                    <div className="v">{resp.rates![k].toLocaleString(undefined,{maximumFractionDigits:4})}</div>
                  </div>
                ))}
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

            {/* Totals min/base/max */}
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
