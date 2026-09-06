import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const orgName = tenant.legal_name || tenant.name || 'la FUNDACIÓN';
  const supportEmail = tenant.contact_email || 'soporte@donatio.lat';

  const handleAcceptAndClose = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[var(--tenant-primary)] shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                TÉRMINOS Y CONDICIONES DE USO CLICKWRAP Y POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES PARA DONANTES
              </h2>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{orgName}</span>
                <span>•</span>
                <span>Marco Jurídico Ley N° 164 & D.S. N° 1793</span>
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
            <span>TÉRMINOS Y CONDICIONES CLICKWRAP</span>
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
            <span>POLÍTICA DE PRIVACIDAD Y DATOS (BI)</span>
          </button>
        </div>

        {/* Scrollable Content Body - 100% TEXTO LITERAL VERBATIM */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[60vh]">
          {activeTab === 'terms' ? (
            <div className="space-y-6">
              {/* Encabezado y Advertencia Obligatoria */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p>
                  Bienvenido a la plataforma de recaudación en línea de la <strong className="text-slate-900">{orgName}</strong> (en adelante, la FUNDACIÓN), operada técnicamente bajo la infraestructura de software de Donatio SaaS, de propiedad exclusiva del PROVEEDOR tecnológico DarkoSync.
                </p>
                <p>
                  El presente documento constituye un acuerdo legal vinculante y un contrato de adhesión (en adelante, los TÉRMINOS) celebrado entre usted, en calidad de donante o usuario de la interfaz de pago (en adelante, el DONANTE), y la FUNDACIÓN. Al realizar una donación única, activar una donación mensual recurrente o interactuar con el widget de pago, usted declara tener plena capacidad legal para obligarse conforme a las leyes del Estado Plurinacional de Bolivia y manifiesta su consentimiento y aceptación expresa, previa, libre, informada y exenta de vicios de la totalidad de las condiciones aquí estipuladas. Esto se fundamenta estrictamente bajo el Artículo 78 de la Ley N° 164 de Telecomunicaciones y Tecnologías de Información y Comunicación de Bolivia y el Decreto Supremo N° 1793.
                </p>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-bold text-xs uppercase tracking-wide">
                  ADVERTENCIA OBLIGATORIA: SI USTED NO ESTÁ DE ACUERDO CON ESTOS TÉRMINOS, DEBERÁ ABSTENERSE DE UTILIZAR LA PLATAFORMA Y DE REALIZAR APORTES A TRAVÉS DE ELLA.
                </div>
              </div>

              <div className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                TÉRMINOS Y CONDICIONES CLICKWRAP PARA DONANTES
              </div>

              {/* SECCIÓN 1 */}
              <section className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  SECCIÓN 1.- (NATURALEZA JURÍDICA DE LA TRANSACCIÓN: APORTE VOLUNTARIO GRATUITO Y NO REEMBOLSABLE)
                </h3>
                <div className="space-y-2.5 pl-3 border-l-2 border-slate-200">
                  <p>
                    <strong>1.1 Objeto y Gratuidad:</strong> El DONANTE reconoce y acepta que todo importe de dinero transferido a través de esta plataforma constituye una donación voluntaria, altruista, irrevocable, unilateral y a título de liberalidad gratuita realizada a favor de la FUNDACIÓN, de conformidad con las disposiciones aplicables al contrato de donación regulado por el Código Civil boliviano.
                  </p>
                  <p>
                    <strong>1.2 Exclusión de Normativa Comercial de Reembolso:</strong> Al tratarse de un acto de liberalidad pura y simple para fines benéficos, de asistencia social, educativos o de desarrollo comunitario, las partes declaran que esta transacción carece de carácter comercial. En consecuencia, el DONANTE acepta que no le asiste el derecho de retracto, rescisión, desistimiento, reversión de pago o devolución de aportes previstos para relaciones de consumo comercial bajo la Ley N° 453 (Ley General de Defensa de los Derechos de las Usuarias y los Usuarios y de las Consumidoras y los Consumidores). Una vez que la transacción es autorizada electrónicamente por el procesador de pagos local (ATC Red Enlace) o internacional (Cybersource de Visa), los fondos se consolidan de forma definitiva e inmediata en la cuenta bancaria de la FUNDACIÓN sin posibilidad de reversión unilateral por parte del DONANTE.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 2 */}
              <section className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  SECCIÓN 2.- (RÉGIMEN DE DÉBITOS MENSUALES RECURRENTES - SUSCRIPCIONES)
                </h3>
                <div className="space-y-2.5 pl-3 border-l-2 border-slate-200">
                  <p>
                    <strong>2.1 Consentimiento de Débito Recurrente:</strong> Si el DONANTE selecciona la opción de &apos;Donación Mensual Recurrente&apos; (o denominación equivalente de suscripción o aporte mensual en el checkout), otorga su consentimiento y autorización previa, expresa, escrita, informada e inequívoca a la FUNDACIÓN y a sus intermediarios tecnológicos para que efectúen cargos mensuales recurrentes y automatizados a su tarjeta de crédito o débito registrada, por el monto exacto seleccionado por el DONANTE.
                  </p>
                  <p>
                    <strong>2.2 Periodicidad del Cobro:</strong> Los débitos recurrentes se procesarán de forma mensual, tomando como fecha de referencia el mismo día del calendario en el que se realizó la primera donación. En caso de que la transacción sea rechazada por falta de fondos, vencimiento de tarjeta o restricciones de seguridad, el sistema intentará de forma automática procesar el débito en los días siguientes según los ciclos lógicos de reintento del software, sin que esto constituya un cobro indebido o duplicado.
                  </p>
                  <p>
                    <strong>2.3 Procedimiento de Cancelación (Opt-Out):</strong> El DONANTE retiene el derecho de revocar esta autorización de cobro recurrente en cualquier momento, de manera totalmente gratuita y sin penalización alguna. Para proceder con la baja de futuros débitos, el DONANTE deberá ejecutar una de las siguientes acciones con una anticipación mínima de setenta y dos (72) horas hábiles antes de la fecha programada para el siguiente débito: a) Desactivar la opción de cobro recurrente directamente desde su panel de control de usuario habilitado en la plataforma; o b) Enviar una solicitud expresa por escrito vía correo electrónico oficial de soporte de la FUNDACIÓN:{' '}
                    <a href={`mailto:${supportEmail}`} className="font-bold text-[var(--tenant-primary)] underline">
                      {supportEmail}
                    </a>.
                  </p>
                  <p>
                    <strong>2.4 Efectos de la Cancelación:</strong> La cancelación de la suscripción mensual impedirá futuros cargos automáticos a partir del momento de su procesamiento efectivo en la plataforma. Bajo ninguna circunstancia la cancelación de una suscripción mensual generará derecho a la devolución, compensación o reembolso de los montos que hubiesen sido debitados de forma automática con anterioridad a la fecha efectiva de la baja.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 3 */}
              <section className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  SECCIÓN 3.- (RÉGIMEN CAMBIARIO EN TIEMPO REAL, PROCESAMIENTO Y EXCLUSIÓN DE RESPONSABILIDAD CAMBIARIA)
                </h3>
                <div className="space-y-2.5 pl-3 border-l-2 border-slate-200">
                  <p>
                    <strong>3.1 Procesamiento Tecnológico de Transacciones:</strong> El DONANTE reconoce y acepta que Donatio es una plataforma tecnológica multi-tenant y no un intermediario financiero ni pasarela de pagos. Por tanto, Donatio no procesa, no capta y no realiza conversiones de divisas en la pasarela de pagos al momento de la donación. La plataforma se conecta directamente a las pasarelas procesadoras de dinero autorizadas (Cybersource de Visa y ATC Red Enlace). El cobro al DONANTE se efectúa en el monto exacto y moneda seleccionada por este (Bolivianos o Dólares Estadounidenses) según esté habilitado en el checkout.
                  </p>
                  <p>
                    <strong>3.2 Tipo de Cambio y Comisiones del Banco Emisor:</strong> Si el DONANTE realiza su aporte utilizando una tarjeta internacional o de una cuenta denominada en una divisa distinta a la moneda de cobro de la donación, el tipo de cambio, comisiones por conversión cambiaria de divisas y tasas de procesamiento internacional (cross-border fees) son determinados de forma exclusiva y unilateral por el banco emisor del DONANTE o la red de su tarjeta (Visa, Mastercard, Amex, etc.). La FUNDACIÓN y el PROVEEDOR tecnológico (DarkoSync) no aplican ningún tipo de cambio, conversión cambiaria o comisión de conversión al donante en el checkout, ni perciben ingresos de ello.
                  </p>
                  <p>
                    <strong>3.3 Exclusión de Responsabilidad Cambiaria:</strong> La regla del Tipo de Cambio Oficial del Banco Central de Bolivia (BCB) pactada en la relación B2B (Anexo &apos;A&apos;) es un estándar utilizado estrictamente para la facturación interna y el cálculo administrativo de comisiones entre DarkoSync y la FUNDACIÓN por el uso de la plataforma. Dicha tasa no tiene relación alguna con los cobros en tiempo real aplicados al DONANTE por su banco. El DONANTE libera de toda responsabilidad cambiaria y financiera a la FUNDACIÓN y al PROVEEDOR (DarkoSync) ante cualquier diferencia, cobro o retención adicional que aparezca en su extracto bancario derivado de la conversión de moneda realizada por su propia entidad bancaria emisora.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 4 */}
              <section className="space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  SECCIÓN 4.- (DESLINDE ABSOLUTO DE RESPONSABILIDAD E INVISIBILIDAD JURÍDICA DE DARKO-SYNC)
                </h3>
                <div className="space-y-2.5 pl-3 border-l-2 border-slate-200">
                  <p>
                    <strong>4.1 Delimitación de Roles Operativos y Tecnológicos:</strong> El DONANTE declara conocer de forma expresa y aceptar que DarkoSync (representada de forma unipersonal) es una empresa de tecnología absolutamente independiente y ajena a la relación de beneficencia celebrada entre el DONANTE y la FUNDACIÓN. El PROVEEDOR actúa única y exclusivamente como el desarrollador y arrendador de la infraestructura de software multi-tenant en la nube de Donatio SaaS. En consecuencia, DarkoSync NO es una entidad de intermediación financiera, no realiza captación de ahorro público, no custodia fondos, no es una pasarela de pagos ni opera como agregador de cobros.
                  </p>
                  <p>
                    <strong>4.2 Límite de Responsabilidad Tecnológica:</strong> Bajo ninguna circunstancia DarkoSync, su propietario, ingenieros, desarrolladores o colaboradores asumirán responsabilidad civil, penal o administrativa ante el DONANTE por: a) Fallas técnicas, cortes de servidor, denegaciones de servicio (DDoS), caídas de red o retrasos en el procesamiento o liquidación de fondos imputables a la pasarela de pagos de ATC S.A. o sus sistemas de Códigos QR; b) Errores de comunicación, fallas de autenticación o rechazos transaccionales en el protocolo de seguridad CyberSource 3D Secure / 3DS2 operado por redes de tarjetas o bancos emisores; c) Disputas referentes al destino de las donaciones recaudadas, el cumplimiento de programas benéficos de la FUNDACIÓN o la emisión de certificados de exención impositiva. Todo reclamo financiero o administrativo deberá canalizarse directamente ante la FUNDACIÓN o ante el banco emisor de la tarjeta.
                  </p>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                POLÍTICA DE PRIVACIDAD, TRATAMIENTO DE DATOS Y USO DE INFORMACIÓN (BI)
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                Al amparo de lo establecido en los Artículos 21.2 (Derecho a la Intimidad y Privacidad) y 130 (Acción de Protección de Privacidad) de la Constitución Política del Estado Plurinacional de Bolivia, el Artículo 56 de la reglamentación de la Ley N° 164 (Decreto Supremo N° 1793) y los Estándares de Protección de Datos Personales de la Red Iberoamericana de Protección de Datos (RIPD), la FUNDACIÓN y el PROVEEDOR se comprometen a resguardar la privacidad e intimidad de su información mediante las siguientes directrices de seguridad lógica:
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    1. Responsable del Tratamiento de Datos Identificables:
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    La FUNDACIÓN es la única propietaria, titular y Responsable del Tratamiento de las bases de datos personales recopiladas en la plataforma de recaudación. La FUNDACIÓN captura de forma directa los datos personales identificables del DONANTE (nombres, correos, números de C.I., números de teléfono y datos de contacto) necesarios para fines de emisión de recibos oficiales de donación y contacto institucional.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    2. Encargado del Tratamiento:
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    El PROVEEDOR tecnológico (DarkoSync) actúa estrictamente en calidad de Encargado del Tratamiento por cuenta de la FUNDACIÓN, de conformidad con lo establecido por el Decreto Supremo N° 1793. DarkoSync no utiliza, no cede, no comercializa ni trata los datos personales identificables de los DONANTES para fines propios ni de terceros, y los almacena de forma lógica separada en su infraestructura en la nube.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    3. Autorización de Tratamiento Estadístico (Business Intelligence) y Exclusión de Datos Sensibles:
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    El DONANTE otorga su consentimiento previo, informado y expreso para que el PROVEEDOR (DarkoSync) realice tratamientos técnicos sobre la generalidad de los datos lógicos generados en el uso de la plataforma, consistentes en metadatos agregados, logs de rendimiento e información de telemetría inalterable de transacciones, con fines de Business Intelligence (BI) y optimización tecnológica. Queda expresamente pactado que DarkoSync no recopila, no almacena ni realiza tratamiento de datos de carácter sensible, entendiéndose por tales los datos financieros de las tarjetas (PAN, fecha de vencimiento, CVV, PIN), los cuales se procesan mediante tecnología de tokenización directa provista por las pasarelas bancarias asociadas (Cybersource/ATC) sin pasar por los servidores del PROVEEDOR. Todo dato personal identificable que sea sometido a análisis de Business Intelligence o monetización estadística con terceros será sometido previamente a procesos informáticos de anonimización irreversibles e independientes, de conformidad con los estándares de la RIPD, asegurando la imposibilidad absoluta de reidentificación.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    4. Medidas de Seguridad Lógica (PostgreSQL RLS):
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    Para garantizar el secreto de la información conforme al Artículo 56.e del Decreto Supremo N° 1793, la plataforma implementa tecnología de Row Level Security (RLS) a nivel de la base de datos PostgreSQL, asegurando el aislamiento lógico estricto de los registros de la FUNDACIÓN frente a otros clientes multi-tenant. Todo el flujo de datos transaccionales e información entre el dispositivo del DONANTE y la plataforma viaja encriptado ininterrumpidamente bajo protocolos seguros HTTPS/TLS gestionados por la red de entrega de contenido de Cloudflare.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    5. Ejercicio de Derechos ARCO:
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    El DONANTE podrá ejercer de forma gratuita y en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) de conformidad con el marco constitucional e internacional aplicable. Para el ejercicio de estos derechos, el DONANTE deberá remitir una solicitud escrita dirigida al Responsable del Tratamiento (la FUNDACIÓN) a través del correo de soporte{' '}
                    <a href={`mailto:${supportEmail}`} className="font-bold text-[var(--tenant-primary)] underline">
                      {supportEmail}
                    </a>. El PROVEEDOR (DarkoSync) únicamente procesará solicitudes de borrado o rectificación en la base de datos de PostgreSQL bajo instrucción técnica formal, expresa y por escrito remitida por los canales administrativos autorizados de la FUNDACIÓN.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Soporte oficial: </span>
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

  return createPortal(modalContent, document.body);
};
