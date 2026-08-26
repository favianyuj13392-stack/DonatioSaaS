import React from 'react';
import { CreditCard, Lock, Calendar, User, ShieldCheck } from 'lucide-react';

export interface CardFormData {
  cardNumber: string;
  expiration: string;
  cvv: string;
  cardholderName: string;
  isInternational: boolean;
  department: string;
  stateProvince: string;
  country: string;
  locality: string;
  address1: string;
  postalCode: string;
}

interface AtcCreditCardFormProps {
  cardData: CardFormData;
  onChange: (data: CardFormData) => void;
  disabled?: boolean;
}

const BOLIVIAN_DEPARTMENTS = [
  { code: 'L', name: 'La Paz' },
  { code: 'S', name: 'Santa Cruz' },
  { code: 'C', name: 'Cochabamba' },
  { code: 'H', name: 'Chuquisaca (Sucre)' },
  { code: 'T', name: 'Tarija' },
  { code: 'P', name: 'Potosí' },
  { code: 'O', name: 'Oruro' },
  { code: 'B', name: 'Beni' },
  { code: 'N', name: 'Pando' },
];

export const AtcCreditCardForm: React.FC<AtcCreditCardFormProps> = ({
  cardData,
  onChange,
  disabled = false,
}) => {
  // Formatear número de tarjeta con espacios cada 4 dígitos
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    onChange({ ...cardData, cardNumber: formatted });
  };

  // Formatear fecha de expiración MM/AA
  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    onChange({ ...cardData, expiration: raw });
  };

  // Formatear CVV
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    onChange({ ...cardData, cvv: raw });
  };

  const isMastercard = cardData.cardNumber.replace(/\s+/g, '').startsWith('5');

  return (
    <div className="space-y-4">
      {/* 1. Selector de Origen de la Tarjeta (Bolivia vs Internacional) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Origen de la Tarjeta
          </label>
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...cardData, isInternational: false, country: 'BO' })}
              className={`px-3 py-1 rounded-md transition-all ${
                !cardData.isInternational
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇧🇴 Bolivia
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...cardData, isInternational: true, country: 'US' })}
              className={`px-3 py-1 rounded-md transition-all ${
                cardData.isInternational
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 Internacional
            </button>
          </div>
        </div>

        {!cardData.isInternational ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Departamento
              </label>
              <select
                value={cardData.department}
                onChange={(e) => onChange({ ...cardData, department: e.target.value })}
                disabled={disabled}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
              >
                {BOLIVIAN_DEPARTMENTS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Dirección (Opcional)
              </label>
              <input
                type="text"
                value={cardData.address1}
                onChange={(e) => onChange({ ...cardData, address1: e.target.value })}
                disabled={disabled}
                placeholder="Calle, avenida o zona"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                País (ISO)
              </label>
              <input
                type="text"
                value={cardData.country}
                onChange={(e) => onChange({ ...cardData, country: e.target.value.toUpperCase() })}
                disabled={disabled}
                placeholder="US, AR, ES"
                maxLength={2}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs uppercase font-medium text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Estado / Región
              </label>
              <input
                type="text"
                value={cardData.stateProvince}
                onChange={(e) => onChange({ ...cardData, stateProvince: e.target.value })}
                disabled={disabled}
                placeholder="FL, Madrid, etc."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                value={cardData.postalCode}
                onChange={(e) => onChange({ ...cardData, postalCode: e.target.value })}
                disabled={disabled}
                placeholder="33101"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Nombre del Titular */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Nombre Completo del Titular
        </label>
        <div className="relative">
          <input
            type="text"
            value={cardData.cardholderName}
            onChange={(e) => onChange({ ...cardData, cardholderName: e.target.value })}
            disabled={disabled}
            placeholder="JUAN PEREZ"
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm uppercase font-semibold text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
            required
          />
          <div className="absolute right-3.5 top-3 text-slate-400">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Número de Tarjeta */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-slate-700">
            Número de Tarjeta
          </label>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {isMastercard ? 'Mastercard' : 'Visa / Débito'}
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={cardData.cardNumber}
            onChange={handleCardNumberChange}
            disabled={disabled}
            placeholder="4000 1234 5678 9010"
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider font-semibold text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
            required
          />
          <div className="absolute right-3.5 top-3 text-slate-400">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. Expiración y CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Vencimiento (MM/AA)
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardData.expiration}
              onChange={handleExpirationChange}
              disabled={disabled}
              placeholder="12/28"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-center font-semibold text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
              required
            />
            <div className="absolute right-3.5 top-3 text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            CVV / CVC
          </label>
          <div className="relative">
            <input
              type="password"
              value={cardData.cvv}
              onChange={handleCvvChange}
              disabled={disabled}
              placeholder="123"
              maxLength={4}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-center font-semibold text-slate-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
              required
            />
            <div className="absolute right-3.5 top-3 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Tus datos viajan cifrados y nunca se almacenan en servidores locales.</span>
      </div>
    </div>
  );
};
