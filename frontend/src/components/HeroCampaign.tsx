import React from 'react';
import { useTenant } from '../context/TenantContext';
import { Target, TrendingUp } from 'lucide-react';

export const HeroCampaign: React.FC = () => {
  const { campaign } = useTenant();

  if (!campaign) return null;

  return (
    <section id="causa" className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      {/* Banner de Campaña */}
      {campaign.banner_url && (
        <div className="relative h-48 sm:h-72 w-full overflow-hidden bg-gray-100">
          <img
            src={campaign.banner_url}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 text-white hidden sm:block">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Campaña Activa
            </span>
          </div>
        </div>
      )}

      {/* Contenido y Barra de Progreso */}
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug mb-3">
          {campaign.title}
        </h2>

        {campaign.description && (
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-line">
            {campaign.description}
          </p>
        )}

        {/* Barra de Progreso Financiero */}
        {campaign.monetary_goal > 0 && (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-tenant-primary" /> Recaudado
                </span>
                <span className="text-xl sm:text-2xl font-black text-gray-900">
                  Bs. {campaign.current_amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-end gap-1">
                  <Target className="w-3.5 h-3.5 text-gray-400" /> Meta
                </span>
                <span className="text-base sm:text-lg font-bold text-gray-500">
                  Bs. {campaign.monetary_goal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Barra Visual */}
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(100, campaign.progress_percentage)}%`,
                  backgroundColor: 'var(--tenant-primary)',
                }}
              />
            </div>

            <div className="mt-2 text-right">
              <span className="text-xs font-bold text-gray-700">
                {campaign.progress_percentage}% alcanzado
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
