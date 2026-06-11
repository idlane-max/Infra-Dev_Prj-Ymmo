import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Maximize, DoorOpen, Search, ArrowRight, Phone, Menu, X } from 'lucide-react';

interface Property {
  id: number;
  title: string;
  price: number;
  area: number;
  city: string;
  type: string;
  status: string;
  transaction_mode: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
}

function getTypeLabel(type: string) {
  if (type?.toLowerCase() === 'apartment') return 'Appartement';
  if (type?.toLowerCase() === 'house') return 'Maison';
  if (type?.toLowerCase() === 'commercial') return 'Local commercial';
  return type;
}

function getImage(type: string) {
  return type?.toLowerCase() === 'apartment' ? '/images/city_apartment.png' : '/images/modern_house.png';
}

export default function LandingPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [keyword, setKeyword] = useState('');
  const [transactionMode, setTransactionMode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async (kw = '', mode = '') => {
    setIsLoading(true);
    try {
      const params: any = { limit: 6 };
      if (kw) params.keyword = kw;
      if (mode) params.transaction_mode = mode;
      const res = await axios.get('http://127.0.0.1:8000/api/v1/properties/', { params });
      setProperties(res.data);
    } catch {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties(keyword, transactionMode);
  };

  const handleCardClick = (id: number) => {
    navigate(`/client/properties/${id}`);
  };

  const navToAllProperties = () => {
    navigate('/client/properties');
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100" style={{minHeight: 68}}>
        <div className="flex items-center px-4 md:px-12" style={{height: 68}}>
          <div className="flex items-baseline space-x-1 mr-auto">
            <span className="text-2xl font-serif font-bold text-[#1a2e44]">Ymmo</span>
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full inline-block mb-0.5" />
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600 mr-8">
            <button onClick={navToAllProperties} className="hover:text-[#D4AF37] transition-colors">Acheter</button>
            <button onClick={navToAllProperties} className="hover:text-[#D4AF37] transition-colors">Louer</button>
            <a href="#agences" className="hover:text-[#D4AF37] transition-colors">Nos agences</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {token && user ? (
              <button
                onClick={() => user.role === 'Client' ? navigate('/client/properties') : navigate('/dashboard')}
                className="px-4 py-2 bg-[#1a2e44] text-white text-sm font-semibold rounded-lg hover:bg-[#243d57] transition-colors"
              >
                Mon espace
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[#1a2e44] transition-colors">Connexion</Link>
                <Link to="/register" className="px-4 py-2 bg-[#1a2e44] text-white text-sm font-semibold rounded-lg hover:bg-[#243d57] transition-colors">Créer un compte</Link>
              </>
            )}
          </div>
          {/* Hamburger mobile */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white ml-3"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} color="#1a2e44" /> : <Menu size={20} color="#1a2e44" />}
          </button>
        </div>
        {/* Menu mobile */}
        {mobileMenuOpen && (
          <nav aria-label="Menu mobile" className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-3">
            <button onClick={() => { navToAllProperties(); setMobileMenuOpen(false); }} className="text-left text-sm font-semibold text-[#1a2e44] py-2">🏠 Acheter</button>
            <button onClick={() => { navToAllProperties(); setMobileMenuOpen(false); }} className="text-left text-sm text-slate-600 py-2">🔑 Louer</button>
            <a href="#agences" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-600 py-2">📍 Nos agences</a>
            <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem'}}>
              {token && user ? (
                <button onClick={() => { user.role === 'Client' ? navigate('/client/properties') : navigate('/dashboard'); setMobileMenuOpen(false); }} className="w-full text-center px-4 py-2.5 bg-[#1a2e44] text-white text-sm font-semibold rounded-lg">
                  Mon espace
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-600 font-medium py-1">Connexion</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-center px-4 py-2.5 bg-[#1a2e44] text-white text-sm font-semibold rounded-lg">Créer un compte</Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative pt-[68px] min-h-[580px] flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/modern_house.png')" }}
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/75 to-[#0a1628]/30" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 py-16">
          {/* Tag */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
            <span className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase">Portail immobilier premium</span>
          </div>

          {/* Titre */}
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white leading-[1.1] mb-4 max-w-2xl">
            Trouvez le bien
            <br />
            <span className="text-[#D4AF37]">de vos rêves</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-xl leading-relaxed">
            Accédez à notre catalogue de biens à vendre et à louer dans toute la France — sans inscription requise.
          </p>

          {/* Barre de recherche intégrée */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Ville, quartier, référence..."
                className="w-full pl-10 pr-4 py-3.5 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
            <select
              value={transactionMode}
              onChange={e => setTransactionMode(e.target.value)}
              className="px-4 py-3.5 bg-white rounded-xl text-sm text-slate-700 border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] min-w-[140px]"
            >
              <option value="">Tout</option>
              <option value="sale">À vendre</option>
              <option value="rent">À louer</option>
            </select>
            <button
              type="submit"
              className="px-6 py-3.5 bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 whitespace-nowrap"
            >
              Rechercher
            </button>
          </form>

          {/* Stats en ligne */}
          <div className="flex flex-wrap gap-6 mt-10">
            {[
              { v: '12', l: 'agences' },
              { v: '500+', l: 'biens disponibles' },
              { v: '98%', l: 'clients satisfaits' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">{s.v}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CATALOGUE ══════════════════ */}
      <section className="py-16 px-6 md:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-[#D4AF37] tracking-widest uppercase mb-1">Sélection du moment</p>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1a2e44]">
                Biens disponibles
              </h2>
            </div>
            <button
              onClick={navToAllProperties}
              className="hidden sm:flex items-center space-x-1.5 text-sm font-semibold text-[#1a2e44] hover:text-[#D4AF37] transition-colors group"
            >
              <span>Voir tout le catalogue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Grille de biens */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a2e44]" />
            </div>
          ) : properties.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <p>Aucun bien trouvé pour cette recherche.</p>
              <button onClick={() => { setKeyword(''); setTransactionMode(''); fetchProperties(); }} className="mt-3 text-sm text-[#D4AF37] hover:underline">
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleCardClick(p.id)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-100 hover:border-[#D4AF37]/30"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img
                      src={getImage(p.type)}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Badge Vente / Location */}
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md ${
                      p.transaction_mode === 'rent' ? 'bg-emerald-600' : 'bg-blue-700'
                    }`}>
                      {p.transaction_mode === 'rent' ? '🔑 Location' : '🏷️ Vente'}
                    </div>
                    {/* Badge disponibilité */}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md ${
                      p.status === 'under_offer' ? 'bg-orange-500' : 'bg-green-600'
                    }`}>
                      {p.status === 'under_offer' ? 'Sous offre' : 'Disponible'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-xs text-slate-400 mb-0.5">{getTypeLabel(p.type)}</p>
                        <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{p.title}</h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-[#1a2e44]">{formatPrice(p.price)}</p>
                        {p.transaction_mode === 'rent' && <p className="text-xs text-slate-400">/mois</p>}
                      </div>
                    </div>

                    <div className="flex items-center text-slate-400 text-xs mb-3">
                      <MapPin className="w-3 h-3 mr-1" />
                      {p.city}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-3">
                      <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{p.area} m²</span>
                      <span className="flex items-center gap-1"><DoorOpen className="w-3 h-3" />{Math.ceil(p.area / 25)} pièces</span>
                      <span className="flex items-center gap-1 text-[#D4AF37] font-semibold group-hover:underline">
                        Voir <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA voir tout */}
          <div className="mt-10 text-center">
            <button
              onClick={navToAllProperties}
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#1a2e44] hover:bg-[#243d57] text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
            >
              <span>Voir tous les biens disponibles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════ AVANTAGES ══════════════════ */}
      <section className="py-16 px-6 md:px-12 bg-white" id="acheter">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1a2e44] mb-3">
              Pourquoi choisir <span className="text-[#D4AF37]">Ymmo</span> ?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">La référence de l'immobilier premium en France, avec 12 agences et des centaines de biens exclusifs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🏠', title: 'Catalogue complet', desc: 'Des centaines de biens à vendre et à louer, mis à jour en temps réel. Accessibles sans inscription.', color: 'border-blue-100 hover:border-blue-300' },
              { icon: '⚡', title: 'Réservation rapide', desc: 'Réservez un bien en quelques clics avec un acompte sécurisé de 300 €. Simple et transparent.', color: 'border-amber-100 hover:border-amber-300' },
              { icon: '🛡️', title: 'Transactions sécurisées', desc: 'Vos données et paiements sont protégés. Accompagnement professionnel de la visite à la signature.', color: 'border-emerald-100 hover:border-emerald-300' },
            ].map(f => (
              <div key={f.title} className={`p-7 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg group ${f.color}`}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-[#1a2e44] mb-2 group-hover:text-[#D4AF37] transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section className="py-16 px-6 bg-[#1a2e44]" id="agences">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-serif font-bold text-white mb-4">
              Prêt à concrétiser <span className="text-[#D4AF37]">votre projet ?</span>
            </h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Créez votre compte gratuit et accédez à tous nos services : favoris, suivi de dossier, réservation en ligne.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/register" className="px-6 py-3 bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg">
                Créer un compte
              </Link>
              <button onClick={navToAllProperties} className="px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
                Parcourir les biens
              </button>
            </div>
          </div>
          <div className="hidden md:flex flex-col space-y-4">
            {[
              { icon: '📍', title: '12 agences', desc: 'Dans toute la France' },
              { icon: '📞', title: 'Support 7j/7', desc: 'Conseillers disponibles' },
              { icon: '💳', title: 'Acompte 300 €', desc: 'Réservation sécurisée' },
            ].map(item => (
              <div key={item.title} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="py-8 px-8 bg-[#0a1628] text-slate-500 text-xs text-center">
        <div className="flex items-baseline justify-center space-x-1 mb-2">
          <span className="text-lg font-serif font-bold text-slate-300">Ymmo</span>
          <span className="w-1 h-1 bg-[#D4AF37] rounded-full inline-block" />
        </div>
        © 2026 Ymmo. Tous droits réservés.&nbsp;
        <a href="#" className="hover:text-[#D4AF37] transition-colors">Mentions légales</a>
        &nbsp;·&nbsp;
        <a href="#" className="hover:text-[#D4AF37] transition-colors">Confidentialité</a>
      </footer>
    </div>
  );
}
