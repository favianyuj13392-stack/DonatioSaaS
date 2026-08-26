import React from 'react';
import { useTenant } from '../context/TenantContext';
import {
  Trees,
  Droplet,
  BookOpen,
  Heart,
  Pill,
  Shield,
  Users,
  Activity,
  Layers,
} from 'lucide-react';

function getProgramIcon(iconName?: string) {
  switch (iconName?.toLowerCase()) {
    case 'tree':
    case 'trees':
      return <Trees className="w-6 h-6" />;
    case 'droplet':
    case 'water':
      return <Droplet className="w-6 h-6" />;
    case 'book':
    case 'education':
      return <BookOpen className="w-6 h-6" />;
    case 'pill':
    case 'medical':
      return <Pill className="w-6 h-6" />;
    case 'shield':
      return <Shield className="w-6 h-6" />;
    case 'users':
      return <Users className="w-6 h-6" />;
    case 'heart':
      return <Heart className="w-6 h-6" />;
    default:
      return <Activity className="w-6 h-6" />;
  }
}

export const ProgramsSection: React.FC = () => {
  const { tenant } = useTenant();

  if (!tenant || !tenant.programs || tenant.programs.length === 0) {
    return null;
  }

  const programs = tenant.programs;

  const gridColsClass = programs.length === 2
    ? 'md:grid-cols-2 max-w-4xl mx-auto'
    : programs.length === 4
    ? 'sm:grid-cols-2 lg:grid-cols-4'
    : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section id="programas" className="py-16 sm:py-24 bg-slate-50/70 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-tenant">
            <Layers className="w-3.5 h-3.5" />
            <span>Nuestras Líneas de Acción</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Qué Hacemos
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Programas e iniciativas activas que transforman realidades y generan impacto medible en nuestra comunidad.
          </p>
        </div>

        {/* Grid Dinámico de Programas */}
        <div className={`grid grid-cols-1 ${gridColsClass} gap-8`}>
          {programs.map((prog, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 space-y-5 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xs group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: 'var(--tenant-primary)' }}
                >
                  {getProgramIcon(prog.icon)}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-[var(--tenant-primary)] transition">
                  {prog.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {prog.description}
                </p>
              </div>

              {prog.stat && (
                <div className="pt-3 border-t border-slate-100">
                  <span
                    className="text-xs font-black tracking-tight"
                    style={{ color: 'var(--tenant-primary)' }}
                  >
                    {prog.stat}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
