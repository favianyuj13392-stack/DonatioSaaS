import React from 'react';
import { CorporatePartner } from '../types';
import { Building2 } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface CorporatePartnersMarqueeProps {
  partners?: CorporatePartner[];
}

export const CorporatePartnersMarquee: React.FC<CorporatePartnersMarqueeProps> = ({ partners }) => {
  const { ref, isVisible } = useScrollAnimation();

  if (!partners || partners.length === 0) {
    return null;
  }

  // Duplicate partners for seamless infinite loop
  const items = partners.length >= 4 ? [...partners, ...partners] : null;
  const useMarquee = items !== null;

  const LogoCard: React.FC<{ partner: CorporatePartner }> = ({ partner }) => (
    <div
      className="bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 group flex items-center justify-center min-w-[140px] max-w-[200px] h-20 flex-shrink-0"
    >
      {partner.logo_url ? (
        <img
          src={partner.logo_url}
          alt={partner.name}
          className="max-h-10 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
          onError={(e) => {
            // Fallback: show initials if image fails
            const el = e.currentTarget;
            el.style.display = 'none';
            const next = el.nextElementSibling as HTMLElement | null;
            if (next) next.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Initials fallback (hidden by default, shown if image fails) */}
      <div
        className="hidden items-center justify-center w-10 h-10 rounded-lg font-black text-sm text-white"
        style={{ backgroundColor: 'var(--tenant-primary)', display: 'none' }}
        aria-hidden="true"
      >
        {partner.name.slice(0, 2).toUpperCase()}
      </div>
    </div>
  );

  const wrapWithLink = (partner: CorporatePartner, index: number, child: React.ReactNode) =>
    partner.website_url ? (
      <a
        key={index}
        href={partner.website_url}
        target="_blank"
        rel="noopener noreferrer"
        title={partner.name}
        className="focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--tenant-primary)] rounded-2xl"
      >
        {child}
      </a>
    ) : (
      <div key={index}>{child}</div>
    );

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="aliados"
      className={`py-16 sm:py-20 bg-slate-50/60 border-t border-slate-200/60 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-tenant">
            <Building2 className="w-3.5 h-3.5" />
            <span>Alianzas de Confianza</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Nuestros Aliados y Cooperación Institucional
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            Empresas, organismos y fundaciones aliadas que impulsan nuestros proyectos.
          </p>
        </div>

        {useMarquee ? (
          /* ── Infinite auto-scrolling marquee (4+ partners) ── */
          <div className="relative overflow-hidden" aria-label="Socios institucionales">
            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgb(248 250 252 / 0.9), transparent)' }}
              aria-hidden="true"
            />
            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, rgb(248 250 252 / 0.9), transparent)' }}
              aria-hidden="true"
            />
            <div className="flex gap-6 animate-marquee w-max">
              {items!.map((partner, index) =>
                wrapWithLink(partner, index, <LogoCard partner={partner} />)
              )}
            </div>
          </div>
        ) : (
          /* ── Static grid (< 4 partners) ── */
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
            {partners.map((partner, index) =>
              wrapWithLink(partner, index, <LogoCard partner={partner} />)
            )}
          </div>
        )}

      </div>
    </section>
  );
};
