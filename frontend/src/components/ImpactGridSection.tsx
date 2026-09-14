import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { DonationTier, TangibleImpactItem } from '../types';
import { EditorialIcon, hasText } from './Editorial';

interface Props {
  impactItems?: (TangibleImpactItem | null)[] | null;
  tiers?: (DonationTier | null)[] | null;
}
export const ImpactGridSection: React.FC<Props> = ({ impactItems, tiers }) => {
  const supplied = Array.isArray(impactItems)
    ? impactItems.filter((item): item is TangibleImpactItem =>
      !!item && [item.title, item.description, item.stat_highlight].some(hasText)) : [];
  const items = supplied.length ? supplied : (Array.isArray(tiers) ? tiers : [])
    .filter((tier): tier is DonationTier => !!tier && hasText(tier.label) && Number(tier.amount) > 0)
    .map((tier) => ({
      title: tier.label, description: '', icon: 'hand-heart',
      stat_highlight: 'Bs. ' + new Intl.NumberFormat('es-BO').format(Number(tier.amount)),
    }));
  if (!items.length) return null;
  return (
    <section id="impacto" className="journal-section journal-impact" aria-labelledby="impact-title">
      <div className="journal-container">
        <header className="journal-section-heading">
          <p className="journal-kicker">El valor de ayudar</p>
          <h2 id="impact-title" className="journal-display">Tu aporte.<br /><em>Su posibilidad.</em></h2>
          <p>El impacto empieza en algo concreto.</p>
        </header>
        <div className={'journal-impact__grid' + (items.length === 1 ? ' journal-impact__grid--single' : '')}>
          {items.map((item, index) => (
            <article className={'journal-impact__card' + (index === 0 ? ' journal-impact__card--featured' : '')} key={item.title + '-' + index}>
              <div className="journal-impact__top"><EditorialIcon name={item.icon} /><span className="journal-index">{String(index + 1).padStart(2, '0')}</span></div>
              <div className="journal-impact__body">
                {hasText(item.stat_highlight) && <p className="journal-impact__stat">{item.stat_highlight}</p>}
                {hasText(item.title) && <h3>{item.title}</h3>}
                {hasText(item.description) && <p>{item.description}</p>}
              </div>
              <a className="journal-impact__link" href="#donacion">Hacerlo posible <ArrowUpRight size={19} aria-hidden="true" /></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
