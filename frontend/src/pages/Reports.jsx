import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../api/axios';

const FUEL_COLORS = ['#f0a500', '#4fa8f0', '#22d67a', '#9d6ef5', '#f04f4f'];

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#141825', border: '1px solid #2a3a5e', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem' }}>
      {label && <div style={{ color: '#8a93a8', marginBottom: 6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#e8ecf5', fontWeight: 600 }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
        </div>
      ))}
    </div>
  );
};

export default function Reports() {
  const [tab, setTab] = useState('revenue');

  // Revenue tab
  const [revenue,    setRevenue]    = useState([]);
  const [startDate,  setStartDate]  = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 13);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Fuel consumption tab
  const [fuelData, setFuelData] = useState([]);

  // Shift performance tab
  const [shiftData, setShiftData] = useState([]);
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);

  // Vehicle activity tab
  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleData, setVehicleData] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState('');

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState({});
  const [err, setErr] = useState('');

  const setLoad = (k, v) => setLoading(prev => ({ ...prev, [k]: v }));

  const loadRevenue = async () => {
    setLoad('revenue', true);
    try {
      const r = await api.get(`/reports/daily-revenue?start=${startDate}&end=${endDate}`);
      setRevenue(r.data.map(d => ({
        ...d,
        sale_date: new Date(d.sale_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        gross_revenue: parseFloat(d.gross_revenue),
        total_liters:  parseFloat(d.total_liters),
      })));
    } catch { setErr('Failed to load revenue data'); }
    finally { setLoad('revenue', false); }
  };

  const loadFuel = async () => {
    setLoad('fuel', true);
    try {
      const r = await api.get('/reports/fuel-consumption');
      setFuelData(r.data.map(d => ({
        ...d,
        total_liters_sold: parseFloat(d.total_liters_sold),
        total_revenue: parseFloat(d.total_revenue),
      })));
    } catch { setErr('Failed to load fuel data'); }
    finally { setLoad('fuel', false); }
  };

  const loadShift = async () => {
    setLoad('shift', true);
    try {
      const r = await api.get(`/reports/shift-performance?date=${shiftDate}`);
      setShiftData(r.data.map(d => ({
        ...d,
        total_revenue: parseFloat(d.total_revenue),
        total_liters:  parseFloat(d.total_liters),
      })));
    } catch { setErr('Failed to load shift data'); }
    finally { setLoad('shift', false); }
  };

  const loadVehicle = async () => {
    if (!vehicleReg.trim()) return;
    setLoad('vehicle', true);
    try {
      const r = await api.get(`/reports/vehicle-activity?reg=${vehicleReg.trim().toUpperCase()}`);
      setVehicleData(r.data);
    } catch { setErr('Failed to load vehicle activity'); }
    finally { setLoad('vehicle', false); }
  };

  useEffect(() => { api.get('/reports/low-stock').then(r => setAlerts(r.data)).catch(() => {}); }, []);
  useEffect(() => { if (tab === 'revenue') loadRevenue(); }, [tab, startDate, endDate]);
  useEffect(() => { if (tab === 'fuel')    loadFuel(); },    [tab]);
  useEffect(() => { if (tab === 'shift')   loadShift(); },   [tab, shiftDate]);

  const TABS = [
    { id: 'revenue', label: '📈 Daily Revenue',      color: 'var(--amber)' },
    { id: 'fuel',    label: '⛽ Fuel Consumption',    color: 'var(--blue)' },
    { id: 'shift',   label: '🕐 Shift Performance',  color: 'var(--purple)' },
    { id: 'vehicle', label: '🚗 Vehicle Activity',    color: 'var(--green)' },
  ];

  const fmt = n => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>ANALYTICS & REPORTS</h1>
        <p>Stored procedure–powered insights for your station's performance</p>
      </div>

      {/* Low stock alerts banner */}
      {alerts.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚠️ <strong>{alerts.length} tank(s)</strong> with critically low stock:&nbsp;
          {alerts.map(a => `${a.tank_name} (${parseFloat(a.remaining_stock).toFixed(0)} L)`).join(' · ')}
        </div>
      )}

      {err && <div className="alert alert-error" style={{ marginBottom: 20 }}>{err}</div>}

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setErr(''); }}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
              fontFamily: 'var(--font-body)',
              background: tab === t.id ? 'var(--bg-card-hover)' : 'transparent',
              color: tab === t.id ? t.color : 'var(--text-2)',
              borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DAILY REVENUE ── */}
      {tab === 'revenue' && (
        <div>
          <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</span>
                <input className="form-control" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ maxWidth: 160 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>To</span>
                <input className="form-control" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ maxWidth: 160 }} />
              </div>
              <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
                Powered by <code style={{ color: 'var(--amber)', background: 'var(--amber-dim)', padding: '2px 6px', borderRadius: 4 }}>CALL GetDailyRevenue()</code>
              </span>
            </div>
          </div>

          {/* Revenue summary */}
          {revenue.length > 0 && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
              {[
                { label: 'Total Revenue', value: fmt(revenue.reduce((a,d) => a + d.gross_revenue, 0)), color: 'var(--amber)' },
                { label: 'Total Transactions', value: revenue.reduce((a,d) => a + d.total_transactions, 0), color: 'var(--blue)' },
                { label: 'Total Liters Sold', value: `${revenue.reduce((a,d) => a + d.total_liters, 0).toFixed(1)} L`, color: 'var(--green)' },
                { label: 'Days Tracked', value: revenue.length, color: 'var(--purple)' },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 20 }}>
              GROSS DAILY REVENUE (₹)
            </h3>
            {loading.revenue ? <div className="spinner" /> : revenue.length === 0 ? (
              <div className="empty-state"><div className="icon">📈</div><p>No revenue data for selected range</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenue} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f0a500" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f0a500" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2740" />
                  <XAxis dataKey="sale_date" stroke="#556080" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#556080" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip prefix="₹" />} />
                  <Area type="monotone" dataKey="gross_revenue" name="Revenue" stroke="#f0a500" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 20 }}>
              DAILY LITERS DISPENSED
            </h3>
            {!loading.revenue && revenue.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenue} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2740" />
                  <XAxis dataKey="sale_date" stroke="#556080" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#556080" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_liters" name="Liters" fill="#4fa8f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── FUEL CONSUMPTION ── */}
      {tab === 'fuel' && (
        <div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 20, color: 'var(--text-3)', fontSize: '0.75rem' }}>
            Powered by <code style={{ color: 'var(--blue)', background: 'rgba(79,168,240,0.1)', padding: '2px 8px', borderRadius: 4, marginLeft: 4 }}>CALL GetFuelConsumption()</code>
          </div>

          {loading.fuel ? <div className="spinner" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Pie chart */}
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 20 }}>
                  LITERS SOLD BY FUEL TYPE
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={fuelData} dataKey="total_liters_sold" nameKey="fuel_type"
                      cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                      paddingAngle={3} label={({ fuel_type, percent }) => `${fuel_type} ${(percent*100).toFixed(0)}%`}>
                      {fuelData.map((_, i) => <Cell key={i} fill={FUEL_COLORS[i % FUEL_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart */}
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 20 }}>
                  REVENUE BY FUEL TYPE (₹)
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={fuelData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2740" horizontal={false} />
                    <XAxis type="number" stroke="#556080" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="fuel_type" stroke="#556080" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip content={<CustomTooltip prefix="₹" />} />
                    <Bar dataKey="total_revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                      {fuelData.map((_, i) => <Cell key={i} fill={FUEL_COLORS[i % FUEL_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="card" style={{ gridColumn: '1/-1', padding: 0 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.08em', color: 'var(--text-2)' }}>FUEL BREAKDOWN TABLE</h3>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fuel Type</th><th>Transactions</th><th>Total Liters</th>
                        <th>Avg Liters/Sale</th><th>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelData.map((f, i) => (
                        <tr key={f.fuel_id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: FUEL_COLORS[i % FUEL_COLORS.length] }} />
                              <span style={{ fontWeight: 600 }}>{f.fuel_type}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--blue)', fontFamily: 'var(--font-brand)' }}>{f.transaction_count}</td>
                          <td style={{ color: 'var(--green)', fontFamily: 'var(--font-brand)' }}>{parseFloat(f.total_liters_sold).toFixed(2)} L</td>
                          <td style={{ color: 'var(--text-2)' }}>{parseFloat(f.avg_liters_per_txn || 0).toFixed(2)} L</td>
                          <td style={{ color: 'var(--amber)', fontFamily: 'var(--font-brand)', fontWeight: 700 }}>{fmt(f.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SHIFT PERFORMANCE ── */}
      {tab === 'shift' && (
        <div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <input className="form-control" type="date" value={shiftDate}
              onChange={e => setShiftDate(e.target.value)} style={{ maxWidth: 180 }} />
            <button className="btn btn-primary btn-sm" onClick={loadShift}>Load Report</button>
            <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
              Powered by <code style={{ color: 'var(--purple)', background: 'rgba(157,110,245,0.1)', padding: '2px 8px', borderRadius: 4 }}>CALL GetShiftPerformance()</code>
            </span>
          </div>

          {loading.shift ? <div className="spinner" /> : shiftData.length === 0 ? (
            <div className="empty-state card"><div className="icon">🕐</div><p>No shift data for selected date</p></div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 20 }}>
                  SHIFT REVENUE COMPARISON
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={shiftData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2740" />
                    <XAxis dataKey="shift_name" stroke="#556080" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#556080" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip prefix="₹" />} />
                    <Bar dataKey="total_revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {shiftData.map((s, i) => (
                        <Cell key={i} fill={
                          s.shift_name === 'Morning' ? '#f0a500' :
                          s.shift_name === 'Afternoon' ? '#4fa8f0' : '#9d6ef5'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.08em', color: 'var(--text-2)' }}>SHIFT PERFORMANCE BREAKDOWN</h3>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Shift</th><th>Employee</th><th>Role</th><th>Time Slot</th>
                        <th>Transactions</th><th>Liters</th><th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftData.map(s => {
                        const clr = s.shift_name === 'Morning' ? 'var(--amber)' : s.shift_name === 'Afternoon' ? 'var(--blue)' : 'var(--purple)';
                        return (
                          <tr key={s.shift_id}>
                            <td>
                              <span style={{ color: clr, fontWeight: 700 }}>
                                {s.shift_name === 'Morning' ? '🌅' : s.shift_name === 'Afternoon' ? '☀️' : '🌙'} {s.shift_name}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{s.employee_name}</td>
                            <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{s.role}</span></td>
                            <td style={{ color: 'var(--text-2)', fontSize: '0.82rem', fontFamily: 'var(--font-brand)' }}>
                              {s.start_time} – {s.end_time}
                            </td>
                            <td style={{ color: 'var(--blue)', fontFamily: 'var(--font-brand)' }}>{s.total_transactions}</td>
                            <td style={{ color: 'var(--green)', fontFamily: 'var(--font-brand)' }}>{parseFloat(s.total_liters).toFixed(1)} L</td>
                            <td style={{ color: 'var(--amber)', fontFamily: 'var(--font-brand)', fontWeight: 700 }}>{fmt(s.total_revenue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── VEHICLE ACTIVITY ── */}
      {tab === 'vehicle' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <input className="form-control" placeholder="Enter Registration Number (e.g. KA-01-AB-1234)"
              value={vehicleReg} onChange={e => setVehicleReg(e.target.value.toUpperCase())}
              style={{ maxWidth: 320, fontFamily: 'var(--font-brand)', letterSpacing: '0.05em' }}
              onKeyDown={e => e.key === 'Enter' && loadVehicle()} />
            <button className="btn btn-primary" onClick={loadVehicle} disabled={!vehicleReg.trim() || loading.vehicle}>
              {loading.vehicle ? '⏳' : '🔍 Lookup'}
            </button>
            <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
              Powered by <code style={{ color: 'var(--green)', background: 'rgba(34,214,122,0.08)', padding: '2px 8px', borderRadius: 4 }}>CALL GetVehicleActivity()</code>
            </span>
          </div>

          {vehicleData !== null && (
            vehicleData.length === 0 ? (
              <div className="empty-state card"><div className="icon">🚗</div><p>No refueling records found for "{vehicleReg}"</p></div>
            ) : (
              <>
                {/* Vehicle stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
                  {[
                    { label: 'Total Visits', value: vehicleData.length, color: 'var(--blue)' },
                    { label: 'Total Liters', value: `${vehicleData.reduce((a,r) => a+parseFloat(r.liters_pumped),0).toFixed(1)} L`, color: 'var(--green)' },
                    { label: 'Total Spent', value: fmt(vehicleData.reduce((a,r) => a+parseFloat(r.total_amount),0)), color: 'var(--amber)' },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
                      <div className="stat-value">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: 0 }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.08em', color: 'var(--text-2)' }}>
                      REFUELING LOG — {vehicleData[0]?.reg_number}
                    </h3>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date & Time</th><th>Fuel</th><th>Liters</th>
                          <th>Amount</th><th>Payment</th><th>Served By</th><th>Shift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicleData.map((r, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-2)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {new Date(r.sale_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td><span className="badge badge-amber">{r.fuel_type}</span></td>
                            <td style={{ color: 'var(--blue)', fontFamily: 'var(--font-brand)', fontSize: '0.88rem' }}>{r.liters_pumped} L</td>
                            <td style={{ color: 'var(--amber)', fontFamily: 'var(--font-brand)', fontWeight: 700 }}>{fmt(r.total_amount)}</td>
                            <td><span className={`badge ${r.payment_method==='Cash'?'badge-green':r.payment_method==='Card'?'badge-blue':'badge-amber'}`}>{r.payment_method}</span></td>
                            <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{r.served_by}</td>
                            <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{r.shift_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )
          )}

          {vehicleData === null && (
            <div className="empty-state card">
              <div className="icon">🔍</div>
              <p>Enter a vehicle registration number above and press Lookup</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
