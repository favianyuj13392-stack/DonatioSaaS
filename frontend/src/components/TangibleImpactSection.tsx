import React from 'react';
import { TangibleImpactItem } from '../types';
import { Pill, Home, Ambulance, Heart, BookOpen, Sparkles } from 'lucide-react';

interface TangibleImpactSectionProps {
  items?: TangibleImpactItem[];
  campaignTitle?: string;
}

export const TangibleImpactSection: React.FC<TangibleImpactSectionProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6 text-[var(--tenant-primary)]' };
    switch (iconName) {
      case 'pill':
        return <Pill {...props} />;
      case 'home':
        return <Home {...props} />;
      case 'ambulance':
        return <Ambulance {...props} />;
      case 'heart':
        return <Heart {...props} />;
      case 'book':
        return <BookOpen {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <section className="py-12 border-t border-slate-100 bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--tenant-light)] text-[var(--tenant-primary)] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Transparencia & Destino de tu Ayuda
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ¿Cómo transforma vidas cada Bolívar que aportas?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Tu generosidad se traduce directamente en insumos y servicios vitales sin intermediarios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {renderIcon(item.icon)}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {item.stat_highlight}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
