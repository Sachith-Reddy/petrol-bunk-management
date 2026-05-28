import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// All available roles with display labels and badge colors
const ROLES = [
  { value: 'admin',             label: 'Admin',                    badge: 'badge-red'    },
  { value: 'manager',           label: 'Manager',                  badge: 'badge-amber'  },
  { value: 'cashier',           label: 'Cashier',                  badge: 'badge-green'  },
  { value: 'pump_operator',     label: 'Pump Operator',            badge: 'badge-blue'   },
  { value: 'loader',            label: 'Loader',                   badge: 'badge-gray'   },
  { value: 'inventory_clerk',   label: 'Stock & Inventory Clerk',  badge: 'badge-blue'   },
  { value: 'carwash_attendant', label: 'Car Wash Attendant',       badge: 'badge-gray'   },
  { value: 'field_engineer',    label: 'Field Service Engineer',   badge: 'badge-gray'   },
];

const ROLE_ICONS = {
  admin:             '👑',
  manager:           '🏢',
  cashier:           '💳',
  pump_operator:     '⛽',
  loader:            '🏗️',
  inventory_clerk:   '📦',
  carwash_attendant: '🚿',
  field_engineer:    '🔧',
};

const getRoleMeta = val => ROLES.find(r => r.value === val) || { label: val, badge: 'badge-gray' };

const ADD_EMPTY  = { name:'', email:'', password:'', phone:'', role:'cashier', hire_date:'', is_active:1 };
const EDIT_EMPTY = { name:'', phone:'', role:'cashier', is_active:1 };

export default function Employee() {
  const { isAdmin } = useAuth();
  const [emps,    setEmps]    = useState([]);
  const [modal,   setModal]   = useState(false);   // 'add' | 'edit' | false
  const [editing, setEditing] = useState(null);
  const [addForm, setAddForm] = useState(ADD_EMPTY);
  const [editForm,setEditForm]= useState(EDIT_EMPTY);
  const [msg,  setMsg]  = useState('');
  const [err,  setErr]  = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showPass, setShowPass] = useState(false);

  const load = () => api.get('/employees').then(r => setEmps(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setAddForm(ADD_EMPTY); setMsg(''); setErr('');
    setShowPass(false); setModal('add');
  };

  const openEdit = emp => {
    setEditForm({ name:emp.name, phone:emp.phone||'', role:emp.role, is_active:emp.is_active });
    setEditing(emp.emp_id); setMsg(''); setErr(''); setModal('edit');
  };

  const submitAdd = async e => {
    e.preventDefault(); setErr('');
    if (addForm.password.length < 6) return setErr('Password must be at least 6 characters.');
    try {
      await api.post('/auth/register', addForm);
      setMsg('✅ Employee added successfully!');
      load(); setTimeout(() => setModal(false), 900);
    } catch (er) { setErr(er.response?.data?.error || 'Failed to add employee.'); }
  };

  const submitEdit = async e => {
    e.preventDefault(); setErr('');
    try {
      await api.put(`/employees/${editing}`, editForm);
      setMsg('✅ Employee updated!'); load(); setTimeout(() => setModal(false), 800);
    } catch (er) { setErr(er.response?.data?.error || 'Error updating employee.'); }
  };

  const remove = async id => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try { await api.delete(`/employees/${id}`); load(); }
    catch (er) { alert(er.response?.data?.error || 'Delete failed'); }
  };

  // Filter by search + role
  const filtered = emps.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Role counts for summary
  const roleCounts = ROLES.map(r => ({
    ...r,
    count: emps.filter(e => e.role === r.value).length,
  })).filter(r => r.count > 0);

  const setA = k => e => setAddForm(f  => ({ ...f,  [k]: e.target.value }));
  const setE = k => e => setEditForm(f => ({ ...f,  [k]: e.target.value }));

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1>EMPLOYEES</h1>
          <p>Manage all station staff — {emps.length} total employees</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
      </div>

      {/* Role summary pills */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        <button
          onClick={() => setRoleFilter('all')}
          style={{
            padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer',
            background: roleFilter==='all' ? 'var(--amber)' : 'var(--bg-card)',
            color: roleFilter==='all' ? '#0a0b10' : 'var(--text-2)',
            fontSize:'0.78rem', fontWeight:600,
            border: roleFilter==='all' ? 'none' : '1px solid var(--border)',
          }}>
          All ({emps.length})
        </button>
        {roleCounts.map(r => (
          <button key={r.value}
            onClick={() => setRoleFilter(roleFilter === r.value ? 'all' : r.value)}
            style={{
              padding:'5px 14px', borderRadius:20, cursor:'pointer',
              background: roleFilter===r.value ? 'var(--amber-dim)' : 'var(--bg-card)',
              color: roleFilter===r.value ? 'var(--amber)' : 'var(--text-2)',
              border: roleFilter===r.value ? '1px solid var(--amber)' : '1px solid var(--border)',
              fontSize:'0.78rem', fontWeight:600,
            }}>
            {ROLE_ICONS[r.value]} {r.label} ({r.count})
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>
          Showing {filtered.length} of {emps.length} employees
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Email</th><th>Role</th>
                <th>Phone</th><th>Hire Date</th><th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign:'center', padding:'40px', color:'var(--text-3)' }}>
                    No employees found
                  </td>
                </tr>
              ) : (
                filtered.map((e, i) => {
                  const roleMeta = getRoleMeta(e.role);
                  return (
                    <tr key={e.emp_id}>
                      <td style={{ color:'var(--text-3)' }}>{i+1}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:34, height:34, borderRadius:'50%',
                            background:'var(--amber-dim)',
                            border:'1px solid var(--amber)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'0.82rem', color:'var(--amber)', fontWeight:700,
                            flexShrink:0,
                          }}>
                            {e.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{e.name}</div>
                            <div style={{ fontSize:'0.7rem', color:'var(--text-3)' }}>
                              {ROLE_ICONS[e.role]} {roleMeta.label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>{e.email}</td>
                      <td>
                        <span className={`badge ${roleMeta.badge}`}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td style={{ color:'var(--text-2)' }}>{e.phone || '—'}</td>
                      <td style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>
                        {new Date(e.hire_date).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge ${e.is_active ? 'badge-green' : 'badge-red'}`}>
                          {e.is_active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}
                            style={{ marginRight:6 }}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(e.emp_id)}>🗑</button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD EMPLOYEE MODAL ── */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="modal-header">
              <span className="modal-title">➕ ADD NEW EMPLOYEE</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}

            <form onSubmit={submitAdd}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" placeholder="e.g. Kiran Kumar"
                    value={addForm.name} onChange={setA('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-control" placeholder="e.g. 9876543210"
                    value={addForm.phone} onChange={setA('phone')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-control" type="email"
                  placeholder="e.g. kiran@fueltrack.com"
                  value={addForm.email} onChange={setA('email')} required />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position:'relative' }}>
                  <input
                    className="form-control"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={addForm.password}
                    onChange={setA('password')}
                    required
                    minLength={6}
                    style={{ paddingRight:44 }}
                  />
                  <button type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{
                      position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'var(--text-3)',
                      fontSize:'1rem',
                    }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-control" value={addForm.role} onChange={setA('role')}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>
                      {ROLE_ICONS[r.value]} {r.label}
                    </option>
                  ))}
                </select>
                <div style={{
                  marginTop:8, padding:'8px 12px',
                  background:'var(--bg-surface)',
                  borderRadius:'var(--radius-sm)',
                  fontSize:'0.75rem', color:'var(--text-2)',
                }}>
                  {addForm.role === 'admin'             && '👑 Full system access — manage everything'}
                  {addForm.role === 'manager'           && '🏢 Can manage staff, tanks, fuels and view reports'}
                  {addForm.role === 'cashier'           && '💳 Can record sales and view basic dashboard'}
                  {addForm.role === 'pump_operator'     && '⛽ Operates fuel pumps and records dispensing'}
                  {addForm.role === 'loader'            && '🏗️ Handles fuel loading and unloading from tankers'}
                  {addForm.role === 'inventory_clerk'   && '📦 Manages stock levels, tank refills and inventory records'}
                  {addForm.role === 'carwash_attendant' && '🚿 Operates the car wash facility and logs services'}
                  {addForm.role === 'field_engineer'    && '🔧 Maintains and repairs pumps and equipment'}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Hire Date *</label>
                  <input className="form-control" type="date"
                    value={addForm.hire_date} onChange={setA('hire_date')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={addForm.is_active}
                    onChange={e => setAddForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                    <option value={1}>● Active</option>
                    <option value={0}>○ Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">➕ Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT EMPLOYEE MODAL ── */}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:500 }}>
            <div className="modal-header">
              <span className="modal-title">✏️ EDIT EMPLOYEE</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}

            <form onSubmit={submitEdit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={editForm.name}
                    onChange={setE('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={editForm.phone}
                    onChange={setE('phone')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={editForm.role} onChange={setE('role')}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>
                      {ROLE_ICONS[r.value]} {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={editForm.is_active}
                  onChange={e => setEditForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                  <option value={1}>● Active</option>
                  <option value={0}>○ Inactive</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">💾 Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
