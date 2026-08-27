import React from 'react';

export interface CardFormData {
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  expiration: string;
  cvv: string;
  cardholderName: string;
  email: string;
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

export const BOLIVIAN_DEPARTMENTS = [
  { code: 'L', name: 'La Paz' },
  { code: 'S', name: 'Santa Cruz' },
  { code: 'C', name: 'Cochabamba' },
  { code: 'H', name: 'Chuquisaca (Sucre)' },
  { code: 'T', name: 'Tarija' },
  { code: 'O', name: 'Oruro' },
  { code: 'P', name: 'Potosí' },
  { code: 'B', name: 'Beni (Trinidad)' },
  { code: 'N', name: 'Pando (Cobija)' },
];

export const COUNTRIES = [
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'España' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Perú' },
  { code: 'MX', name: 'México' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CA', name: 'Canadá' },
  { code: 'DE', name: 'Alemania' },
  { code: 'FR', name: 'Francia' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'IT', name: 'Italia' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'VE', name: 'Venezuela' },
];

export const US_STATES = [
  { code: 'FL', name: 'Florida (FL)' },
  { code: 'CA', name: 'California (CA)' },
  { code: 'NY', name: 'New York (NY)' },
  { code: 'TX', name: 'Texas (TX)' },
  { code: 'IL', name: 'Illinois (IL)' },
  { code: 'WA', name: 'Washington (WA)' },
  { code: 'MA', name: 'Massachusetts (MA)' },
  { code: 'NJ', name: 'New Jersey (NJ)' },
  { code: 'PA', name: 'Pennsylvania (PA)' },
  { code: 'GA', name: 'Georgia (GA)' },
  { code: 'NC', name: 'North Carolina (NC)' },
  { code: 'VA', name: 'Virginia (VA)' },
  { code: 'OH', name: 'Ohio (OH)' },
  { code: 'MI', name: 'Michigan (MI)' },
  { code: 'AZ', name: 'Arizona (AZ)' },
  { code: 'CO', name: 'Colorado (CO)' },
  { code: 'MD', name: 'Maryland (MD)' },
  { code: 'NV', name: 'Nevada (NV)' },
  { code: 'OR', name: 'Oregon (OR)' },
  { code: 'UT', name: 'Utah (UT)' },
];

export const AtcCreditCardForm: React.FC<AtcCreditCardFormProps> = ({
  cardData,
  onChange,
  disabled = false,
}) => {
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    onChange({ ...cardData, cardNumber: formatted });
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    onChange({ ...cardData, cvv: raw });
  };

  return (
    <div className="space-y-4">
      {/* 1. Selector de Origen de Tarjeta: Bolivia vs Internacional */}
      <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-gray-700">Origen de la Tarjeta</label>
          <div className="flex bg-gray-200/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...cardData, isInternational: false, country: 'BO', department: cardData.department || 'L' })}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
                !cardData.isInternational
                  ? 'bg-[var(--tenant-primary)] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🇧🇴</span> Bolivia
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...cardData, isInternational: true, country: cardData.country === 'BO' ? 'US' : (cardData.country || 'US'), stateProvince: cardData.stateProvince || 'FL' })}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
                cardData.isInternational
                  ? 'bg-[var(--tenant-primary)] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🌐</span> Internacional
            </button>
          </div>
        </div>

        {!cardData.isInternational ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Departamento</label>
              <select
                value={cardData.department}
                onChange={(e) => onChange({ ...cardData, department: e.target.value })}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
              >
                {BOLIVIAN_DEPARTMENTS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Dirección (Opcional)</label>
              <input
                type="text"
                value={cardData.address1}
                onChange={(e) => onChange({ ...cardData, address1: e.target.value })}
                disabled={disabled}
                placeholder="Calle, avenida o zona"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">País</label>
                <select
                  value={cardData.country}
                  onChange={(e) => onChange({ ...cardData, country: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Estado / Provincia</label>
                {cardData.country === 'US' ? (
                  <select
                    value={cardData.stateProvince || 'FL'}
                    onChange={(e) => onChange({ ...cardData, stateProvince: e.target.value })}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
                  >
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={cardData.stateProvince}
                    onChange={(e) => onChange({ ...cardData, stateProvince: e.target.value })}
                    disabled={disabled}
                    placeholder="Estado o Provincia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white outline-none"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Ciudad / Localidad</label>
                <input
                  type="text"
                  value={cardData.locality}
                  onChange={(e) => onChange({ ...cardData, locality: e.target.value })}
                  disabled={disabled}
                  placeholder="Miami, Madrid, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Código Postal / Zip</label>
                <input
                  type="text"
                  value={cardData.postalCode}
                  onChange={(e) => onChange({ ...cardData, postalCode: e.target.value })}
                  disabled={disabled}
                  placeholder="90210, 28001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Dirección de Facturación (Opcional)</label>
              <input
                type="text"
                value={cardData.address1}
                onChange={(e) => onChange({ ...cardData, address1: e.target.value })}
                disabled={disabled}
                placeholder="Calle, número, depto."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Nombre Completo del Titular */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo del Titular</label>
        <input
          type="text"
          name="ccname"
          autoComplete="cc-name"
          required
          placeholder="JUAN PEREZ"
          value={cardData.cardholderName}
          onChange={(e) => onChange({ ...cardData, cardholderName: e.target.value.toUpperCase() })}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm uppercase font-semibold text-gray-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
        />
      </div>

      {/* 3. Correo Electrónico */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico (Requerido por el banco)</label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="juan@ejemplo.com"
          value={cardData.email}
          onChange={(e) => onChange({ ...cardData, email: e.target.value })}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
        />
      </div>

      {/* 4. Número de Tarjeta */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Número de Tarjeta</label>
        <input
          type="text"
          name="cardnumber"
          autoComplete="cc-number"
          required
          maxLength={19}
          placeholder="4000 0000 0000 1000"
          value={cardData.cardNumber}
          onChange={handleCardNumberChange}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono tracking-wider font-semibold text-gray-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
        />
      </div>

      {/* 5. Mes, Año y CVV */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Mes Venc.</label>
          <select
            name="ccexpmonth"
            autoComplete="cc-exp-month"
            value={cardData.expirationMonth}
            onChange={(e) => onChange({ ...cardData, expirationMonth: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const m = (i + 1).toString().padStart(2, '0');
              return (
                <option key={m} value={m}>
                  {m}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Año Venc.</label>
          <select
            name="ccexpyear"
            autoComplete="cc-exp-year"
            value={cardData.expirationYear}
            onChange={(e) => onChange({ ...cardData, expirationYear: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-[var(--tenant-primary)] outline-none"
          >
            {Array.from({ length: 10 }, (_, i) => {
              const y = (2026 + i).toString();
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">CVV / CVC</label>
          <input
            type="password"
            name="cvc"
            autoComplete="cc-csc"
            required
            maxLength={4}
            placeholder="123"
            value={cardData.cvv}
            onChange={handleCvvChange}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono text-center font-semibold text-gray-800 focus:ring-2 focus:ring-[var(--tenant-primary)] focus:border-transparent outline-none transition"
          />
        </div>
      </div>
    </div>
  );
};
