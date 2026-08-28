import React, { type RefObject } from 'react';
import { useTenant } from '../context/TenantContext';
import { Target, Compass, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const AboutSection: React.FC = () => {
  const { tenant } = useTenant();
  const { ref: refMain, isVisible: mainVisible } = useScrollAnimation();
  const { ref: refCards, isVisible: cardsVisible } = useScrollAnimation({ threshold: 0.1 });

  if (!tenant) return null;

  const hasAbout = !!tenant.about_text;
  const hasMission = !!tenant.mission;
  const hasVision = !!tenant.vision;
  const hasValues = !!(tenant.values && tenant.values.length > 0);

  if (!hasAbout && !hasMission && !hasVision && !hasValues) {
    return null;
  }

  return (
    <section
      id="quienes-somos"
      className="relative overflow-hidden section-tenant-primary"
    >
      {/* Decorative large circle — editorial accent */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-48 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
        aria-hidden="true"
      />

      {/* ── TOP BLOCK: About text as pull quote or Section Title ── */}
      <div
        ref={refMain as RefObject<HTMLDivElement>}
        className={`max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-12 transition-all duration-700 ease-out ${mainVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Label */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
            Nuestra Identidad
          </span>
        </div>

        {/* Section title */}
        <h2
          className="text-white font-black leading-[0.95] tracking-tight mb-8"
          style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4.2rem)' }}
        >
          Quiénes Somos
        </h2>

        {/* Pull quote (if about_text exists) */}
        {hasAbout && (
          <blockquote className="pull-quote max-w-3xl mb-4">
            <p className="text-white/90 text-xl sm:text-2xl lg:text-3xl font-semibold leading-relaxed italic">
              "{tenant.about_text}"
            </p>
          </blockquote>
        )}
      </div>

      {/* ── DIVIDER (if there are mission/vision below) ── */}
      {(hasMission || hasVision || hasValues) && (
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />
        </div>
      )}

      {/* ── BOTTOM BLOCK: Mission + Vision + Values ── */}
      <div
        ref={refCards as RefObject<HTMLDivElement>}
        className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-16"
      >
        {(hasMission || hasVision) && (
          <div className={`grid grid-cols-1 ${hasMission && hasVision ? 'lg:grid-cols-2' : ''} gap-0 lg:gap-12 transition-all duration-700 ease-out delay-100 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {hasMission && (
              <div className="space-y-4 py-8 lg:py-0">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">
                    Nuestra Misión
                  </h3>
                </div>
                <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
                  {tenant.mission}
                </p>
              </div>
            )}

            {/* Vertical divider between mission and vision */}
            {hasMission && hasVision && (
              <div className="hidden lg:block" aria-hidden="true" />
            )}
            {hasMission && hasVision && (
              <div className="lg:hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} aria-hidden="true" />
            )}

            {hasVision && (
              <div className="space-y-4 py-8 lg:py-0">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <Compass className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">
                    Nuestra Visión
                  </h3>
                </div>
                <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
                  {tenant.vision}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Values */}
        {hasValues && (
          <div
            className={`mt-12 pt-8 transition-all duration-700 ease-out delay-200 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/50 mb-5">
              Valores y Principios
            </p>
            <div className="flex flex-wrap gap-3">
              {tenant.values?.map((val, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white border"
                  style={{ borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.10)' }}
                >
                  {val}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
