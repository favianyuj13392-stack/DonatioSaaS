import React from 'react';
import { Tenant, Campaign } from '../types';
import { ShieldCheck, Building2, Tag, RefreshCw, CreditCard, QrCode } from 'lucide-react';

interface DonationStickySummaryProps {
  tenant: Tenant;
  campaign: Campaign;
  amount: number;
  frequency: 'single' | 'monthly';
  paymentMethod: 'card' | 'qr';
}

export const DonationStickySummary: React.FC<DonationStickySummaryProps> = ({
  tenant,
  campaign,
  amount,
  frequency,
  paymentMethod,
}) => {
  const banner = campaign.banner_url || tenant.logo_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="sticky top-6 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
      {/* Portada con eslogan */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        <img
          src={banner}
          alt={campaign.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex items-end p-5">
          <p className="text-white font-medium text-sm sm:text-base leading-snug drop-shadow-md">
            "{campaign.description || 'Con tu ayuda, transformamos el futuro de quienes más lo necesitan.'}"
          </p>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Resumen de tu Donación
        </h3>

        <div className="space-y-3 pb-5 border-b border-slate-100 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-slate-500 gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Institución
            </span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
              {tenant.name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-slate-500 gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              Monto
            </span>
            <span className="font-semibold text-slate-800">
              Bs. {amount > 0 ? amount.toLocaleString('es-BO') : '0'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-slate-500 gap-2">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              Frecuencia
            </span>
            <span className={`font-semibold ${frequency === 'monthly' ? 'text-[var(--tenant-primary)]' : 'text-slate-800'}`}>
              {frequency === 'monthly' ? 'Mensual (Padrino)' : 'Aporte Único'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-slate-500 gap-2">
              {paymentMethod === 'card' ? (
                <CreditCard className="w-4 h-4 text-slate-400" />
              ) : (
                <QrCode className="w-4 h-4 text-slate-400" />
              )}
              Método
            </span>
            <span className="font-semibold text-slate-800">
              {paymentMethod === 'card' ? 'Tarjeta Cifrada (3DS)' : 'Código QR Simple'}
            </span>
          </div>
        </div>

        {/* Total por Cobro */}
        <div className="pt-4 flex items-baseline justify-between mb-5">
          <span className="text-slate-700 font-bold text-base">
            Total {frequency === 'monthly' ? 'por mes' : 'a donar'}:
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[var(--tenant-primary)] tracking-tight">
            Bs. {amount > 0 ? amount.toLocaleString('es-BO') : '0'}
          </span>
        </div>

        {/* Badge de Seguridad 100% */}
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-800 leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-900">Tu donación es 100% segura</p>
            <p className="text-emerald-700/90 text-[11px] mt-0.5">
              Procesamiento bancario directo con cifrado SSL y autenticación 3D Secure homologada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
