import React from 'react';
import { MotionReveal } from './JournalMotion';
import { useTenant } from '../context/TenantContext';
import { EditorialIcon, hasText } from './Editorial';

export const ProgramsSection: React.FC = () => {
  const { tenant } = useTenant();
  const programs = Array.isArray(tenant?.programs)
    ? tenant.programs.filter((program) => program && [program.title, program.description, program.stat].some(hasText)) : [];
  if (!programs.length) return null;
  return (
    <section id="programas" className="journal-section journal-programs" aria-labelledby="programs-title">
      <div className="journal-container">
        <header className="journal-section-heading journal-section-heading--split">
          <div><p className="journal-kicker">Nuestro trabajo</p><h2 id="programs-title" className="journal-display">Compromiso<br /><em>en acción.</em></h2></div>
          <p>Así acompañamos a quienes forman parte de nuestra causa.</p>
        </header>
        <div className="journal-programs__list">
          {programs.map((program, index) => (
            <MotionReveal index={index} identity={JSON.stringify(program)} className="journal-programs__row" key={program.title + '-' + index}>
              <span className="journal-programs__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div className="journal-programs__icon"><EditorialIcon name={program.icon} /></div>
              <div className="journal-programs__copy">
                <h3>{hasText(program.title) ? program.title : 'Programa ' + (index + 1)}</h3>
                {hasText(program.description) && <p>{program.description}</p>}
              </div>
              {hasText(program.stat) && <strong className={'journal-programs__stat' + (program.stat.trim().length > 12 ? ' journal-programs__stat--compact' : '')}>{program.stat}</strong>}
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
