import React from 'react';
import { CalendarHeart, QrCode, HandHeart, ArrowRight } from 'lucide-react';

export const HowToHelpSection: React.FC = () => {
  const scrollToDonation = () => {
    const el = document.getElementById('donar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="como-ayudar" className="py-16 sm:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-tenant-primary bg-tenant-light">
            <HandHeart className="w-3.5 h-3.5" />
            <span>Formas de Participar</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Múltiples maneras de multiplicar la ayuda
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Tu solidaridad puede manifestarse a través de un aporte puntual, una membresía mensual o colaborando activamente en la difusión de nuestras campañas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Opción 1: Socio Recurrente (El pilar más valorado) */}
          <div className="bg-gradient-to-b from-pink-50/50 to-white rounded-3xl p-8 border-2 border-tenant-primary/30 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-tenant-primary text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              Más Recomendado
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-tenant-primary text-white flex items-center justify-center font-bold shadow-sm">
                <CalendarHeart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Socio Mensual Recurrente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Un débito mensual automático desde tu tarjeta Visa o Mastercard. Aporta estabilidad continua para sostener los proyectos mes a mes.
              </p>
            </div>
            <div className="pt-6">
              <button
                onClick={scrollToDonation}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-tenant-primary hover:opacity-95 shadow-sm transition-all cursor-pointer"
              >
                <span>Hacerme Socio Mensual</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Opción 2: Donación Única / QR Simple */}
          <div className="bg-gray-50/70 rounded-3xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Donación Única por QR o Tarjeta</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Realiza un aporte directo con tarjeta internacional o escaneando un código QR Simple desde cualquier aplicación bancaria boliviana.
              </p>
            </div>
            <div className="pt-6">
              <button
                onClick={scrollToDonation}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-all cursor-pointer"
              >
                <span>Donar por QR / Tarjeta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Opción 3: Alianzas y Voluntariado */}
          <div className="bg-gray-50/70 rounded-3xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <HandHeart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Alianzas y Voluntariado</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sumá a tu empresa, grupo de amigos o colegio. Apóyanos con voluntariado en terreno, donaciones corporativas o difusión solidaria.
              </p>
            </div>
            <div className="pt-6">
              <a
                href="#contacto"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
              >
                <span>Contáctanos</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
