import React from 'react';
import { useTenant } from '../context/TenantContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import {
  Trees,
  Droplet,
  BookOpen,
  Heart,
  Pill,
  Shield,
  Users,
  Activity,
  ArrowRight,
} from 'lucide-react';

function getProgramIcon(iconName?: string) {
  const cls = 'w-5 h-5';
  switch (iconName?.toLowerCase()) {
    case 'tree':
    case 'trees':    return <Trees className={cls} />;
    case 'droplet':
    case 'water':    return <Droplet className={cls} />;
    case 'book':
    case 'education': return <BookOpen className={cls} />;
    case 'pill':
    case 'medical':  return <Pill className={cls} />;
    case 'shield':   return <Shield className={cls} />;
    case 'users':    return <Users className={cls} />;
    case 'heart':    return <Heart className={cls} />;
    default:         return <Activity className={cls} />;
  }
}

export const ProgramsSection: React.FC = () => {
  const { tenant } = useTenant();
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.05 });

  if (!tenant || !tenant.programs || tenant.programs.length === 0) {
    return null;
  }

  const programs = tenant.programs;

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="programas"
      className="py-20 sm:py-28 bg-white border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── Section header ── */}
        <div
          className={`mb-16 sm:mb-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="space-y-4 max-w-2xl">
            <span
              className="inline-block text-[11px] font-black uppercase tracking-[0.2em]"
              style={{ color: 'var(--tenant-primary)' }}
            >
              Nuestras Líneas de Acción
            </span>
            <h2
              className="text-slate-900 font-black leading-[0.92] tracking-[-0.03em]"
              style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)' }}
            >
              Qué Hacemos
            </h2>
          </div>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-sm sm:text-right">
            Programas e iniciativas activas que transforman realidades y generan impacto medible.
          </p>
        </div>

        {/* ── Editorial numbered list ── */}
        <div className="space-y-0">
          {programs.map((prog, idx) => {
            const num = String(idx + 1).padStart(2, '0');
            const isLast = idx === programs.length - 1;
            const staggerDelay = Math.min(idx * 80, 400);

            return (
              <div
                key={idx}
                className={`group relative transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${staggerDelay}ms` }}
              >
                {/* Horizontal rule above (except first) */}
                {idx > 0 && (
                  <div className="border-t border-slate-100" aria-hidden="true" />
                )}

                <div className="flex gap-6 lg:gap-12 py-10 sm:py-12 relative">

                  {/* Giant editorial number */}
                  <div className="flex-shrink-0 w-16 sm:w-24 lg:w-32 relative select-none" aria-hidden="true">
                    <span
                      className="editorial-number leading-none absolute -top-2"
                      style={{ fontSize: 'clamp(3.5rem, 6vw, 7rem)' }}
                    >
                      {num}
                    </span>
                  </div>

                  {/* Content area */}
                  <div className="flex-1 flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-12 min-w-0">

                    {/* Left: icon + title */}
                    <div className="lg:w-[40%] space-y-4">
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: 'var(--tenant-primary)' }}
                      >
                        {getProgramIcon(prog.icon)}
                      </div>
                      <h3
                        className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight tracking-tight group-hover:transition-colors duration-200"
                        style={{ transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--tenant-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = '')}
                      >
                        {prog.title}
                      </h3>
                    </div>

                    {/* Right: description + stat */}
                    <div className="lg:w-[60%] space-y-5 pt-1">
                      <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                        {prog.description}
                      </p>

                      {prog.stat && (
                        <div className="flex items-center gap-3">
                          <span
                            className="text-sm font-black uppercase tracking-wide"
                            style={{ color: 'var(--tenant-primary)' }}
                          >
                            {prog.stat}
                          </span>
                          <ArrowRight
                            className="w-4 h-4 opacity-40"
                            style={{ color: 'var(--tenant-primary)' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom rule (last item) */}
                {isLast && (
                  <div className="border-t border-slate-100" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
