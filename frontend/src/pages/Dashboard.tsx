// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Summary {
  total_biens: number;
  biens_disponibles: number;
  biens_vendus: number;
  biens_en_cours: number;
  taux_conversion: number;
  ca_total: number;
  ca_mois: number;
  ventes_mois: number;
  prix_moyen: number;
}

interface CityStats {
  city: string;
  total_biens: number;
  ca: number;
  taux_vente: number;
  score_popularite: number;
  prix_m2_moyen: number;
}

interface MonthlyTrend {
  month: string;
  nb_ventes: number;
  ca: number;
  tendance: number;
}

interface Activity {
  type: string;
  label: string;
  detail: string;
  date: string;
  color: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n);

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)} jours`;
};

// ─── Subcomponents ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, icon, trend,
}: {
  label: string; value: string; sub?: string; color: string; icon: string; trend?: number;
}) {
  return (
    <article
      className={`kpi-card ${color}`}
      aria-label={`${label} : ${value}`}
    >
      <span className="kpi-icon" aria-hidden="true">{icon}</span>
      <div className="kpi-body">
        <p className="kpi-label">{label}</p>
        <p className="kpi-value">{value}</p>
        {sub && <p className="kpi-sub">{sub}</p>}
      </div>
      {trend !== undefined && (
        <span className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`} aria-label={`Tendance : ${trend >= 0 ? 'hausse' : 'baisse'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      )}
    </article>
  );
}

function BarChart({ data, labelKey, valueKey, color, title }: {
  data: any[]; labelKey: string; valueKey: string; color: string; title: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <figure className="chart-container" aria-label={title}>
      <figcaption className="chart-title">{title}</figcaption>
      <div className="chart-bars" role="list">
        {data.slice(0, 8).map((d, i) => {
          const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
          return (
            <div key={i} className="chart-bar-row" role="listitem">
              <span className="chart-bar-label" title={d[labelKey]}>{d[labelKey]}</span>
              <div className="chart-bar-track" aria-hidden="true">
                <div
                  className={`chart-bar-fill ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="chart-bar-value">
                {valueKey === 'ca' || valueKey === 'ca_total'
                  ? `${(d[valueKey] / 1_000_000).toFixed(1)}M€`
                  : fmtNum(Math.round(d[valueKey]))}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

function MiniLineChart({ data }: { data: MonthlyTrend[] }) {
  if (data.length < 2) return null;
  const W = 360, H = 80, PAD = 10;
  const maxCa = Math.max(...data.map(d => d.ca));
  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.ca / maxCa) * (H - PAD * 2));
    return `${x},${y}`;
  });
  const trendPoints = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.tendance / maxCa) * (H - PAD * 2));
    return `${x},${y}`;
  });

  return (
    <figure className="linechart-container" aria-label="Évolution mensuelle du CA">
      <figcaption className="chart-title">Évolution du CA (12 derniers mois)</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="linechart-svg" aria-hidden="true">
        {/* Grille */}
        {[0, 25, 50, 75, 100].map(pct => (
          <line key={pct}
            x1={PAD} y1={H - PAD - (pct / 100) * (H - PAD * 2)}
            x2={W - PAD} y2={H - PAD - (pct / 100) * (H - PAD * 2)}
            stroke="#e2e8f0" strokeWidth="1"
          />
        ))}
        {/* Ligne CA réel */}
        <polyline points={points.join(' ')} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Points */}
        {points.map((pt, i) => {
          const [x, y] = pt.split(',');
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#3b82f6" />;
        })}
        {/* Ligne de tendance */}
        <polyline points={trendPoints.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,4" strokeLinejoin="round" />
      </svg>
      <div className="linechart-legend" aria-hidden="true">
        <span className="legend-dot" style={{ background: '#3b82f6' }} /> CA réel
        <span className="legend-dot ml" style={{ background: '#f59e0b' }} /> Tendance
      </div>
      <div className="linechart-months" aria-hidden="true">
        {data.filter((_, i) => i % Math.ceil(data.length / 4) === 0).map(d => (
          <span key={d.month}>{d.month.slice(0, 7)}</span>
        ))}
      </div>
    </figure>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [cities, setCities] = useState<CityStats[]>([]);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [sumRes, cityRes, trendRes, actRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/by-city'),
        api.get('/analytics/monthly-trend'),
        api.get('/analytics/recent-activity'),
      ]);
      setSummary(sumRes.data);
      setCities(cityRes.data);
      setTrend(trendRes.data);
      setActivity(actRes.data);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: any) {
      setError('Impossible de charger les données analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Polling toutes les 30 secondes (monitoring temps réel léger)
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const quickActions = [
    { label: 'Nouveau bien', icon: '🏠', path: '/properties/new', color: 'qa-blue' },
    { label: 'Catalogue', icon: '📋', path: '/properties', color: 'qa-green' },
    { label: 'Suivi clients', icon: '👥', path: '/clients', color: 'qa-purple' },
    { label: 'Transactions', icon: '💰', path: '/transactions', color: 'qa-amber' },
    { label: 'Agences', icon: '🏢', path: '/agencies', color: 'qa-indigo' },
  ];

  if (loading) {
    return (
      <div className="dashboard-loader" role="status" aria-label="Chargement du tableau de bord">
        <div className="loader-spinner" aria-hidden="true" />
        <p>Chargement des données…</p>
      </div>
    );
  }

  return (
    <main className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Tableau de bord</h1>
          <p className="dashboard-subtitle">
            Bonjour, <strong>{user?.email?.split('@')[0]}</strong> ·{' '}
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="dashboard-header-right">
          <span className="refresh-label" aria-live="polite">
            Mis à jour {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button className="btn-refresh" onClick={fetchAll} aria-label="Rafraîchir les données">
            ↻ Actualiser
          </button>
          {user?.role === 'Direction' && (
            <button className="btn-primary" onClick={() => navigate('/properties/new')} aria-label="Ajouter un nouveau bien">
              + Nouveau bien
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="alert-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      {summary && (
        <section className="kpi-grid" aria-label="Indicateurs clés">
          <KpiCard label="Biens actifs" value={fmtNum(summary.biens_disponibles)} sub={`sur ${fmtNum(summary.total_biens)} total`} color="kpi-blue" icon="🏠" />
          <KpiCard label="Ventes ce mois" value={String(summary.ventes_mois)} sub={`CA : ${fmt(summary.ca_mois)}`} color="kpi-green" icon="📈" trend={summary.ventes_mois > 0 ? summary.taux_conversion : undefined} />
          <KpiCard label="Taux de conversion" value={`${summary.taux_conversion}%`} sub={`${summary.biens_vendus} biens vendus`} color="kpi-amber" icon="🎯" />
          <KpiCard label="CA Total" value={fmt(summary.ca_total)} sub={`Prix moyen : ${fmt(summary.prix_moyen)}`} color="kpi-purple" icon="💶" />
        </section>
      )}

      {/* ── Charts Row ── */}
      <section className="charts-grid" aria-label="Graphiques analytiques">
        <MiniLineChart data={trend} />
        <BarChart
          data={cities}
          labelKey="city"
          valueKey="ca"
          color="bar-blue"
          title="CA par ville"
        />
      </section>

      {/* ── Bottom Row : Actions + Activity ── */}
      <section className="bottom-grid">
        {/* Quick Actions */}
        <div className="qa-section">
          <h2 className="section-title">Actions rapides</h2>
          <nav className="qa-grid" aria-label="Actions rapides">
            {quickActions.map(({ label, icon, path, color }) => (
              <button
                key={path}
                className={`qa-btn ${color}`}
                onClick={() => navigate(path)}
                aria-label={label}
              >
                <span className="qa-icon" aria-hidden="true">{icon}</span>
                <span className="qa-label">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Activity Feed */}
        <div className="activity-section">
          <h2 className="section-title">Activité récente</h2>
          <ol className="activity-list" aria-label="Activité récente">
            {activity.slice(0, 8).map((a, i) => (
              <li key={i} className="activity-item">
                <span
                  className={`activity-dot ${a.color === 'green' ? 'dot-green' : 'dot-blue'}`}
                  aria-hidden="true"
                />
                <div className="activity-body">
                  <p className="activity-label">{a.label}</p>
                  <p className="activity-detail">{a.detail}</p>
                </div>
                <time className="activity-time" dateTime={a.date}>
                  {a.date ? timeAgo(a.date) : '–'}
                </time>
              </li>
            ))}
            {activity.length === 0 && (
              <li className="activity-empty">Aucune activité récente.</li>
            )}
          </ol>
        </div>
      </section>

      {/* ── Zones chaudes (Direction uniquement) ── */}
      {user?.role === 'Direction' && cities.length > 0 && (
        <section className="zones-section" aria-label="Zones géographiques attractives">
          <h2 className="section-title">Attractivité par zone</h2>
          <div className="zones-grid">
            {cities.slice(0, 6).map((c, i) => (
              <article key={c.city} className={`zone-card ${c.score_popularite >= 75 ? 'zone-hot' : c.score_popularite >= 40 ? 'zone-warm' : 'zone-cold'}`}>
                <span className="zone-rank" aria-label={`Rang ${i + 1}`}>#{i + 1}</span>
                <h3 className="zone-city">{c.city}</h3>
                <p className="zone-stat">{c.total_biens} biens · {c.taux_vente}% vendus</p>
                <div className="zone-score-bar" aria-label={`Score attractivité : ${c.score_popularite}/100`}>
                  <div className="zone-score-fill" style={{ width: `${c.score_popularite}%` }} />
                </div>
                <p className="zone-score-label">Score : {c.score_popularite}/100</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
