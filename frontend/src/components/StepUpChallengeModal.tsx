import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X, Smartphone, Lock, ArrowRight } from 'lucide-react';

interface StepUpChallengeModalProps {
  isOpen: boolean;
  stepUpJwt: string;
  stepUpUrl?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StepUpChallengeModal: React.FC<StepUpChallengeModalProps> = ({
  isOpen,
  stepUpJwt,
  stepUpUrl = 'https://centinelapistag.cardinalcommerce.com/V2/Cruise/StepUp',
  onSuccess,
  onCancel,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [mounted, setMounted] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const isSandboxJwt = stepUpJwt.startsWith('sandbox_');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && formRef.current && stepUpJwt && !isSandboxJwt) {
      formRef.current.submit();
    }
  }, [isOpen, stepUpJwt, isSandboxJwt]);

  if (!isOpen || !stepUpJwt || !mounted) return null;

  const handleSimulateOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setOtpError('Ingresa el código OTP (Ej: 1234 para pruebas)');
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
    }, 800);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scaleUp">
        
        {/* Cabecera Institucional de Seguridad 3DS2 */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Verificación 3D Secure 2.0</h3>
              <p className="text-[11px] text-blue-100/80">Protección Bancaria EMVCo (ATC Cybersource)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-blue-100 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="Cerrar verificación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo: Simulador Sandbox o Iframe Oficial Cardinal */}
        <div className="p-6">
          {isSandboxJwt ? (
            /* Simulador Interactivo Sandbox */
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold block text-blue-950 mb-0.5">Simulador de Banco Emisor (Sandbox)</span>
                  Ingresa el código de prueba <strong className="bg-blue-200/80 px-1.5 py-0.5 rounded text-blue-950 font-mono">1234</strong> para completar la autenticación 3DS2.
                </div>
              </div>

              <form onSubmit={handleSimulateOtpSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Código de Seguridad (OTP / SMS)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="1234"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value);
                        setOtpError(null);
                      }}
                      className="w-full py-3 pl-10 pr-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 text-center font-mono text-lg font-black tracking-widest outline-none transition"
                      autoFocus
                    />
                  </div>
                  {otpError && (
                    <p className="text-xs text-red-600 font-medium mt-1.5">{otpError}</p>
                  )}
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <span>Validando...</span>
                    ) : (
                      <>
                        <span>Verificar OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Iframe Oficial de Producción Cardinal Commerce */
            <div className="flex flex-col items-center">
              <p className="text-xs text-slate-600 mb-3 text-center leading-relaxed">
                Tu banco emisor requiere confirmar tu identidad para autorizar este aporte.
              </p>

              <iframe
                name="step-up-iframe"
                title="3DS2 Step-Up Challenge"
                className="w-full h-[360px] border border-slate-200 rounded-2xl shadow-inner bg-slate-50"
              />

              <form
                ref={formRef}
                id="step-up-form"
                target="step-up-iframe"
                method="POST"
                action={stepUpUrl}
                className="hidden"
              >
                <input type="hidden" name="JWT" value={stepUpJwt} />
              </form>

              <div className="mt-4 flex gap-3 w-full">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-xs text-slate-700 hover:bg-slate-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  Ya completé la verificación
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
