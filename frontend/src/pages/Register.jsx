import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'cashier', phone:'', hire_date:'' });
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handle = async e => {
    e.preventDefault();
    setErr(''); setMsg(''); setLoading(true);
    try {
      await register(form);
      setMsg('✅ Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setErr(error.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-root)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-brand)', fontSize: '1.6rem', color: 'var(--amber)', fontWeight: 900, letterSpacing: '0.1em' }}>
            ⛽ FUELTRACK
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem', marginTop: 5 }}>Create Employee Account</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.95rem', letterSpacing: '0.08em', marginBottom: 24 }}>
            NEW EMPLOYEE REGISTRATION
          </h2>

          {err && <div className="alert alert-error">{err}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}

          <form onSubmit={handle}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" placeholder="Ravi Kumar" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" placeholder="ravi@fueltrack.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={form.role} onChange={set('role')}>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hire Date</label>
                <input className="form-control" type="date" value={form.hire_date} onChange={set('hire_date')} required />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
              {loading ? '⏳ Registering...' : '✅ Register Employee'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.82rem', color: 'var(--text-2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--amber)', textDecoration: 'none', fontWeight: 600 }}>← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
