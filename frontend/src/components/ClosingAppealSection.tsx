import React from 'react';
import { ArrowUpRight, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

export const ClosingAppealSection: React.FC = () => {
  const { tenant, campaign, routeMode } = useTenant();

  if (!tenant) return null;

  const isCampaign = routeMode === 'campaign' && !!campaign;
  const image = campaign?.story_image_url || campaign?.banner_url || tenant.hero_image_url;
  const title = isCampaign
    ? 'El próximo cambio puede empezar con vos.'
    : `Hagamos que el impacto de ${tenant.name} llegue más lejos.`;
  const rawCtaUrl = tenant.hero_cta_url?.trim();
  const ctaUrl = rawCtaUrl && (
    /^https?:/i.test(rawCtaUrl) ||
    (rawCtaUrl.startsWith('/') && !rawCtaUrl.startsWith('//')) ||
    rawCtaUrl.startsWith('#')
  ) ? rawCtaUrl : null;
  const description = isCampaign
    ? campaign?.description || tenant.mission || tenant.about_text
    : tenant.mission || tenant.about_text;

  const scrollToDonation = () => {
    document.getElementById('donacion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="closing-appeal" aria-labelledby="closing-appeal-title">
      {image && (
        <img
          className="closing-appeal__image"
          src={image}
          alt=""
          aria-hidden="true"
        />
      )}
      <div className="closing-appeal__veil" aria-hidden="true" />
      <div className="closing-appeal__content">
        <div className="closing-appeal__mark" aria-hidden="true">
          <HeartHandshake className="h-7 w-7" />
        </div>
        <p className="closing-appeal__eyebrow">Tu decisión. Su oportunidad.</p>
        <h2 id="closing-appeal-title" className="closing-appeal__title">
          {title}
        </h2>
        {description && <p className="closing-appeal__description">{description}</p>}
        <div className="closing-appeal__actions">
          {ctaUrl ? (
            <a href={ctaUrl} className="closing-appeal__cta">
              <span>{tenant.hero_cta_text || 'Quiero ser parte'}</span>
              <ArrowUpRight className="h-5 w-5" />
            </a>
          ) : (
            <button type="button" onClick={scrollToDonation} className="closing-appeal__cta">
              <span>{tenant.hero_cta_text || 'Quiero ser parte'}</span>
              <ArrowUpRight className="h-5 w-5" />
            </button>
          )}
          <span className="closing-appeal__security">
            <ShieldCheck className="h-4 w-4" />
            Aporte seguro y trazable
          </span>
        </div>
      </div>
    </section>
  );
};
