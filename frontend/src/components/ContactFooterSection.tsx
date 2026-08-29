import React from 'react';
import { useTenant } from '../context/TenantContext';
import { Mail, Phone, MapPin, ShieldCheck, Lock, CreditCard, QrCode } from 'lucide-react';

export const ContactFooterSection: React.FC = () => {
  const { tenant, navigateToHome, navigateToCampaigns, paymentProviders } = useTenant();

  if (!tenant) return null;

  const activeProviders = paymentProviders?.filter(p => p.is_active !== false) || [];
  const providersText = activeProviders.length > 0
    ? activeProviders.map(p => p.name).join(', ')
    : null;

  return (
    <footer id="contacto" className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Grid de 4 Columnas Institucionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-slate-800/80">
          
          {/* Columna 1: Identidad Institucional (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <button
              type="button"
              onClick={navigateToHome}
              className="flex items-center gap-3 text-left focus:outline-hidden"
            >
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-10 w-auto object-contain brightness-0 invert max-w-[150px]"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[var(--tenant-primary)] text-white flex items-center justify-center font-black text-lg">
                  {tenant.code?.slice(0, 2) || 'ON'}
                </div>
              )}
              <span className="text-base sm:text-lg font-black text-white tracking-tight">
                {tenant.name}
              </span>
            </button>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              {tenant.mission || 'Organización sin fines de lucro comprometida con el desarrollo social, la transparencia y el impacto medible.'}
            </p>

            {tenant.location_city && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sede Principal: <strong>{tenant.location_city}</strong></span>
              </div>
            )}
          </div>

          {/* Columna 2: Nosotros / Navegación Rápida (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Nosotros
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={navigateToHome}
                  className="hover:text-white transition-colors"
                >
                  Inicio
                </button>
              </li>
              <li>
                <a href="#quienes-somos" className="hover:text-white transition-colors">
                  Quiénes somos
                </a>
              </li>
              <li>
                <a href="#programas" className="hover:text-white transition-colors">
                  Qué hacemos
                </a>
              </li>
              <li>
                <a href="#transparencia" className="hover:text-white transition-colors">
                  Transparencia
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={navigateToCampaigns}
                  className="hover:text-white transition-colors text-left"
                >
                  Campañas activas
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legal & Fiscal (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Legal & Transparencia
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              {tenant.legal_name && (
                <li className="text-slate-300 font-semibold">
                  {tenant.legal_name}
                </li>
              )}
              {tenant.legal_id_details && (
                <li>
                  {tenant.legal_id_details}
                </li>
              )}
              {/* ⚠️ CERO HARDCODING DE NIT */}
              {tenant.nit && (
                <li className="font-mono text-slate-300">
                  NIT: {tenant.nit}
                </li>
              )}
              <li className="pt-2 text-[11px] text-slate-500">
                Entidad legalmente constituida y habilitada para recaudación de fondos solidarios.
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto & Procesamiento Seguro (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Contacto & Soporte
            </h4>
            <ul className="space-y-2.5">
              {tenant.contact_email && (
                <li>
                  <a
                    href={`mailto:${tenant.contact_email}`}
                    className="flex items-center gap-2 hover:text-white transition-colors text-slate-300"
                  >
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{tenant.contact_email}</span>
                  </a>
                </li>
              )}
              {tenant.phone && (
                <li>
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-2 hover:text-white transition-colors text-slate-300"
                  >
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{tenant.phone}</span>
                  </a>
                </li>
              )}
            </ul>

            {/* Módulo Discreto de Procesamiento Seguro */}
            <div className="pt-3 bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Procesamiento de Pago Seguro</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {providersText ? (
                  <>Autorizado y procesado de forma segura a través de <strong>{providersText}</strong>.</>
                ) : (
                  <>Procesamiento seguro certificado con tecnología y cifrado de alta seguridad.</>
                )}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                  <CreditCard className="w-3 h-3" /> Tarjeta
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                  <QrCode className="w-3 h-3" /> QR Simple
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3" /> SSL 256-bit
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Sub-footer con Créditos */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Plataforma de Fundraising Multi-Tenant</span>
            <span>•</span>
            <strong className="text-white font-bold">Powered by Donatio</strong>
          </div>
        </div>

      </div>
    </footer>
  );
};
