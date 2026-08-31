import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X } from 'lucide-react';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && formRef.current && stepUpJwt) {
      formRef.current.submit();
    }
  }, [isOpen, stepUpJwt]);

  if (!isOpen || !stepUpJwt || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scaleUp">
        
        {/* Cabecera Oficial 3D Secure 2.0 */}
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

        {/* Contenido del Iframe Bancario Real */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-xs text-slate-600 mb-3 text-center leading-relaxed">
            Tu banco emisor requiere confirmar tu identidad mediante un código de seguridad para autorizar este aporte solidario.
          </p>

          <iframe
            name="step-up-iframe"
            title="3DS2 Step-Up Challenge"
            className="w-full h-[380px] border border-slate-200 rounded-2xl shadow-inner bg-slate-50"
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
              className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSuccess}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              Ya completé la verificación
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
