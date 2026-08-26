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
  Sparkles,
  User,
  Mail,
  ChevronRight,
} from 'lucide-react';

const FALLBACK_TIERS: DonationTier[] = [
  { amount: 30, label: 'Alimentación de 1 día (niño + mamá)', is_default: false },
  { amount: 50, label: '1 Kit de medicinas básicas para quimioterapia', is_default: true },
  { amount: 100, label: '3 Días de albergue y atención médica integral', is_default: false },
  { amount: 250, label: 'Tratamiento semanal y análisis de laboratorio', is_default: false },
];

export const DonationCheckoutContainer: React.FC = () => {
  const { tenant, campaign, subdomain, refreshData } = useTenant();

  const tiers: DonationTier[] = campaign?.donation_tiers && campaign.donation_tiers.length > 0
    ? campaign.donation_tiers
    : FALLBACK_TIERS;

  // Frecuencia inicial según configuración de la campaña
  const initialFrequency = campaign?.allowed_frequencies === 'monthly_only' ? 'monthly' : 'single';
  const [frequency, setFrequency] = useState<'single' | 'monthly'>(initialFrequency);

  // Método de pago: card | qr
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr'>('card');

  // Monto inicial (busca tier default o 50)
  const defaultTier = tiers.find(t => t.is_default) || tiers[1] || tiers[0];
  const [amount, setAmount] = useState<number>(defaultTier?.amount || 50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Donante
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // ThreatMetrix Fingerprint Session ID
  const [fingerprintSessionId, setFingerprintSessionId] = useState<string>('');

  // 3DS2 State
  const [cardinalJwt, setCardinalJwt] = useState<string | null>(null);
  const [stepUpJwt, setStepUpJwt] = useState<string | null>(null);
  const [pendingAuthTxId, setPendingAuthTxId] = useState<string | null>(null);
  const [pendingRefNumber, setPendingRefNumber] = useState<string | null>(null);

  // Tarjeta con AVS
  const [cardData, setCardData] = useState<CardFormData>({
    cardNumber: '',
    expiration: '',
    cvv: '',
    cardholderName: '',
    isInternational: false,
    department: 'L',
    stateProvince: 'FL',
    country: 'BO',
    locality: 'La Paz',
    address1: 'Av. Principal 123',
    postalCode: '0000',
  });

  // Estados de interfaz
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittingStep, setSubmittingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<QrResponse | null>(null);

  // Modal de Éxito
  const [successModalData, setSuccessModalData] = useState<{
    amount: number;
    frequency: 'single' | 'monthly';
    referenceNumber: string;
    receiptUrl: string | null;
  } | null>(null);

  // Sincronizar frecuencia si la campaña cambia
  useEffect(() => {
    if (campaign?.allowed_frequencies === 'monthly_only') {
      setFrequency('monthly');
      setPaymentMethod('card');
    }
  }, [campaign?.allowed_frequencies]);

  // Si cambia a mensual y estaba en QR, forzar tarjeta
  useEffect(() => {
    if (frequency === 'monthly' && paymentMethod === 'qr') {
      setPaymentMethod('card');
    }
  }, [frequency, paymentMethod]);

  const currentAmount = isCustom ? parseFloat(customAmount) || 0 : amount;
  const currentTier = tiers.find(t => t.amount === currentAmount);
  const impactLabel = currentTier?.label || (isCustom ? 'Aporte solidario para medicamentos y albergue integral' : 'Cubre insumos y atención médica');

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

  // Paso Final de Captura Financiera
  const executeFinalCheckout = async (refNumber: string, auth3ds?: any) => {
    if (!tenant || !campaign) return;

    setSubmittingStep('Procesando donación segura...');
    const [expMonth, expYear] = cardData.expiration.split('/');
    const cleanCard = cardData.cardNumber.replace(/\s+/g, '');

    const checkoutPayload = {
      campaign_id: campaign.id,
      amount: currentAmount,
      currency: 'BOB',
      frequency,
      donor_name: isAnonymous ? 'Donante Anónimo' : (donorName || cardData.cardholderName || 'Donante'),
      donor_email: isAnonymous ? 'anonimo@donatio.lat' : donorEmail,
      is_anonymous: isAnonymous,
      merchant_reference_number: refNumber,
      card_number: cleanCard,
      expiration_month: expMonth,
      expiration_year: `20${expYear}`,
      cvv: cardData.cvv,
      country: cardData.isInternational ? (cardData.country || 'US') : 'BO',
      state: cardData.isInternational ? (cardData.stateProvince || 'FL') : cardData.department,
      locality: cardData.isInternational ? (cardData.locality || 'Miami') : 'La Paz',
      address1: cardData.isInternational ? (cardData.address1 || '100 Biscayne Blvd') : 'Av. Principal 123',
      postal_code: cardData.isInternational ? (cardData.postalCode || '33101') : '0000',
      fingerprint_session_id: fingerprintSessionId,
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

  // Manejador del Desafío Step-Up Resuelto
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

  // Envío del Formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (currentAmount <= 0) {
      setErrorMessage('Por favor selecciona o ingresa un monto válido.');
      return;
    }

    if (!isAnonymous && !donorEmail) {
      setErrorMessage('Por favor ingresa tu correo electrónico para enviarte el comprobante oficial.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === 'qr') {
        setSubmittingStep('Generando código QR dinámico de ATC...');
        const qrRes = await generateQrDonation(subdomain, {
          campaign_id: campaign?.id,
          amount: currentAmount,
          donor_name: isAnonymous ? 'Donante Anónimo' : donorName,
          donor_email: isAnonymous ? 'anonimo@donatio.lat' : donorEmail,
          is_anonymous: isAnonymous,
        });

        setQrModalData(qrRes);
      } else {
        const cleanCard = cardData.cardNumber.replace(/\s+/g, '');
        const [expMonth, expYear] = cardData.expiration.split('/');

        if (cleanCard.length < 15 || !expMonth || !expYear || !cardData.cvv) {
          setErrorMessage('Por favor completa todos los datos de tu tarjeta.');
          setIsSubmitting(false);
          return;
        }

        // 1. Setup 3DS2
        setSubmittingStep('Iniciando sesión segura con el banco...');
        const setupRes = await setup3dsSession(subdomain, {
          card_number: cleanCard,
          expiration_month: expMonth,
          expiration_year: `20${expYear}`,
        });

        const refNo = setupRes.merchant_reference_number;
        const authInfo = setupRes.data;
        setPendingRefNumber(refNo);

        if (authInfo?.accessToken) {
          setCardinalJwt(authInfo.accessToken);
        }

        // 2. Check Enrollment
        setSubmittingStep('Verificando autenticación bancaria...');
        const enrollRes = await check3dsEnrollment(subdomain, {
          reference_id: authInfo?.referenceId,
          merchant_reference_number: refNo,
          amount: currentAmount,
          currency: 'BOB',
          card_number: cleanCard,
          expiration_month: expMonth,
          expiration_year: `20${expYear}`,
          cvv: cardData.cvv,
          first_name: isAnonymous ? 'Donante' : (donorName.split(' ')[0] || 'Donante'),
          last_name: isAnonymous ? 'Anonimo' : (donorName.split(' ').slice(1).join(' ') || 'Solidario'),
          donor_email: isAnonymous ? 'anonimo@donatio.lat' : donorEmail,
          country: cardData.isInternational ? (cardData.country || 'US') : 'BO',
          state: cardData.isInternational ? (cardData.stateProvince || 'FL') : cardData.department,
          locality: cardData.isInternational ? (cardData.locality || 'Miami') : 'La Paz',
          address1: cardData.isInternational ? (cardData.address1 || '100 Biscayne Blvd') : 'Av. Principal 123',
          postal_code: cardData.isInternational ? (cardData.postalCode || '33101') : '0000',
          fingerprint_session_id: fingerprintSessionId,
        });

        if (enrollRes.isChallengeRequired && enrollRes.stepUpJwt) {
          setStepUpJwt(enrollRes.stepUpJwt);
          setPendingAuthTxId(enrollRes.authenticationTransactionId || null);
          return;
        }

        // Frictionless
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

  if (!tenant || !campaign) return null;

  const pct = Math.min(100, Math.round(campaign.progress_percentage || 0));
  const banner = campaign.banner_url || tenant.logo_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80';

  return (
    <>
      <ThreatMetrixScript onSessionGenerated={(sid: string) => setFingerprintSessionId(sid)} />
      {cardinalJwt && <CardinalDataCollector jwt={cardinalJwt} />}

      {stepUpJwt && (
        <StepUpChallengeModal
          isOpen={true}
          stepUpJwt={stepUpJwt}
          onSuccess={handleChallengeSuccess}
          onCancel={() => {
            setStepUpJwt(null);
            setIsSubmitting(false);
          }}
        />
      )}

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

      {/* ========================================================================= */}
      {/* HERO SPLIT: 60% HISTORIA EMOCIONAL / 40% CARD DE DONACIÓN FLOTANTE STICKY */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* ------------------------------------------------------------------------- */}
        {/* COLUMNA IZQUIERDA (60% ancho / 7 cols): PROTAGONISTA EMOCIONAL            */}
        {/* ------------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badge temático sutil */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200/80">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>Causa Solidaria Oficial en Bolivia</span>
          </div>

          {/* Título H1 Grande y Elegante */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            {campaign.title}
          </h1>

          {/* Imagen Principal en formato 16:9 */}
          {banner && (
            <div className="rounded-3xl shadow-xl overflow-hidden aspect-video w-full bg-slate-900 relative">
              <img
                src={banner}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>
          )}

          {/* Barra de Recaudación Integrada y Limpia */}
          {campaign.monetary_goal > 0 && (
            <div className="bg-slate-50/90 rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Recaudado
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Bs. {campaign.current_amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Meta
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-500">
                    Bs. {campaign.monetary_goal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Barra Visual Suave con Gradiente */}
              <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-[var(--tenant-primary)] to-pink-400"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Apoyo directo a pacientes y familias</span>
                <span className="text-[var(--tenant-primary)] font-black">{pct}% de la meta alcanzada</span>
              </div>
            </div>
          )}

          {/* Historia Conmovedora */}
          <div className="prose prose-slate max-w-none text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-line pt-2">
            {campaign.story_markdown || campaign.description}
          </div>
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* COLUMNA DERECHA (40% ancho / 5 cols): CARD DE DONACIÓN FLOTANTE STICKY    */}
        {/* ------------------------------------------------------------------------- */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-slate-100/90">
            {/* Stepper Superior Minimalista */}
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[var(--tenant-primary)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--tenant-primary)] text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Donación
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-400">2. Datos</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-400">3. Confirmación</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Pago seguro
              </span>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Haz tu donación
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Cada boliviano cuenta para salvar vidas. Elige monto y frecuencia.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Atención</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Selector de Frecuencia */}
              {campaign.allowed_frequencies !== 'single_only' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Frecuencia de tu Aporte
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFrequency('monthly')}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                        frequency === 'monthly'
                          ? 'border-[var(--tenant-primary)] bg-[var(--tenant-light)]/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-bold text-xs sm:text-sm flex items-center gap-1 ${
                          frequency === 'monthly' ? 'text-[var(--tenant-primary)]' : 'text-slate-800'
                        }`}>
                          <RefreshCw className="w-3.5 h-3.5" /> Mensual (Padrino)
                        </span>
                        {frequency === 'monthly' && (
                          <span className="w-3.5 h-3.5 rounded-full bg-[var(--tenant-primary)] text-white flex items-center justify-center text-[9px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Débito automático cada mes.
                      </p>
                    </button>

                    {campaign.allowed_frequencies === 'all' && (
                      <button
                        type="button"
                        onClick={() => setFrequency('single')}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                          frequency === 'single'
                            ? 'border-[var(--tenant-primary)] bg-[var(--tenant-light)]/40 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-bold text-xs sm:text-sm flex items-center gap-1 ${
                            frequency === 'single' ? 'text-[var(--tenant-primary)]' : 'text-slate-800'
                          }`}>
                            <Heart className="w-3.5 h-3.5" /> Aporte Único
                          </span>
                          {frequency === 'single' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-[var(--tenant-primary)] text-white flex items-center justify-center text-[9px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Donación puntual por única vez.
                        </p>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Selector de Montos (Tiers con Impact Anchoring) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Monto de la Donación
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {tiers.map((t) => {
                    const isSelected = !isCustom && amount === t.amount;
                    return (
                      <button
                        key={t.amount}
                        type="button"
                        onClick={() => handleSelectTier(t.amount)}
                        className={`py-2.5 px-1 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all ${
                          isSelected
                            ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white shadow-md scale-[1.02]'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                        }`}
                      >
                        Bs. {t.amount}
                      </button>
                    );
                  })}
                </div>

                {/* Input Monto Personalizado */}
                <div className="mt-2.5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      Otro Bs.
                    </div>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="Ingresa otro monto solidario..."
                      className={`w-full pl-20 pr-4 py-2 rounded-xl border text-xs font-semibold transition outline-none ${
                        isCustom
                          ? 'border-[var(--tenant-primary)] ring-2 ring-[var(--tenant-primary)]/20 bg-white'
                          : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {/* 💡 Caja Dinámica de Impacto Real */}
                <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="leading-tight">
                    <strong>Tu aporte permite:</strong> {impactLabel}
                  </span>
                </div>
              </div>

              {/* 3. Selector de Método de Pago */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[var(--tenant-primary)] bg-[var(--tenant-light)]/40 text-[var(--tenant-primary)]'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Tarjeta Crédito/Débito
                  </button>

                  <button
                    type="button"
                    disabled={frequency === 'monthly'}
                    onClick={() => setPaymentMethod('qr')}
                    className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-all ${
                      frequency === 'monthly'
                        ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                        : paymentMethod === 'qr'
                        ? 'border-[var(--tenant-primary)] bg-[var(--tenant-light)]/40 text-[var(--tenant-primary)]'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4" /> Código QR Simple
                  </button>
                </div>
              </div>

              {/* 4. Datos del Donante */}
              <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/70 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Datos para el Comprobante Oficial
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => {
                        setDonorName(e.target.value);
                        setCardData(prev => ({ ...prev, cardholderName: e.target.value }));
                      }}
                      disabled={isAnonymous}
                      placeholder="Carlos Mamani"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
                      required={!isAnonymous}
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                    Correo Electrónico (Para el recibo oficial)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      disabled={isAnonymous}
                      placeholder="carlos.mamani@ejemplo.com"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
                      required={!isAnonymous}
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2" />
                  </div>
                </div>

                <div className="pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded text-[var(--tenant-primary)] focus:ring-[var(--tenant-primary)] w-3.5 h-3.5"
                    />
                    <span>Deseo realizar mi donación de forma anónima</span>
                  </label>
                </div>
              </div>

              {/* 5. Formulario de Tarjeta */}
              {paymentMethod === 'card' && (
                <AtcCreditCardForm
                  cardData={cardData}
                  onChange={setCardData}
                  disabled={isSubmitting}
                />
              )}

              {/* 6. Botón Principal CTA con Microinteracción */}
              <button
                type="submit"
                disabled={isSubmitting || currentAmount <= 0}
                className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  isSubmitting || currentAmount <= 0
                    ? 'opacity-60 cursor-not-allowed bg-slate-400'
                    : 'bg-[var(--tenant-primary)] hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{submittingStep || 'Procesando...'}</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 fill-current" />
                    <span>
                      {frequency === 'monthly'
                        ? `Ser Socio con Bs. ${currentAmount > 0 ? currentAmount : '0'} / mes`
                        : `Donar Bs. ${currentAmount > 0 ? currentAmount : '0'} Ahora`}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Sello de Confianza Bancaria */}
              <div className="pt-1 text-center">
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Procesamiento bancario seguro cifrado con protocolo 3D Secure</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
