import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: 'admin@fueltrack.com', password: 'Admin@123' });
  const [err,  setErr]  = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (error) {
      setErr(error.response?.data?.error || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-root)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundImage: `
        radial-gradient(ellipse 600px 400px at 20% 50%, rgba(240,165,0,0.05) 0%, transparent 60%),
        radial-gradient(ellipse 400px 300px at 80% 80%, rgba(79,168,240,0.04) 0%, transparent 60%)
      `,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '2rem', fontWeight: 900,
            color: 'var(--amber)',
            textShadow: '0 0 30px rgba(240,165,0,0.5)',
            letterSpacing: '0.1em',
          }}>
            ⛽ FUELTRACK
          </div>
          <div style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginTop: 6, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Petrol Bunk Management Pro
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '36px' }}>
          <h2 style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '1rem',
            letterSpacing: '0.08em',
            marginBottom: 6,
            color: 'var(--text-1)',
          }}>STATION LOGIN</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem', marginBottom: 28 }}>
            Sign in to access the management dashboard
          </p>

          {err && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {err}</div>}

          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                placeholder="admin@fueltrack.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div style={{
              background: 'var(--amber-dim)',
              border: '1px solid rgba(240,165,0,0.2)',
              borderRadius: '7px',
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: '0.78rem',
              color: 'var(--amber)',
            }}>
              <strong>Demo credentials:</strong><br />
              Email: admin@fueltrack.com &nbsp;|&nbsp; Password: Admin@123
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', justifyContent: 'center' }}>
              {loading ? '⏳ Signing in...' : '🔑 Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--text-2)' }}>
            New employee?{' '}
            <Link to="/register" style={{ color: 'var(--amber)', textDecoration: 'none', fontWeight: 600 }}>
              Register here →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
