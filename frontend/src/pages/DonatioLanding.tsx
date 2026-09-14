import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CreditCard, Heart, Layers, LayoutDashboard, Menu, Plus, Repeat, Users, X } from 'lucide-react';
import './donatio.css';

type PreviewTab = 'Campañas' | 'Aportes' | 'Socios';
type PreviewTone = 'sage' | 'navy' | 'clay';

const campaigns = [
  { name: 'Educación que abre caminos', category: 'Educación', progress: 68 },
  { name: 'Un plato, nuevas oportunidades', category: 'Alimentación', progress: 42 },
  { name: 'Más cerca de la salud', category: 'Salud', progress: 85 },
];
const contributions = [
  { name: 'Aporte 003', detail: '18 jun · Educación', amount: 'BOB 1.500' },
  { name: 'Aporte 002', detail: '12 jun · Alimentación', amount: 'BOB 960' },
  { name: 'Aporte 001', detail: '04 jun · Salud', amount: 'BOB 500' },
];
const members = [
  { name: 'Socio 001', detail: 'Aporte mensual', amount: 'BOB 120' },
  { name: 'Socio 002', detail: 'Aporte mensual', amount: 'BOB 200' },
  { name: 'Socio 003', detail: 'Aporte mensual', amount: 'BOB 150' },
];
const previewMetrics = {
  Campañas: { label: 'Aportes de enero a junio', value: 'BOB 10.240', badge: '3 campañas' },
  Aportes: { label: 'Aportes registrados en junio', value: 'BOB 2.960', badge: '3 aportes' },
  Socios: { label: 'Socios recurrentes', value: '24', badge: 'Aporte mensual' },
};
const faqs = [
  { question: '¿Donatio es una página para donar o una plataforma de gestión?', answer: 'Ambas cosas, conectadas. Tu organización puede presentar su misión y sus campañas en una página con identidad propia, recibir aportes y administrar campañas, transacciones, socios recurrentes y liquidaciones desde su panel.' },
  { question: '¿La experiencia puede llevar la marca de mi organización?', answer: 'Sí. Donatio contempla páginas institucionales y de campañas con la identidad de cada organización: su logo, sus colores y su contenido. La vista de ejemplo de esta página permite explorar distintas paletas; no modifica una organización real.' },
  { question: '¿Se pueden recibir aportes recurrentes?', answer: 'Sí. La plataforma contempla aportes únicos y recurrentes. La recurrencia automática depende del medio de pago habilitado: un pago por QR no genera cobros mensuales automáticos.' },
  { question: '¿Qué monedas contempla la plataforma?', answer: 'Donatio contempla bolivianos (BOB) y dólares estadounidenses (USD). Las modalidades de cobro disponibles dependen de la configuración de cada organización.' },
];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <a className={`dm-brand${light ? ' dm-brand-light' : ''}`} href="#dm-top" aria-label="Donatio, inicio">
      <span className="dm-brand-mark" aria-hidden="true"><img src="/brand/donatio-logo.png" alt="" width="1254" height="1254" /></span>
      <span>Donatio<span className="dm-brand-dot">.</span></span>
    </a>
  );
}

function ProductPreview() {
  const [tab, setTab] = useState<PreviewTab>('Campañas');
  const [tone, setTone] = useState<PreviewTone>('sage');
  const metric = previewMetrics[tab];
  return (
    <div className="dm-product-preview" id="dm-producto" data-tone={tone}>
      <div className="dm-preview-label"><span>UNA VISTA DE DONATIO</span><span className="dm-preview-label-line" /><span>01 / PLATAFORMA</span></div>
      <div className="dm-preview-window">
        <div className="dm-window-bar">
          <span className="dm-window-dots" aria-hidden="true"><i /><i /><i /></span>
          <span>Tu organización · Panel de gestión</span>
          <LayoutDashboard size={13} aria-hidden="true" />
        </div>
        <div className="dm-dashboard">
          <div className="dm-dashboard-rail" aria-hidden="true">
            <span className="dm-rail-brand"><Heart size={19} /></span>
            <span className="dm-rail-active"><LayoutDashboard size={17} /></span>
            <Layers size={17} /><CreditCard size={17} /><Users size={17} />
            <span className="dm-rail-bottom">FH</span>
          </div>
          <div className="dm-dashboard-main">
            <div className="dm-dashboard-heading"><div><span>TU ESPACIO DE IMPACTO</span><h3>Fundación Horizonte</h3></div><span className="dm-avatar">FH</span></div>
            <div className="dm-preview-tabs" role="group" aria-label="Explorar la vista ilustrativa">
              {(['Campañas', 'Aportes', 'Socios'] as PreviewTab[]).map((name) => (
                <button key={name} type="button" aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>
              ))}
            </div>
            <div className="dm-preview-content" aria-live="polite" aria-atomic="true">
              <div className="dm-preview-summary"><div><span>{metric.label}</span><strong>{metric.value}</strong></div><span className="dm-mini-badge">{metric.badge}</span></div>
              {tab === 'Campañas' ? (
                <>
                  <div className="dm-chart">
                    <svg viewBox="0 0 320 108" role="img" aria-label="Aportes de ejemplo en BOB: enero 800, febrero 1260, marzo 980, abril 1940, mayo 2300, junio 2960.">
                      <path d="M0 24H320 M0 54H320 M0 84H320" className="dm-chart-grid" />
                      {[{ month: 'Ene', amount: 800 }, { month: 'Feb', amount: 1260 }, { month: 'Mar', amount: 980 }, { month: 'Abr', amount: 1940 }, { month: 'May', amount: 2300 }, { month: 'Jun', amount: 2960 }].map(({ month, amount }, index) => (
                        <g key={month}><rect x={index * 53 + 12} y={84 - amount / 40} width="28" height={amount / 40} rx="4" /><text x={index * 53 + 26} y="104" textAnchor="middle">{month}</text></g>
                      ))}
                    </svg>
                  </div>
                  <div className="dm-list-heading"><span>Campañas activas</span><span>Avance de meta</span></div>
                  <div className="dm-campaign-list">
                    {campaigns.map((campaign, index) => (
                      <div className="dm-campaign-row" key={campaign.name}>
                        <span className={`dm-campaign-icon dm-campaign-icon-${index}`} aria-hidden="true">{index === 0 ? <Layers size={16} /> : index === 1 ? <Heart size={16} /> : <Plus size={16} />}</span>
                        <div><strong>{campaign.name}</strong><span>{campaign.category}</span></div>
                        <div className="dm-campaign-progress"><span>{campaign.progress}%</span><progress value={campaign.progress} max="100" aria-label={`Avance ilustrativo de ${campaign.name}`} /></div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="dm-records">
                  <div className="dm-records-intro"><span className="dm-records-icon">{tab === 'Aportes' ? <CreditCard size={24} aria-hidden="true" /> : <Users size={24} aria-hidden="true" />}</span><p>{tab === 'Aportes' ? 'Cada aporte, en un mismo lugar.' : 'Un vínculo que continúa mes a mes.'}</p></div>
                  <div className="dm-list-heading"><span>{tab === 'Aportes' ? 'Últimos aportes' : 'Selección de socios'}</span><span>Importe</span></div>
                  {(tab === 'Aportes' ? contributions : members).map((record) => (
                    <div className="dm-record-row" key={record.name}><span className="dm-record-check"><Check size={13} aria-hidden="true" /></span><div><strong>{record.name}</strong><span>{record.detail}</span></div><b>{record.amount}</b></div>
                  ))}
                  <p className="dm-records-note">Registros ilustrativos. No se realizan operaciones.</p>
                </div>
              )}
            </div>
            <div className="dm-dashboard-footer"><span className="dm-status-dot" />Vista ilustrativa · Datos de ejemplo</div>
          </div>
        </div>
      </div>
      <div className="dm-preview-customize">
        <span>Una plataforma. <strong>Tu identidad.</strong></span>
        <div className="dm-palette" role="group" aria-label="Cambiar la paleta de la vista ilustrativa">
          {([{ id: 'sage', label: 'verde salvia' }, { id: 'navy', label: 'azul profundo' }, { id: 'clay', label: 'terracota' }] as const).map((palette) => (
            <button type="button" key={palette.id} className={`dm-swatch dm-swatch-${palette.id}`} aria-label={`Vista en ${palette.label}`} aria-pressed={tone === palette.id} onClick={() => setTone(palette.id)}>{tone === palette.id && <Check size={13} aria-hidden="true" />}</button>
          ))}
        </div>
      </div>
      <div className="dm-preview-caption"><span className="dm-caption-symbol" aria-hidden="true">↳</span><p>Detrás de cada aporte,<br /><strong>una causa que sigue adelante.</strong></p></div>
    </div>
  );
}

export default function DonatioLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const previousTitle = document.title;
    const existingDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = existingDescription?.getAttribute('content');
    const description = existingDescription ?? document.createElement('meta');
    document.title = 'Donatio | Conecta causas, cambia vidas';
    description.name = 'description';
    description.content = 'Donatio conecta la misión de tu organización con una plataforma para presentar campañas, recibir aportes y gestionar socios recurrentes con tu propia identidad.';
    if (!existingDescription) document.head.appendChild(description);
    return () => {
      document.title = previousTitle;
      if (!existingDescription) description.remove();
      else if (previousDescription == null) description.removeAttribute('content');
      else description.setAttribute('content', previousDescription);
    };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        document.getElementById('dm-menu-toggle')?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="dm-page" id="dm-top">
      <a className="dm-skip-link" href="#dm-main">Saltar al contenido</a>
      <header className="dm-header">
        <div className="dm-container dm-header-inner">
          <Brand />
          <button className="dm-menu-toggle" id="dm-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="dm-navigation" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}</button>
          <nav id="dm-navigation" className={`dm-navigation${menuOpen ? ' dm-navigation-open' : ''}`} aria-label="Navegación principal">
            <a href="#dm-producto" onClick={() => setMenuOpen(false)}>La plataforma</a>
            <a href="#dm-como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
            <a href="#dm-para-quien" onClick={() => setMenuOpen(false)}>Para tu organización</a>
            <a className="dm-nav-cta" href="#dm-producto" onClick={() => setMenuOpen(false)}>Explorar Donatio <ArrowUpRight size={16} aria-hidden="true" /></a>
          </nav>
        </div>
      </header>
      <main id="dm-main" tabIndex={-1}>
        <section className="dm-hero" aria-labelledby="dm-hero-title">
          <div className="dm-container dm-hero-grid">
            <div className="dm-hero-copy">
              <p className="dm-eyebrow"><span />TECNOLOGÍA CON PROPÓSITO</p>
              <h1 id="dm-hero-title">Tu causa,<br />con más<br /><em>futuro.</em></h1>
              <p className="dm-hero-description">Conecta a quienes quieren ayudar con todo lo que tu organización puede hacer.</p>
              <p className="dm-hero-detail">Tu marca, tus campañas y la gestión de tus aportes. Una plataforma para que la misión esté siempre al frente.</p>
              <div className="dm-hero-actions"><a className="dm-button dm-button-primary" href="#dm-producto">Conocer la plataforma <ArrowUpRight size={18} aria-hidden="true" /></a><a className="dm-text-link" href="#dm-como-funciona">Cómo funciona <ArrowRight size={17} aria-hidden="true" /></a></div>
              <div className="dm-hero-signoff"><span className="dm-signoff-line" /><span>Conecta causas. Cambia vidas.</span></div>
            </div>
            <ProductPreview />
          </div>
          <div className="dm-container"><div className="dm-proof-strip">
            {[{ icon: Heart, title: 'Tu marca', detail: 'Una experiencia propia' }, { icon: CreditCard, title: 'BOB + USD', detail: 'Dos monedas, una plataforma' }, { icon: Repeat, title: 'Aportes recurrentes', detail: 'Vínculos que continúan' }, { icon: LayoutDashboard, title: 'Control centralizado', detail: 'Una gestión más clara' }].map(({ icon: Icon, title, detail }) => (
              <div key={title}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><p><strong>{title}</strong><span>{detail}</span></p></div>
            ))}
          </div></div>
        </section>

        <section className="dm-section dm-platform" aria-labelledby="dm-platform-title">
          <div className="dm-container">
            <div className="dm-section-heading"><div><p className="dm-eyebrow">01 — UNA MISIÓN, TODO CONECTADO</p><h2 id="dm-platform-title">Menos dispersión.<br />Más <em>propósito.</em></h2></div><p>Una buena causa necesita ser contada.<br />Y también necesita herramientas para sostenerse.</p></div>
            <div className="dm-feature-grid">
              <article className="dm-feature dm-feature-brand"><span className="dm-feature-number">01 / IDENTIDAD</span><h3>Tu marca,<br />al frente.</h3><p>Una página para contar quiénes son, presentar sus campañas y recibir aportes sin perder su identidad.</p><div className="dm-brand-example" aria-label="Ejemplo ilustrativo de identidad institucional"><span><Heart size={17} aria-hidden="true" /> TU ORGANIZACIÓN</span><strong>Hay historias que<br />podemos cambiar.</strong><div><span>Tu historia</span><span>Tu comunidad</span><span>Tu causa</span></div></div><span className="dm-feature-bottom">Páginas institucionales y de campañas <ArrowUpRight size={18} aria-hidden="true" /></span></article>
              <article className="dm-feature dm-feature-recurring"><div className="dm-feature-top"><span className="dm-feature-number">02 / CONTINUIDAD</span><Repeat size={25} strokeWidth={1.4} aria-hidden="true" /></div><h3>Que el apoyo<br />no termine hoy.</h3><p>Aportes únicos para una necesidad concreta. Socios recurrentes para acompañar una misión en el tiempo.</p><div className="dm-frequency-example" aria-label="Modalidades de aporte"><span>Una vez</span><span><Check size={14} aria-hidden="true" /> Mes a mes</span></div></article>
              <article className="dm-feature dm-feature-control"><div className="dm-feature-top"><span className="dm-feature-number">03 / GESTIÓN</span><Layers size={25} strokeWidth={1.4} aria-hidden="true" /></div><h3>La información,<br />en su lugar.</h3><p>Campañas, transacciones, socios y liquidaciones. Un panel para seguir lo que pasa y trabajar con claridad.</p><div className="dm-control-example"><span><Check size={13} aria-hidden="true" /> Campañas</span><span><Check size={13} aria-hidden="true" /> Aportes</span><span><Check size={13} aria-hidden="true" /> Socios</span></div></article>
            </div>
          </div>
        </section>

        <section className="dm-section dm-process" id="dm-como-funciona" aria-labelledby="dm-process-title">
          <div className="dm-container"><div className="dm-section-heading"><div><p className="dm-eyebrow">02 — DE LA MISIÓN A LA ACCIÓN</p><h2 id="dm-process-title">Un camino claro.<br />Un impacto <em>compartido.</em></h2></div><a className="dm-text-link" href="#dm-producto">Explorar la vista de producto <ArrowUpRight size={17} aria-hidden="true" /></a></div>
            <ol className="dm-steps">
              {[{ number: '01', title: 'Haz visible tu causa', text: 'Presenta tu organización con su identidad y da a cada campaña un espacio para contar su propósito.' }, { number: '02', title: 'Conecta con el apoyo', text: 'Reúne aportes para campañas específicas o para la misión general, con opciones únicas y recurrentes.' }, { number: '03', title: 'Acompaña lo que sigue', text: 'Consulta tus transacciones, administra tus campañas y da seguimiento a tus socios desde el panel.' }].map((step) => (<li key={step.number}><div><span>{step.number}</span><ArrowRight size={22} strokeWidth={1.3} aria-hidden="true" /></div><h3>{step.title}</h3><p>{step.text}</p></li>))}
            </ol>
          </div>
        </section>

        <section className="dm-section dm-audience" id="dm-para-quien" aria-labelledby="dm-audience-title">
          <div className="dm-container dm-audience-grid"><div><p className="dm-eyebrow">03 — PARA QUIENES ESTÁN AL FRENTE</p><h2 id="dm-audience-title">La misión es grande.<br />Tu equipo no tiene<br />que hacerlo <em>todo solo.</em></h2><p className="dm-audience-lead">Para fundaciones y organizaciones sin fines de lucro que quieren conectar su propósito con una gestión más clara.</p><span className="dm-audience-note"><Heart size={17} aria-hidden="true" /> Tecnología al servicio de las personas.</span></div><div className="dm-roles">
            {[{ number: '01', title: 'Dirección', text: 'La identidad de la organización y sus campañas, reunidas en una experiencia coherente.' }, { number: '02', title: 'Captación de fondos', text: 'Un lugar para presentar cada causa y ofrecer distintas formas de acompañarla.' }, { number: '03', title: 'Administración', text: 'Transacciones, socios recurrentes y liquidaciones organizados para su seguimiento.' }].map((role) => (<article key={role.number}><span>{role.number}</span><div><h3>{role.title}</h3><p>{role.text}</p></div><ArrowUpRight size={20} aria-hidden="true" /></article>))}
          </div></div>
        </section>

        <section className="dm-section dm-faq" aria-labelledby="dm-faq-title"><div className="dm-container dm-faq-grid"><div><p className="dm-eyebrow">LO ESENCIAL, SIN LETRA PEQUEÑA</p><h2 id="dm-faq-title">Buenas preguntas.<br /><em>Respuestas claras.</em></h2></div><div className="dm-faq-list">{faqs.map((faq) => (<details key={faq.question}><summary>{faq.question}<Plus size={20} aria-hidden="true" /></summary><p>{faq.answer}</p></details>))}</div></div></section>

        <section className="dm-closing" aria-labelledby="dm-closing-title"><div className="dm-container dm-closing-inner"><div><p className="dm-eyebrow">EL PRÓXIMO CAPÍTULO EMPIEZA CON UNA CONEXIÓN</p><h2 id="dm-closing-title">Detrás de tu causa,<br />hay un futuro <em>posible.</em></h2><p>Dale a tu organización un espacio para conectar,<br />recibir apoyo y seguir adelante.</p><a className="dm-button dm-button-light" href="#dm-producto">Explorar Donatio <ArrowUpRight size={19} aria-hidden="true" /></a></div><div className="dm-closing-statement" aria-hidden="true"><Heart size={48} strokeWidth={1} /><span>Conecta<br />causas.<br /><em>Cambia<br />vidas.</em></span></div></div></section>
      </main>
      <footer className="dm-footer"><div className="dm-container dm-footer-inner"><Brand light /><p>Tecnología con propósito.</p><a href="#dm-top">Volver al inicio <ArrowUpRight size={15} aria-hidden="true" /></a></div></footer>
    </div>
  );
}

// ## Key Learnings:
// 1. Product preview interactions remain local and explicitly illustrative.
// 2. Marketing claims follow verified product scope; QR does not imply automatic recurrence.