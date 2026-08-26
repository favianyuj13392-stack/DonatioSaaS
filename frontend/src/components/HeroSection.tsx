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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA (60% ancho / 7 cols): PROTAGONISTA EMOCIONAL            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Eyebrow / Identificador de Causa con Tokens Dinámicos */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider badge-tenant"
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--tenant-primary)' }}
            />
            <span>{eyebrowText}</span>
          </div>

          {/* Headline Emocional de Gran Impacto */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
            {headline}
          </h1>

          {/* Descripción Breve */}
          {description && (
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}

          {/* Fotografía de Impacto en Formato 16:9 */}
          {banner && (
            <div className="rounded-3xl shadow-xl overflow-hidden aspect-video w-full bg-slate-900 relative group">
              <img
                src={banner}
                alt={headline}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
                <div className="text-white text-xs sm:text-sm font-medium flex items-center gap-2 drop-shadow-md">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>
                    {tenant.location_city
                      ? `Impacto activo en ${tenant.location_city}`
                      : `Comunidad solidaria de ${tenant.name}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Métricas de Recaudación y Barra de Progreso (Solo en Campañas con Meta) */}
          {isCampaignMode && monetaryGoal > 0 && (
            <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/70 space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Recaudado
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Bs. {currentAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Meta Solidaria
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-500">
                    Bs. {monetaryGoal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Barra Visual Proporcional */}
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out progress-bar-tenant"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 inline" /> Transparencia y destino directo
                </span>
                <span
                  className="font-black"
                  style={{ color: 'var(--tenant-primary)' }}
                >
                  {pct}% de la meta alcanzada
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA (40% ancho / 5 cols): DONATION DECISION WIDGET STICKY     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <DonationWidget />
        </div>

      </div>
    </section>
  );
};
