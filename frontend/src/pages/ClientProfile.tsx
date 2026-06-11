import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Mail, ShieldCheck, Building } from 'lucide-react';

export default function ClientProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar & infos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1a2e44] to-[#243d57] flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{user?.email?.split('@')[0]}</h2>
          <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
          <div className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-semibold text-[#D4AF37]">{user?.role}</span>
          </div>
        </div>

        {/* Détails */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Informations du compte</h3>
          <div className="space-y-4">
            {[
              { icon: Mail, label: 'Email', value: user?.email || '—' },
              { icon: UserCircle, label: 'Identifiant', value: user?.email?.split('@')[0] || '—' },
              { icon: ShieldCheck, label: 'Rôle', value: user?.role || '—' },
              { icon: Building, label: 'Statut', value: 'Compte actif' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            💡 La modification du profil sera disponible dans une prochaine version.
          </div>
        </div>
      </div>
    </div>
  );
}
