import React from 'react';
import { Sparkles, Utensils, Pill, Home, Heart, BookOpen, Trees, Droplet, Shield } from 'lucide-react';
import { TangibleImpactItem, DonationTier } from '../types';

interface ImpactGridSectionProps {
  impactItems?: TangibleImpactItem[];
  tiers?: DonationTier[];
}

function getImpactIcon(iconName: string) {
  const props = { className: 'w-6 h-6' };
  switch (iconName?.toLowerCase()) {
    case 'tree':
    case 'trees':
      return <Trees {...props} />;
    case 'droplet':
    case 'water':
      return <Droplet {...props} />;
    case 'shield':
      return <Shield {...props} />;
    case 'utensils':
      return <Utensils {...props} />;
    case 'pill':
      return <Pill {...props} />;
    case 'home':
      return <Home {...props} />;
    case 'book':
      return <BookOpen {...props} />;
    default:
      return <Heart {...props} />;
  }
}

export const ImpactGridSection: React.FC<ImpactGridSectionProps> = ({ impactItems, tiers }) => {
  // Si no hay items de impacto ni tiers, no renderizar sección vacía
  if ((!impactItems || impactItems.length === 0) && (!tiers || tiers.length === 0)) {
    return null;
  }

  // Mapear items de impacto reales
  const items = impactItems && impactItems.length > 0
    ? impactItems
    : (tiers || []).slice(0, 4).map((t, idx) => ({
        icon: idx === 0 ? 'heart' : idx === 1 ? 'pill' : idx === 2 ? 'home' : 'book',
        title: t.label,
        description: `Tu aporte de Bs. ${t.amount} genera un impacto tangible y directo.`,
        stat_highlight: `Bs. ${t.amount}`,
      }));

  const gridColsClass = items.length === 2
    ? 'md:grid-cols-2 max-w-3xl mx-auto'
    : items.length === 4
    ? 'sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto'
    : 'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto';

  return (
    <section id="impacto" className="py-16 sm:py-20 bg-slate-50/70 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado Editorial */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-tenant">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Destino de tu Aporte</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tu aporte se convierte en impacto concreto
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Cada donación cuenta con un propósito definido y se traduce en acciones verificables sobre el terreno.
          </p>
        </div>

        {/* Grid de Columnas Dinámico */}
        <div className={`grid grid-cols-1 ${gridColsClass} gap-6 lg:gap-8`}>
          {items.map((imp, idx) => {
            const isFeatured = idx === 1; // Segundo elemento destacado ("Más elegido")
            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-7 sm:p-8 border transition-all duration-300 flex flex-col justify-between ${
                  isFeatured
                    ? 'border-[var(--tenant-primary)] shadow-lg ring-2 ring-[var(--tenant-primary-soft)] relative'
                    : 'border-slate-200/80 shadow-xs hover:shadow-md'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-tenant-primary text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-2xs">
                    Más Elegido
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {imp.stat_highlight}
                    </span>
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-2xs"
                      style={{
                        backgroundColor: 'var(--tenant-primary-soft)',
                        color: 'var(--tenant-primary)',
                        borderColor: 'var(--tenant-primary-border)',
                      }}
                    >
                      {getImpactIcon(imp.icon)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {imp.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    {imp.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
