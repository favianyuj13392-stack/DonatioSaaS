import React from 'react';
import { useTenant } from '../context/TenantContext';
import { Heart, ArrowRight } from 'lucide-react';

export const CampaignsListPage: React.FC = () => {
  const { tenant, campaignsList, navigateToCampaign, navigateToHome } = useTenant();

  if (!tenant) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold badge-tenant">
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>Causas Activas</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Nuestras Campañas Solidarias
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Conoce todas las iniciativas activas de <strong>{tenant.name}</strong> y elige a qué causa destinar tu aporte.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaignsList.map((c) => {
          const pct = c.monetary_goal > 0 ? Math.min(100, Math.round((c.current_amount / c.monetary_goal) * 100)) : 0;
          return (
            <div
              key={c.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                <img
                  src={c.banner_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80'}
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs">
                    Activa
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <h2 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-[var(--tenant-primary)] transition">
                    {c.title}
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                    {c.headline || c.description}
                  </p>
                </div>

                {c.monetary_goal > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Recaudado</span>
                      <span className="text-slate-900">Bs. {c.current_amount.toLocaleString('es-BO')}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full progress-bar-tenant"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>Meta: Bs. {c.monetary_goal.toLocaleString('es-BO')}</span>
                      <span className="text-[var(--tenant-primary)] font-black">{pct}%</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigateToCampaign(c.slug)}
                  className="btn-tenant-primary w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md transition"
                >
                  <span>Apoyar esta causa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-6">
        <button
          type="button"
          onClick={navigateToHome}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition underline underline-offset-4"
        >
          ← Volver a la página principal
        </button>
      </div>
    </div>
  );
};
