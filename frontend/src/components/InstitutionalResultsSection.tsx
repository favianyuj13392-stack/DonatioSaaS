import React from 'react';
import { useTenant } from '../context/TenantContext';
import { InstitutionalMetric } from '../types';
import { LegalIdentitySection } from './LegalIdentitySection';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCountUp } from '../hooks/useCountUp';

interface InstitutionalResultsSectionProps {
  metrics?: InstitutionalMetric[];
}

function parseMetric(value: string) {
  const trimmed = value.trim();
  // Match prefix (non-digit at start like "+"), number with optional dots/commas, and trailing suffix
  const match = trimmed.match(/^([^\d]*)([\d.,]+)\s*(.*)$/);
  if (match) {
    const prefix = match[1] || '';
    const rawNumberStr = match[2];
    const suffix = match[3] || '';

    const cleanNumberStr = rawNumberStr.replace(/\./g, '').replace(/,/g, '');
    const num = parseInt(cleanNumberStr, 10);

    if (!isNaN(num)) {
      return {
        prefix,
        number: num,
        suffix,
      };
    }
  }
  return { prefix: '', number: null, suffix: trimmed };
}

const AnimatedMetric: React.FC<{ value: string; isVisible: boolean }> = ({ value, isVisible }) => {
  const parsed = parseMetric(value);

  if (parsed.number === null) {
    return <span className="text-3xl sm:text-4xl lg:text-5xl font-black">{value}</span>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedNumber = useCountUp({ target: parsed.number, enabled: isVisible });

  return (
    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
      <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-none">
        {parsed.prefix}{animatedNumber}
      </span>
      {parsed.suffix && (
        <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white/70 tracking-tight leading-none">
          {parsed.suffix}
        </span>
      )}
    </div>
  );
};

export const InstitutionalResultsSection: React.FC<InstitutionalResultsSectionProps> = ({ metrics }) => {
  const { tenant } = useTenant();
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  if (!metrics || metrics.length === 0 || !tenant) {
    return null;
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="resultados"
      className="relative overflow-hidden texture-noise"
      style={{ backgroundColor: 'var(--tenant-secondary, #0f172a)' }}
    >
      {/* Decorative blurred orbs */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 20%, transparent)' }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none"
        style={{ backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 10%, transparent)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-12 sm:pt-28">

        {/* ── Top label + headline ── */}
        <div
          className={`mb-16 sm:mb-20 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">
            Nuestros Resultados
          </span>
          <h2
            className="font-black leading-[0.88] tracking-[-0.04em] text-white max-w-4xl"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
          >
            Impacto comprobado.<br />
            <span style={{ color: 'var(--tenant-primary)' }}>Números reales.</span>
          </h2>
        </div>

        {/* ── Giant metric numbers grid ── */}
        <div
          className={`grid grid-cols-1 ${
            metrics.length === 2 ? 'sm:grid-cols-2 max-w-3xl' :
            metrics.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' :
            'sm:grid-cols-3'
          } gap-8 lg:gap-10 transition-all duration-700 ease-out delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {metrics.map((m, idx) => {
            const staggerDelay = Math.min(idx * 80, 320);
            return (
              <div
                key={idx}
                className={`py-8 sm:py-10 border-t border-white/10 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{
                  transitionDelay: `${staggerDelay + 100}ms`,
                }}
              >
                {/* The number IS the statement */}
                <div
                  className="mb-3"
                  style={{ color: 'var(--tenant-primary)' }}
                >
                  <AnimatedMetric value={m.value} isVisible={isVisible} />
                </div>
                <p className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white/50 leading-relaxed">
                  {m.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Description line ── */}
        <div
          className={`mt-8 mb-16 sm:mb-20 max-w-xl transition-all duration-700 ease-out delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-white/50 text-sm sm:text-base leading-relaxed">
            En <span className="text-white font-semibold">{tenant.name}</span> convertimos la solidaridad en resultados medibles y rendición de cuentas continua.
          </p>
        </div>

        {/* ── Legal identity as separated bottom block ── */}
        <div
          className={`border-t pt-10 transition-all duration-700 ease-out delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <LegalIdentitySection />
        </div>
      </div>
    </section>
  );
};
