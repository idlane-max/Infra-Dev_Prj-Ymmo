// frontend/src/pages/Agencies.tsx
import React, { useEffect, useState } from 'react';
import './Agencies.css';
import { api } from '../services/api';

interface Agency {
  id: number;
  name: string;
  city: string;
  is_headquarters: boolean;
  agents_count: number;
  properties_count: number;
  ca_total: number;
}

interface AgentDetail {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  properties_count: number;
}

interface AgencyDetail {
  id: number;
  name: string;
  city: string;
  is_headquarters: boolean;
  agents: AgentDetail[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export default function Agencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selected, setSelected] = useState<AgencyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/agencies/')
      .then(r => setAgencies(r.data))
      .catch(() => setError('Impossible de charger les agences.'))
      .finally(() => setLoading(false));
  }, []);

  const openAgency = async (id: number) => {
    setDetailLoading(true);
    try {
      const r = await api.get(`/agencies/${id}`);
      setSelected(r.data);
    } catch {
      setError('Impossible de charger le détail de l\'agence.');
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return <div className="agencies-loader" role="status" aria-label="Chargement"><span>Chargement…</span></div>;
  }

  return (
    <main className="agencies-page">
      <header className="agencies-header">
        <h1 className="agencies-title">
          {selected ? (
            <>
              <button className="detail-back" onClick={() => setSelected(null)} aria-label="Retour à la liste des agences">
                ← Retour
              </button>
              {selected.name}
            </>
          ) : (
            '🏢 Nos agences'
          )}
        </h1>
        {!selected && (
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {agencies.length} agence{agencies.length > 1 ? 's' : ''}
          </span>
        )}
      </header>

      {error && <div role="alert" style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}>{error}</div>}

      {/* Liste des agences */}
      {!selected && (
        <section aria-label="Liste des agences">
          <div className="agencies-grid">
            {agencies.map(agency => (
              <article
                key={agency.id}
                className={`agency-card ${agency.is_headquarters ? 'hq' : ''}`}
                onClick={() => openAgency(agency.id)}
                onKeyDown={e => e.key === 'Enter' && openAgency(agency.id)}
                tabIndex={0}
                role="button"
                aria-label={`Agence ${agency.name} — ${agency.city}`}
              >
                <div className="agency-card-header">
                  <div>
                    <h2 className="agency-name">{agency.name}</h2>
                    <p className="agency-city">📍 {agency.city}</p>
                  </div>
                  {agency.is_headquarters && (
                    <span className="agency-badge-hq" aria-label="Siège social">Siège</span>
                  )}
                </div>

                <div className="agency-stats">
                  <div className="agency-stat">
                    <p className="agency-stat-value">{agency.agents_count}</p>
                    <p className="agency-stat-label">Agents</p>
                  </div>
                  <div className="agency-stat">
                    <p className="agency-stat-value">{agency.properties_count}</p>
                    <p className="agency-stat-label">Biens</p>
                  </div>
                  <div className="agency-stat">
                    <p className="agency-stat-value">{Math.round(agency.ca_total / 1_000_000)}M</p>
                    <p className="agency-stat-label">CA (M€)</p>
                  </div>
                </div>

                <p className="agency-ca">
                  CA Total : <span>{fmt(agency.ca_total)}</span>
                </p>
              </article>
            ))}
          </div>
          {agencies.length === 0 && !error && (
            <p className="agencies-empty">Aucune agence disponible.</p>
          )}
        </section>
      )}

      {/* Détail agence */}
      {selected && !detailLoading && (
        <section className="agency-detail" aria-label={`Détail de l'agence ${selected.name}`}>
          <p className="agency-city" style={{ marginBottom: '1rem' }}>📍 {selected.city}</p>
          <h2 className="detail-title">
            Équipe — {selected.agents.length} agent{selected.agents.length > 1 ? 's' : ''}
          </h2>
          {selected.agents.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="agents-table" aria-label={`Agents de l'agence ${selected.name}`}>
                <thead>
                  <tr>
                    <th scope="col">Email</th>
                    <th scope="col">Rôle</th>
                    <th scope="col">Biens gérés</th>
                    <th scope="col">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.agents.map(agent => (
                    <tr key={agent.id}>
                      <td>{agent.email}</td>
                      <td>{agent.role}</td>
                      <td style={{ textAlign: 'center' }}>{agent.properties_count}</td>
                      <td>
                        <span className={agent.is_active ? 'badge-active' : 'badge-inactive'}>
                          {agent.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Aucun agent dans cette agence.</p>
          )}
        </section>
      )}

      {detailLoading && (
        <div className="agencies-loader" role="status" aria-label="Chargement du détail">
          <span>Chargement de l'agence…</span>
        </div>
      )}
    </main>
  );
}
