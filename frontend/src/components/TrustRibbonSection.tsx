import React from 'react';
import { BadgeCheck, Landmark, LockKeyhole, MapPin } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

export const TrustRibbonSection: React.FC = () => {
  const { tenant, campaign, paymentProviders } = useTenant();

  if (!tenant) return null;

  const institutionalProof = tenant.institutional_metrics?.find(
    (metric) => metric.value?.trim() && metric.label?.trim(),
  );
  const hasLegalEvidence = Boolean(tenant.legal_name || tenant.legal_id_details || tenant.nit);
  const hasActiveCardProvider =
    campaign?.allowed_payment_methods !== 'qr_only' &&
    paymentProviders.some(
      (provider) =>
        provider.is_active &&
        /atc|cybersource|card|tarjeta/i.test(
          `${provider.name} ${provider.processor}`,
        ),
    );

  const proofItems = [
    {
      icon: BadgeCheck,
      eyebrow: hasLegalEvidence ? 'Identidad institucional' : 'Portal oficial',
      value: tenant.legal_name || tenant.name,
    },
    hasActiveCardProvider
      ? {
          icon: LockKeyhole,
          eyebrow: 'Donación protegida',
          value: 'Seguridad bancaria 3DS2',
        }
      : {
          icon: LockKeyhole,
          eyebrow: 'Procesamiento protegido',
          value: 'Canales habilitados por la organización',
        },
    institutionalProof
      ? {
          icon: Landmark,
          eyebrow: institutionalProof.label,
          value: institutionalProof.value,
        }
      : null,
    tenant.location_city
      ? {
          icon: MapPin,
          eyebrow: 'Impacto con presencia local',
          value: tenant.location_city,
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: React.ComponentType<{ className?: string }>;
    eyebrow: string;
    value: string;
  }>;

  return (
    <section className="trust-ribbon" aria-label="Garantías institucionales">
      <div className="trust-ribbon__track">
        {proofItems.map(({ icon: Icon, eyebrow, value }) => (
          <div key={`${eyebrow}-${value}`} className="trust-ribbon__item">
            <span className="trust-ribbon__icon" aria-hidden="true">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="trust-ribbon__eyebrow">{eyebrow}</span>
              <strong className="trust-ribbon__value">{value}</strong>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
