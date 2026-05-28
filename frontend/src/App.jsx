import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Fuel        from './pages/Fuel';
import Tank        from './pages/Tank';
import Employee    from './pages/Employee';
import Shift       from './pages/Shift';
import Vehicle     from './pages/Vehicle';
import Sale        from './pages/Sale';
import Reports     from './pages/Reports';
import Layout      from './components/Layout';

function Guard({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index         element={<Dashboard />} />
            <Route path="fuel"   element={<Fuel />} />
            <Route path="tanks"  element={<Tank />} />
            <Route path="employees" element={<Employee />} />
            <Route path="shifts" element={<Shift />} />
            <Route path="vehicles"  element={<Vehicle />} />
            <Route path="sales"  element={<Sale />} />
            <Route path="reports"   element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
