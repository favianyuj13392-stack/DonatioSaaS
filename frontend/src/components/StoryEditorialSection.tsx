import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import { TestimonialItem } from '../types';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { renderSimpleMarkdown } from '../utils/simpleMarkdown';

interface StoryEditorialSectionProps {
  storyMarkdown?: string | null;
  storyImageUrl?: string | null;
  locationCity?: string | null;
  testimonial?: TestimonialItem | null;
}

// Split markdown into first paragraph (lead) and rest
function splitLead(markdown: string): { lead: string; rest: string } {
  const paras = markdown.trim().split(/\n{2,}/);
  if (paras.length <= 1) return { lead: markdown, rest: '' };
  return { lead: paras[0], rest: paras.slice(1).join('\n\n') };
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
  const { lead, rest } = splitLead(storyMarkdown);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="historia"
      className={`py-16 sm:py-24 bg-white border-t-4 border-l-0 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ borderTopColor: 'var(--tenant-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-tenant">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Historia que Inspira</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Nuestra Causa en Primera Persona
          </h2>
        </div>

        {hasTestimonial ? (
          /* ── WITH TESTIMONIAL: asymmetric 5-4-3 ── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Text column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-5">
              {/* Lead paragraph — editorial style */}
              <p
                className="text-xl sm:text-2xl font-semibold text-slate-800 leading-snug"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(lead) }}
              />
              {rest && (
                <div
                  className="space-y-3 text-base text-slate-500 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(rest) }}
                />
              )}
            </div>

            {/* Photo (4 cols) */}
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

            {/* Testimonial card (3 cols) */}
            <div
              className="lg:col-span-3 rounded-3xl p-7 flex flex-col justify-between space-y-6 border border-slate-200/80"
              style={{ backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 6%, white)' }}
            >
              <div className="space-y-4">
                {/* Typographic quote mark instead of icon */}
                <span
                  className="block font-black leading-none select-none"
                  style={{ fontSize: '5rem', lineHeight: 0.8, color: 'var(--tenant-primary)', opacity: 0.35 }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <p className="text-base font-semibold text-slate-800 italic leading-relaxed">
                  {testimonial!.quote}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200/70">
                <span className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                  {testimonial!.author_name}
                </span>
                {testimonial!.author_role && (
                  <span className="block text-[11px] font-semibold text-slate-500">
                    {testimonial!.author_role}
                  </span>
                )}
                {testimonial!.location && (
                  <span className="block text-[10px] font-medium text-slate-400 mt-0.5">
                    {testimonial!.location}
                  </span>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ── WITHOUT TESTIMONIAL: 2-column large ── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

            {/* Photo (5 cols) */}
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

            {/* Text (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Lead paragraph — editorial lead */}
              <p
                className="text-2xl sm:text-3xl font-semibold text-slate-800 leading-snug"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(lead) }}
              />
              {rest && (
                <div
                  className="space-y-4 text-base sm:text-lg text-slate-500 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(rest) }}
                />
              )}
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
