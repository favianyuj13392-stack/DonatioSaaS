import React from 'react';
import { Quote } from 'lucide-react';
import { TestimonialItem } from '../types';

interface TestimonialSectionProps {
  testimonial?: TestimonialItem | null;
}

export const TestimonialSection: React.FC<TestimonialSectionProps> = ({ testimonial }) => {
  if (!testimonial || !testimonial.quote) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 bg-slate-50/70 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Ícono de Cita */}
        <div className="w-12 h-12 bg-rose-100 text-[var(--tenant-primary)] rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Quote className="w-6 h-6 fill-current" />
        </div>

        {/* Testimonio Real */}
        <blockquote className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
          "{testimonial.quote}"
        </blockquote>

        {/* Autor */}
        <div className="space-y-1">
          <p className="font-extrabold text-slate-900 text-sm sm:text-base">
            {testimonial.author_name}
          </p>
          {testimonial.author_role && (
            <p className="text-xs text-slate-500 font-medium">
              {testimonial.author_role} {testimonial.location ? `· ${testimonial.location}` : ''}
            </p>
          )}
        </div>

      </div>
    </section>
  );
};
