import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EMPTY = { fuel_type: '', price_per_liter: '', description: '' };

export default function Fuel() {
  const { isAdmin } = useAuth();
  const [fuels,    setFuels]    = useState([]);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [msg,      setMsg]      = useState('');
  const [err,      setErr]      = useState('');

  const load = () => api.get('/fuels').then(r => setFuels(r.data));
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY); setEditing(null); setMsg(''); setErr(''); setModal(true); };
  const openEdit = f  => { setForm({ fuel_type: f.fuel_type, price_per_liter: f.price_per_liter, description: f.description || '' }); setEditing(f.fuel_id); setMsg(''); setErr(''); setModal(true); };

  const submit = async e => {
    e.preventDefault(); setErr('');
    try {
      if (editing) { await api.put(`/fuels/${editing}`, form); setMsg('Fuel updated!'); }
      else         { await api.post('/fuels', form);            setMsg('Fuel added!'); }
      load(); setTimeout(() => setModal(false), 800);
    } catch (error) { setErr(error.response?.data?.error || 'Error'); }
  };

  const remove = async id => {
    if (!confirm('Delete this fuel type?')) return;
    try { await api.delete(`/fuels/${id}`); load(); }
    catch (error) { alert(error.response?.data?.error || 'Delete failed'); }
  };

  const COLOR = { Petrol:'var(--petrol-color)', Diesel:'var(--diesel-color)', CNG:'var(--cng-color)' };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1>FUEL TYPES</h1>
          <p>Manage fuel categories and current market prices</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openNew}>+ Add Fuel</button>}
      </div>

      {/* Fuel cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
        {fuels.map(f => (
          <div key={f.fuel_id} className="card" style={{ '--accent-color': COLOR[f.fuel_type] || 'var(--amber)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-brand)', fontSize: '1rem', color: COLOR[f.fuel_type] || 'var(--amber)', letterSpacing: '0.05em' }}>
                {f.fuel_type}
              </span>
              {isAdmin && (
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(f)}>✏️</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => remove(f.fuel_id)}>🗑</button>
                </div>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-brand)', fontSize: '1.8rem', fontWeight: 700, color: COLOR[f.fuel_type] || 'var(--amber)' }}>
              ₹{parseFloat(f.price_per_liter).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 2 }}>per liter</div>
            {f.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: 10 }}>{f.description}</p>}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 10 }}>
              Updated: {new Date(f.updated_at).toLocaleDateString('en-IN')}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.85rem', letterSpacing: '0.08em', color: 'var(--text-2)' }}>
            FUEL PRICE TABLE
          </h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Fuel Type</th><th>Price/Liter</th><th>Description</th><th>Last Updated</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {fuels.map((f, i) => (
                <tr key={f.fuel_id}>
                  <td style={{ color: 'var(--text-3)' }}>{i + 1}</td>
                  <td><span className="badge badge-amber">{f.fuel_type}</span></td>
                  <td style={{ fontFamily: 'var(--font-brand)', color: 'var(--amber)' }}>₹{parseFloat(f.price_per_liter).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-2)' }}>{f.description || '—'}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{new Date(f.updated_at).toLocaleDateString('en-IN')}</td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)} style={{ marginRight: 8 }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(f.fuel_id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'EDIT FUEL' : 'ADD NEW FUEL'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <input className="form-control" placeholder="e.g. Petrol" value={form.fuel_type}
                  onChange={e => setForm({...form, fuel_type: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price per Liter (₹)</label>
                <input className="form-control" type="number" step="0.01" min="1" placeholder="102.50" value={form.price_per_liter}
                  onChange={e => setForm({...form, price_per_liter: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" placeholder="Brief description" value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Fuel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
