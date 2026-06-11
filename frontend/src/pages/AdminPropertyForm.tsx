import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function AdminPropertyForm() {
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    area: '',
    city: '',
    type: 'APARTMENT',
    transaction_mode: 'sale',
    status: 'AVAILABLE'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (isEditing) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      // In a real app we might have a specific GET /properties/:id endpoint.
      // But since we don't, we can fetch all and find it, or we could add a new endpoint.
      // Actually, since we only have the ID, it's better to fetch from the general list for now,
      // or ideally we should add a GET /properties/{id} to the backend.
      // Let's assume the backend doesn't have GET /properties/{id} yet, so we fetch all and filter.
      const response = await axios.get('http://127.0.0.1:8000/api/v1/properties/');
      const property = response.data.find((p: any) => p.id === parseInt(id!));
      
      if (property) {
        setFormData({
          title: property.title,
          description: property.description || '',
          price: property.price.toString(),
          area: property.area.toString(),
          city: property.city,
          type: property.type,
          transaction_mode: property.transaction_mode || 'sale',
          status: property.status
        });
      } else {
        setError("Bien introuvable.");
      }
    } catch (err) {
      setError("Erreur lors de la récupération des données.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        area: parseFloat(formData.area),
      };

      if (isEditing) {
        await axios.put(`http://127.0.0.1:8000/api/v1/properties/${id}`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('http://127.0.0.1:8000/api/v1/properties/', payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      navigate('/properties');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'enregistrement du bien");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditing ? "Modifier le bien" : "Ajouter un nouveau bien"}
        </h1>
        <Button variant="ghost" onClick={() => navigate('/properties')}>
          Retour
        </Button>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <Input 
              label="Titre de l'annonce" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              required 
              placeholder="Ex: Superbe appartement T3 en centre-ville"
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                placeholder="Description détaillée du bien..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Prix (€)" 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                required 
                min="0"
              />
              <Input 
                label="Surface (m²)" 
                type="number" 
                name="area" 
                value={formData.area} 
                onChange={handleChange} 
                required 
                min="0"
              />
            </div>

            <Input 
              label="Ville" 
              name="city" 
              value={formData.city} 
              onChange={handleChange} 
              required 
            />

            {/* === TYPE DE TRANSACTION === */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Type de transaction
                <span className="ml-1 text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transaction_mode: 'sale' })}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    formData.transaction_mode === 'sale'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl mb-1">🏷️</span>
                  <span className="font-semibold text-sm">À vendre</span>
                  <span className="text-xs mt-0.5 opacity-70">Vente définitive</span>
                  {formData.transaction_mode === 'sale' && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transaction_mode: 'rent' })}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    formData.transaction_mode === 'rent'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl mb-1">🔑</span>
                  <span className="font-semibold text-sm">À louer</span>
                  <span className="text-xs mt-0.5 opacity-70">Location</span>
                  {formData.transaction_mode === 'rent' && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de bien</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white"
                >
                  <option value="APARTMENT">Appartement</option>
                  <option value="HOUSE">Maison / Villa</option>
                  <option value="COMMERCIAL">Local Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white"
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="UNDER_OFFER">Sous offre</option>
                  <option value="SOLD">Vendu</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                {isEditing ? "Enregistrer les modifications" : "Créer l'annonce"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
