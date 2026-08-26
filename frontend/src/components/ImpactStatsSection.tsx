import React from 'react';
import { useTenant } from '../context/TenantContext';
import { Award, Users, Receipt, Lock } from 'lucide-react';

export const ImpactStatsSection: React.FC = () => {
  const { tenant } = useTenant();

  const stats = [
    {
      icon: Users,
      value: 'Miles',
      label: 'De Vidas Impactadas',
      desc: `Gracias a los donantes y socios que confían en ${tenant?.name || 'la fundación'}.`,
    },
    {
      icon: Lock,
      value: '256-bit',
      label: 'Seguridad Bancaria',
      desc: 'Cifrado de nivel bancario y tokenización segura en Cybersource TMS.',
    },
    {
      icon: Receipt,
      value: 'Inmediato',
      label: 'Recibo Oficial',
      desc: 'Generación instantánea de comprobante de donación con referencia bancaria única.',
    },
    {
      icon: Award,
      value: '100%',
      label: 'Auditoría Continua',
      desc: 'Rendición de cuentas periódica y apego estricto a las normas bolivianas.',
    },
  ];

  return (
    <section id="impacto" className="py-16 sm:py-20 bg-gray-50/50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Transparencia, Confianza y Compromiso
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Cada aporte cuenta. Construimos una relación de absoluta claridad con nuestros donantes y socios.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-3 text-center sm:text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-tenant-light text-tenant-primary flex items-center justify-center font-bold mx-auto sm:mx-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-gray-900">{stat.value}</span>
                  <span className="block text-sm font-bold text-gray-800">{stat.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
