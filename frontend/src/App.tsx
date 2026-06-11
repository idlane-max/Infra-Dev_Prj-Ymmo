// frontend/src/App.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { ClientLayout } from './components/layout/ClientLayout';

// ── Fallback de chargement ──
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748b', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <p style={{ fontSize: '0.875rem' }}>Chargement…</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Pages publiques (chargement immédiat) ──
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// ── Pages admin/agent (lazy — chargées à la demande) ──
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const AdminPropertyForm = lazy(() => import('./pages/AdminPropertyForm'));
const ClientsTracking = lazy(() => import('./pages/ClientsTracking'));
const Transactions = lazy(() => import('./pages/Transactions'));
const ClientProfile = lazy(() => import('./pages/ClientProfile'));
const Agencies = lazy(() => import('./pages/Agencies'));

// ── Pages client (lazy) ──
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Routes publiques ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Routes client (catalogue public) ── */}
          <Route element={<ClientLayout />}>
            <Route path="/client/properties" element={<Properties />} />
            <Route path="/client/properties/:id" element={<PropertyDetail />} />
            <Route path="/checkout/:id" element={<Checkout />} />
          </Route>

          {/* ── Routes admin / agent ── */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/new" element={<AdminPropertyForm />} />
            <Route path="/properties/edit/:id" element={<AdminPropertyForm />} />
            <Route path="/clients" element={<ClientsTracking />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/profile" element={<ClientProfile />} />
            <Route path="/agencies" element={<Agencies />} />
          </Route>

          {/* ── Catch all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;