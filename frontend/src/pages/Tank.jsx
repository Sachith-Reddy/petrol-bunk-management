import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Tank() {
  const { isAdmin } = useAuth();
  const [tanks, setTanks] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [modal, setModal] = useState(false);
  const [refillModal, setRefillModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tank_name:'', fuel_id:'', capacity_liters:'', remaining_stock:'' });
  const [addLiters, setAddLiters] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    api.get('/tanks').then(r => setTanks(r.data));
    api.get('/fuels').then(r => setFuels(r.data));
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm({tank_name:'',fuel_id:'',capacity_liters:'',remaining_stock:''}); setEditing(null); setMsg(''); setErr(''); setModal(true); };
  const openEdit = t  => { setForm({tank_name:t.tank_name,fuel_id:t.fuel_id,capacity_liters:t.capacity_liters,remaining_stock:t.remaining_stock}); setEditing(t.tank_id); setMsg(''); setErr(''); setModal(true); };

  const submit = async e => {
    e.preventDefault(); setErr('');
    try {
      if (editing) await api.put(`/tanks/${editing}`, form);
      else         await api.post('/tanks', form);
      setMsg(editing ? 'Tank updated!' : 'Tank added!');
      load(); setTimeout(() => setModal(false), 800);
    } catch (er) { setErr(er.response?.data?.error || 'Error'); }
  };

  const doRefill = async () => {
    try { await api.put(`/tanks/${refillModal.tank_id}/refill`, { add_liters: addLiters }); load(); setRefillModal(null); }
    catch (er) { alert(er.response?.data?.error || 'Refill failed'); }
  };

  const remove = async id => {
    if (!confirm('Delete this tank?')) return;
    try { await api.delete(`/tanks/${id}`); load(); }
    catch (er) { alert(er.response?.data?.error || 'Delete failed'); }
  };

  const stockColor = pct => pct < 10 ? 'var(--red)' : pct < 30 ? 'var(--amber)' : 'var(--green)';

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div><h1>UNDERGROUND TANKS</h1><p>Monitor storage capacities and real-time stock levels</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={openNew}>+ Add Tank</button>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, marginBottom:28 }}>
        {tanks.map(t => {
          const pct = parseFloat(t.stock_pct || 0);
          const clr = stockColor(pct);
          return (
            <div key={t.tank_id} className="card" style={{ '--accent-color': clr }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.95rem' }}>{t.tank_name}</div>
                  <span className="badge badge-amber" style={{ marginTop:4 }}>{t.fuel_type}</span>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:5 }}>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:'0.75rem' }} onClick={() => { setRefillModal(t); setAddLiters(''); }}>🔄 Refill</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(t)}>✏️</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => remove(t.tank_id)}>🗑</button>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:'0.8rem', color:'var(--text-2)' }}>Stock Level</span>
                <span style={{ fontSize:'0.85rem', fontWeight:700, color:clr }}>{pct}%</span>
              </div>
              <div className="progress-bar" style={{ marginBottom:10 }}>
                <div className="progress-fill" style={{ width:`${pct}%`, background:clr }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
                <div style={{ background:'var(--bg-surface)', borderRadius:7, padding:'10px 12px' }}>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-3)', marginBottom:3 }}>REMAINING</div>
                  <div style={{ fontFamily:'var(--font-brand)', fontSize:'1rem', color:clr }}>{parseFloat(t.remaining_stock).toLocaleString()} L</div>
                </div>
                <div style={{ background:'var(--bg-surface)', borderRadius:7, padding:'10px 12px' }}>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-3)', marginBottom:3 }}>CAPACITY</div>
                  <div style={{ fontFamily:'var(--font-brand)', fontSize:'1rem', color:'var(--text-1)' }}>{parseFloat(t.capacity_liters).toLocaleString()} L</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'EDIT TANK' : 'ADD NEW TANK'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Tank Name</label>
                <input className="form-control" placeholder="Tank A - Petrol Main" value={form.tank_name}
                  onChange={e => setForm({...form,tank_name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <select className="form-control" value={form.fuel_id} onChange={e => setForm({...form,fuel_id:e.target.value})} required>
                  <option value="">— Select Fuel —</option>
                  {fuels.map(f => <option key={f.fuel_id} value={f.fuel_id}>{f.fuel_type}</option>)}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Capacity (Liters)</label>
                  <input className="form-control" type="number" min="1" value={form.capacity_liters}
                    onChange={e => setForm({...form,capacity_liters:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Stock (L)</label>
                  <input className="form-control" type="number" min="0" value={form.remaining_stock}
                    onChange={e => setForm({...form,remaining_stock:e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Tank'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refill modal */}
      {refillModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setRefillModal(null)}>
          <div className="modal" style={{ maxWidth:360 }}>
            <div className="modal-header">
              <span className="modal-title">REFILL TANK</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setRefillModal(null)}>✕</button>
            </div>
            <p style={{ color:'var(--text-2)', fontSize:'0.85rem', marginBottom:16 }}>
              <strong style={{ color:'var(--text-1)' }}>{refillModal.tank_name}</strong><br />
              Current: {parseFloat(refillModal.remaining_stock).toLocaleString()} L / {parseFloat(refillModal.capacity_liters).toLocaleString()} L
            </p>
            <div className="form-group">
              <label className="form-label">Liters to Add</label>
              <input className="form-control" type="number" min="1" placeholder="e.g. 2000"
                value={addLiters} onChange={e => setAddLiters(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRefillModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doRefill}>🔄 Refill Tank</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
