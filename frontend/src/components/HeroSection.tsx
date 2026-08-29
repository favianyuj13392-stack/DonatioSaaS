import React, { useEffect, useRef, useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { DonationWidget } from './DonationWidget';
import { TrendingUp, ChevronDown } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { tenant, campaign, routeMode } = useTenant();
  const [textVisible, setTextVisible] = useState(false);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Entrance animations on mount
  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 80);
    const t2 = setTimeout(() => setWidgetVisible(true), 320);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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
    : 'Organización Sin Fines de Lucro';

  const scrollDown = () => {
    const next = heroRef.current?.nextElementSibling as HTMLElement | null;
    next?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={heroRef}
      className="w-full relative flex flex-col lg:flex-row min-h-[100svh] lg:min-h-[92vh] overflow-hidden"
    >
      {/* ── Background Image (full cover, behind everything) ── */}
      {banner ? (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, var(--tenant-secondary, #0f172a) 0%, var(--tenant-primary) 100%)',
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Left gradient overlay (editorial: stronger left, fades right) ── */}
      <div
        className="absolute inset-0 z-10 hero-gradient-left"
        aria-hidden="true"
      />

      {/* ── Subtle tenant-color vignette at bottom ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── LEFT COLUMN: Editorial copy (55% on desktop) ── */}
      <div className="relative z-20 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-20 pt-28 pb-16 lg:pt-0 lg:pb-0 lg:w-[58%] min-h-[60vh] lg:min-h-0">

        {/* Eyebrow badge */}
        <div
          className={`mb-6 inline-flex items-center gap-2 transition-all duration-700 ease-out ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] bg-white/15 text-white backdrop-blur-sm border border-white/25"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {eyebrowText}
          </span>
        </div>

        {/* Display headline — the visual anchor */}
        <h1
          className={`text-white font-black leading-[1.02] tracking-tight mb-6 transition-all duration-700 ease-out delay-75 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ fontSize: 'clamp(2.2rem, 4.2vw, 4.2rem)' }}
        >
          {headline}
        </h1>

        {/* Description */}
        {description && (
          <p
            className={`text-white/80 text-base sm:text-lg lg:text-xl leading-relaxed max-w-lg mb-8 transition-all duration-700 ease-out delay-150 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            {description}
          </p>
        )}

        {/* Campaign progress bar (campaign mode only) */}
        {isCampaignMode && monetaryGoal > 0 && (
          <div
            className={`mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 max-w-md transition-all duration-700 ease-out delay-200 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 block mb-0.5">Recaudado</span>
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Bs. {currentAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 block mb-0.5">Meta</span>
                <span className="text-sm font-bold text-white/70">
                  Bs. {monetaryGoal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div
              className="w-full bg-white/20 h-2 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de recaudación"
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: 'var(--tenant-on-primary, #ffffff)',
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[11px] font-bold text-white/60">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 inline" /> Transparencia garantizada
              </span>
              <span className="text-white font-black">{pct}% alcanzado</span>
            </div>
          </div>
        )}

        {/* CTA — scroll to widget on mobile, just a visual anchor */}
        <div
          className={`flex items-center gap-4 transition-all duration-700 ease-out delay-300 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <a
            href="#donacion"
            className="btn-tenant-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-black shadow-xl active:scale-95 lg:hidden"
          >
            Donar ahora
          </a>
          <button
            type="button"
            onClick={scrollDown}
            className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-widest hover:text-white transition group"
          >
            Conocé más
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Donation Widget (45% on desktop, floating panel) ── */}
      <div
        id="donacion"
        className={`relative z-20 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-10 py-8 lg:py-16 lg:w-[42%] transition-all duration-700 ease-out ${widgetVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
      >
        {/* Glassmorphism card wrapper for the widget */}
        <div className="lg:bg-white/10 lg:backdrop-blur-md lg:rounded-3xl lg:p-1 lg:border lg:border-white/20 lg:shadow-2xl">
          <div className="bg-white rounded-2xl lg:rounded-[1.1rem] overflow-hidden shadow-2xl">
            <DonationWidget />
          </div>
        </div>
      </div>

      {/* ── Scroll indicator at bottom center ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden lg:flex flex-col items-center gap-2 animate-bounce pointer-events-none">
        <ChevronDown className="w-5 h-5 text-white/50" />
      </div>
    </section>
  );
};
