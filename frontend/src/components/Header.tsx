import React from 'react';
import { useTenant } from '../context/TenantContext';
import { ShieldCheck, Heart } from 'lucide-react';

export const Header: React.FC = () => {
  const { tenant } = useTenant();

  if (!tenant) return null;

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo e Identidad de la Fundación */}
        <div className="flex items-center space-x-3">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-10 w-10 object-contain rounded-full shadow-sm border border-gray-100"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-tenant-light flex items-center justify-center text-tenant-primary font-bold text-lg">
              {tenant.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
              {tenant.name}
            </h1>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500 inline fill-red-500" /> Causa Solidaria Verificada
            </span>
          </div>
        </div>

        {/* Insignia de Seguridad Bancaria */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Pago Seguro SSL / <strong>ATC Red Enlace</strong></span>
        </div>
      </div>
    </header>
  );
};
