import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Campaign, Tenant, PaymentProvider } from '../types';
import {
  fetchPublicTenant,
  fetchPublicCampaign,
  fetchPublicCampaigns,
  resolveSubdomain,
} from '../services/api';
import { applyTenantTheme } from '../utils/theme';

export type RouteMode = 'institutional' | 'campaign' | 'campaigns_list';

interface TenantContextType {
  tenant: Tenant | null;
  campaign: Campaign | null;
  campaignsList: Campaign[];
  otherCampaigns: Campaign[];
  paymentProviders: PaymentProvider[];
  subdomain: string;
  routeMode: RouteMode;
  currentSlug: string | null;
  isLoading: boolean;
  error: string | null;
  navigateToHome: () => void;
  navigateToCampaign: (slug: string) => void;
  navigateToCampaigns: () => void;
  refreshData: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);
  const [otherCampaigns, setOtherCampaigns] = useState<Campaign[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [routeMode, setRouteMode] = useState<RouteMode>('campaign');
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const subdomain = resolveSubdomain();
  const isFetchingRef = React.useRef(false);

  // Parsear la URL actual para determinar la vista y slug
  const parseCurrentRoute = useCallback((): { mode: RouteMode; slug: string | null } => {
    const urlParams = new URLSearchParams(window.location.search);
    const campaignParam = urlParams.get('campaign') || urlParams.get('c');
    const viewParam = urlParams.get('view');

    if (campaignParam) {
      return { mode: 'campaign', slug: campaignParam };
    }

    if (viewParam === 'campaigns' || viewParam === 'campanas') {
      return { mode: 'campaigns_list', slug: null };
    }

    if (viewParam === 'foundation' || viewParam === 'institucional') {
      return { mode: 'institutional', slug: null };
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean);

    // /c/:slug
    if (pathParts[0] === 'c' && pathParts[1]) {
      return { mode: 'campaign', slug: pathParts[1] };
    }

    // /campanas
    if (pathParts[0] === 'campanas' || pathParts[0] === 'campaigns') {
      return { mode: 'campaigns_list', slug: null };
    }

    // /fundacion
    if (pathParts[0] === 'fundacion' || pathParts[0] === 'institucional') {
      return { mode: 'institutional', slug: null };
    }

    // Default: si no hay sub-ruta, cargar la causa principal
    return { mode: 'campaign', slug: 'default' };
  }, []);

  const loadData = useCallback(async (isBackground: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!isBackground) {
        setIsLoading(true);
      }
      setError(null);

      const { mode, slug } = parseCurrentRoute();
      setRouteMode(mode);
      setCurrentSlug(slug);

      if (mode === 'campaigns_list') {
        // Cargar catálogo de campañas
        const listRes = await fetchPublicCampaigns(subdomain);
        setTenant((prev) => (prev ? { ...prev, ...listRes.tenant } : (listRes.tenant as Tenant)));
        setCampaignsList(listRes.campaigns || []);
        if (listRes.tenant.primary_color) {
          applyTenantTheme(listRes.tenant);
        }
        document.title = `Campañas | ${listRes.tenant.name}`;
      } else if (mode === 'institutional') {
        // Cargar homepage institucional del tenant
        const instRes = await fetchPublicTenant(subdomain);
        setTenant(instRes.tenant);
        setCampaign(instRes.featured_campaign);
        setPaymentProviders(instRes.payment_providers || []);
        applyTenantTheme(instRes.tenant);
        document.title = `${instRes.tenant.name} | Portal Institucional`;
      } else {
        // Cargar detalle de campaña (o default)
        const response = await fetchPublicCampaign(subdomain, slug || 'default');
        setTenant(response.tenant);
        setCampaign(response.campaign);
        setOtherCampaigns(response.other_campaigns || []);
        setPaymentProviders(response.payment_providers || []);

        // Aplicar motor de tokens CSS y accesibilidad
        applyTenantTheme(response.tenant);

        // Actualizar título de la pestaña
        document.title = response.campaign.title
          ? `${response.campaign.title} | ${response.tenant.name}`
          : response.tenant.name;
      }
    } catch (err: any) {
      console.error('[TenantContext Error]:', err);
      if (!isBackground) {
        setError(err.message || 'Error al conectar con la fundación');
      }
    } finally {
      isFetchingRef.current = false;
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  }, [subdomain, parseCurrentRoute]);

  // Navegación fluida dentro de la SPA
  const navigateToCampaign = useCallback((slug: string) => {
    const newUrl = `/c/${slug}?tenant=${subdomain}`;
    window.history.pushState({}, '', newUrl);
    loadData(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [subdomain, loadData]);

  const navigateToHome = useCallback(() => {
    const newUrl = `/?tenant=${subdomain}`;
    window.history.pushState({}, '', newUrl);
    loadData(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [subdomain, loadData]);

  const navigateToCampaigns = useCallback(() => {
    const newUrl = `/campanas?tenant=${subdomain}`;
    window.history.pushState({}, '', newUrl);
    loadData(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [subdomain, loadData]);

  useEffect(() => {
    loadData(false);

    const handlePopState = () => {
      loadData(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadData]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        campaign,
        campaignsList,
        otherCampaigns,
        paymentProviders,
        subdomain,
        routeMode,
        currentSlug,
        isLoading,
        error,
        navigateToHome,
        navigateToCampaign,
        navigateToCampaigns,
        refreshData: () => loadData(true),
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe ser utilizado dentro de un TenantProvider');
  }
  return context;
}
