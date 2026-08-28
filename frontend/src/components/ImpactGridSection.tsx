import React from 'react';
import { Utensils, Pill, Home, Heart, BookOpen, Trees, Droplet, Shield, ArrowUpRight } from 'lucide-react';
import { TangibleImpactItem, DonationTier } from '../types';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface ImpactGridSectionProps {
  impactItems?: TangibleImpactItem[];
  tiers?: DonationTier[];
}

function getImpactIcon(iconName: string) {
  const cls = 'w-7 h-7';
  switch (iconName?.toLowerCase()) {
    case 'tree':
    case 'trees':    return <Trees className={cls} />;
    case 'droplet':
    case 'water':    return <Droplet className={cls} />;
    case 'shield':   return <Shield className={cls} />;
    case 'utensils': return <Utensils className={cls} />;
    case 'pill':     return <Pill className={cls} />;
    case 'home':     return <Home className={cls} />;
    case 'book':     return <BookOpen className={cls} />;
    default:         return <Heart className={cls} />;
  }
}

export const ImpactGridSection: React.FC<ImpactGridSectionProps> = ({ impactItems, tiers }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.05 });

  if ((!impactItems || impactItems.length === 0) && (!tiers || tiers.length === 0)) {
    return null;
  }

  const items = impactItems && impactItems.length > 0
    ? impactItems
    : (tiers || []).slice(0, 4).map((t, idx) => ({
        icon: idx === 0 ? 'heart' : idx === 1 ? 'pill' : idx === 2 ? 'home' : 'book',
        title: t.label,
        description: `Tu aporte de Bs. ${t.amount} genera un impacto tangible y directo.`,
        stat_highlight: `Bs. ${t.amount}`,
      }));

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="impacto"
      className="overflow-hidden"
    >
      {/* ── Section label (outside the grid, on white) ── */}
      <div className="bg-slate-50 border-t border-slate-200/60 px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div
            className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="space-y-4 max-w-2xl">
              <span
                className="inline-block text-[11px] font-black uppercase tracking-[0.2em]"
                style={{ color: 'var(--tenant-primary)' }}
              >
                Destino de tu Aporte
              </span>
              <h2
                className="text-slate-900 font-black leading-[0.92] tracking-[-0.03em]"
                style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)' }}
              >
                Tu aporte,<br />impacto concreto
              </h2>
            </div>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-sm sm:text-right">
              Cada donación tiene un propósito definido y se traduce en acciones verificables sobre el terreno.
            </p>
          </div>
        </div>
      </div>

      {/* ── High-contrast alternating grid ── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${items.length >= 4 ? 'lg:grid-cols-4' : items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {items.map((imp, idx) => {
          // Alternate between dark and tenant-primary
          const isDark = idx % 2 === 0;
          const staggerDelay = Math.min(idx * 100, 400);

          return (
            <div
              key={idx}
              className={`relative p-8 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[280px] sm:min-h-[320px] overflow-hidden group transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                backgroundColor: isDark ? '#0f172a' : 'var(--tenant-primary)',
                transitionDelay: `${staggerDelay}ms`,
              }}
            >
              {/* Decorative circle accent */}
              <div
                className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full pointer-events-none transition-transform duration-500 group-hover:scale-125"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)' }}
                aria-hidden="true"
              />

              {/* Top: icon + stat */}
              <div className="relative z-10 space-y-6">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.15)',
                    color: '#ffffff',
                  }}
                >
                  {getImpactIcon(imp.icon)}
                </div>

                {/* Giant stat */}
                <div
                  className="font-black leading-none tracking-[-0.04em] text-white"
                  style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}
                >
                  {imp.stat_highlight}
                </div>
              </div>

              {/* Bottom: title + description */}
              <div className="relative z-10 space-y-2 mt-8">
                <h3 className="text-white font-black text-lg sm:text-xl leading-tight">
                  {imp.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.80)' }}
                >
                  {imp.description}
                </p>
              </div>

              {/* Corner arrow on hover */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <ArrowUpRight className="w-5 h-5 text-white/40" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
