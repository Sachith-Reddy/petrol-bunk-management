import { useEffect, useState } from 'react';
import api from '../api/axios';

const EMPTY = { reg_number: '', owner_name: '', vehicle_type: 'Car', fuel_preference: '' };
const TYPE_ICONS = { Car: '🚗', Bike: '🏍️', Truck: '🚛', Bus: '🚌', Auto: '🛺' };
const TYPE_COLORS = { Car: 'var(--blue)', Bike: 'var(--amber)', Truck: 'var(--red)', Bus: 'var(--green)', Auto: 'var(--teal)' };

export default function Vehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [fuels,    setFuels]    = useState([]);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [history,  setHistory]  = useState(null);  // { vehicle, records }
  const [search,   setSearch]   = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    api.get('/vehicles').then(r => setVehicles(r.data)).catch(() => {});
    api.get('/fuels').then(r => setFuels(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY); setEditing(null); setMsg(''); setErr(''); setModal(true); };
  const openEdit = v => {
    setForm({ reg_number: v.reg_number, owner_name: v.owner_name || '', vehicle_type: v.vehicle_type, fuel_preference: v.fuel_preference || '' });
    setEditing(v.vehicle_id); setMsg(''); setErr(''); setModal(true);
  };

  const openHistory = async v => {
    const r = await api.get(`/vehicles/${v.vehicle_id}/history`);
    setHistory({ vehicle: v, records: r.data });
  };

  const submit = async e => {
    e.preventDefault(); setErr('');
    try {
      if (editing) await api.put(`/vehicles/${editing}`, form);
      else         await api.post('/vehicles', { ...form, reg_number: form.reg_number.toUpperCase() });
      setMsg(editing ? 'Vehicle updated!' : 'Vehicle registered!');
      load(); setTimeout(() => setModal(false), 800);
    } catch (er) { setErr(er.response?.data?.error || 'Error'); }
  };

  const remove = async id => {
    if (!confirm('Delete vehicle record?')) return;
    try { await api.delete(`/vehicles/${id}`); load(); }
    catch (er) { alert(er.response?.data?.error || 'Delete failed'); }
  };

  const filtered = vehicles.filter(v =>
    v.reg_number.toLowerCase().includes(search.toLowerCase()) ||
    (v.owner_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const fmt = n => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>VEHICLE REGISTRY</h1>
          <p>Log vehicle registrations and track refueling history</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Register Vehicle</button>
      </div>

      {/* Summary by type */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(TYPE_ICONS).map(([type, icon]) => {
          const count = vehicles.filter(v => v.vehicle_type === type).length;
          return (
            <div key={type} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: '1.1rem', color: TYPE_COLORS[type] }}>{count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{type}s</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Search by reg number or owner…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{filtered.length} vehicles</span>
      </div>

      {/* Vehicle grid cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(v => {
          const clr = TYPE_COLORS[v.vehicle_type] || 'var(--text-2)';
          return (
            <div key={v.vehicle_id} className="card" style={{ '--accent-color': clr, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `color-mix(in srgb, ${clr} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${clr} 40%, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem',
                  }}>
                    {TYPE_ICONS[v.vehicle_type]}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-brand)', fontSize: '1rem', color: 'var(--text-1)', letterSpacing: '0.05em' }}>
                      {v.reg_number}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
                      {v.owner_name || 'Unknown Owner'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(v)} title="Edit">✏️</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => remove(v.vehicle_id)} title="Delete">🗑</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: `color-mix(in srgb, ${clr} 12%, transparent)`, color: clr }}>
                  {v.vehicle_type}
                </span>
                {v.preferred_fuel && (
                  <span className="badge badge-amber">⛽ {v.preferred_fuel}</span>
                )}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 12 }}>
                Registered: {new Date(v.created_at).toLocaleDateString('en-IN')}
              </div>

              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => openHistory(v)}
              >
                📋 View Refuel History
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="icon">🚗</div>
            <p>No vehicles found. Register one to get started.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'EDIT VEHICLE' : 'REGISTER VEHICLE'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input className="form-control" placeholder="KA-01-AB-1234" value={form.reg_number}
                  onChange={e => setForm({ ...form, reg_number: e.target.value.toUpperCase() })}
                  required disabled={!!editing}
                  style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-brand)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <input className="form-control" placeholder="Anand Sharma" value={form.owner_name}
                  onChange={e => setForm({ ...form, owner_name: e.target.value })} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-control" value={form.vehicle_type}
                    onChange={e => setForm({ ...form, vehicle_type: e.target.value })}>
                    {Object.entries(TYPE_ICONS).map(([t, ic]) => (
                      <option key={t} value={t}>{ic} {t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Preference</label>
                  <select className="form-control" value={form.fuel_preference}
                    onChange={e => setForm({ ...form, fuel_preference: e.target.value })}>
                    <option value="">— Any —</option>
                    {fuels.map(f => <option key={f.fuel_id} value={f.fuel_id}>{f.fuel_type}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : '🚗 Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {history && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setHistory(null)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">REFUEL HISTORY</span>
                <div style={{ color: 'var(--text-2)', fontSize: '0.8rem', marginTop: 2 }}>
                  {history.vehicle.reg_number} · {history.vehicle.owner_name || 'Unknown'}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setHistory(null)}>✕</button>
            </div>

            {history.records.length === 0 ? (
              <div className="empty-state"><div className="icon">📋</div><p>No refueling records yet</p></div>
            ) : (
              <>
                {/* Mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Visits', value: history.records.length, color: 'var(--blue)' },
                    { label: 'Total Liters', value: `${history.records.reduce((a, r) => a + parseFloat(r.liters_pumped), 0).toFixed(1)} L`, color: 'var(--green)' },
                    { label: 'Total Spent', value: fmt(history.records.reduce((a, r) => a + parseFloat(r.total_amount), 0)), color: 'var(--amber)' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-brand)', fontSize: '1.05rem', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Date & Time</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Fuel</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Liters</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.records.map(r => (
                        <tr key={r.sale_id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '9px 12px', color: 'var(--text-2)' }}>
                            {new Date(r.sale_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '9px 12px' }}><span className="badge badge-amber">{r.fuel_type}</span></td>
                          <td style={{ padding: '9px 12px', color: 'var(--blue)', fontFamily: 'var(--font-brand)', fontSize: '0.85rem' }}>{r.liters_pumped} L</td>
                          <td style={{ padding: '9px 12px', color: 'var(--amber)', fontFamily: 'var(--font-brand)', fontSize: '0.85rem' }}>{fmt(r.total_amount)}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span className={`badge ${r.payment_method === 'Cash' ? 'badge-green' : r.payment_method === 'Card' ? 'badge-blue' : 'badge-amber'}`}>
                              {r.payment_method}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="modal-footer" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setHistory(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
