import React from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { ProgramsSection } from './components/ProgramsSection';
import { ImpactGridSection } from './components/ImpactGridSection';
import { StoryEditorialSection } from './components/StoryEditorialSection';
import { TransparencySection } from './components/TransparencySection';
import { InstitutionalResultsSection } from './components/InstitutionalResultsSection';
import { CorporatePartnersMarquee } from './components/CorporatePartnersMarquee';
import { OtherCampaignsSection } from './components/OtherCampaignsSection';
import { ContactFooterSection } from './components/ContactFooterSection';
import { SkeletonLoader } from './components/SkeletonLoader';
import { ReactivationPage } from './components/ReactivationPage';
import { CampaignsListPage } from './components/CampaignsListPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AlertCircle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { tenant, campaign, otherCampaigns, routeMode, isLoading, error } = useTenant();

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error) {
    const isSuspended = error.toLowerCase().includes('suspendida') || error.toLowerCase().includes('mantenimiento');

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50" role="alert" aria-live="assertive">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-4 border border-slate-100">
          <div
            className={`w-14 h-14 ${
              isSuspended ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
            } rounded-full flex items-center justify-center mx-auto`}
          >
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {isSuspended ? 'Portal en Mantenimiento' : 'Fundación no encontrada'}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  if (routeMode === 'campaigns_list') {
    return (
      <div className="min-h-screen flex flex-col bg-white antialiased selection:bg-[var(--tenant-primary)] selection:text-white">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg focus:shadow-lg focus:font-bold focus:text-sm">
          Saltar al contenido principal
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          <CampaignsListPage />
        </main>
        <ContactFooterSection />
      </div>
    );
  }

  const testimonialData = campaign?.testimonial || tenant.testimonial || null;

  return (
    <div className="min-h-screen flex flex-col bg-white antialiased selection:bg-[var(--tenant-primary)] selection:text-white">
      {/* ========================================================================= */}
      {/* ZONE 1: TOP (Navbar Oficial + Adaptive Hero & Donation Flow)              */}
      {/* ========================================================================= */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg focus:shadow-lg focus:font-bold focus:text-sm">
        Saltar al contenido principal
      </a>
      <Navbar />

      <main id="main-content" className="flex-1">
        <HeroSection />

      {/* ========================================================================= */}
      {/* ZONE 2: CONTENT (Quiénes somos, Qué hacemos, Impacto, Historia)           */}
      {/* ========================================================================= */}
      
      {/* 01. QUIÉNES SOMOS (Condicional: solo si existe misión/visión/about/valores) */}
      <AboutSection />

      {/* 02. QUÉ HACEMOS / PROGRAMAS (Condicional: solo si existen programas) */}
      <ProgramsSection />

      {/* 03. IMPACTO DEL APORTE (Condicional: solo si existen tiers o items de impacto) */}
      <ImpactGridSection
        impactItems={campaign?.tangible_impact_items}
        tiers={campaign?.donation_tiers}
      />

      {/* 04. HISTORIA HUMANA / PROBLEMA (Condicional: con o sin testimonio integrado) */}
      {campaign?.story_markdown && (
        <StoryEditorialSection
          storyMarkdown={campaign.story_markdown}
          storyImageUrl={campaign.story_image_url}
          locationCity={tenant.location_city}
          testimonial={testimonialData}
        />
      )}

      {/* ========================================================================= */}
      {/* ZONE 3: TRUST (Transparencia, Resultados comprobados, Aliados)            */}
      {/* ========================================================================= */}

      {/* 05. TRANSPARENCIA (Condicional: solo si existe funds_breakdown) */}
      {campaign?.funds_breakdown && campaign.funds_breakdown.length > 0 && (
        <TransparencySection fundsBreakdown={campaign.funds_breakdown} />
      )}

      {/* 06. RESULTADOS / CREDIBILIDAD (Condicional: incluye identidad legal desacoplada) */}
      {tenant.institutional_metrics && tenant.institutional_metrics.length > 0 && (
        <InstitutionalResultsSection metrics={tenant.institutional_metrics} />
      )}

      {/* 07. NUESTROS ALIADOS (Condicional: solo si existen aliados registrados) */}
      {tenant.corporate_partners && tenant.corporate_partners.length > 0 && (
        <CorporatePartnersMarquee partners={tenant.corporate_partners} />
      )}

      {/* ========================================================================= */}
      {/* ZONE 4: CONVERSION (Otras Campañas Activas)                                */}
      {/* ========================================================================= */}
      {otherCampaigns && otherCampaigns.length > 0 && <OtherCampaignsSection />}

      </main>

      {/* ========================================================================= */}
      {/* ZONE 5: SYSTEM (Footer Institucional, Enlaces y Procesamiento Seguro)     */}
      {/* ========================================================================= */}
      <ContactFooterSection />
    </div>
  );
};

export const App: React.FC = () => {
  // Detectar si la ruta actual es de reactivación de socio: /reactivar/:token
  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 'reactivar' && pathParts[2]) {
    return (
      <ErrorBoundary>
        <ReactivationPage token={pathParts[2]} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <TenantProvider>
        <MainLayout />
      </TenantProvider>
    </ErrorBoundary>
  );
};

export default App;
