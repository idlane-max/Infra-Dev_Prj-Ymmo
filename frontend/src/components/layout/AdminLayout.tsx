// frontend/src/components/layout/AdminLayout.tsx
import React, { useState, useCallback } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, Users, Receipt,
  UserCircle, LogOut, ShieldCheck, Landmark, Menu, X
} from 'lucide-react';
import './layout.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

export function AdminLayout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(o => !o), []);

  if (!token) return <Navigate to="/" replace />;
  if (user?.role === 'Client') return <Navigate to="/client/properties" replace />;

  const mainLinks: NavItem[] = [
    { to: '/dashboard',    label: 'Tableau de bord',   icon: LayoutDashboard },
    { to: '/properties',   label: 'Biens immobiliers', icon: Building2 },
    { to: '/clients',      label: 'Suivi clients',      icon: Users },
    { to: '/transactions', label: 'Transactions',       icon: Receipt },
    { to: '/agencies',     label: 'Agences',            icon: Landmark },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="admin-shell">
      {/* ── Header ── */}
      <header className="admin-header" role="banner">
        <div className="header-left">
          {/* Hamburger — visible mobile seulement */}
          <button
            className="hamburger"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="header-brand">Ymmo<span>·</span>Portal</span>
        </div>

        <div className="header-right">
          {user && (
            <>
              <div className="header-user" aria-label={`Connecté en tant que ${user.email}, rôle ${user.role}`}>
                <span className="header-user-name">{user.email.split('@')[0]}</span>
                <span className="header-user-role">{user.role}</span>
              </div>
              <div className="header-avatar" aria-hidden="true">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <button className="header-logout" onClick={handleLogout} aria-label="Se déconnecter">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="admin-body">
        {/* ── Overlay mobile ── */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* ── Sidebar ── */}
        <aside
          id="admin-sidebar"
          className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
          aria-label="Navigation principale"
        >
          <nav className="sidebar-nav" aria-label="Menu principal">
            <p className="sidebar-section-label">Navigation</p>
            {mainLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={closeSidebar}
                aria-label={label}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}

            <div className="sidebar-divider" />
            <p className="sidebar-section-label">Mon compte</p>

            <NavLink
              to="/profile"
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
              aria-label="Mon profil"
            >
              <UserCircle size={18} aria-hidden="true" />
              <span>Mon profil</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="sidebar-nav-link"
              style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'none' }}
              aria-label="Se déconnecter"
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Déconnexion</span>
            </button>
          </nav>

          {/* Badge utilisateur */}
          <div className="sidebar-user-card">
            <div className="sidebar-user-inner">
              <div className="sidebar-user-avatar" aria-hidden="true">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="sidebar-user-name">{user?.email?.split('@')[0]}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={11} color="#D4AF37" aria-hidden="true" />
                  <p className="sidebar-user-role">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="admin-main" id="main-content" aria-label="Contenu principal">
          <div className="admin-main-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
