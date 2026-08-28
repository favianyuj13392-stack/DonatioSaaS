import { Tenant } from '../types';

/**
 * Convierte un color HEX (#RRGGBB o #RGB) a tupla RGB [r, g, b] (0-255).
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [5, 150, 105]; // fallback verde esmeralda
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calcula la luminancia relativa según WCAG 2.2.
 * Fórmula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determina el color de texto accesible (onColor) conforme a WCAG 2.2 AA (Ratio >= 4.5:1).
 * Si el fondo es claro retorna grafito oscuro (#0f172a), si es oscuro retorna blanco (#ffffff).
 */
export function getAccessibleTextColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = getRelativeLuminance(r, g, b);
  // Un luminance > 0.179 indica color claro que requiere texto oscuro para cumplir AA
  return luminance > 0.179 ? '#0f172a' : '#ffffff';
}

/**
 * Oscurece o aclara un color HEX en un porcentaje dado.
 */
export function adjustBrightness(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const adjust = (val: number) => Math.min(255, Math.max(0, Math.round(val * (1 + percent / 100))));
  const [nr, ng, nb] = [adjust(r), adjust(g), adjust(b)];
  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
}

/**
 * Genera e inyecta dinámicamente los tokens de diseño CSS en el :root del documento.
 */
export function applyTenantTheme(tenant: Partial<Tenant>): void {
  const root = document.documentElement;

  const primaryHex = tenant.primary_color || '#059669';
  const primaryHoverHex = tenant.primary_color_hover || adjustBrightness(primaryHex, -12);
  const secondaryHex = tenant.secondary_color || '#064e3b';

  const [pr, pg, pb] = hexToRgb(primaryHex);
  const [sr, sg, sb] = hexToRgb(secondaryHex);

  const onPrimary = getAccessibleTextColor(primaryHex);
  const onSecondary = getAccessibleTextColor(secondaryHex);

  // Inyección de tokens en CSS Custom Properties
  root.style.setProperty('--tenant-primary', primaryHex);
  root.style.setProperty('--tenant-primary-hover', primaryHoverHex);
  root.style.setProperty('--tenant-primary-soft', `rgba(${pr}, ${pg}, ${pb}, 0.10)`);
  root.style.setProperty('--tenant-primary-subtle', `rgba(${pr}, ${pg}, ${pb}, 0.05)`);
  root.style.setProperty('--tenant-primary-border', `rgba(${pr}, ${pg}, ${pb}, 0.25)`);
  root.style.setProperty('--tenant-on-primary', onPrimary);

  root.style.setProperty('--tenant-secondary', secondaryHex);
  root.style.setProperty('--tenant-secondary-soft', `rgba(${sr}, ${sg}, ${sb}, 0.08)`);
  root.style.setProperty('--tenant-on-secondary', onSecondary);

  root.style.setProperty('--tenant-surface', '#ffffff');
  root.style.setProperty('--tenant-surface-alt', '#f8fafc');
  root.style.setProperty('--tenant-border', '#e2e8f0');
}
