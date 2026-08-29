import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { AtcCreditCardForm, CardFormData } from './AtcCreditCardForm';
import { QrDisplayModal } from './QrDisplayModal';
import { DonationSuccessModal } from './DonationSuccessModal';
import { ThreatMetrixScript } from './ThreatMetrixScript';
import { CardinalDataCollector } from './CardinalDataCollector';
import { StepUpChallengeModal } from './StepUpChallengeModal';
import {
  generateQrDonation,
  setup3dsSession,
  check3dsEnrollment,
  validate3dsChallenge,
  submitCheckout,
} from '../services/api';
import { QrResponse, DonationTier } from '../types';
import {
  CreditCard,
  QrCode,
  Heart,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building2,
  Coins,
} from 'lucide-react';

export const DonationWidget: React.FC = () => {
  const { tenant, campaign, subdomain, refreshData } = useTenant();

  const defaultFoundationTiers: DonationTier[] = [
    { amount: 50, label: 'Aporte de apoyo continuo', is_default: false },
    { amount: 100, label: 'Aporte de alto impacto', is_default: true },
    { amount: 200, label: 'Aporte padrino solidario', is_default: false },
  ];

  const tiers: DonationTier[] = campaign?.donation_tiers && campaign.donation_tiers.length > 0
    ? campaign.donation_tiers
    : defaultFoundationTiers;

  // Frecuencia: monthly | single
  const initialFrequency = campaign?.allowed_frequencies === 'monthly_only' ? 'monthly' : 'monthly';
  const [frequency, setFrequency] = useState<'single' | 'monthly'>(initialFrequency);

  // Método de pago: card | qr
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr'>('card');

  // Montos y Moneda
  const defaultTier = tiers.find(t => t.is_default) || tiers[1] || tiers[0];
  const [amount, setAmount] = useState<number>(defaultTier?.amount || 100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [currency, setCurrency] = useState<'Bs' | 'USD'>('Bs');

  // Datos de tarjeta con AVS nacional/internacional
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
    address1: '',
    postalCode: '',
  });

  // ThreatMetrix Fingerprint Session ID
  const [fingerprintSessionId, setFingerprintSessionId] = useState<string>('');

  // 3DS2 State
  const [cardinalJwt, setCardinalJwt] = useState<string | null>(null);
  const [stepUpJwt, setStepUpJwt] = useState<string | null>(null);
  const [pendingAuthTxId, setPendingAuthTxId] = useState<string | null>(null);
  const [pendingRefNumber, setPendingRefNumber] = useState<string | null>(null);

  // Estados de proceso y modales
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittingStep, setSubmittingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<QrResponse | null>(null);

  const [successModalData, setSuccessModalData] = useState<{
    amount: number;
    frequency: 'single' | 'monthly';
    referenceNumber: string;
    receiptUrl: string | null;
  } | null>(null);

  // Sincronizar frecuencia si la campaña impone restricciones
  useEffect(() => {
    if (campaign?.allowed_frequencies === 'monthly_only') {
      setFrequency('monthly');
      setPaymentMethod('card');
    } else if (campaign?.allowed_frequencies === 'single_only') {
      setFrequency('single');
    }
  }, [campaign?.allowed_frequencies]);

  // Si selecciona QR, forzar a donación única
  useEffect(() => {
    if (paymentMethod === 'qr') {
      setFrequency('single');
    }
  }, [paymentMethod]);

  const currentAmount = isCustom ? parseFloat(customAmount) || 0 : amount;

  const handleSelectTier = (tierAmount: number) => {
    setIsCustom(false);
    setAmount(tierAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '');
    setCustomAmount(val);
    setIsCustom(true);
  };

  // Validaciones del formulario
  const validateForm = (): boolean => {
    if (currentAmount <= 0) {
      setErrorMessage('Por favor selecciona o ingresa un monto válido.');
      return false;
    }

    if (paymentMethod === 'card') {
      const cleanCard = cardData.cardNumber.replace(/\s+/g, '');
      if (!cardData.cardholderName.trim()) {
        setErrorMessage('Por favor ingresa el nombre completo del titular de la tarjeta.');
        return false;
      }
      if (!cardData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cardData.email)) {
        setErrorMessage('Por favor ingresa un correo electrónico válido requerido por el banco.');
        return false;
      }
      if (cleanCard.length < 13 || cleanCard.length > 19) {
        setErrorMessage('Por favor ingresa un número de tarjeta válido (13 a 19 dígitos).');
        return false;
      }
      if (!cardData.expirationMonth || !cardData.expirationYear) {
        setErrorMessage('Por favor selecciona el mes y año de vencimiento de tu tarjeta.');
        return false;
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        setErrorMessage('Por favor ingresa el código de seguridad CVV/CVC de 3 o 4 dígitos.');
        return false;
      }
    }

    setErrorMessage(null);
    return true;
  };

  // Ejecución final del cobro con tarjeta
  const executeFinalCheckout = async (refNumber: string, auth3ds?: any) => {
    if (!tenant) return;

    setSubmittingStep('Procesando donación segura...');
    const cleanCard = cardData.cardNumber.replace(/\s+/g, '');

    const nameParts = cardData.cardholderName.trim().split(' ');
    const firstName = nameParts[0] || 'Donante';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Solidario';

    const checkoutPayload = {
      foundation_id: tenant.id,
      campaign_id: campaign?.id || null,
      amount: currentAmount,
      currency: currency === 'Bs' ? 'BOB' : 'USD',
      frequency,
      donor_name: cardData.cardholderName.trim(),
      first_name: firstName,
      last_name: lastName,
      donor_email: cardData.email.trim(),
      email: cardData.email.trim(),
      is_anonymous: false,
      merchant_reference_number: refNumber,
      card_number: cleanCard,
      expiration_month: cardData.expirationMonth,
      expiration_year: cardData.expirationYear,
      cvv: cardData.cvv,
      country: cardData.isInternational ? (cardData.country || 'US') : 'BO',
      state: cardData.isInternational ? (cardData.stateProvince || 'FL') : (cardData.department || 'L'),
      locality: cardData.isInternational ? (cardData.locality || 'Miami') : 'La Paz',
      address1: cardData.address1.trim() || (cardData.isInternational ? '100 Biscayne Blvd' : 'Av. Principal 123'),
      postal_code: cardData.isInternational ? (cardData.postalCode || '33101') : '0000',
      fingerprint_session_id: fingerprintSessionId,
      card_type: cleanCard.startsWith('4') ? 'VISA' : (cleanCard.startsWith('5') ? 'MASTERCARD' : 'AMEX'),
      cavv: auth3ds?.cavv || null,
      eci_raw: auth3ds?.eci || (cleanCard.startsWith('5') ? '02' : '05'),
      xid: auth3ds?.xid || null,
      three_ds_server_transaction_id: auth3ds?.threeDSServerTransactionId || null,
      accepted_terms: true,
    };

    const checkoutResult = await submitCheckout(subdomain, checkoutPayload);

    setSuccessModalData({
      amount: currentAmount,
      frequency,
      referenceNumber: checkoutResult.merchant_reference_number || refNumber,
      receiptUrl: checkoutResult.receipt_url || null,
    });

    refreshData();
  };

  // Manejador del Desafío Step-Up Resuelto en el modal
  const handleChallengeSuccess = async () => {
    if (!pendingRefNumber || !tenant) return;

    try {
      setIsSubmitting(true);
      setSubmittingStep('Validando autenticación con el banco...');

      const valRes = await validate3dsChallenge(subdomain, {
        merchant_reference_number: pendingRefNumber,
        authentication_transaction_id: pendingAuthTxId,
      });

      setStepUpJwt(null);
      await executeFinalCheckout(pendingRefNumber, valRes);
    } catch (err: any) {
      setErrorMessage(err?.message || 'La autenticación bancaria no pudo ser completada.');
      setStepUpJwt(null);
    } finally {
      setIsSubmitting(false);
      setSubmittingStep('');
    }
  };

  // Procesar Donación (Paso principal)
  const handleProcessDonation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm() || !tenant) return;

    setIsSubmitting(true);

    try {
      if (paymentMethod === 'qr') {
        setSubmittingStep('Generando código QR dinámico...');
        const qrRes = await generateQrDonation(subdomain, {
          foundation_id: tenant.id,
          campaign_id: campaign?.id || null,
          amount: currentAmount,
          donor_name: cardData.cardholderName.trim() || 'Donante Solidario',
          donor_email: cardData.email.trim() || 'donante@donatio.lat',
          is_anonymous: false,
        });

        setQrModalData(qrRes);
      } else {
        const cleanCard = cardData.cardNumber.replace(/\s+/g, '');

        // 1. Setup 3DS2 Session
        setSubmittingStep('Iniciando sesión segura con Cybersource (3DS2)...');
        const setupRes = await setup3dsSession(subdomain, {
          card_number: cleanCard,
          expiration_month: cardData.expirationMonth,
          expiration_year: cardData.expirationYear,
        });

        const refNo = setupRes.merchant_reference_number;
        const authInfo = setupRes.data;
        setPendingRefNumber(refNo);

        if (authInfo?.accessToken) {
          setCardinalJwt(authInfo.accessToken);
        }

        const nameParts = cardData.cardholderName.trim().split(' ');
        const firstName = nameParts[0] || 'Donante';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Solidario';

        // 2. Check Enrollment 3DS2
        setSubmittingStep('Evaluando riesgo bancario (Check Enrollment)...');
        const enrollRes = await check3dsEnrollment(subdomain, {
          reference_id: authInfo?.referenceId,
          merchant_reference_number: refNo,
          amount: currentAmount,
          currency: currency === 'Bs' ? 'BOB' : 'USD',
          card_number: cleanCard,
          expiration_month: cardData.expirationMonth,
          expiration_year: cardData.expirationYear,
          cvv: cardData.cvv,
          first_name: firstName,
          last_name: lastName,
          donor_email: cardData.email.trim(),
          country: cardData.isInternational ? (cardData.country || 'US') : 'BO',
          state: cardData.isInternational ? (cardData.stateProvince || 'FL') : (cardData.department || 'L'),
          locality: cardData.isInternational ? (cardData.locality || 'Miami') : 'La Paz',
          address1: cardData.address1.trim() || (cardData.isInternational ? '100 Biscayne Blvd' : 'Av. Principal 123'),
          postal_code: cardData.isInternational ? (cardData.postalCode || '33101') : '0000',
          fingerprint_session_id: fingerprintSessionId,
        });

        if (enrollRes.isChallengeRequired && enrollRes.stepUpJwt) {
          setStepUpJwt(enrollRes.stepUpJwt);
          setPendingAuthTxId(enrollRes.authenticationTransactionId || null);
          return;
        }

        // Flujo Frictionless -> Captura directa
        await executeFinalCheckout(refNo, enrollRes);
      }
    } catch (err: any) {
      console.error('[Donation Error]:', err);
      setErrorMessage(err?.message || 'Ocurrió un error al procesar tu donación. Por favor intenta nuevamente.');
    } finally {
      if (!stepUpJwt) {
        setIsSubmitting(false);
        setSubmittingStep('');
      }
    }
  };

  if (!tenant) return null;

  const heroImage = campaign?.banner_url || tenant.logo_url || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb4?auto=format&fit=crop&w=800&q=80';
  const heroQuote = campaign?.headline || `"Con tu ayuda, transformamos futuros"`;

  return (
    <div id="donar" className="w-full max-w-6xl mx-auto my-8 px-4 sm:px-6">
      {/* Servicios invisibles de riesgo y perfilado */}
      <ThreatMetrixScript onSessionGenerated={(sid: string) => setFingerprintSessionId(sid)} />
      {cardinalJwt && <CardinalDataCollector jwt={cardinalJwt} />}

      {/* Modal de Desafío OTP 3DS2 */}
      {stepUpJwt && (
        <StepUpChallengeModal
          isOpen={true}
          stepUpJwt={stepUpJwt}
          onSuccess={handleChallengeSuccess}
          onCancel={() => {
            setStepUpJwt(null);
            setIsSubmitting(false);
            setErrorMessage('La verificación de seguridad 3DS fue cancelada.');
          }}
        />
      )}

      {/* Modal de Código QR Simple */}
      {qrModalData && (
        <QrDisplayModal
          qrData={qrModalData}
          onClose={() => setQrModalData(null)}
          onSuccess={(receiptUrl?: string) => {
            setQrModalData(null);
            setSuccessModalData({
              amount: currentAmount,
              frequency: 'single',
              referenceNumber: qrModalData.qr.merchant_reference_number,
              receiptUrl: receiptUrl || null,
            });
            refreshData();
          }}
        />
      )}

      {/* Modal de Éxito y Recibo Oficial */}
      {successModalData && (
        <DonationSuccessModal
          tenant={tenant}
          amount={successModalData.amount}
          frequency={successModalData.frequency}
          referenceNumber={successModalData.referenceNumber}
          receiptUrl={successModalData.receiptUrl}
          onClose={() => setSuccessModalData(null)}
        />
      )}

      {/* CONTENEDOR PRINCIPAL 2 COLUMNAS (MOCKUP CERTIFICADO) */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO INTERACTIVO (7 COLUMNAS) */}
        <div className="md:col-span-7 p-5 sm:p-7 md:p-8 space-y-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Tu donación</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Tu ayuda hace la diferencia. Elige el monto y la frecuencia de tu donación.</p>
          </div>

          {/* 1. Monto de la Donación */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">Monto de la donación</label>
            
            {/* Montos Predefinidos Flexibles y Auto-adaptables (2, 3, 4, 5, 6 montos) */}
            <div className="flex flex-wrap gap-2">
              {tiers.map((t) => (
                <button
                  key={t.amount}
                  type="button"
                  onClick={() => handleSelectTier(t.amount)}
                  className={`flex-1 min-w-[70px] sm:min-w-[80px] py-2.5 px-3 rounded-2xl text-center border-2 transition-all font-bold text-xs sm:text-sm whitespace-nowrap ${
                    !isCustom && amount === t.amount
                      ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary-soft)] text-[var(--tenant-primary)] shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div>{t.amount} {currency}</div>
                </button>
              ))}
            </div>

            {/* Input Personalizado con selector de divisa independiente y holgado */}
            <div className="mt-2.5 relative flex items-center">
              <div className="absolute left-3.5 text-xs sm:text-sm font-bold text-gray-400 pointer-events-none">
                {currency === 'USD' ? '$' : 'Bs.'}
              </div>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="Ingresar otro monto personalizado..."
                value={customAmount}
                onChange={handleCustomAmountChange}
                className={`w-full py-2.5 pl-10 pr-24 rounded-2xl border-2 text-xs sm:text-sm font-bold outline-none transition-all ${
                  isCustom
                    ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary-soft)] text-[var(--tenant-primary)] shadow-xs'
                    : 'border-gray-200 focus:border-[var(--tenant-primary)] text-gray-800 bg-gray-50/50 hover:bg-white'
                }`}
              />
              <div className="absolute right-1.5 flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrency(currency === 'Bs' ? 'USD' : 'Bs')}
                  title="Cambiar divisa"
                  className="px-2.5 py-1 text-xs font-black text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl shadow-2xs transition flex items-center gap-1"
                >
                  <span>{currency}</span>
                  <span className="text-[10px] text-gray-400">▾</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Método de Pago (Tabs) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">Método de pago</label>
            <div className="grid grid-cols-2 bg-gray-100/90 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'card'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Tarjeta Crédito/Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qr')}
                className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'qr'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">Código QR Simple</span>
              </button>
            </div>
          </div>

          {/* 3. Frecuencia de Donación */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">Frecuencia</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                disabled={paymentMethod === 'qr'}
                className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                  paymentMethod === 'qr'
                    ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50'
                    : frequency === 'monthly'
                    ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary-soft)] text-gray-900 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    Mensual
                  </span>
                  {frequency === 'monthly' && paymentMethod !== 'qr' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                  Se cobrará cada mes automáticamente
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('single')}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  frequency === 'single'
                    ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary-soft)] text-gray-900 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="font-bold text-xs sm:text-sm">Una sola vez</span>
                <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                  Cobro único al momento
                </p>
              </button>
            </div>

            {frequency === 'monthly' && paymentMethod === 'card' && (
              <div className="mt-2.5 p-2.5 bg-rose-50/70 border border-rose-200/60 rounded-xl flex items-start gap-2 text-rose-800 text-[11px]">
                <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tu donación será recurrente y automática.</strong> Puedes cancelar tu suscripción cuando quieras desde tu perfil.
                </span>
              </div>
            )}
          </div>

          {/* 4. Formulario de Tarjeta ATC Red Enlace (Incrustado Dinámico) */}
          {paymentMethod === 'card' && (
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2.5">
                Datos de la Tarjeta (ATC Red Enlace)
              </label>
              <AtcCreditCardForm
                cardData={cardData}
                onChange={setCardData}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* CTA Principal de Pago */}
          <button
            type="button"
            onClick={handleProcessDonation}
            disabled={isSubmitting}
            style={{
              backgroundColor: 'var(--tenant-primary)',
              color: 'var(--tenant-on-primary)',
            }}
            className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base shadow-lg hover:opacity-95 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{submittingStep || 'Procesando pago seguro...'}</span>
              </>
            ) : paymentMethod === 'card' ? (
              <>
                <span>💳 Pagar {currentAmount > 0 ? `${currentAmount} ${currency}` : ''}</span>
                <span className="text-lg">›</span>
              </>
            ) : (
              <>
                <span>📱 Generar Código QR {currentAmount > 0 ? `(${currentAmount} ${currency})` : ''}</span>
                <span className="text-lg">›</span>
              </>
            )}
          </button>
        </div>

        {/* COLUMNA DERECHA: RESUMEN DE DONACIÓN (5 COLUMNAS - STICKY) */}
        <div className="md:col-span-5 bg-gray-50/80 border-t md:border-t-0 md:border-l border-gray-100 p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Resumen de tu donación</h3>

            {/* Banner de Campaña / Institución */}
            <div className="relative rounded-2xl overflow-hidden h-36 shadow-md group">
              <img
                src={heroImage}
                alt={tenant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-3.5">
                <p className="text-white font-bold text-xs sm:text-sm leading-snug drop-shadow-md">
                  {heroQuote}
                </p>
              </div>
            </div>

            {/* Lista de Metadatos */}
            <div className="space-y-3 text-xs sm:text-sm text-gray-600 border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  Institución
                </span>
                <span className="font-bold text-gray-900 text-right leading-tight break-words max-w-[140px] sm:max-w-[180px]" title={tenant.name}>
                  {tenant.name}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <Coins className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  Monto
                </span>
                <span className="font-bold text-gray-900">{currentAmount} {currency}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  Frecuencia
                </span>
                <span className="font-bold text-gray-900">{frequency === 'monthly' ? 'Mensual' : 'Una sola vez'}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  Método
                </span>
                <span className="font-bold text-gray-900 text-right text-xs sm:text-sm">
                  {paymentMethod === 'card' ? 'Tarjeta (Cybersource)' : 'Código QR Simple'}
                </span>
              </div>
            </div>

            {/* Total por cobro */}
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-gray-900 text-sm sm:text-base">Total por cobro</span>
              <span
                style={{ color: 'var(--tenant-primary)' }}
                className="font-extrabold text-xl sm:text-2xl"
              >
                {currentAmount} {currency}
              </span>
            </div>
          </div>

          {/* Badge de Seguridad EMVCo 3DS2 */}
          <div className="mt-6 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-900">Tu donación es 100% segura</h4>
              <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Plataforma certificada SSL y validación bancaria 3DS2 (EMVCo).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
