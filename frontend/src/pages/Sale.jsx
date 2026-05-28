import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EMPTY = { vehicle_id: '', fuel_id: '', tank_id: '', emp_id: '', shift_id: '', liters_pumped: '', payment_method: 'Cash' };

export default function Sale() {
  const { user } = useAuth();
  const [sales,    setSales]    = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuels,    setFuels]    = useState([]);
  const [tanks,    setTanks]    = useState([]);
  const [emps,     setEmps]     = useState([]);
  const [shifts,   setShifts]   = useState([]);
  const [todayStats, setTodayStats] = useState(null);

  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [estimate, setEstimate] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(0);
  const LIMIT = 15;

  const load = () => {
    api.get(`/sales?limit=${LIMIT}&offset=${page * LIMIT}`).then(r => setSales(r.data)).catch(() => {});
    api.get('/sales/today').then(r => setTodayStats(r.data)).catch(() => {});
    api.get('/vehicles').then(r => setVehicles(r.data)).catch(() => {});
    api.get('/fuels').then(r => setFuels(r.data)).catch(() => {});
    api.get('/tanks').then(r => setTanks(r.data)).catch(() => {});
    api.get('/employees').then(r => setEmps(r.data.filter(e => e.is_active))).catch(() => {});
    api.get(`/shifts?date=${new Date().toISOString().split('T')[0]}`).then(r => setShifts(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [page]);

  // Compute billing estimate when fuel + liters change
  useEffect(() => {
    if (form.fuel_id && form.liters_pumped) {
      const fuel = fuels.find(f => f.fuel_id == form.fuel_id);
      if (fuel) setEstimate((parseFloat(fuel.price_per_liter) * parseFloat(form.liters_pumped)).toFixed(2));
    } else setEstimate(null);
  }, [form.fuel_id, form.liters_pumped]);

  // Filter tanks by selected fuel
  const filteredTanks = form.fuel_id
    ? tanks.filter(t => t.fuel_id == form.fuel_id)
    : tanks;

  const openModal = () => {
    setForm({ ...EMPTY, emp_id: user?.emp_id || '' });
    setEstimate(null); setMsg(''); setErr(''); setModal(true);
  };

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const res = await api.post('/sales', form);
      setMsg(`✅ Sale recorded! Total: ₹${res.data.total_amount}`);
      load(); setTimeout(() => setModal(false), 1500);
    } catch (er) { setErr(er.response?.data?.error || 'Error recording sale'); }
    finally { setLoading(false); }
  };

  const fmt = n => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const filtered = sales.filter(s =>
    s.reg_number.toLowerCase().includes(search.toLowerCase()) ||
    s.fuel_type.toLowerCase().includes(search.toLowerCase())
  );

  const PAYMENT_BADGE = { Cash: 'badge-green', Card: 'badge-blue', UPI: 'badge-amber' };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>SALES LEDGER</h1>
          <p>Record fuel dispensing transactions and monitor billing</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ New Sale</button>
      </div>

      {/* Today stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        {[
          { icon: '💰', label: "Today's Revenue",    value: fmt(todayStats?.total_revenue),  color: 'var(--amber)' },
          { icon: '⛽', label: 'Liters Dispensed',   value: `${parseFloat(todayStats?.total_liters||0).toFixed(1)} L`, color: 'var(--blue)' },
          { icon: '🧾', label: 'Transactions Today', value: todayStats?.total_sales || 0,    color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-value">{s.value ?? '—'}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Search by vehicle reg or fuel type…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}>← Prev</button>
          <span style={{ color: 'var(--text-2)', fontSize: '0.82rem', alignSelf: 'center' }}>Page {page + 1}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p+1)} disabled={sales.length < LIMIT}>Next →</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Vehicle</th><th>Fuel</th><th>Liters</th>
                <th>Rate</th><th>Total</th><th>Payment</th>
                <th>Cashier</th><th>Shift</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No transactions found</td></tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.sale_id}>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{page * LIMIT + i + 1}</td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-brand)', fontSize: '0.82rem', letterSpacing: '0.04em' }}>{s.reg_number}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{s.vehicle_type}</div>
                    </td>
                    <td><span className="badge badge-amber">{s.fuel_type}</span></td>
                    <td style={{ color: 'var(--blue)', fontFamily: 'var(--font-brand)', fontSize: '0.88rem' }}>{s.liters_pumped} L</td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.8rem' }}>₹{parseFloat(s.price_per_liter).toFixed(2)}</td>
                    <td style={{ color: 'var(--amber)', fontFamily: 'var(--font-brand)', fontSize: '0.92rem', fontWeight: 700 }}>{fmt(s.total_amount)}</td>
                    <td><span className={`badge ${PAYMENT_BADGE[s.payment_method]}`}>{s.payment_method}</span></td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{s.cashier_name}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{s.shift_name}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(s.sale_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <span className="modal-title">⛽ RECORD NEW SALE</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}

            <form onSubmit={submit}>
              {/* Billing estimate */}
              {estimate && (
                <div style={{
                  background: 'var(--amber-dim)',
                  border: '1px solid rgba(240,165,0,0.3)',
                  borderRadius: 8, padding: '12px 16px',
                  marginBottom: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>💰 Estimated Bill</span>
                  <span style={{ fontFamily: 'var(--font-brand)', fontSize: '1.4rem', color: 'var(--amber)', fontWeight: 700 }}>
                    ₹{parseFloat(estimate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Vehicle</label>
                  <select className="form-control" value={form.vehicle_id}
                    onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
                    <option value="">— Select Vehicle —</option>
                    {vehicles.map(v => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>{v.reg_number} ({v.vehicle_type})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select className="form-control" value={form.fuel_id}
                    onChange={e => setForm({ ...form, fuel_id: e.target.value, tank_id: '' })} required>
                    <option value="">— Select Fuel —</option>
                    {fuels.map(f => (
                      <option key={f.fuel_id} value={f.fuel_id}>{f.fuel_type} (₹{parseFloat(f.price_per_liter).toFixed(2)}/L)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tank</label>
                  <select className="form-control" value={form.tank_id}
                    onChange={e => setForm({ ...form, tank_id: e.target.value })} required>
                    <option value="">— Select Tank —</option>
                    {filteredTanks.map(t => (
                      <option key={t.tank_id} value={t.tank_id}>
                        {t.tank_name} ({parseFloat(t.remaining_stock).toLocaleString()} L left)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Liters to Pump</label>
                  <input className="form-control" type="number" step="0.01" min="0.1"
                    placeholder="e.g. 10.5" value={form.liters_pumped}
                    onChange={e => setForm({ ...form, liters_pumped: e.target.value })} required />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Shift</label>
                  <select className="form-control" value={form.shift_id}
                    onChange={e => setForm({ ...form, shift_id: e.target.value })} required>
                    <option value="">— Select Shift —</option>
                    {shifts.map(s => (
                      <option key={s.shift_id} value={s.shift_id}>{s.shift_name} – {s.emp_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cashier</label>
                  <select className="form-control" value={form.emp_id}
                    onChange={e => setForm({ ...form, emp_id: e.target.value })} required>
                    <option value="">— Select Employee —</option>
                    {emps.map(e => (
                      <option key={e.emp_id} value={e.emp_id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Cash', 'Card', 'UPI'].map(m => (
                    <label key={m} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, padding: '10px', cursor: 'pointer',
                      background: form.payment_method === m ? 'var(--amber-dim)' : 'var(--bg-surface)',
                      border: `1px solid ${form.payment_method === m ? 'var(--amber)' : 'var(--border)'}`,
                      borderRadius: 8, color: form.payment_method === m ? 'var(--amber)' : 'var(--text-2)',
                      transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="payment" value={m} checked={form.payment_method === m}
                        onChange={() => setForm({ ...form, payment_method: m })} style={{ display: 'none' }} />
                      <span>{m === 'Cash' ? '💵' : m === 'Card' ? '💳' : '📱'}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 140 }}>
                  {loading ? '⏳ Recording...' : '⛽ Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
