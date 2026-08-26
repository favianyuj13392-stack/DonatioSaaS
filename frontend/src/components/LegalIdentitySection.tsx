import React from 'react';
import { useTenant } from '../context/TenantContext';
import { ShieldCheck, Scale, FileText } from 'lucide-react';

export const LegalIdentitySection: React.FC = () => {
  const { tenant } = useTenant();

  if (!tenant) return null;

  const hasLegalName = !!tenant.legal_name;
  const hasLegalId = !!tenant.legal_id_details;
  const hasNit = !!tenant.nit;
  const hasCity = !!tenant.location_city;

  // Si no hay ningún dato legal configurado, no renderizar nada
  if (!hasLegalName && !hasLegalId && !hasNit && !hasCity) {
    return null;
  }

  return (
    <div className="pt-8 border-t border-white/10 text-xs text-slate-400 space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
        {hasLegalName && (
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Entidad Civil: {tenant.legal_name}</span>
          </span>
        )}

        {hasLegalId && (
          <span className="flex items-center gap-1.5 text-slate-300">
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{tenant.legal_id_details}</span>
          </span>
        )}

        {/* ⚠️ CERO HARDCODING DE NIT: Solo se renderiza si tenant.nit tiene un valor real */}
        {hasNit && (
          <span className="bg-white/10 px-2.5 py-0.5 rounded-md font-mono text-slate-200">
            NIT: {tenant.nit}
          </span>
        )}

        {hasCity && (
          <span className="text-slate-400">
            {tenant.location_city}
          </span>
        )}
      </div>

      <div className="text-center text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Recaudación solidaria autorizada y procesada de forma segura por ATC Red Enlace</span>
        </span>
      </div>
    </div>
  );
};
