import React from 'react';
import { useTenant } from '../context/TenantContext';
import { HeartHandshake, Eye, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

export const AboutUsSection: React.FC = () => {
  const { tenant } = useTenant();

  if (!tenant) return null;

  const missionText = tenant.mission || 'Canalizar ayuda integral, tratamientos médicos y albergue digno a familias de escasos recursos en Bolivia.';
  const visionText = tenant.vision || 'Consolidar una red sostenible de padrinos que garantice que ningún niño abandone su tratamiento médico por falta de recursos.';
  const metrics = tenant.institutional_metrics && tenant.institutional_metrics.length > 0
    ? tenant.institutional_metrics
    : [
        { value: '+450', label: 'Niños Atendidos' },
        { value: '8 Años', label: 'De Trayectoria' },
        { value: '100%', label: 'Auditoría Transparente' },
      ];

  return (
    <section id="nosotros" className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contenedor Oscuro de Alta Gama Integrado */}
        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden relative border border-slate-800">
          {/* Acento decorativo de fondo */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--tenant-primary)]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-12">
            {/* Cabecera y Misión / Visión en Layout Asimétrico */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nuestra Razón de Ser</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Comprometidos con transformar vidas en Bolivia
                </h2>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  En <strong>{tenant.name}</strong> trabajamos diariamente con vocación de servicio, transparencia inquebrantable y el respaldo de una comunidad solidaria.
                </p>
                {tenant.nit && (
                  <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>NIT Oficial Registrado: <strong className="text-white">{tenant.nit}</strong> ({tenant.location_city || 'Bolivia'})</span>
                  </div>
                )}
              </div>

              {/* Misión y Visión con tipografía editorial */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="border-l-2 border-[var(--tenant-primary)] pl-5 space-y-2">
                  <div className="flex items-center gap-2 text-[var(--tenant-primary)] font-extrabold text-sm uppercase tracking-wider">
                    <HeartHandshake className="w-4 h-4" /> Misión Solidaria
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {missionText}
                  </p>
                </div>

                <div className="border-l-2 border-blue-400 pl-5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-extrabold text-sm uppercase tracking-wider">
                    <Eye className="w-4 h-4" /> Visión de Futuro
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {visionText}
                  </p>
                </div>
              </div>
            </div>

            {/* Separador sutil */}
            <div className="border-t border-slate-800/80 pt-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                {metrics.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="block text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                      {m.value}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wide">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sello de Personería Legal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-900 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 inline shrink-0" />
                <span>Entidad civil legalmente constituida: {tenant.legal_name || tenant.name}</span>
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                {tenant.legal_id_details || 'Personería Jurídica Registrada'} • Homologado ATC Red Enlace
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
