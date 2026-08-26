import React from 'react';
import { useTenant } from '../context/TenantContext';
import { Sparkles } from 'lucide-react';
import { InstitutionalMetric } from '../types';
import { LegalIdentitySection } from './LegalIdentitySection';

interface InstitutionalResultsSectionProps {
  metrics?: InstitutionalMetric[];
}

export const InstitutionalResultsSection: React.FC<InstitutionalResultsSectionProps> = ({ metrics }) => {
  const { tenant } = useTenant();

  // Si no hay métricas, no renderizar sección vacía
  if (!metrics || metrics.length === 0 || !tenant) {
    return null;
  }

  const gridColsClass = metrics.length === 2
    ? 'sm:grid-cols-2 max-w-3xl'
    : metrics.length === 4
    ? 'sm:grid-cols-2 lg:grid-cols-4'
    : 'sm:grid-cols-3';

  return (
    <section id="resultados" className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Contenedor Oscuro de Contraste y Credibilidad */}
        <div
          className="rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden relative border border-slate-800 text-white"
          style={{
            backgroundColor: 'var(--tenant-secondary, #0f172a)',
          }}
        >
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
          />

          <div className="relative z-10 space-y-12">
            
            {/* Cabecera Editorial */}
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-400 bg-white/10 border border-white/15">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nuestros Resultados</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Impacto comprobado y trayectoria verificable
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                En <strong>{tenant.name}</strong> convertimos la solidaridad en resultados medibles y rendición de cuentas continua en Bolivia.
              </p>
            </div>

            {/* Métricas Gigantes con Alto Impacto Visual */}
            <div className={`grid grid-cols-1 ${gridColsClass} gap-8 pt-2 border-t border-white/10`}>
              {metrics.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="block text-4xl sm:text-5xl lg:text-6xl font-black text-emerald-400 tracking-tight">
                    {m.value}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wide block">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Identidad Legal y Autorización Bancaria Desacoplada (CERO hardcoding) */}
            <LegalIdentitySection />

          </div>
        </div>

      </div>
    </section>
  );
};
