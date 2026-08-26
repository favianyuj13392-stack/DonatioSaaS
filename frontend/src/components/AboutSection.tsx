import React from 'react';
import { useTenant } from '../context/TenantContext';
import { Target, Compass, Sparkles, Award } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { tenant } = useTenant();

  if (!tenant) return null;

  const hasAbout = !!tenant.about_text;
  const hasMission = !!tenant.mission;
  const hasVision = !!tenant.vision;
  const hasValues = !!(tenant.values && tenant.values.length > 0);

  // Si no hay información institucional, no renderizar sección vacía
  if (!hasAbout && !hasMission && !hasVision && !hasValues) {
    return null;
  }

  return (
    <section id="quienes-somos" className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-tenant">
            <Award className="w-3.5 h-3.5" />
            <span>Nuestra Identidad</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Quiénes Somos
          </h2>
          {hasAbout && (
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed pt-2">
              {tenant.about_text}
            </p>
          )}
        </div>

        {/* Misión y Visión (Grid adaptativo) */}
        {(hasMission || hasVision) && (
          <div className={`grid grid-cols-1 ${hasMission && hasVision ? 'md:grid-cols-2' : 'max-w-3xl mx-auto'} gap-8`}>
            {hasMission && (
              <div className="bg-slate-50/80 rounded-3xl p-8 border border-slate-200/70 space-y-4 relative overflow-hidden group hover:border-slate-300 transition shadow-xs">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: 'var(--tenant-primary)' }}
                >
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Nuestra Misión
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {tenant.mission}
                </p>
              </div>
            )}

            {hasVision && (
              <div className="bg-slate-50/80 rounded-3xl p-8 border border-slate-200/70 space-y-4 relative overflow-hidden group hover:border-slate-300 transition shadow-xs">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: 'var(--tenant-secondary, var(--tenant-primary))' }}
                >
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Nuestra Visión
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {tenant.vision}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Valores Institucionales */}
        {hasValues && (
          <div className="bg-slate-50/50 rounded-2xl p-6 sm:p-8 border border-slate-200/50 text-center space-y-4">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Valores y Principios que nos Guían</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {tenant.values?.map((val, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-800 border border-slate-200/80 shadow-2xs"
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
