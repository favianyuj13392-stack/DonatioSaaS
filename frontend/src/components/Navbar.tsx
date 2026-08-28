import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { ShieldCheck, Menu, X, Heart } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { tenant, campaign, routeMode, navigateToHome, navigateToCampaigns } = useTenant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  if (!tenant) return null;

  const hasAbout = !!(tenant.about_text || tenant.mission);
  const hasPrograms = !!(tenant.programs && tenant.programs.length > 0);
  const hasImpact = !!(campaign?.tangible_impact_items && campaign.tangible_impact_items.length > 0);
  const hasTransparency = !!(campaign?.funds_breakdown && campaign.funds_breakdown.length > 0);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDonate = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo e Identidad Institucional */}
          <button
            type="button"
            onClick={navigateToHome}
            className="flex items-center gap-3 text-left focus:outline-hidden group"
          >
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-9 sm:h-10 w-auto object-contain max-w-[150px] group-hover:opacity-90 transition"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[var(--tenant-primary)] text-[var(--tenant-on-primary)] flex items-center justify-center font-black text-base shadow-xs">
                {tenant.code?.slice(0, 2) || 'ON'}
              </div>
            )}
            <div>
              <span className="text-sm sm:text-base font-black text-slate-900 leading-tight block group-hover:text-[var(--tenant-primary)] transition">
                {tenant.name}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>Portal Verificado</span>
              </div>
            </div>
          </button>

          {/* Menú de Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-600">
            <button
              type="button"
              onClick={navigateToHome}
              className={`hover:text-[var(--tenant-primary)] transition ${routeMode === 'institutional' ? 'text-[var(--tenant-primary)] font-black' : ''}`}
            >
              Inicio
            </button>

            {hasAbout && (
              <button
                type="button"
                onClick={() => scrollToSection('quienes-somos')}
                className="hover:text-[var(--tenant-primary)] transition"
              >
                Quiénes somos
              </button>
            )}

            {hasPrograms && (
              <button
                type="button"
                onClick={() => scrollToSection('programas')}
                className="hover:text-[var(--tenant-primary)] transition"
              >
                Qué hacemos
              </button>
            )}

            {hasImpact && (
              <button
                type="button"
                onClick={() => scrollToSection('impacto')}
                className="hover:text-[var(--tenant-primary)] transition"
              >
                Impacto
              </button>
            )}

            {hasTransparency && (
              <button
                type="button"
                onClick={() => scrollToSection('transparencia')}
                className="hover:text-[var(--tenant-primary)] transition"
              >
                Transparencia
              </button>
            )}

            <button
              type="button"
              onClick={navigateToCampaigns}
              className={`hover:text-[var(--tenant-primary)] transition ${routeMode === 'campaigns_list' ? 'text-[var(--tenant-primary)] font-black' : ''}`}
            >
              Campañas
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('contacto')}
              className="hover:text-[var(--tenant-primary)] transition"
            >
              Contacto
            </button>
          </nav>

          {/* Botón Donar Ahora Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={scrollToDonate}
              className="btn-tenant-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Donar ahora</span>
            </button>
          </div>

          {/* Botón Menú Mobile */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={scrollToDonate}
              className="btn-tenant-primary px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Donar
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menú Desplegable Mobile */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" role="navigation" aria-label="Navegación móvil" className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3">
          <button
            type="button"
            onClick={() => { setMobileMenuOpen(false); navigateToHome(); }}
            className="block w-full text-left py-3 text-sm font-bold text-slate-700"
          >
            Inicio
          </button>
          {hasAbout && (
            <button
              type="button"
              onClick={() => scrollToSection('quienes-somos')}
              className="block w-full text-left py-3 text-sm font-bold text-slate-700"
            >
              Quiénes somos
            </button>
          )}
          {hasPrograms && (
            <button
              type="button"
              onClick={() => scrollToSection('programas')}
              className="block w-full text-left py-3 text-sm font-bold text-slate-700"
            >
              Qué hacemos
            </button>
          )}
          {hasImpact && (
            <button
              type="button"
              onClick={() => scrollToSection('impacto')}
              className="block w-full text-left py-3 text-sm font-bold text-slate-700"
            >
              Impacto
            </button>
          )}
          {hasTransparency && (
            <button
              type="button"
              onClick={() => scrollToSection('transparencia')}
              className="block w-full text-left py-3 text-sm font-bold text-slate-700"
            >
              Transparencia
            </button>
          )}
          <button
            type="button"
            onClick={() => { setMobileMenuOpen(false); navigateToCampaigns(); }}
            className="block w-full text-left py-3 text-sm font-bold text-slate-700"
          >
            Campañas
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('contacto')}
            className="block w-full text-left py-3 text-sm font-bold text-slate-700"
          >
            Contacto
          </button>
        </div>
      )}
    </header>
  );
};
