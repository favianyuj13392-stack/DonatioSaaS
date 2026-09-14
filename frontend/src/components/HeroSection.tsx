import React, { useEffect } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { DonationWidget } from './DonationWidget';
import { hasText, positiveNumber, safeLink, scrollToSection } from './Editorial';

export const HeroSection: React.FC = () => {
  const { tenant, campaign, routeMode } = useTenant();
  useEffect(() => {
    if (!tenant || window.location.hash !== '#donacion') return;
    const frame = window.requestAnimationFrame(() => scrollToSection('donacion'));
    return () => window.cancelAnimationFrame(frame);
  }, [tenant]);
  if (!tenant) return null;
  const isCampaign = routeMode === 'campaign' && !!campaign;
  const name = hasText(tenant.name) ? tenant.name.trim() : 'Nuestra organización';
  const headline = [isCampaign ? campaign?.headline : null, isCampaign ? campaign?.title : null, tenant.hero_headline, name].find(hasText)!;
  const description = [isCampaign ? campaign?.description : null, tenant.hero_description, tenant.mission, tenant.about_text].find(hasText);
  const photo = [isCampaign ? campaign?.banner_url : null, tenant.hero_image_url].find(hasText);
  const initials = name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('');
  const goal = isCampaign ? positiveNumber(campaign?.monetary_goal) : 0;
  const raised = isCampaign ? positiveNumber(campaign?.current_amount) : 0;
  const suppliedProgress = campaign?.progress_percentage;
  const progress = suppliedProgress != null && Number.isFinite(Number(suppliedProgress))
    ? positiveNumber(suppliedProgress) : goal > 0 ? (raised / goal) * 100 : 0;
  const formatAmount = (value: number) => new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(value);
  const cta = hasText(tenant.hero_cta_text) ? tenant.hero_cta_text : 'Quiero contribuir';
  const href = safeLink(tenant.hero_cta_url);
  const campaignTitle = isCampaign && hasText(campaign?.title) ? campaign.title : null;

  return (
    <section className="journal-hero" aria-labelledby="journal-hero-title">
      <div className="journal-hero__cinema">
        <div className="journal-hero__copy">
          <p className="journal-kicker journal-kicker--light">
            <span className="journal-status-dot" aria-hidden="true" />
            {isCampaign ? 'Una causa que nos une' : 'Compromiso que transforma'}
          </p>
          <h1 id="journal-hero-title" className="journal-hero__title">{headline}</h1>
          {description && <p className="journal-hero__description">{description}</p>}
          <div className="journal-hero__actions">
            <a className="journal-button journal-button--primary" href={href}>
              <span>{cta}</span><ArrowUpRight size={21} aria-hidden="true" />
            </a>
            <button className="journal-hero__explore" type="button" onClick={() => scrollToSection('journal-content')}>
              Conocer la causa <ArrowDown size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="journal-hero__signature">
            <span>{name}</span>{hasText(tenant.location_city) && <span>{tenant.location_city}</span>}
          </div>
        </div>
        <figure className="journal-hero__portrait">
          <div className="journal-hero__fallback" aria-hidden="true">
            <span>{initials}</span><div className="journal-hero__halo" />
          </div>
          {photo && <img key={photo} className="journal-hero__photo" src={photo} alt={campaignTitle || name} fetchPriority="high" onError={(event) => { event.currentTarget.hidden = true; }} />}
          <figcaption className="journal-hero__caption">
            <span>{campaignTitle || name}</span><span className="journal-hero__caption-mark" aria-hidden="true">↗</span>
          </figcaption>
        </figure>
      </div>
      <div className="journal-hero__bridge" aria-hidden="true">
        <span>Una decisión.</span><span>Muchas posibilidades.</span><ArrowDown size={24} />
      </div>
      <div id="donacion" className="journal-donation">
        <div className="journal-donation__intro">
          <p className="journal-kicker">Tu aporte importa</p>
          <h2 className="journal-donation__title">Aquí empieza<br /><em>el cambio.</em></h2>
          <p className="journal-donation__description">Elige cómo quieres acompañar esta causa. Cada aporte suma al trabajo de {name}.</p>
          {goal > 0 && <div className="journal-donation__progress">
            <div className="journal-donation__progress-heading"><span>Juntos hemos reunido</span><strong>Bs. {formatAmount(raised)}</strong></div>
            <div className="journal-donation__track" role="progressbar" aria-label="Avance de la recaudación" aria-valuenow={Math.min(100, Math.round(progress))} aria-valuemin={0} aria-valuemax={100} aria-valuetext={Math.round(progress) + '% de la meta'}>
              <span style={{ width: Math.min(100, progress) + '%' }} />
            </div>
            <div className="journal-donation__progress-foot"><span>Meta: Bs. {formatAmount(goal)}</span><span>{Math.round(progress)}%</span></div>
          </div>}
          <div className="journal-donation__footnote"><span className="journal-donation__currency">Bs. / USD</span><p>Elige tu moneda y revisa los detalles antes de continuar.</p></div>
        </div>
        <div className="journal-donation__widget"><DonationWidget /></div>
      </div>
    </section>
  );
};
