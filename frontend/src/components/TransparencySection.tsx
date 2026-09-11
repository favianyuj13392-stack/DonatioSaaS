import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { FundsBreakdownItem } from '../types';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface TransparencySectionProps {
  fundsBreakdown?: FundsBreakdownItem[];
}

// Palette: tenant-primary first, then fixed accents
const FIXED_PALETTE = ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

// Pure SVG donut — no libraries, no dependencies
interface DonutProps {
  segments: { pct: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
}

const DonutChart: React.FC<DonutProps> = ({ segments, size = 200, strokeWidth = 28 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  // start from top (rotate -90deg)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribución de fondos">
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg, idx) => {
        const dashArray = (seg.pct / 100) * circumference;
        const dashOffset = circumference - dashArray;
        // rotate so segment starts from previous segments' end
        const rotation = -90 + (offset / 100) * 360;
        offset += seg.pct;
        return (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashArray} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'stroke-dasharray 0.8s ease-out',
            }}
          />
        );
      })}
    </svg>
  );
};

export const TransparencySection: React.FC<TransparencySectionProps> = ({ fundsBreakdown }) => {
  const { tenant } = useTenant();
  const { ref, isVisible } = useScrollAnimation();

  if (!fundsBreakdown || fundsBreakdown.length === 0) {
    return null;
  }

  const palette = [
    'var(--tenant-primary)',
    ...FIXED_PALETTE,
  ];

  const segments = fundsBreakdown.map((item, idx) => ({
    pct: item.percentage,
    color: palette[idx % palette.length],
    label: (item as any).title ?? item.category ?? '',
  }));

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="transparencia"
      className={`py-16 sm:py-24 bg-white border-t border-slate-200/60 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rendición de Cuentas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Así utilizamos cada Bs. 100
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Cada aporte es administrado bajo estrictos criterios de eficiencia, rendición continua y destino tangible.
          </p>
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 sm:p-10 border border-slate-200/80">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* ── Donut chart ── */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <div className={`transition-all duration-700 delay-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                <DonutChart segments={isVisible ? segments : segments.map(s => ({ ...s, pct: 0 }))} size={200} strokeWidth={28} />
              </div>
            </div>

            {/* ── Breakdown list ── */}
            <div className="flex-1 w-full space-y-5">
              {fundsBreakdown.map((item, idx) => {
                const color = palette[idx % palette.length];
                const label = (item as any).title ?? item.category ?? '';
                return (
                  <div key={idx} className="flex items-start gap-4">
                    {/* Color swatch */}
                    <div
                      className="mt-1 w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-wide">
                          {label}
                        </span>
                        <span
                          className="text-xl font-black tracking-tight"
                          style={{ color }}
                        >
                          Bs. {item.percentage}
                        </span>
                      </div>
                      {/* Animated progress bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: isVisible ? `${item.percentage}%` : '0%',
                            backgroundColor: color,
                            transitionDelay: `${idx * 120 + 300}ms`,
                          }}
                        />
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-medium">
                  {tenant?.legal_id_details
                    ? `Entidad sin fines de lucro respaldada por ${tenant.legal_id_details}.`
                    : `Administración transparente y auditable de fondos para ${tenant?.name}.`}
                </span>
                <a
                  href="#quienes-somos"
                  className="inline-flex items-center gap-1.5 font-bold text-[var(--tenant-primary)] hover:underline flex-shrink-0"
                >
                  <span>Ver información institucional</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
