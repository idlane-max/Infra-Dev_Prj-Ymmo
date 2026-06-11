import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, Users, Receipt, UserCircle, LogOut, ShieldCheck, Landmark
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mainLinks: NavItem[] = [
    { to: '/dashboard',    label: 'Tableau de bord',   icon: LayoutDashboard },
    { to: '/properties',   label: 'Biens immobiliers', icon: Building2 },
    { to: '/clients',      label: 'Suivi clients',      icon: Users },
    { to: '/transactions', label: 'Transactions',       icon: Receipt },
    // Agences visibles pour Direction et Commercial
    ...(user?.role !== 'Client' ? [{ to: '/agencies', label: 'Agences', icon: Landmark }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-[#0f1c2d] text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col shadow-xl">
      {/* Nav principale */}
      <div className="p-5 flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-2">
          Navigation
        </p>
        <nav className="space-y-1">
          {mainLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-semibold'
                    : 'hover:bg-white/5 hover:text-white text-slate-400'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Séparateur */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-2">
            Mon compte
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-semibold'
                    : 'hover:bg-white/5 hover:text-white text-slate-400'
                }`
              }
            >
              <UserCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Mon profil</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-all duration-150"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Déconnexion</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Badge utilisateur */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3 px-3 py-3 bg-white/5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.email?.split('@')[0]}</p>
            <div className="flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
              <p className="text-xs text-[#D4AF37]">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
