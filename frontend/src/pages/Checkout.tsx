import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Lock, CreditCard, CheckCircle, ShieldCheck } from 'lucide-react';

type Step = 'recap' | 'payment' | 'confirmation';

const DEPOSIT_AMOUNT = 300; // Acompte fixe de réservation

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', brand: 'Visa', icon: '💳', color: 'from-blue-700 to-blue-900' },
  { number: '5555 5555 5555 4444', brand: 'Mastercard', icon: '💳', color: 'from-red-600 to-orange-700' },
];

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [step, setStep] = useState<Step>('recap');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(0);
  const [transactionRef] = useState('YM-' + Date.now().toString().slice(-8));
  const [form, setForm] = useState({
    cardNumber: TEST_CARDS[0].number,
    cardName: '',
    expiry: '12/28',
    cvv: '123',
  });

  // Si non connecté → redirection vers login avec message
  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { message: 'Connectez-vous pour finaliser votre réservation.' } });
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, cardName: user.email.split('@')[0] }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectCard = (idx: number) => {
    setSelectedCard(idx);
    setForm(f => ({ ...f, cardNumber: TEST_CARDS[idx].number }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setStep('confirmation');
    setIsLoading(false);
  };

  if (!token) return null;

  // ── CONFIRMATION ──
  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Réservation confirmée !</h1>
          <p className="text-slate-500 text-sm mb-1">
            Votre acompte de <strong className="text-[#1a2e44]">300 €</strong> pour le bien <strong>#{id}</strong> a bien été enregistré.
          </p>
          <p className="text-xs text-slate-400 mb-8">Un email de confirmation sera envoyé à <strong>{user?.email}</strong>.</p>

          <div className="bg-slate-50 rounded-2xl p-5 text-left text-sm space-y-2.5 mb-8 border border-slate-100">
            {[
              ['Référence', transactionRef],
              ['Acompte réglé', '300,00 €'],
              ['Carte', `**** ${form.cardNumber.slice(-4)}`],
              ['Date', new Date().toLocaleDateString('fr-FR')],
              ['Statut', '✅ Approuvé'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className={`font-semibold ${k === 'Statut' ? 'text-green-600' : 'text-slate-800'}`}>{v}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mb-6 text-left">
            ℹ️ Un conseiller Ymmo vous contactera dans les 48h pour organiser la suite de votre projet.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/client/properties')}
              className="flex-1 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Catalogue
            </button>
            <button
              onClick={() => navigate(`/client/properties/${id}`)}
              className="flex-1 py-3 bg-[#1a2e44] rounded-xl text-white font-semibold text-sm hover:bg-[#243d57] transition-colors"
            >
              Voir le bien
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl border border-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Réservation du bien #{id}</h1>
            <p className="text-sm text-slate-500">Acompte de réservation · <strong className="text-[#1a2e44]">300 €</strong></p>
          </div>
        </div>

        {/* Étapes */}
        <div className="flex items-center space-x-3 mb-8">
          {['Récapitulatif', 'Paiement'].map((label, i) => {
            const active = (step === 'recap' && i === 0) || (step === 'payment' && i >= 1);
            const done = step === 'payment' && i === 0;
            return (
              <React.Fragment key={label}>
                <div className={`flex items-center space-x-2 ${active ? 'text-[#1a2e44] font-bold' : 'text-slate-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active || done ? 'bg-[#1a2e44] text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="text-sm">{label}</span>
                </div>
                {i < 1 && <div className="flex-1 h-px bg-slate-200" />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-3">

            {/* ── ÉTAPE 1 : Récapitulatif ── */}
            {step === 'recap' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-5">Récapitulatif de votre réservation</h2>

                <div className="rounded-xl overflow-hidden bg-slate-100 h-44 mb-5">
                  <img src="/images/modern_house.png" alt="Bien" className="w-full h-full object-cover" />
                </div>

                <div className="space-y-3 text-sm mb-6">
                  {[
                    ['Référence du bien', `#${id}`],
                    ['Acheteur / Locataire', user?.email || ''],
                    ['Frais d\'agence', 'inclus dans le prix final'],
                    ['Acompte de réservation', '300 €'],
                    ['Solde restant', 'À régler à la signature'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-slate-500">{k}</span>
                      <span className={`font-semibold ${k === 'Acompte de réservation' ? 'text-[#1a2e44] text-base' : 'text-slate-700'}`}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 mb-6">
                  <p className="font-semibold mb-1">ℹ️ Comment fonctionne l'acompte ?</p>
                  <p className="text-xs leading-relaxed">
                    L'acompte de 300 € permet de réserver le bien et de le retirer du marché pendant 10 jours. 
                    Il sera déduit du prix de vente final à la signature.
                  </p>
                </div>

                <button
                  onClick={() => setStep('payment')}
                  className="w-full py-3.5 bg-[#1a2e44] text-white font-bold rounded-xl hover:bg-[#243d57] transition-colors"
                >
                  Procéder au paiement de 300 € →
                </button>
              </div>
            )}

            {/* ── ÉTAPE 2 : Paiement ── */}
            {step === 'payment' && (
              <form onSubmit={handlePayment} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <h2 className="text-lg font-bold text-slate-900">Paiement sécurisé</h2>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2.5 py-1 rounded-full">🧪 Données de test</span>
                </div>

                {/* Sélection carte test */}
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-3">Cartes de test :</p>
                  <div className="grid grid-cols-2 gap-3">
                    {TEST_CARDS.map((card, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCard(idx)}
                        className={`relative h-[76px] rounded-xl bg-gradient-to-br ${card.color} p-4 text-white text-left transition-all ${
                          selectedCard === idx ? 'ring-2 ring-offset-2 ring-[#D4AF37] scale-[1.02]' : 'opacity-70 hover:opacity-90'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 mb-1 opacity-70" />
                        <p className="text-xs font-mono">{card.number.slice(0, 9)}••••</p>
                        <p className="text-xs font-bold">{card.brand}</p>
                        {selectedCard === idx && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-[#D4AF37] rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Champs carte */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Numéro de carte</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#1a2e44] focus:border-transparent outline-none bg-slate-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom sur la carte</label>
                    <input
                      type="text"
                      name="cardName"
                      value={form.cardName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1a2e44] focus:border-transparent outline-none bg-slate-50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiration</label>
                      <input
                        type="text"
                        name="expiry"
                        value={form.expiry}
                        onChange={handleChange}
                        placeholder="MM/AA"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#1a2e44] focus:border-transparent outline-none bg-slate-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={form.cvv}
                        onChange={handleChange}
                        placeholder="•••"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#1a2e44] focus:border-transparent outline-none bg-slate-50"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#D4AF37] hover:bg-[#B5952F] disabled:opacity-60 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isLoading ? (
                    <><div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /><span>Traitement en cours...</span></>
                  ) : (
                    <><Lock className="w-4 h-4" /><span>Payer l'acompte de {DEPOSIT_AMOUNT} €</span></>
                  )}
                </button>
                <p className="text-xs text-center text-slate-400">
                  🔒 Données de test — Aucun prélèvement réel ne sera effectué
                </p>
              </form>
            )}
          </div>

          {/* Récapitulatif latéral */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-6">
              <h3 className="font-bold text-slate-800 mb-4 text-sm">Votre réservation</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Bien #{id}</span>
                  <Link to={`/client/properties/${id}`} className="text-[#D4AF37] hover:underline text-xs">Voir</Link>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Frais d'agence</span>
                  <span className="font-medium text-slate-700">Inclus</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-base">
                  <span className="text-slate-800">Acompte dû</span>
                  <span className="text-[#1a2e44] text-xl">300 €</span>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-green-50 rounded-xl flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-700 leading-relaxed">
                  Réservation sécurisée. L'acompte est remboursable si la vente n'aboutit pas.
                </p>
              </div>

              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl text-xs text-slate-500 leading-relaxed">
                📋 En réservant, vous acceptez nos <a href="#" className="text-[#D4AF37] hover:underline">conditions générales de vente</a>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
