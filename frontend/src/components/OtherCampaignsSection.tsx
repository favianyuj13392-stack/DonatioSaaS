import React from 'react';
import { useTenant } from '../context/TenantContext';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';

export const OtherCampaignsSection: React.FC = () => {
  const { otherCampaigns, tenant, navigateToCampaign, navigateToCampaigns } = useTenant();

  if (!otherCampaigns || otherCampaigns.length === 0) {
    return null;
  }

  // Mostrar hasta 3 campañas por defecto
  const campaignsToShow = otherCampaigns.slice(0, 3);
  const isSingle = campaignsToShow.length === 1;
  const hasMore = otherCampaigns.length >= 3;

  return (
    <section id="campanas" className="py-16 sm:py-24 bg-slate-50/60 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Encabezado */}
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-tenant">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Otras Formas de Ayudar</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Conoce más causas activas de {tenant?.name}
          </h2>
          <p className="text-sm text-slate-600">
            Descubre otros proyectos solidarios y elige a qué causa destinar tu aporte.
          </p>
        </div>

        {/* Grid de Campañas */}
        <div
          className={
            isSingle
              ? 'flex justify-center max-w-lg mx-auto'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'
          }
        >
          {campaignsToShow.map((c) => {
            const pct = c.monetary_goal > 0 ? Math.min(100, Math.round((c.current_amount / c.monetary_goal) * 100)) : 0;

            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between w-full group"
              >
                {c.banner_url && (
                  <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={c.banner_url}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        Campaña Activa
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-[var(--tenant-primary)] transition">
                      {c.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {c.description || 'Apoya esta iniciativa solidaria para seguir transformando vidas en Bolivia.'}
                    </p>
                  </div>

                  {c.monetary_goal > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-900 font-bold">
                          Bs. {c.current_amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-400">
                          Meta: Bs. {c.monetary_goal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 progress-bar-tenant"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-right text-[11px] font-black" style={{ color: 'var(--tenant-primary)' }}>
                        {pct}% alcanzado
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigateToCampaign(c.slug)}
                      className="btn-tenant-primary w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold shadow-2xs transition-all active:scale-[0.99]"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>Ver Causa y Donar</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA "Ver todas las campañas" si hay más de 2 causas */}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={navigateToCampaigns}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-300 shadow-2xs transition"
            >
              <span>Ver todas las campañas activas</span>
              <ArrowRight className="w-4 h-4 text-[var(--tenant-primary)]" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
