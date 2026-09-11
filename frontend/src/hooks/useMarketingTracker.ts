import { useEffect } from 'react';

export const useMarketingTracker = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Si existe algún parámetro utm principal, los guardamos en localStorage
    if (urlParams.has('utm_campaign') || urlParams.has('utm_source')) {
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');
      const utmContent = urlParams.get('utm_content');

      if (utmSource) localStorage.setItem('donatio_utm_source', utmSource);
      if (utmMedium) localStorage.setItem('donatio_utm_medium', utmMedium);
      if (utmCampaign) localStorage.setItem('donatio_utm_campaign', utmCampaign);
      if (utmContent) localStorage.setItem('donatio_utm_content', utmContent);
    }
  }, []);

  const getUtmData = () => {
    return {
      utm_source: localStorage.getItem('donatio_utm_source') || undefined,
      utm_medium: localStorage.getItem('donatio_utm_medium') || undefined,
      utm_campaign: localStorage.getItem('donatio_utm_campaign') || undefined,
      utm_content: localStorage.getItem('donatio_utm_content') || undefined,
    };
  };

  const clearUtmData = () => {
    localStorage.removeItem('donatio_utm_source');
    localStorage.removeItem('donatio_utm_medium');
    localStorage.removeItem('donatio_utm_campaign');
    localStorage.removeItem('donatio_utm_content');
  };

  return { getUtmData, clearUtmData };
};
