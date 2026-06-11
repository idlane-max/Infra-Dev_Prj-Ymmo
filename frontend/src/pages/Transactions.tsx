import React from 'react';
import { Receipt, TrendingUp, CheckCircle } from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: 'TX-001', property: 'Villa avec piscine, Aix-en-Provence', buyer: 'Marie Martin', agent: 'Agent Dupont', price: 750000, date: '2026-06-08', status: 'completed' },
  { id: 'TX-002', property: 'Appartement T3, Lyon 6e', buyer: 'Jean Bernard', agent: 'Agent Martin', price: 320000, date: '2026-06-05', status: 'completed' },
  { id: 'TX-003', property: 'Local commercial, Paris 11e', buyer: 'SARL Trident', agent: 'Agent Lefebvre', price: 480000, date: '2026-05-29', status: 'pending' },
  { id: 'TX-004', property: 'Maison 4 pièces, Bordeaux', buyer: 'Sophie Petit', agent: 'Agent Girard', price: 290000, date: '2026-05-22', status: 'completed' },
];

export default function Transactions() {
  const totalRevenue = MOCK_TRANSACTIONS
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.price, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">Historique des ventes et locations finalisées.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#1a2e44] to-[#243d57] rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Volume total</p>
              <p className="text-2xl font-bold mt-1">{formatPrice(totalRevenue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-300 opacity-60" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Transactions finalisées</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{MOCK_TRANSACTIONS.filter(t => t.status === 'completed').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">En attente</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{MOCK_TRANSACTIONS.filter(t => t.status === 'pending').length}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
          <Receipt className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Historique des transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Réf.</th>
                <th className="px-6 py-3 text-left font-medium">Bien</th>
                <th className="px-6 py-3 text-left font-medium">Acheteur</th>
                <th className="px-6 py-3 text-left font-medium">Agent</th>
                <th className="px-6 py-3 text-left font-medium">Montant</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800 text-xs leading-snug max-w-[180px]">{tx.property}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{tx.buyer}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{tx.agent}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{formatPrice(tx.price)}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{new Date(tx.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    {tx.status === 'completed' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span>Finalisée</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                        En attente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
