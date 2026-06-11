import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapPin, Maximize, Home, DoorOpen, ArrowLeft, Tag, Key, Eye, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  city: string;
  type: string;
  status: string;
  transaction_mode: string;
  agent_id: number;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, isAdmin } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/properties/${id}`);
      setProperty(response.data);
    } catch (err) {
      setError('Bien introuvable.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);

  const getPropertyTypeLabel = (type: string) => {
    if (type.toLowerCase() === 'apartment') return 'Appartement';
    if (type.toLowerCase() === 'house') return 'Maison / Villa';
    if (type.toLowerCase() === 'commercial') return 'Local Commercial';
    return type;
  };

  const handleApply = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setApplyLoading(true);
    // Simulate an apply action (endpoint to be added later)
    await new Promise(r => setTimeout(r, 800));
    setApplied(true);
    setApplyLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2e44]" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-slate-500 text-lg">{error || 'Bien introuvable.'}</p>
        <Button onClick={() => navigate(-1)} className="mt-6">Retour</Button>
      </div>
    );
  }

  const isRent = property.transaction_mode === 'rent';

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center space-x-2 text-sm text-slate-500">
          <button onClick={() => navigate(-1)} className="flex items-center space-x-1 hover:text-[#1a2e44] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au catalogue</span>
          </button>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate">{property.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Colonne principale ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Galerie / Image principale */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-200 h-80 md:h-[420px] shadow-lg">
            <img
              src={property.type.toLowerCase() === 'apartment' ? '/images/city_apartment.png' : '/images/modern_house.png'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-[#1a2e44] text-white text-xs font-semibold rounded-full">
                {getPropertyTypeLabel(property.type)}
              </span>
              <span className={`px-3 py-1 text-white text-xs font-semibold rounded-full ${
                isRent ? 'bg-emerald-600' : 'bg-blue-700'
              }`}>
                {isRent ? '🔑 À louer' : '🏷️ À vendre'}
              </span>
            </div>
            <div className={`absolute top-4 right-4 px-3 py-1 text-xs font-semibold rounded-full text-white ${
              property.status === 'sold' ? 'bg-red-600' :
              property.status === 'under_offer' ? 'bg-orange-500' : 'bg-green-600'
            }`}>
              {property.status === 'sold' ? 'Vendu' : property.status === 'under_offer' ? 'Sous offre' : 'Disponible'}
            </div>
          </div>

          {/* Titre & Prix */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1a2e44] leading-tight">
                  {property.title}
                </h1>
                <div className="flex items-center text-slate-500 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{property.city}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#1a2e44]">{formatPrice(property.price)}</p>
                {isRent && <p className="text-sm text-slate-500">/ mois</p>}
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
              {[
                { icon: Maximize, label: 'Surface', value: `${property.area} m²` },
                { icon: DoorOpen, label: 'Pièces', value: `${Math.ceil(property.area / 25)} pièces` },
                { icon: Home, label: 'Type', value: getPropertyTypeLabel(property.type) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center p-3 bg-slate-50 rounded-xl">
                  <Icon className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-[#1a2e44] mb-4">Description</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description || 'Aucune description disponible pour ce bien.'}
            </p>
          </div>

          {/* Stats (simulées) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-[#1a2e44] mb-4">Activité sur ce bien</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">247</p>
                  <p className="text-xs text-blue-500">Vues totales</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">12</p>
                  <p className="text-xs text-emerald-500">Candidatures reçues</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Colonne latérale ── */}
        <div className="space-y-4">
          {/* CTA Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-28">
            <p className="text-2xl font-bold text-[#1a2e44] mb-1">{formatPrice(property.price)}</p>
            {isRent && <p className="text-sm text-slate-500 mb-4">par mois</p>}
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-6 ${
              isRent ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isRent ? '🔑 À louer' : '🏷️ À vendre'}
            </div>

            {property.status !== 'sold' ? (
              <>
                {applied ? (
                  <div className="w-full py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl text-center">
                    ✅ Candidature envoyée !
                  </div>
                ) : (
                  <Button
                    onClick={handleApply}
                    isLoading={applyLoading}
                    className="w-full py-3 text-base font-bold"
                  >
                    {isRent ? 'Postuler pour la location' : 'Faire une offre d\'achat'}
                  </Button>
                )}
                <Link
                  to={token ? `/checkout/${property.id}` : '/login'}
                  state={!token ? { message: 'Connectez-vous pour réserver ce bien.' } : undefined}
                  className={`mt-3 flex flex-col items-center justify-center w-full py-3 border-2 text-sm font-bold rounded-xl transition-colors ${
                    isRent
                      ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                      : 'border-[#D4AF37] text-[#D4AF37] hover:bg-yellow-50'
                  }`}
                >
                  <span>{isRent ? '📋 Réserver (acompte)' : '💳 Réserver ce bien'}</span>
                  <span className="text-xs font-normal mt-0.5 opacity-80">Acompte de réservation : 300 €</span>
                </Link>
                {!token && (
                  <p className="text-center text-xs text-slate-400 mt-2">
                    🔒 Connexion requise pour réserver
                  </p>
                )}
              </>
            ) : (
              <div className="w-full py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
                Ce bien n'est plus disponible
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">📍</span>
                <span>{property.city}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">📐</span>
                <span>{property.area} m²</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">🏠</span>
                <span>{getPropertyTypeLabel(property.type)}</span>
              </div>
            </div>
          </div>

          {/* Contact agence */}
          <div className="bg-[#1a2e44] rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2">Contacter l'agence</h3>
            <p className="text-slate-300 text-sm mb-4">Un conseiller Ymmo est disponible pour vous accompagner.</p>
            <a
              href="tel:+33400000000"
              className="block text-center py-2.5 bg-[#D4AF37] hover:bg-[#B5952F] text-white font-semibold rounded-xl text-sm transition-colors"
            >
              📞 04 00 00 00 00
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
