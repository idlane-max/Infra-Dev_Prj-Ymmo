import React from 'react';
import { Users, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';

const MOCK_CLIENTS = [
  { id: 1, name: 'Jean Dupont', email: 'jean.dupont@email.fr', property: 'Appartement T3, Lyon', status: 'interested', date: '2026-06-10' },
  { id: 2, name: 'Marie Martin', email: 'marie.martin@email.fr', property: 'Villa avec piscine, Aix', status: 'visit_planned', date: '2026-06-09' },
  { id: 3, name: 'Paul Bernard', email: 'paul.bernard@email.fr', property: 'Studio centre-ville, Marseille', status: 'offer_made', date: '2026-06-08' },
  { id: 4, name: 'Sophie Leclerc', email: 'sophie.leclerc@email.fr', property: 'Maison 5 pièces, Bordeaux', status: 'signed', date: '2026-06-07' },
  { id: 5, name: 'Thomas Petit', email: 'thomas.petit@email.fr', property: 'Local commercial, Paris', status: 'cancelled', date: '2026-06-06' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  interested:    { label: 'Intéressé',         color: 'bg-blue-100 text-blue-700',   icon: Eye },
  visit_planned: { label: 'Visite planifiée',  color: 'bg-purple-100 text-purple-700', icon: Clock },
  offer_made:    { label: 'Offre faite',        color: 'bg-amber-100 text-amber-700',  icon: Clock },
  signed:        { label: 'Signé',              color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  cancelled:     { label: 'Annulé',             color: 'bg-red-100 text-red-700',      icon: XCircle },
};

export default function ClientsTracking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Suivi clients</h1>
        <p className="mt-1 text-sm text-slate-500">Gérez les candidatures et mettez à jour les statuts clients.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total candidatures', value: MOCK_CLIENTS.length, color: 'text-slate-800' },
          { label: 'Visites planifiées', value: 1, color: 'text-purple-600' },
          { label: 'Offres en cours', value: 1, color: 'text-amber-600' },
          { label: 'Dossiers signés', value: 1, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
          <Users className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Tableau de suivi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Client</th>
                <th className="px-6 py-3 text-left font-medium">Bien concerné</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-left font-medium">Statut</th>
                <th className="px-6 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_CLIENTS.map((client) => {
                const status = STATUS_CONFIG[client.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{client.name}</p>
                        <p className="text-xs text-slate-400">{client.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{client.property}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(client.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{status.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        defaultValue={client.status}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1a2e44]"
                      >
                        <option value="interested">Intéressé</option>
                        <option value="visit_planned">Visite planifiée</option>
                        <option value="offer_made">Offre faite</option>
                        <option value="signed">Signé</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
