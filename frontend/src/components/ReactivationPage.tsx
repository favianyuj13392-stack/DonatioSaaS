import React, { useEffect, useState } from 'react';
import { ReactivationData } from '../types';
import { validateReactivationToken, confirmSubscriptionReactivation } from '../services/api';
import { AtcCreditCardForm, CardFormData } from './AtcCreditCardForm';
import { Heart, CheckCircle2, AlertCircle, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';

interface ReactivationPageProps {
  token: string;
}

export const ReactivationPage: React.FC<ReactivationPageProps> = ({ token }) => {
  const [data, setData] = useState<ReactivationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [cardData, setCardData] = useState<CardFormData>({
    cardNumber: '',
    expirationMonth: '12',
    expirationYear: '2028',
    expiration: '',
    cvv: '',
    cardholderName: '',
    email: '',
    isInternational: false,
    department: 'L',
    stateProvince: 'FL',
    country: 'BO',
    locality: 'La Paz',
    address1: 'Av. Principal 123',
    postalCode: '0000',
  });

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const result = await validateReactivationToken(token);
        setData(result);
        if (result.foundation?.primary_color) {
          document.documentElement.style.setProperty('--tenant-primary', result.foundation.primary_color);
        }
      } catch (err: any) {
        setError(err.message || 'El enlace de reactivación no es válido.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [token]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let payload = {};
      if (useNewCard) {
        const [expMonth, expYear] = cardData.expiration.split('/');
        payload = {
          card_number: cardData.cardNumber.replace(/\s/g, ''),
          expiration_month: expMonth,
          expiration_year: `20${expYear}`,
          cvv: cardData.cvv,
        };
      }

      const result = await confirmSubscriptionReactivation(token, payload);
      setSuccessMessage(result.message);
    } catch (err: any) {
      setError(err.message || 'Error al reactivar la suscripción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-tenant-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Verificando enlace de socio...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Enlace Expirado o Inválido</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Logo / Nombre de Fundación */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-tenant-light text-tenant-primary mb-3">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {data.foundation.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Reactivación de Membresía Solidaria</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-gray-100">
          {successMessage ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">¡Suscripción Reactivada!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-6">
              {/* Tarjeta Informativa del Socio */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Socio</span>
                  <span className="text-sm font-bold text-gray-900">{data.donor_name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Aporte Mensual</span>
                  <span className="text-base font-extrabold text-tenant-primary">
                    {data.currency} {data.amount} / mes
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Causa</span>
                  <span className="text-xs text-gray-700 font-semibold">{data.campaign_title}</span>
                </div>
              </div>

              {/* Opción 1-Click con Tarjeta Guardada */}
              {data.has_saved_card && !useNewCard && (
                <div className="p-4 rounded-2xl border-2 border-tenant-primary bg-tenant-light/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-tenant-primary" />
                      <span className="text-sm font-bold text-gray-900">
                        {data.card_brand} terminada en •••• {data.card_last_four}
                      </span>
                    </div>
                    <span className="text-xs font-bold bg-white text-tenant-primary px-2 py-0.5 rounded-full border border-tenant-primary/30">
                      Guardada
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tu tarjeta tokenizada en Cybersource sigue registrada. Puedes reactivar tu aporte con un solo clic.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUseNewCard(true)}
                    className="text-xs font-bold text-tenant-primary hover:underline block"
                  >
                    ¿Deseas usar otra tarjeta diferente?
                  </button>
                </div>
              )}

              {/* Formulario para Ingresar Nueva Tarjeta */}
              {useNewCard && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">Nueva Tarjeta</span>
                    <button
                      type="button"
                      onClick={() => setUseNewCard(false)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Volver a tarjeta guardada
                    </button>
                  </div>
                  <AtcCreditCardForm
                    cardData={cardData}
                    onChange={setCardData}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Botón de Confirmación */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--tenant-primary)' }}
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" /> Confirmar Reactivación 1-Clic <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
