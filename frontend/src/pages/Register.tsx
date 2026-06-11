import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('http://127.0.0.1:8000/api/v1/users/register-client', {
        email,
        password
      });

      // Redirection vers le login après succès
      navigate('/login', { state: { message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.' } });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Une erreur est survenue lors de l'inscription.");
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
            <h2 className="text-4xl font-extrabold text-brand-600 tracking-tight">Ymmo</h2>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              Créer un compte client
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Inscrivez-vous pour consulter nos biens exclusifs.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleRegister} className="space-y-6">
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
                placeholder="votre.email@exemple.fr"
              />

              <Input
                label="Mot de passe"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />

              <Input
                label="Confirmer le mot de passe"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />

              <div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  S'inscrire
                </Button>
              </div>
              
              <div className="text-sm text-center mt-4">
                <span className="text-slate-600">Vous avez déjà un compte ? </span>
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
                  Connectez-vous
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
        <div className="absolute inset-0 bg-brand-900/40 mix-blend-multiply" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center">
          <h1 className="text-5xl font-bold mb-6">L'immobilier d'exception</h1>
          <p className="text-xl max-w-lg">Rejoignez Ymmo et découvrez une sélection de biens uniques correspondant à vos exigences les plus élevées.</p>
        </div>
      </div>
    </div>
  );
}
