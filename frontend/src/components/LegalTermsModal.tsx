import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Lock, Building, Mail, CheckCircle2 } from 'lucide-react';
import { Tenant } from '../types';

interface LegalTermsModalProps {
  isOpen: boolean;
  tenant: Tenant;
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
  onAccept?: () => void;
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({
  isOpen,
  tenant,
  initialTab = 'terms',
  onClose,
  onAccept,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const orgName = tenant.legal_name || tenant.name || 'la Fundación';
  const supportEmail = tenant.contact_email || 'soporte@donatio.lat';

  const handleAcceptAndClose = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[var(--tenant-primary)] shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Marco Legal & Transparencia
              </h2>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{orgName}</span>
                <span>•</span>
                <span>Versión v1.0-2026</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 sm:px-6 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'terms'
                ? 'border-[var(--tenant-primary)] text-[var(--tenant-primary)]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Términos y Condiciones Clickwrap</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'privacy'
                ? 'border-[var(--tenant-primary)] text-[var(--tenant-primary)]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Tratamiento de Datos Personales</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[60vh]">
          {activeTab === 'terms' ? (
            <div className="space-y-5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-medium leading-relaxed">
                Bienvenido a la plataforma de recaudación en línea de la <strong className="text-slate-900">{orgName}</strong> (en adelante, la FUNDACIÓN), operada técnicamente bajo la infraestructura de software de <strong>Donatio SaaS</strong>, de propiedad exclusiva del PROVEEDOR tecnológico <strong>DarkoSync</strong>.
                <br /><br />
                El presente documento constituye un acuerdo legal vinculante y un contrato de adhesión (en adelante, los TÉRMINOS) celebrado entre usted, en calidad de donante o usuario de la interfaz de pago (en adelante, el DONANTE), y la FUNDACIÓN. Al realizar una donación única, activar una donación mensual recurrente o interactuar con el widget de pago, usted declara tener plena capacidad legal para obligarse y acepta expresamente todas las cláusulas aquí estipuladas mediante el mecanismo de consentimiento electrónico Clickwrap.
                <br /><br />
                <span className="font-bold text-slate-900 uppercase">
                  Si usted no está de acuerdo con estos términos o con la política de privacidad, debe abstenerse de utilizar la plataforma y de proporcionar sus datos.
                </span>
              </div>

              {/* SECCIÓN 1 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-black">1</span>
                  Naturaleza Jurídica de la Transacción y Procesamiento Financiero
                </h3>
                <div className="space-y-2 pl-6">
                  <p>
                    <strong className="text-slate-800">1.1 Carácter Gratuito e Irrevocable de la Donación:</strong> El DONANTE reconoce y acepta que toda transferencia monetaria realizada a través de esta plataforma constituye una donación pura, simple, gratuita e irrevocable a favor de la FUNDACIÓN, destinada exclusivamente al cumplimiento de su misión social, fines benéficos, estatutos y proyectos en ejecución. La donación no constituye una compraventa mercantil, no otorga derecho a contraprestación comercial, compensación en bienes o servicios, ni confiere derechos de propiedad, voto, membresía corporativa o injerencia en la administración de la FUNDACIÓN.
                  </p>
                  <p>
                    <strong className="text-slate-800">1.2 Pasarela de Pagos y Estándares de Seguridad:</strong> El procesamiento de los instrumentos financieros es operado a través de los servicios de adquirencia y liquidación autorizados por la Administradora de Tarjetas de Crédito (ATC Red Enlace) y la pasarela tecnológica global Cybersource (Visa Solution). Ni la FUNDACIÓN ni DarkoSync almacenan ni tienen acceso a información sensible de pago (PAN completo, expiración o CVV). Toda comunicación viaja bajo cifrado bancario TLS 1.3.
                  </p>
                  <p>
                    <strong className="text-slate-800">1.3 Protocolo de Autenticación Reforzada (3D Secure 2.2):</strong> Las transacciones con tarjeta están sujetas a verificación obligatoria del protocolo EMV 3-D Secure (3DS v2.2) de Cardinal Commerce / Cybersource. En desafíos de autenticación (Step-Up), el DONANTE deberá completar la autenticación de doble factor (OTP o biometría). Dicho proceso constituye prueba irrefutable de la autorización expresa del titular financiero.
                  </p>
                  <p>
                    <strong className="text-slate-800">1.4 Moneda de Liquidación y Régimen Cambiario:</strong> Toda donación se procesa y liquida en Moneda Nacional (Bolivianos - BOB) o Dólares Estadounidenses (USD). En caso de tarjetas internacionales con otras divisas, la tasa de cambio y comisiones transfronterizas son determinadas por el banco emisor del donante.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 2 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-black">2</span>
                  Donaciones Mensuales Recurrentes (Suscripciones Solidarias)
                </h3>
                <div className="space-y-2 pl-6">
                  <p>
                    <strong className="text-slate-800">2.1 Autorización de Débito Automático Tokenizado:</strong> Al seleccionar la modalidad de «Donación Mensual» o «Socio Recurrente», el DONANTE autoriza expresamente a la FUNDACIÓN y a ATC Red Enlace a debitar automáticamente el monto acordado de su tarjeta con periodicidad mensual (cada 30 días calendario).
                  </p>
                  <p>
                    <strong className="text-slate-800">2.2 Tokenización Segura (TMS):</strong> Se autoriza la generación de un Token Criptográfico Único (Token Management Service - TMS) custodiado en la bóveda de Cybersource bajo estándar PCI-DSS Nivel 1. Dicho token abstracto y no reversible es el único elemento empleado para los cargos recurrentes autorizados.
                  </p>
                  <p>
                    <strong className="text-slate-800">2.3 Cancelación y Modificación de la Suscripción:</strong> El DONANTE goza del derecho inalienable de pausar, modificar el monto o cancelar su suscripción en cualquier momento, sin penalidad alguna, a través de:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>El enlace de autogestión y baja segura incluido en cada comprobante mensual emitido.</li>
                    <li>
                      Comunicación directa dirigida al correo oficial de atención al donante:{' '}
                      <a href={`mailto:${supportEmail}`} className="font-bold text-[var(--tenant-primary)] underline">
                        {supportEmail}
                      </a>.
                    </li>
                  </ul>
                </div>
              </section>

              {/* SECCIÓN 3 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-black">3</span>
                  Política de Reembolsos, Errores y Contracargos
                </h3>
                <div className="space-y-2 pl-6">
                  <p>
                    <strong className="text-slate-800">3.1 Principio General de No Reembolso:</strong> Dado el carácter irrevocable de las donaciones benéficas y su inmediata asignación a causas sociales y humanitarias, las donaciones efectuadas no son legalmente reembolsables.
                  </p>
                  <p>
                    <strong className="text-slate-800">3.2 Excepciones por Errores Técnicos Manifiestos:</strong> Únicamente se admitirán revisiones por duplicidad involuntaria o error tipográfico flagrante notificado dentro de las 72 horas calendario del cargo a través de{' '}
                    <a href={`mailto:${supportEmail}`} className="font-bold text-[var(--tenant-primary)] underline">
                      {supportEmail}
                    </a>{' '}
                    adjuntando comprobante bancario.
                  </p>
                  <p>
                    <strong className="text-slate-800">3.3 Prevención de Contracargos Fraudulentos:</strong> Cualquier desconocimiento infundado de transacciones autenticadas con éxito vía 3D Secure v2.2 motivará la presentación ante la red bancaria y autoridades competentes de las bitácoras forenses de auditoría (IP, User-Agent, Session ID ThreatMetrix y firma criptográfica SHA-256 de consentimiento).
                  </p>
                </div>
              </section>

              {/* SECCIÓN 4 */}
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-black">4</span>
                  Limitación de Responsabilidad y Disponibilidad Técnica
                </h3>
                <div className="space-y-2 pl-6">
                  <p>
                    <strong className="text-slate-800">4.1 Plataforma Provista «Tal Cual» (As-Is):</strong> Ni la FUNDACIÓN ni DarkoSync garantizan la inexistencia de intermitencias derivadas de caídas de telecomunicaciones, servidores adquirentes de ATC Red Enlace o la red de pagos ajenas a su control razonable.
                  </p>
                  <p>
                    <strong className="text-slate-800">4.2 Rol Exclusivo de DarkoSync:</strong> DarkoSync actúa exclusivamente como proveedor tecnológico de la infraestructura de software (SaaS), deslindando toda injerencia en el manejo, destino final o administración de los fondos recaudados por la FUNDACIÓN.
                  </p>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-medium leading-relaxed">
                En cumplimiento de las normativas de protección de datos, la Constitución Política del Estado Plurinacional de Bolivia y estándares internacionales de privacidad digital, la <strong className="text-slate-900">{orgName}</strong> y <strong>Donatio SaaS</strong> informan al DONANTE sobre el tratamiento de su información personal:
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Datos Recolectados</h4>
                    <p className="mt-0.5">
                      Para procesar la donación y emitir el certificado oficial, se solicitan datos de contacto básicos (nombre, correo electrónico, país y ciudad). En caso de optar por donación anónima, el nombre no figurará en reportes públicos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Finalidad del Tratamiento</h4>
                    <p className="mt-0.5">
                      Los datos se utilizan exclusivamente para procesar la transacción bancaria, emitir el recibo digital oficial, brindar soporte y cumplir con regulaciones vigentes de prevención de legitimación de ganancias ilícitas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">No Comercialización ni Cesión</h4>
                    <p className="mt-0.5">
                      Se garantiza de forma categórica que bajo ninguna circunstancia se venderán, alquilarán ni cederán datos a empresas publicitarias o terceros ajenos a la operación de la donación.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Medidas de Ciberseguridad y Perfilamiento Antifraude</h4>
                    <p className="mt-0.5">
                      Para mitigar suplantaciones de identidad, la plataforma interactúa de manera anónima con herramientas de telemetría técnica autorizadas (LexisNexis ThreatMetrix y Cardinal Commerce) para certificar la legitimidad de la operación ante el sistema financiero.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Ejercicio de Derechos ARCO (Acceso, Rectificación y Supresión)</h4>
                    <p className="mt-0.5">
                      El DONANTE puede revocar su consentimiento o solicitar la rectificación o eliminación de sus datos en cualquier momento escribiendo a:{' '}
                      <a href={`mailto:${supportEmail}`} className="font-bold text-[var(--tenant-primary)] underline">
                        {supportEmail}
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Contacto: </span>
            <a href={`mailto:${supportEmail}`} className="font-bold text-slate-700 hover:underline">
              {supportEmail}
            </a>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-200/80 hover:bg-slate-300 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleAcceptAndClose}
              className="w-1/2 sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--tenant-primary)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Entendido y Aceptar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
