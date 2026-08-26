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
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const DonationWidget: React.FC = () => {
  const { tenant, campaign, subdomain, refreshData } = useTenant();

  // Paso actual del widget (1: Decidir, 2: Datos, 3: Pago)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const defaultFoundationTiers: DonationTier[] = [
    { amount: 20, label: 'Aporte solidario inicial', is_default: false },
    { amount: 50, label: 'Aporte de apoyo continuo', is_default: true },
    { amount: 100, label: 'Aporte de alto impacto comunitario', is_default: false },
    { amount: 200, label: 'Aporte de transformación sostenible', is_default: false },
  ];

  const tiers: DonationTier[] = campaign?.donation_tiers && campaign.donation_tiers.length > 0
    ? campaign.donation_tiers
    : defaultFoundationTiers;

  // Frecuencia inicial
  const initialFrequency = campaign?.allowed_frequencies === 'monthly_only' ? 'monthly' : 'single';
  const [frequency, setFrequency] = useState<'single' | 'monthly'>(initialFrequency);

  // Método de pago: card | qr
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr'>('card');

  // Montos
  const defaultTier = tiers.find(t => t.is_default) || tiers[1] || tiers[0];
  const [amount, setAmount] = useState<number>(defaultTier?.amount || 50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Datos del donante
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

  // Tarjeta bancaria con AVS
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

  // Estados de proceso
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

  useEffect(() => {
    if (frequency === 'monthly' && paymentMethod === 'qr') {
      setPaymentMethod('card');
    }
  }, [frequency, paymentMethod]);

  const currentAmount = isCustom ? parseFloat(customAmount) || 0 : amount;
  const currentTier = tiers.find(t => t.amount === currentAmount);
  const impactLabel = currentTier?.label || (isCustom ? 'Aporte solidario para medicamentos y albergue' : 'Cubre insumos y atención médica');

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

  // Validar Paso 1 y avanzar a Paso 2
  const handleProceedToStep2 = () => {
    setErrorMessage(null);
    if (currentAmount <= 0) {
      setErrorMessage('Por favor selecciona o ingresa un monto válido para continuar.');
      return;
    }
    setStep(2);
  };

  // Validar Paso 2 y avanzar a Paso 3 (o disparar QR)
  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAnonymous && !donorEmail) {
      setErrorMessage('Por favor ingresa tu correo electrónico para enviarte el comprobante.');
      return;
    }

    if (paymentMethod === 'qr') {
      handleProcessDonation();
    } else {
      setStep(3);
    }
  };

  // Finalizar Cobro
  const executeFinalCheckout = async (refNumber: string, auth3ds?: any) => {
    console.log('[DonationWidget] executeFinalCheckout starting with ref:', refNumber);
    if (!tenant) return;

    setSubmittingStep('Procesando donación segura...');
    const [expMonth, expYear] = cardData.expiration.split('/');
    const cleanCard = cardData.cardNumber.replace(/\s+/g, '');

    const checkoutPayload = {
      foundation_id: tenant.id,
      campaign_id: campaign?.id || null,
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
      card_type: cleanCard.startsWith('4') ? 'VISA' : (cleanCard.startsWith('5') ? 'MASTERCARD' : 'AMEX'),
      cavv: auth3ds?.cavv || null,
      eci_raw: auth3ds?.eci || (cleanCard.startsWith('5') ? '02' : '05'),
      xid: auth3ds?.xid || null,
      three_ds_server_transaction_id: auth3ds?.threeDSServerTransactionId || null,
      accepted_terms: true,
    };

    console.log('[DonationWidget] Submitting checkout payload...');
    const checkoutResult = await submitCheckout(subdomain, checkoutPayload);
    console.log('[DonationWidget] Checkout result received:', checkoutResult);

    setSuccessModalData({
      amount: currentAmount,
      frequency,
      referenceNumber: checkoutResult.merchant_reference_number || refNumber,
      receiptUrl: checkoutResult.receipt_url || null,
    });
    console.log('[DonationWidget] successModalData successfully set!');

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

  // Procesar Donación (Paso 3)
  const handleProcessDonation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    setIsSubmitting(true);

    try {
      if (!tenant) return;

      if (paymentMethod === 'qr') {
        setSubmittingStep('Generando código QR dinámico...');
        const qrRes = await generateQrDonation(subdomain, {
          foundation_id: tenant.id,
          campaign_id: campaign?.id || null,
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
        setSubmittingStep('Iniciando sesión bancaria segura...');
        console.log('[DonationWidget] Calling setup3dsSession...');
        const setupRes = await setup3dsSession(subdomain, {
          card_number: cleanCard,
          expiration_month: expMonth,
          expiration_year: `20${expYear}`,
        });
        console.log('[DonationWidget] setup3dsSession response:', setupRes);

        const refNo = setupRes.merchant_reference_number;
        const authInfo = setupRes.data;
        setPendingRefNumber(refNo);

        if (authInfo?.accessToken) {
          setCardinalJwt(authInfo.accessToken);
        }

        // 2. Check Enrollment
        setSubmittingStep('Verificando autenticación con el banco...');
        console.log('[DonationWidget] Calling check3dsEnrollment with ref:', refNo);
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
        console.log('[DonationWidget] check3dsEnrollment response:', enrollRes);

        if (enrollRes.isChallengeRequired && enrollRes.stepUpJwt) {
          console.log('[DonationWidget] Step-Up challenge required!');
          setStepUpJwt(enrollRes.stepUpJwt);
          setPendingAuthTxId(enrollRes.authenticationTransactionId || null);
          return;
        }

        // Frictionless
        console.log('[DonationWidget] Frictionless flow -> calling executeFinalCheckout...');
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
            setStep(1);
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
          onClose={() => {
            setSuccessModalData(null);
            setStep(1);
          }}
        />
      )}

      {/* Tarjeta Flotante Minimalista de Donación */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100/90 transition-all duration-300">
        
        {/* Stepper Superior Minimalista */}
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <span className={`flex items-center gap-1 ${step >= 1 ? 'text-[var(--tenant-primary)]' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 1 ? 'bg-[var(--tenant-primary)] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {step > 1 ? '✓' : '1'}
              </span>
              Aporte
            </span>
            <span className="text-slate-300">/</span>
            <span className={`flex items-center gap-1 ${step >= 2 ? 'text-[var(--tenant-primary)]' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 2 ? 'bg-[var(--tenant-primary)] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {step > 2 ? '✓' : '2'}
              </span>
              Datos
            </span>
            <span className="text-slate-300">/</span>
            <span className={`flex items-center gap-1 ${step === 3 ? 'text-[var(--tenant-primary)]' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 3 ? 'bg-[var(--tenant-primary)] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </span>
              Pago
            </span>
          </div>

          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Pago Seguro
          </span>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Por favor verifica:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 1: DECIDIR (FRECUENCIA + MONTO + IMPACTO)                            */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Haz tu aporte
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Elige cuánto quieres aportar y con qué frecuencia.
              </p>
            </div>

            {/* Selector de Frecuencia */}
            {campaign?.allowed_frequencies !== 'single_only' && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFrequency('monthly')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                    frequency === 'monthly'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--tenant-primary)]" />
                  <span>{campaign?.monthly_label || 'Cada mes'}</span>
                </button>

                {(!campaign || campaign.allowed_frequencies === 'all') && (
                  <button
                    type="button"
                    onClick={() => setFrequency('single')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                      frequency === 'single'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-[var(--tenant-primary)]" />
                    <span>{campaign?.single_label || 'Una sola vez'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Selector de Montos (Tiers) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                ¿Cuánto quieres aportar?
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {tiers.map((t) => {
                  const isSelected = !isCustom && amount === t.amount;
                  return (
                    <button
                      key={t.amount}
                      type="button"
                      onClick={() => handleSelectTier(t.amount)}
                      className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base border-2 transition-all ${
                        isSelected
                          ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white shadow-md scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      Bs. {t.amount}
                    </button>
                  );
                })}
              </div>

              {/* Input Monto Personalizado */}
              <div className="relative pt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  Otro Bs.
                </div>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Ingresa otro monto solidario..."
                  className={`w-full pl-20 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition outline-none ${
                    isCustom
                      ? 'border-[var(--tenant-primary)] ring-2 ring-[var(--tenant-primary)]/20 bg-white'
                      : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-300'
                  }`}
                />
              </div>

              {/* 💡 Impacto Sutil Concreto */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="leading-snug">
                  <strong>Tu aporte puede cubrir:</strong> {impactLabel}
                </span>
              </div>
            </div>

            {/* Botón Continuar a Paso 2 */}
            <button
              type="button"
              onClick={handleProceedToStep2}
              disabled={currentAmount <= 0}
              className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                currentAmount <= 0
                  ? 'opacity-60 cursor-not-allowed bg-slate-400'
                  : 'bg-[var(--tenant-primary)] hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl'
              }`}
            >
              <Heart className="w-5 h-5 fill-current" />
              <span>Continuar con Bs. {currentAmount > 0 ? currentAmount : '0'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Trust Footer */}
            <div className="text-center pt-1 text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <span>🔒 Donación segura</span>
              <span>•</span>
              <span>Recibo oficial de {tenant.name}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: TUS DATOS (NOMBRE + CORREO + MÉTODO DE PAGO)                       */}
        {/* ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleProceedToStep3} className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Tus datos de contacto
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Para enviarte el comprobante oficial de tu donación.
              </p>
            </div>

            {/* Inputs de Donante */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none transition"
                    required={!isAnonymous}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    disabled={isAnonymous}
                    placeholder="carlos.mamani@ejemplo.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none transition"
                    required={!isAnonymous}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-[var(--tenant-primary)] focus:ring-[var(--tenant-primary)] w-4 h-4"
                  />
                  <span>Deseo realizar mi donación de forma anónima</span>
                </label>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Método de Pago
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
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
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
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

            {/* Botones de Navegación */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-4 rounded-2xl font-black text-base text-white bg-[var(--tenant-primary)] hover:scale-[1.02] active:scale-[0.98] shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {paymentMethod === 'qr' ? 'Generar Código QR' : 'Ir al Pago'} · Bs. {currentAmount}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: PAGO SEGURO (FORMULARIO DE TARJETA BANCARIA 3DS2)                 */}
        {/* ========================================================================= */}
        {step === 3 && (
          <form onSubmit={handleProcessDonation} className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Datos de la Tarjeta
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Aporte de <strong>Bs. {currentAmount}</strong> ({frequency === 'monthly' ? 'Mensual recurrente' : 'Aporte único'}).
              </p>
            </div>

            {/* Formulario de Tarjeta */}
            <AtcCreditCardForm
              cardData={cardData}
              onChange={setCardData}
              disabled={isSubmitting}
            />

            {/* Botones de Acción */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? 'opacity-60 cursor-not-allowed bg-slate-400'
                    : 'bg-[var(--tenant-primary)] hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{submittingStep || 'Procesando pago seguro...'}</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 fill-current" />
                    <span>
                      {frequency === 'monthly'
                        ? `Ser Socio con Bs. ${currentAmount} / mes`
                        : `Donar Bs. ${currentAmount} Ahora`}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setStep(2)}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                ← Modificar datos de contacto
              </button>
            </div>

            {/* Sello de Seguridad */}
            <div className="text-center pt-1">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cifrado bancario seguro SSL homologado por ATC Red Enlace</span>
              </p>
            </div>
          </form>
        )}

      </div>
    </>
  );
};
