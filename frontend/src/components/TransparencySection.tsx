import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { FundsBreakdownItem } from '../types';
import { hasText, positiveNumber } from './Editorial';
import { useViewportProgress } from '../hooks/useJournalMotion';

interface Props { fundsBreakdown?: (FundsBreakdownItem | null)[] | null }
const segmentColors = [
  'var(--tenant-primary)',
  'color-mix(in srgb, var(--tenant-primary) 60%, #171d1b)',
  'color-mix(in srgb, var(--tenant-primary) 35%, #f3f1eb)',
  'color-mix(in srgb, var(--tenant-primary) 75%, #171d1b)',
  'color-mix(in srgb, var(--tenant-primary) 65%, #f3f1eb)',
];
export const TransparencySection: React.FC<Props> = ({ fundsBreakdown }) => {
  const [selected, setSelected] = useState(0);
  const items = Array.isArray(fundsBreakdown)
    ? fundsBreakdown.filter((item): item is FundsBreakdownItem => !!item && hasText(item.category)) : [];
  const motion = useViewportProgress<HTMLDivElement>(JSON.stringify(items.map((item) => [item.category, item.percentage])));
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + positiveNumber(item.percentage), 0);
  const denominator = Math.max(100, total);
  const activeIndex = Math.min(selected, items.length - 1);
  const active = items[activeIndex];
  const format = (value: number) => new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(value);
  let offset = 0;
  return (
    <section id="transparencia" className="journal-section journal-transparency" aria-labelledby="transparency-title">
      <div className="journal-container">
        <header className="journal-section-heading journal-section-heading--split">
          <div><p className="journal-kicker">Claridad en cada aporte</p><h2 id="transparency-title" className="journal-display">La confianza<br /><em>se demuestra.</em></h2></div>
          <p>Conoce la distribución de fondos informada para esta causa.</p>
        </header>
        <div className="journal-transparency__layout">
          <div className="journal-transparency__visual">
            <div ref={motion.ref} className="journal-transparency__donut">
              <svg viewBox="0 0 120 120" role="img" aria-label={'Desglose de fondos. Suma declarada: ' + format(total) + '%.'}>
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--journal-line)" strokeWidth="12" />
                {items.map((item, index) => {
                  const size = positiveNumber(item.percentage) / denominator * 100;
                  const start = offset;
                  offset += size;
                  return <circle key={index} cx="60" cy="60" r="48" fill="none" pathLength="100"
                    stroke={segmentColors[index % segmentColors.length]} strokeWidth={index === activeIndex ? 15 : 11}
                    strokeDasharray={size * motion.fraction + ' ' + (100 - size * motion.fraction)} strokeDashoffset={-start}
                    transform="rotate(-90 60 60)" className="journal-transparency__segment" />;
                })}
              </svg>
              <div className="journal-transparency__center" aria-hidden="true">
                <strong>{format(positiveNumber(active.percentage))}%</strong><span>{active.category}</span>
              </div>
            </div>
            <p className="journal-transparency__note">
              {total > 100.01 ? 'Los porcentajes declarados suman ' + format(total) + '%. El anillo muestra su proporción relativa; revisa el desglose con la organización.'
                : total < 99.99 ? format(100 - total) + '% no está detallado en este desglose.'
                  : 'Distribución del 100% de los fondos informados.'}
            </p>
          </div>
          <div className="journal-transparency__categories">
            {items.map((item, index) => (
              <button type="button" key={item.category + '-' + index}
                className={'journal-transparency__category' + (index === activeIndex ? ' is-active' : '')}
                aria-pressed={index === activeIndex}
                onClick={() => setSelected(index)} onFocus={() => setSelected(index)} onPointerMove={() => setSelected(index)}>
                <span className="journal-transparency__category-main">
                  <span className="journal-transparency__swatch" style={{ background: segmentColors[index % segmentColors.length] }} />
                  <strong>{item.category}</strong><span>{format(positiveNumber(item.percentage))}%</span>
                </span>
                {hasText(item.description) && <span className="journal-transparency__description">{item.description}</span>}
              </button>
            ))}
            <a className="journal-text-link" href="#donacion">Contribuir a esta causa <ArrowUpRight size={19} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </section>
  );
};
