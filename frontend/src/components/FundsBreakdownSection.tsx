import React from 'react';
import { Sparkles } from 'lucide-react';
import { TangibleImpactItem } from '../types';

interface FundsBreakdownProps {
  items?: TangibleImpactItem[];
}

export const FundsBreakdownSection: React.FC<FundsBreakdownProps> = ({ items }) => {
  const breakdown = items && items.length > 0 ? items : [
    {
      icon: 'pill',
      title: 'Fármacos Oncológicos',
      description: 'Compra directa de ampollas de quimioterapia y medicamentos esenciales en farmacia.',
      stat_highlight: '70%',
    },
    {
      icon: 'home',
      title: 'Albergue y Nutrición',
      description: 'Garantiza cama limpia, agua caliente y 3 comidas diarias para el paciente y su acompañante.',
      stat_highlight: '20%',
    },
    {
      icon: 'ambulance',
      title: 'Logística y Traslados',
      description: 'Cobertura de ambulancias y pasajes de familias que llegan desde áreas rurales de Bolivia.',
      stat_highlight: '10%',
    },
  ];

  return (
    <section className="bg-slate-50/90 py-16 sm:py-20 border-t border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado Editorial */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[var(--tenant-primary)] bg-[var(--tenant-light)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparencia y Destino de los Fondos</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            ¿A dónde va cada Boliviano que aportas?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Administramos cada recurso con máxima eficiencia, cero intermediarios y auditoría continua.
          </p>
        </div>

        {/* Barra Horizontal Segmentada Multicolor */}
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="h-4 sm:h-5 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-200">
            <div
              className="bg-[var(--tenant-primary)] h-full transition-all duration-700"
              style={{ width: '70%' }}
              title="70% Fármacos Oncológicos"
            />
            <div
              className="bg-indigo-600 h-full transition-all duration-700"
              style={{ width: '20%' }}
              title="20% Albergue y Nutrición"
            />
            <div
              className="bg-slate-400 h-full transition-all duration-700"
              style={{ width: '10%' }}
              title="10% Logística y Traslados"
            />
          </div>
          {/* Leyenda sutil debajo de la barra */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--tenant-primary)] inline-block" />
              70% Fármacos Oncológicos
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
              20% Albergue y Nutrición
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
              10% Logística y Traslados
            </span>
          </div>
        </div>

        {/* 3 Columnas Limpias Sin Bordes Pesados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 max-w-5xl mx-auto">
          {breakdown.map((item, idx) => (
            <div key={idx} className="space-y-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {item.stat_highlight}
                </span>
                <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  {item.title}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
