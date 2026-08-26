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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-scaleUp">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-200" />
            <h3 className="font-bold text-base">Verificación de Seguridad 3D Secure 2.0</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-blue-100 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <p className="text-sm text-gray-600 mb-4 text-center leading-relaxed">
            Tu banco emisor requiere confirmar tu identidad mediante un código de seguridad para autorizar este aporte solidario.
          </p>

          <iframe
            name="step-up-iframe"
            title="3DS2 Step-Up Challenge"
            className="w-full h-[380px] border border-gray-200 rounded-2xl shadow-inner bg-gray-50"
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

          <div className="mt-6 flex gap-3 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSuccess}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
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
