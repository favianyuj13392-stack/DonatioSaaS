import React, { lazy, Suspense } from 'react';
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

const DonatioLanding = lazy(() => import('./pages/DonatioLanding'));

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

  const testimonialData = campaign?.testimonial?.quote?.trim()
    ? campaign.testimonial
    : tenant.testimonial?.quote?.trim() ? tenant.testimonial : null;

  return (
    <div className="min-h-screen flex flex-col bg-white antialiased selection:bg-[var(--tenant-primary)] selection:text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg">
        Saltar al contenido principal
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 donatio-page">
        <HeroSection />
        <div id="journal-content" />
        <StoryEditorialSection
          storyMarkdown={campaign?.story_markdown}
          storyImageUrl={campaign?.story_image_url}
          locationCity={tenant.location_city}
          testimonial={testimonialData}
        />
        <ImpactGridSection impactItems={campaign?.tangible_impact_items} tiers={campaign?.donation_tiers} />
        <ProgramsSection />
        <InstitutionalResultsSection metrics={tenant.institutional_metrics} />
        <TransparencySection fundsBreakdown={campaign?.funds_breakdown ?? undefined} />
        <AboutSection />
        {tenant.corporate_partners && tenant.corporate_partners.length > 0 && (
          <CorporatePartnersMarquee partners={tenant.corporate_partners} />
        )}
        {otherCampaigns && otherCampaigns.length > 0 && <OtherCampaignsSection />}
      </main>
      <ContactFooterSection />
    </div>
  );
};

export const App: React.FC = () => {
  if (window.location.pathname.replace(/\/+$/, '') === '/donatio') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div role="status" className="min-h-screen grid place-items-center bg-white text-slate-800">Cargando Donatio…</div>}>
          <DonatioLanding />
        </Suspense>
      </ErrorBoundary>
    );
  }
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
