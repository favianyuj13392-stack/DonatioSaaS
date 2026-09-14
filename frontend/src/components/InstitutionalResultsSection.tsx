import React from 'react';
import type { InstitutionalMetric } from '../types';
import { hasText } from './Editorial';

interface Props { metrics?: (InstitutionalMetric | null)[] | null }
export const InstitutionalResultsSection: React.FC<Props> = ({ metrics }) => {
  const items = Array.isArray(metrics) ? metrics.filter((metric): metric is InstitutionalMetric =>
    !!metric && metric.value != null && String(metric.value).trim().length > 0 && hasText(metric.label)) : [];
  if (!items.length) return null;
  return (
    <section id="resultados" className="journal-section journal-results" aria-labelledby="results-title">
      <div className="journal-container">
        <header className="journal-section-heading journal-section-heading--split">
          <div><p className="journal-kicker journal-kicker--light">El camino recorrido</p><h2 id="results-title" className="journal-display">El impacto<br /><em>de estar presentes.</em></h2></div>
          <p>Resultados compartidos por nuestra organización.</p>
        </header>
        <dl className="journal-results__grid">
          {items.map((metric, index) => <div className="journal-results__metric" key={metric.label + '-' + index}>
            <dt>{metric.label}</dt><dd className={String(metric.value).trim().length > 12 ? 'journal-results__value--compact' : undefined}>{String(metric.value)}</dd>
          </div>)}
        </dl>
      </div>
    </section>
  );
};
