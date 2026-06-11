import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { MapPin, Heart, Grid, Map, SlidersHorizontal, Maximize, DoorOpen, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  city: string;
  type: string;
  status: string;
  transaction_mode: string; // 'sale' | 'rent'
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchTransactionMode, setSearchTransactionMode] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchMaxPrice, setSearchMaxPrice] = useState('');

  const { isAdmin, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/properties';

  useEffect(() => {
    fetchProperties();
  }, [isDashboard]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      if (isDashboard) {
        const response = await axios.get('http://127.0.0.1:8000/api/v1/properties/agency', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProperties(response.data);
      } else {
        const params: any = {};
        if (searchKeyword) params.keyword = searchKeyword;
        if (searchType) params.type = searchType;
        if (searchMaxPrice) params.max_price = parseFloat(searchMaxPrice);
        if (searchTransactionMode) params.transaction_mode = searchTransactionMode;

        const response = await axios.get('http://127.0.0.1:8000/api/v1/properties/', { params });
        setProperties(response.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des biens", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/v1/properties/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProperties(properties.filter(p => p.id !== id));
      } catch (error: any) {
        alert(error.response?.data?.detail || "Erreur lors de la suppression.");
      }
    }
  };

  const getPropertyImage = (type: string) => {
    return type.toLowerCase() === 'apartment' ? '/images/city_apartment.png' : '/images/modern_house.png';
  };

  const getPropertyTypeLabel = (type: string) => {
    if (type.toLowerCase() === 'apartment') return 'Appartement';
    if (type.toLowerCase() === 'house') return 'Maison';
    if (type.toLowerCase() === 'commercial') return 'Bureau';
    return type;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen">
      {/* Barre de recherche — Catalogue public uniquement */}
      {!isDashboard && (
        <div className="bg-white border-b border-slate-200 py-4 -mx-8 px-8 mb-8 sticky top-20 z-40">
          <form onSubmit={handleSearch} className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3 flex-wrap">
            
            {/* Mot-clé */}
            <div className="relative flex-1 w-full min-w-[180px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-sm focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="Ville, titre du bien..."
              />
            </div>

            {/* Vente / Location */}
            <select
              value={searchTransactionMode}
              onChange={(e) => setSearchTransactionMode(e.target.value)}
              className="block w-full md:w-40 py-2.5 px-3 border border-slate-300 bg-white rounded-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-sm"
            >
              <option value="">Vente &amp; Location</option>
              <option value="sale">À vendre</option>
              <option value="rent">À louer</option>
            </select>

            {/* Type */}
            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="block w-full md:w-44 py-2.5 px-3 border border-slate-300 bg-white rounded-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-sm"
            >
              <option value="">Tous les types</option>
              <option value="APARTMENT">Appartements</option>
              <option value="HOUSE">Maisons</option>
              <option value="COMMERCIAL">Bureaux &amp; Commerces</option>
            </select>

            {/* Prix max */}
            <select 
              value={searchMaxPrice}
              onChange={(e) => setSearchMaxPrice(e.target.value)}
              className="block w-full md:w-44 py-2.5 px-3 border border-slate-300 bg-white rounded-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-sm"
            >
              <option value="">Pas de limite (€)</option>
              <option value="200000">Max 200 000 €</option>
              <option value="500000">Max 500 000 €</option>
              <option value="1000000">Max 1 000 000 €</option>
            </select>

            <button type="submit" className="flex items-center justify-center w-full md:w-auto px-4 py-2.5 bg-brand-900 text-white rounded-sm text-sm font-medium hover:bg-brand-800 transition-colors">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Rechercher
            </button>
          </form>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 pt-4">
          <p className="text-slate-600 font-medium">
            <span className="font-bold text-slate-900">{properties.length}</span> biens {isDashboard ? "dans mon agence" : "trouvés"}
          </p>
          
          <div className="flex items-center space-x-2">
            {isDashboard && isAdmin && (
              <Button variant="primary" onClick={() => navigate('/properties/new')} className="mr-4">
                Ajouter un nouveau bien
              </Button>
            )}
            <div className="flex border border-slate-300 rounded-sm overflow-hidden bg-white">
              <button className="flex items-center px-4 py-1.5 bg-brand-900 text-white text-sm font-medium">
                <Grid className="h-4 w-4 mr-2" /> Grille
              </button>
              <button className="flex items-center px-4 py-1.5 text-slate-600 text-sm font-medium hover:bg-slate-50">
                <Map className="h-4 w-4 mr-2" /> Carte
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.length > 0 ? properties.map((property) => (
              <div
                key={property.id}
                onClick={() => !isDashboard && navigate(`/client/properties/${property.id}`)}
                className={`bg-white rounded-sm overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col group ${!isDashboard ? 'cursor-pointer' : ''}`}
              >
                {/* Image Container */}
                <div className="relative h-60 overflow-hidden bg-slate-200">
                  <img 
                    src={getPropertyImage(property.type)} 
                    alt={property.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Badge type de bien */}
                  <div className="absolute top-4 left-4 bg-gold-500 text-white px-2 py-0.5 text-xs font-semibold rounded-sm tracking-wide">
                    {getPropertyTypeLabel(property.type)}
                  </div>
                  {/* Badge statut */}
                  <div className={`absolute top-4 right-14 text-white px-2 py-0.5 text-xs font-semibold rounded-sm tracking-wide ${
                    property.status === 'sold' || property.status === 'SOLD' ? 'bg-red-600' :
                    property.status === 'under_offer' || property.status === 'UNDER_OFFER' ? 'bg-orange-500' : 'bg-green-600'
                  }`}>
                    {property.status === 'sold' || property.status === 'SOLD' ? 'Vendu' :
                     property.status === 'under_offer' || property.status === 'UNDER_OFFER' ? 'Sous offre' : 'Disponible'}
                  </div>
                  {/* Badge Vente / Location */}
                  <div className={`absolute bottom-4 left-4 flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow ${
                    property.transaction_mode === 'rent' ? 'bg-emerald-600 text-white' : 'bg-blue-700 text-white'
                  }`}>
                    {property.transaction_mode === 'rent' ? '🔑 À louer' : '🏷️ À vendre'}
                  </div>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-slate-400 hover:text-red-500 shadow-sm transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h2 className={`text-2xl font-serif font-bold mb-2 ${
                    property.status === 'sold' || property.status === 'SOLD' ? 'text-slate-400 line-through' : 'text-brand-900'
                  }`}>
                    {formatPrice(property.price)}
                  </h2>
                  <h3 className="text-base font-serif text-slate-800 leading-snug mb-3 flex-1 line-clamp-2">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-sm text-slate-500 mb-4">
                    <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                    {property.city}
                  </div>
                  
                  <div className="border-t border-slate-100 mb-4"></div>
                  
                  <div className="flex items-center justify-between text-slate-500 text-sm">
                    <div className="flex items-center">
                      <Maximize className="h-4 w-4 mr-1.5 text-slate-400" />
                      {property.area} m²
                    </div>
                    <div className="flex items-center">
                      <DoorOpen className="h-4 w-4 mr-1.5 text-slate-400" />
                      {Math.ceil(property.area / 25)} pièces
                    </div>
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-1.5 text-slate-400" />
                      {property.type === 'house' ? 'RDC' : 'Étage'}
                    </div>
                  </div>
                </div>

                {/* Admin actions */}
                {isDashboard && isAdmin && (
                  <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      className="text-xs h-8 text-brand-700"
                      onClick={(e) => { e.stopPropagation(); navigate('/properties/edit/' + property.id); }}
                    >
                      Éditer
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); handleDelete(property.id); }}
                    >
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            )) : (
              <div className="col-span-full py-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Home className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">Aucun bien trouvé</h3>
                <p className="text-slate-500">Essayez de modifier vos critères de recherche.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}