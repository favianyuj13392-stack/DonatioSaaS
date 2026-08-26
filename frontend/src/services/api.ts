import {
  TenantInstitutionalResponse,
  CampaignDetailResponse,
  CampaignListResponse,
  CheckoutPayload,
  QrResponse,
  ReactivationData,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Resuelve el subdominio del tenant actual desde el hostname o query params para desarrollo local.
 */
export function resolveSubdomain(): string {
  // 1. Soporte para desarrollo local: ?tenant=vfuturo o ?tenant=esperanza
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }

  // 2. Extracción desde Hostname (ej: esperanza.donatio.lat o vfuturo.donatio.lat)
  const host = window.location.hostname;
  const parts = host.split('.');

  if (parts.length >= 3 && parts[0] !== 'api' && parts[0] !== 'www') {
    return parts[0];
  }

  // Subdominio por defecto para staging/local
  return 'esperanza';
}

/**
 * Encabezados base para peticiones hacia el backend con identificación de tenant.
 */
function getHeaders(subdomain: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Tenant-Subdomain': subdomain,
  };
}

/**
 * Consulta la información institucional completa del tenant (Homepage).
 */
export async function fetchPublicTenant(subdomain: string): Promise<TenantInstitutionalResponse> {
  const url = `${API_BASE_URL}/public/tenants/${subdomain}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(subdomain),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Error al cargar la fundación (${response.status})`);
  }

  return response.json();
}

/**
 * Consulta el listado de campañas activas del tenant (Catálogo).
 */
export async function fetchPublicCampaigns(subdomain: string): Promise<CampaignListResponse> {
  const url = `${API_BASE_URL}/public/tenants/${subdomain}/campaigns`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(subdomain),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Error al cargar campañas (${response.status})`);
  }

  return response.json();
}

/**
 * Consulta el detalle de una campaña específica del tenant.
 */
export async function fetchPublicCampaign(subdomain: string, slug?: string): Promise<CampaignDetailResponse> {
  const campaignSlug = slug || 'default';
  const url = `${API_BASE_URL}/public/tenants/${subdomain}/campaigns/${campaignSlug}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(subdomain),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || `No se pudo cargar la campaña (${response.status})`);
  }

  return response.json();
}

/**
 * Paso 1: Inicia la sesión 3DS2 con Cybersource (Cardinal Cruise).
 */
export async function setup3dsSession(subdomain: string, cardData?: any): Promise<{ merchant_reference_number: string; data: any }> {
  const response = await fetch(`${API_BASE_URL}/donations/3ds-setup`, {
    method: 'POST',
    headers: getHeaders(subdomain),
    body: JSON.stringify(cardData || {}),
  });

  if (!response.ok) {
    throw new Error('Error al inicializar sesión 3DS2');
  }

  return response.json();
}

/**
 * Paso 3: Evalúa el enrolamiento 3DS2 del pagador (Check Enrollment).
 */
export async function check3dsEnrollment(subdomain: string, payload: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/donations/3ds-enrollment`, {
    method: 'POST',
    headers: getHeaders(subdomain),
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || 'Error al autenticar la tarjeta con el banco.');
  }

  return result;
}

/**
 * Paso 5: Valida la resolución del desafío Step-Up.
 */
export async function validate3dsChallenge(subdomain: string, payload: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/donations/3ds-validate`, {
    method: 'POST',
    headers: getHeaders(subdomain),
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || 'Error al validar el desafío 3DS.');
  }

  return result;
}

/**
 * Paso 6: Procesa la donación con tarjeta de crédito o débito.
 */
export async function submitCheckout(subdomain: string, payload: CheckoutPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/donations/checkout`, {
    method: 'POST',
    headers: getHeaders(subdomain),
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || 'Error al procesar la donación');
  }

  return result;
}

/**
 * Genera un código QR dinámico de ATC.
 */
export async function generateQrDonation(subdomain: string, payload: any): Promise<QrResponse> {
  const response = await fetch(`${API_BASE_URL}/donations/qr-generate`, {
    method: 'POST',
    headers: getHeaders(subdomain),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Error al generar código QR');
  }

  return response.json();
}

/**
 * Consulta el estado de pago del código QR (Polling).
 */
export async function checkQrStatus(donationId: number): Promise<{ status: string; receipt_url?: string }> {
  const response = await fetch(`${API_BASE_URL}/donations/${donationId}/qr-status`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Error al consultar estado del QR');
  }

  return response.json();
}

/**
 * Valida un token UUID de reactivación de socio (72h).
 */
export async function validateReactivationToken(token: string): Promise<ReactivationData> {
  const response = await fetch(`${API_BASE_URL}/public/subscriptions/validate-reactivation/${token}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'El enlace de reactivación no es válido');
  }

  return result;
}

/**
 * Confirma la reactivación 1-Click con la tarjeta tokenizada TMS guardada.
 */
export async function confirmSubscriptionReactivation(token: string, payload?: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/public/subscriptions/confirm-reactivation/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'No se pudo reactivar la suscripción');
  }

  return result;
}
