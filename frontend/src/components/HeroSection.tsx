import React from 'react';
import { useTenant } from '../context/TenantContext';
import { DonationWidget } from './DonationWidget';
import { TrendingUp, Users } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { tenant, campaign, routeMode } = useTenant();

  if (!tenant) return null;

  const isCampaignMode = routeMode === 'campaign' && !!campaign;
  const monetaryGoal = isCampaignMode ? (campaign?.monetary_goal || 0) : 0;
  const currentAmount = isCampaignMode ? (campaign?.current_amount || 0) : 0;
  const pct = monetaryGoal > 0 ? Math.min(100, Math.round((currentAmount / monetaryGoal) * 100)) : 0;

  const banner = isCampaignMode
    ? (campaign?.banner_url || tenant.hero_image_url || tenant.logo_url)
    : (tenant.hero_image_url || tenant.logo_url);

  const headline = isCampaignMode
    ? (campaign?.headline || campaign?.title || tenant.name)
    : (tenant.hero_headline || tenant.name);

  const description = isCampaignMode
    ? (campaign?.description || tenant.mission || '')
    : (tenant.hero_description || tenant.mission || tenant.about_text || '');

  const eyebrowText = isCampaignMode
    ? (campaign?.title || 'Campaña Activa')
    : (tenant.code ? `${tenant.name} · ${tenant.code}` : 'Organización Sin Fines de Lucro');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Narrative Top */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider badge-tenant"
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
          />
          <span>{eyebrowText}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
          {headline}
        </h1>

        {description && (
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {description}
          </p>
        )}

        {/* Métricas de Recaudación y Barra de Progreso (Solo en Campañas con Meta) */}
        {isCampaignMode && monetaryGoal > 0 && (
          <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/70 space-y-2.5 max-w-xl mx-auto text-left mt-4">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Recaudado
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Bs. {currentAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Meta Solidaria
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-500">
                  Bs. {monetaryGoal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out progress-bar-tenant"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs font-bold pt-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 inline" /> Transparencia garantizada
              </span>
              <span
                className="font-black"
                style={{ color: 'var(--tenant-primary)' }}
              >
                {pct}% alcanzado
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Formulario de Donación Oficial Certificado ATC (2 Columnas) */}
      <DonationWidget />
    </section>
  );
};
