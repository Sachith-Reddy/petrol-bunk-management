import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EMPTY = { shift_name: 'Morning', start_time: '06:00', end_time: '14:00', emp_id: '', shift_date: '' };

const SHIFT_COLORS = { Morning: 'var(--amber)', Afternoon: 'var(--blue)', Night: 'var(--purple)' };
const SHIFT_ICONS  = { Morning: '🌅', Afternoon: '☀️', Night: '🌙' };

export default function Shift() {
  const { isAdmin } = useAuth();
  const [shifts,  setShifts]  = useState([]);
  const [emps,    setEmps]    = useState([]);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    const q = filterDate ? `?date=${filterDate}` : '';
    api.get(`/shifts${q}`).then(r => setShifts(r.data)).catch(() => {});
    api.get('/employees').then(r => setEmps(r.data.filter(e => e.is_active))).catch(() => {});
  };
  useEffect(() => { load(); }, [filterDate]);

  const openNew = () => {
    setForm({ ...EMPTY, shift_date: filterDate || new Date().toISOString().split('T')[0] });
    setMsg(''); setErr(''); setModal(true);
  };

  const submit = async e => {
    e.preventDefault(); setErr('');
    try {
      await api.post('/shifts', form);
      setMsg('Shift scheduled!'); load(); setTimeout(() => setModal(false), 800);
    } catch (er) { setErr(er.response?.data?.error || 'Error saving shift'); }
  };

  const remove = async id => {
    if (!confirm('Delete this shift?')) return;
    try { await api.delete(`/shifts/${id}`); load(); }
    catch (er) { alert(er.response?.data?.error || 'Delete failed'); }
  };

  const shiftPresets = {
    Morning:   { start_time: '06:00', end_time: '14:00' },
    Afternoon: { start_time: '14:00', end_time: '22:00' },
    Night:     { start_time: '22:00', end_time: '06:00' },
  };

  const handleShiftName = e => {
    const name = e.target.value;
    setForm({ ...form, shift_name: name, ...shiftPresets[name] });
  };

  // Group shifts by shift_name for summary
  const grouped = shifts.reduce((acc, s) => {
    acc[s.shift_name] = acc[s.shift_name] || [];
    acc[s.shift_name].push(s);
    return acc;
  }, {});

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>SHIFT MANAGEMENT</h1>
          <p>Coordinate morning, afternoon, and night duty slots</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openNew}>+ Schedule Shift</button>
        )}
      </div>

      {/* Date filter */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
        <span style={{ color: 'var(--text-2)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          📅 View Date
        </span>
        <input
          className="form-control"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ maxWidth: 180 }}
        />
        <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}>
          Today
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate('')}>
          All Dates
        </button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: '0.82rem' }}>
          {shifts.length} shift{shifts.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Shift summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {['Morning', 'Afternoon', 'Night'].map(name => {
          const list = grouped[name] || [];
          const clr  = SHIFT_COLORS[name];
          return (
            <div key={name} className="stat-card" style={{ '--accent-color': clr }}>
              <span className="stat-icon">{SHIFT_ICONS[name]}</span>
              <div className="stat-value" style={{ fontSize: '1.4rem' }}>{list.length}</div>
              <div className="stat-label">{name} Shifts</div>
              {list.length > 0 && (
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-2)' }}>
                  {list.map(s => s.emp_name).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shift list - grouped visually */}
      {['Morning', 'Afternoon', 'Night'].map(name => {
        const list = (grouped[name] || []);
        if (!list.length && filterDate) return null;
        const clr = SHIFT_COLORS[name];
        return (
          <div key={name} className="card" style={{ marginBottom: 16, padding: 0 }}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius) var(--radius) 0 0',
            }}>
              <span style={{ fontSize: '1.2rem' }}>{SHIFT_ICONS[name]}</span>
              <span style={{ fontFamily: 'var(--font-brand)', fontSize: '0.85rem', letterSpacing: '0.08em', color: clr }}>
                {name.toUpperCase()} SHIFT
              </span>
              <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>
                {shiftPresets[name].start_time} – {shiftPresets[name].end_time}
              </span>
              <span className="badge" style={{ marginLeft: 'auto', background: `color-mix(in srgb, ${clr} 15%, transparent)`, color: clr }}>
                {list.length} assigned
              </span>
            </div>

            {list.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <p>No {name.toLowerCase()} shift scheduled for this date</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th><th>Role</th><th>Date</th>
                      <th>Start</th><th>End</th>
                      {isAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(s => (
                      <tr key={s.shift_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%',
                              background: `color-mix(in srgb, ${clr} 15%, transparent)`,
                              border: `1px solid ${clr}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.78rem', color: clr, fontWeight: 700,
                            }}>
                              {s.emp_name?.[0]}
                            </div>
                            <span style={{ fontWeight: 600 }}>{s.emp_name}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{s.role}</span></td>
                        <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
                          {new Date(s.shift_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ color: clr, fontFamily: 'var(--font-brand)', fontSize: '0.85rem' }}>{s.start_time}</td>
                        <td style={{ color: clr, fontFamily: 'var(--font-brand)', fontSize: '0.85rem' }}>{s.end_time}</td>
                        {isAdmin && (
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(s.shift_id)}>🗑 Remove</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Schedule Shift Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">SCHEDULE NEW SHIFT</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Shift Period</label>
                <select className="form-control" value={form.shift_name} onChange={handleShiftName}>
                  <option value="Morning">🌅 Morning (06:00 – 14:00)</option>
                  <option value="Afternoon">☀️ Afternoon (14:00 – 22:00)</option>
                  <option value="Night">🌙 Night (22:00 – 06:00)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="form-control" value={form.emp_id} onChange={e => setForm({ ...form, emp_id: e.target.value })} required>
                  <option value="">— Select Employee —</option>
                  {emps.map(e => (
                    <option key={e.emp_id} value={e.emp_id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input className="form-control" type="time" value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input className="form-control" type="time" value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Shift Date</label>
                <input className="form-control" type="date" value={form.shift_date}
                  onChange={e => setForm({ ...form, shift_date: e.target.value })} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">📅 Schedule Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
