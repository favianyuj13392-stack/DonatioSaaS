import React from 'react';
import { Heart, Download, X, Share2, CheckCircle2 } from 'lucide-react';
import { Tenant } from '../types';
import { useTenant } from '../context/TenantContext';

interface DonationSuccessModalProps {
  tenant: Tenant;
  amount: number;
  currency?: string;
  frequency: 'single' | 'monthly';
  referenceNumber?: string;
  receiptUrl?: string | null;
  campaignTitle?: string;
  onClose: () => void;
}

export const DonationSuccessModal: React.FC<DonationSuccessModalProps> = ({
  tenant,
  amount,
  currency = 'BOB',
  frequency,
  referenceNumber,
  receiptUrl,
  campaignTitle,
  onClose,
}) => {
  const { campaign } = useTenant();
  const effectiveCampaignTitle = campaignTitle || campaign?.title;
  const tenantName = tenant?.name || 'la organización';
  const campaignSuffix = effectiveCampaignTitle ? ` en la campaña "${effectiveCampaignTitle}"` : '';
  const shareText = encodeURIComponent(
    `Acabo de donar a ${tenantName}${campaignSuffix} a través de Donatio. ¡Vos también podés ayudar!`
  );
  const whatsappShareUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-10 shadow-2xl border border-slate-100 relative text-center transform transition-all animate-scaleUp">
        
        {/* Botón de Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition p-2 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícono de Corazón / Celebración */}
        <div className="w-20 h-20 bg-rose-100 text-[var(--tenant-primary)] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner ring-8 ring-rose-50">
          <Heart className="w-10 h-10 fill-current animate-bounce" />
        </div>

        {/* Badge de Impacto */}
        <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full mb-3 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Donación Confirmada Exitosamente</span>
        </div>

        {/* Titular Emocional */}
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">
          ¡Gracias por tu apoyo y generosidad!
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          Tu aporte de <strong>Bs. {amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong> a <strong>{tenant.name}</strong> ya está haciendo posible continuar con nuestra labor solidaria.
        </p>

        {/* Resumen Limpio del Aporte */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 mb-6 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Monto Aportado:</span>
            <span className="font-black text-base text-slate-900">
              {currency === 'USD' ? '$' : 'Bs.'} {amount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Frecuencia:</span>
            <span className="font-bold text-slate-800">
              {frequency === 'monthly' ? 'Socio Padrino Mensual' : 'Aporte Único'}
            </span>
          </div>

          {referenceNumber && (
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-500 font-mono text-[11px]">
              <span>Nº Referencia:</span>
              <span className="font-bold text-slate-800">{referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Acciones: Descargar Recibo + Compartir en WhatsApp + Cerrar */}
        <div className="space-y-3">
          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-[var(--tenant-primary)] flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <Download className="w-4 h-4" /> Descargar Recibo Oficial (PDF)
            </a>
          )}

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>Compartir e inspirar a otros en WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            Hacer otra donación
          </button>
        </div>

      </div>
    </div>
  );
};
