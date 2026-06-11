// frontend/src/components/layout/ClientLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

export function ClientLayout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem' }}>

          {/* Logo */}
          <Link to="/client/properties" style={{ display: 'flex', alignItems: 'baseline', gap: 4, textDecoration: 'none' }} aria-label="Ymmo — Accueil">
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a2e44', fontFamily: 'Georgia, serif' }}>Ymmo</span>
            <span style={{ width: 6, height: 6, background: '#D4AF37', borderRadius: '50%', display: 'inline-block', marginBottom: 2 }} aria-hidden="true" />
          </Link>

          {/* Nav desktop */}
          <nav aria-label="Navigation principale" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="client-nav-desktop">
            <Link to="/client/properties" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a2e44', textDecoration: 'none' }}>Acheter</Link>
            <Link to="/client/properties?mode=rent" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b', textDecoration: 'none' }}>Louer</Link>
          </nav>

          {/* Actions desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="client-actions-desktop">
            {token && user ? (
              <>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{user.email.split('@')[0]}</span>
                <button
                  onClick={() => logout()}
                  style={{ fontSize: '0.8rem', color: '#64748b', background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer' }}
                  aria-label="Se déconnecter"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ fontSize: '0.875rem', color: '#475569', textDecoration: 'none', fontWeight: 500 }}>Connexion</Link>
                <Link
                  to="/register"
                  style={{ fontSize: '0.875rem', background: '#1a2e44', color: '#fff', padding: '0.45rem 1rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>

          {/* Hamburger mobile */}
          <button
            className="client-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <nav
            aria-label="Menu mobile"
            style={{ background: '#fff', borderTop: '1px solid #f1f5f9', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <Link to="/client/properties" onClick={() => setMenuOpen(false)} style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a2e44', textDecoration: 'none', padding: '0.5rem 0' }}>
              🏠 Acheter
            </Link>
            <Link to="/client/properties?mode=rent" onClick={() => setMenuOpen(false)} style={{ fontSize: '0.9rem', color: '#475569', textDecoration: 'none', padding: '0.5rem 0' }}>
              🔑 Louer
            </Link>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {token && user ? (
                <>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Connecté : {user.email}</span>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    style={{ fontSize: '0.875rem', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, textAlign: 'left' }}
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} style={{ fontSize: '0.875rem', color: '#475569', textDecoration: 'none', fontWeight: 500, padding: '0.4rem 0' }}>
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    style={{ fontSize: '0.875rem', background: '#1a2e44', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none', display: 'block', textAlign: 'center' }}
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* ── CONTENU ── */}
      <main style={{ flex: 1, width: '100%', background: '#f8fafc' }} id="main-content" aria-label="Contenu principal">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f172a', color: '#64748b', fontSize: '0.8rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.25rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e2e8f0', fontFamily: 'Georgia, serif' }}>Ymmo</span>
                <span style={{ width: 5, height: 5, background: '#D4AF37', borderRadius: '50%', display: 'inline-block' }} />
              </div>
              <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '0.8rem' }}>L'excellence immobilière depuis 2026. 12 agences en France.</p>
            </div>
            <div>
              <h3 style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Parcourir</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><Link to="/client/properties" style={{ color: '#64748b', textDecoration: 'none' }}>Acheter</Link></li>
                <li><Link to="/client/properties" style={{ color: '#64748b', textDecoration: 'none' }}>Louer</Link></li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Légal</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Mentions légales</a></li>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
            © 2026 Ymmo. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* Styles responsive inline */}
      <style>{`
        @media (max-width: 768px) {
          .client-nav-desktop { display: none !important; }
          .client-actions-desktop { display: none !important; }
          .client-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .client-hamburger { display: none !important; }
        }
      `}</style>
    </div>
  );
}
