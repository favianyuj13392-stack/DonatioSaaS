import React from 'react';
import { useTenant } from '../context/TenantContext';
import { hasText } from './Editorial';

export const AboutSection: React.FC = () => {
  const { tenant } = useTenant();
  if (!tenant) return null;
  const values = Array.isArray(tenant.values) ? tenant.values.filter(hasText) : [];
  const pillars = [{ label: 'Nuestra misión', text: tenant.mission }, { label: 'Nuestra visión', text: tenant.vision }].filter((item) => hasText(item.text));
  const hasLegal = [tenant.legal_name, tenant.nit, tenant.legal_id_details].some(hasText);
  if (!hasText(tenant.about_text) && !pillars.length && !values.length && !hasLegal) return null;
  return (
    <section id="quienes-somos" className="journal-section journal-about" aria-labelledby="about-title">
      <div className="journal-container">
        <div className="journal-about__intro">
          <p className="journal-kicker">La organización detrás de la causa</p>
          <h2 id="about-title" className="journal-display">{tenant.name}</h2>
          {hasText(tenant.about_text) && <p className="journal-about__statement">{tenant.about_text}</p>}
        </div>
        {pillars.length > 0 && <div className="journal-about__pillars">{pillars.map((pillar, index) => (
          <article key={pillar.label}><span className="journal-index">0{index + 1}</span><h3>{pillar.label}</h3><p>{pillar.text}</p></article>
        ))}</div>}
        {values.length > 0 && <ul className="journal-about__values" aria-label="Nuestros valores">
          {values.map((value, index) => <li key={value + '-' + index}>{value}</li>)}
        </ul>}
        {hasLegal && <div className="journal-about__signature">
          <div><span className="journal-kicker">Identidad institucional</span><strong>{tenant.legal_name || tenant.name}</strong></div>
          <div>
            {hasText(tenant.nit) && <p>NIT: {tenant.nit}</p>}
            {hasText(tenant.legal_id_details) && <p>{tenant.legal_id_details}</p>}
            {hasText(tenant.location_city) && <p>{tenant.location_city}</p>}
          </div>
        </div>}
      </div>
    </section>
  );
};
