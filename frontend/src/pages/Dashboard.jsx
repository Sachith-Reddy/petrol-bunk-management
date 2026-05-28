import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,  setStats]  = useState(null);
  const [tanks,  setTanks]  = useState([]);
  const [sales,  setSales]  = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.get('/sales/today').then(r => setStats(r.data)).catch(() => {});
    api.get('/tanks').then(r => setTanks(r.data)).catch(() => {});
    api.get('/sales?limit=8').then(r => setSales(r.data)).catch(() => {});
    api.get('/reports/low-stock').then(r => setAlerts(r.data)).catch(() => {});
  }, []);

  const fmt = n => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const STAT_CARDS = [
    { icon: '💰', label: "Today's Revenue",    value: fmt(stats?.total_revenue),  color: 'var(--amber)' },
    { icon: '⛽', label: 'Liters Dispensed',   value: `${parseFloat(stats?.total_liters || 0).toFixed(1)} L`, color: 'var(--blue)' },
    { icon: '🧾', label: 'Total Transactions', value: stats?.total_sales || 0,    color: 'var(--green)' },
    { icon: '🗄️', label: 'Active Tanks',       value: tanks.length,               color: 'var(--purple)' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>DASHBOARD</h1>
        <p>Welcome back, {user?.name} · {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      </div>

      {alerts.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚠️ <strong>{alerts.length} tank(s)</strong> have critically low stock — refill required!
        </div>
      )}

      {/* Stat cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(({ icon, label, value, color }) => (
          <div key={label} className="stat-card" style={{ '--accent-color': color }}>
            <span className="stat-icon">{icon}</span>
            <div className="stat-value">{value ?? '—'}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Tank stock levels */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: 18, color: 'var(--text-2)' }}>
            TANK STOCK LEVELS
          </h3>
          {tanks.length === 0 ? <div className="empty-state"><p>No tanks found</p></div> : (
            tanks.map(t => {
              const pct = parseFloat(t.stock_pct || 0);
              const clr = pct < 10 ? 'var(--red)' : pct < 30 ? 'var(--amber)' : 'var(--green)';
              return (
                <div key={t.tank_id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-1)' }}>{t.tank_name}</span>
                    <span style={{ fontSize: '0.8rem', color: clr, fontWeight: 600 }}>
                      {parseFloat(t.remaining_stock).toLocaleString()} L ({pct}%)
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: clr }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent sales */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: 18, color: 'var(--text-2)' }}>
            RECENT TRANSACTIONS
          </h3>
          {sales.length === 0 ? <div className="empty-state"><p>No sales today</p></div> : (
            sales.map(s => (
              <div key={s.sale_id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.reg_number}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
                    {s.fuel_type} · {s.liters_pumped} L · {s.shift_name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--amber)', fontWeight: 600 }}>
                    {fmt(s.total_amount)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                    {new Date(s.sale_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
