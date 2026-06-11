import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Récupérer le message de succès de l'inscription s'il existe
  const location = window.location;
  const stateMessage = (window.history.state?.usr as any)?.message;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      login(response.data.access_token);
      
      // On décode manuellement pour rediriger immédiatement sans attendre le useEffect de AuthContext
      const base64Url = response.data.access_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);

      if (decoded.role === 'Client') {
        navigate('/client/properties');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Colonne gauche : Formulaire */}
      <div className="flex flex-col justify-center flex-1 px-8 py-12 sm:px-12 lg:flex-none lg:w-1/2 xl:w-5/12">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Ymmo</h2>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              Bienvenue sur votre portail
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Connectez-vous pour accéder à votre espace.
            </p>
          </div>

          <div className="mt-8">
            {stateMessage && (
              <div className="p-4 mb-6 rounded-md bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800">{stateMessage}</p>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <Input
                label="Adresse Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@ymmo.fr"
              />

              <Input
                label="Mot de passe"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="w-4 h-4 border-gray-300 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-900">
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-brand-600 hover:text-brand-500">
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Se connecter
                </Button>
              </div>
              
              <div className="text-sm text-center mt-6">
                <span className="text-slate-600">Pas encore client ? </span>
                <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 underline underline-offset-2">
                  Créer un compte
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Colonne droite : Image */}
      <div className="relative hidden w-full lg:block lg:flex-1">
        <img
          className="absolute inset-0 object-cover w-full h-full"
          src="/images/login_bg.png"
          alt="Intérieur de luxe"
        />
        <div className="absolute inset-0 bg-slate-900/30 mix-blend-multiply" />
        <div className="absolute bottom-10 left-10 text-white glass-dark p-6 rounded-2xl max-w-md">
          <p className="text-xl font-medium leading-snug">"L'excellence au service de l'immobilier d'exception. Gérer vos biens n'a jamais été aussi simple."</p>
          <div className="mt-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-xl font-bold">V</div>
            <div>
              <p className="font-semibold">Valérie Martin</p>
              <p className="text-sm text-brand-200">Directrice Générale Ymmo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}