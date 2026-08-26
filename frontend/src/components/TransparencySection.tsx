import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { FundsBreakdownItem } from '../types';

interface TransparencySectionProps {
  fundsBreakdown?: FundsBreakdownItem[];
}

const PALETTE = ['var(--tenant-primary)', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

export const TransparencySection: React.FC<TransparencySectionProps> = ({ fundsBreakdown }) => {
  const { tenant } = useTenant();

  // Si no hay datos de fondos, no renderizar sección vacía
  if (!fundsBreakdown || fundsBreakdown.length === 0) {
    return null;
  }

  const gridColsClass = fundsBreakdown.length === 2
    ? 'sm:grid-cols-2'
    : fundsBreakdown.length === 4
    ? 'sm:grid-cols-2 lg:grid-cols-4'
    : 'sm:grid-cols-3';

  return (
    <section id="transparencia" className="py-16 sm:py-24 bg-slate-50/80 border-t border-slate-200/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center space-y-3 mb-12">
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

        {/* Desglose Gráfico Horizontal Segmentado */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-8">
          
          {/* Barra Segmentada Multicolor Dinámica */}
          <div className="h-4 sm:h-5 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-100">
            {fundsBreakdown.map((item, idx) => {
              const segColor = PALETTE[idx % PALETTE.length];
              return (
                <div
                  key={idx}
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: segColor,
                  }}
                  title={`${item.percentage}% ${item.category}`}
                />
              );
            })}
          </div>

          {/* Columnas Dinámicas de Desglose */}
          <div className={`grid grid-cols-1 ${gridColsClass} gap-8 pt-2`}>
            {fundsBreakdown.map((item, idx) => {
              const segColor = PALETTE[idx % PALETTE.length];
              return (
                <div
                  key={idx}
                  className="space-y-1.5 border-l-2 pl-4"
                  style={{ borderColor: segColor }}
                >
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight block">
                    {item.amount || item.percentage} Bs.
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wide block">
                    {item.category}
                  </span>
                  {item.description && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer de Transparencia */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-slate-500 font-medium">
              {tenant?.legal_id_details
                ? `Entidad sin fines de lucro respaldada por ${tenant.legal_id_details}.`
                : `Administración transparente y auditable de fondos para ${tenant?.name}.`}
            </span>

            <a
              href="#quienes-somos"
              className="inline-flex items-center gap-1.5 font-bold text-[var(--tenant-primary)] hover:underline"
            >
              <span>Ver información institucional</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
