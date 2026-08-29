import React from 'react';
import { Heart, MapPin, Quote } from 'lucide-react';
import { TestimonialItem } from '../types';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { renderSimpleMarkdown } from '../utils/simpleMarkdown';

interface StoryEditorialSectionProps {
  storyMarkdown?: string | null;
  storyImageUrl?: string | null;
  locationCity?: string | null;
  testimonial?: TestimonialItem | null;
}

export const StoryEditorialSection: React.FC<StoryEditorialSectionProps> = ({
  storyMarkdown,
  storyImageUrl,
  locationCity,
  testimonial,
}) => {
  const { ref, isVisible } = useScrollAnimation();

  if (!storyMarkdown) {
    return null;
  }

  const image = storyImageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80';
  const hasTestimonial = !!testimonial && !!testimonial.quote;

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="historia" 
      className={`py-16 sm:py-24 bg-slate-50/80 border-t border-slate-200/60 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-tenant">
            <Heart className="w-3.5 h-3.5 fill-current" />

            <span>Historia que Inspira</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Nuestra Causa en Primera Persona
          </h2>
        </div>
        {/* Layout Recompuesto según presencia de Testimonio */}
        {hasTestimonial ? (
          /* ========================================================================= */
          /* CASO 1: CON TESTIMONIO (Composición Asimétrica de 3 Bloques)              */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* 1. Columna de Texto Editorial (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                Un futuro mejor es posible cuando trabajamos juntos.
              </h3>
              <div 
                className="space-y-3 text-sm sm:text-base text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(storyMarkdown) }}
              />
            </div>

            {/* 2. Fotografía Central en Landscape (4 cols) */}
            <div className="lg:col-span-4 rounded-3xl overflow-hidden shadow-lg aspect-4/3 lg:aspect-auto bg-slate-900 relative group">
              <img
                src={image}
                alt="Historia de Impacto"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {locationCity && (
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{locationCity}</span>
                </div>
              )}
            </div>

            {/* 3. Tarjeta de Testimonio / Cita (3 cols) */}
            <div
              className="lg:col-span-3 rounded-3xl p-7 flex flex-col justify-between space-y-6 shadow-md border border-slate-200/80"
              style={{
                backgroundColor: 'var(--tenant-surface-alt, #ffffff)',
              }}
            >
              <div className="space-y-3">
                <Quote
                  className="w-8 h-8"
                  style={{ color: 'var(--tenant-primary)' }}
                />
                <p className="text-sm sm:text-base font-bold text-slate-800 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/70">
                <span className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {testimonial.author_name}
                </span>
                {testimonial.author_role && (
                  <span className="block text-[11px] font-semibold text-slate-500">
                    {testimonial.author_role}
                  </span>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* CASO 2: SIN TESTIMONIO (Composición 2 Columnas de Mayor Tamaño)           */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Fotografía Grande (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl overflow-hidden shadow-xl aspect-4/3 lg:aspect-4/5 bg-slate-900 relative group">
                <img
                  src={image}
                  alt="Historia de Impacto"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {locationCity && (
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{locationCity}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Narrativa Editorial (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                El impacto de tu generosidad en nuestras comunidades.
              </h3>
              <div 
                className="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(storyMarkdown) }}
              />
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
