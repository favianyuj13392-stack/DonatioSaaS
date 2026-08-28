import React from 'react';
import { CorporatePartner } from '../types';
import { Building2 } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface CorporatePartnersMarqueeProps {
  partners?: CorporatePartner[];
}

export const CorporatePartnersMarquee: React.FC<CorporatePartnersMarqueeProps> = ({ partners }) => {
  const { ref, isVisible } = useScrollAnimation();

  if (!partners || partners.length === 0) {
    return null;
  }

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      id="aliados" 
      className={`py-16 sm:py-20 bg-slate-50/60 border-t border-slate-200/60 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Encabezado */}
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-tenant">
            <Building2 className="w-3.5 h-3.5" />
            <span>Alianzas de Confianza</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Nuestros Aliados y Cooperación Institucional
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            Empresas, organismos y fundaciones aliadas que impulsan nuestros proyectos.
          </p>
        </div>

        {/* Grid Monocromático Accesible de Logos */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {partners.map((partner, index) => {
            const logoElement = (
              <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 group flex items-center justify-center min-w-[140px] max-w-[200px] h-20">
                <img
                  src={partner.logo_url}
                  alt={partner.name}
                  className="max-h-10 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                />
              </div>
            );

            return partner.website_url ? (
              <a
                key={index}
                href={partner.website_url}
                target="_blank"
                rel="noopener noreferrer"
                title={partner.name}
                className="focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--tenant-primary)] rounded-2xl"
              >
                {logoElement}
              </a>
            ) : (
              <div key={index}>{logoElement}</div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
