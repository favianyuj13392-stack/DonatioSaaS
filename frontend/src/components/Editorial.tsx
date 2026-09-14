import {
  BedDouble, GraduationCap, HandHeart, Heart, Home, Leaf, Package,
  Pill, ShieldCheck, Stethoscope, Users, Utensils, type LucideIcon,
} from 'lucide-react';
const editorialIcons: Record<string, LucideIcon> = {
  heart: Heart, handheart: HandHeart, users: Users, family: Users,
  home: Home, house: Home, bed: BedDouble, beddouble: BedDouble,
  stethoscope: Stethoscope, medical: Stethoscope, hospital: Stethoscope,
  pill: Pill, medicine: Pill, graduationcap: GraduationCap, education: GraduationCap,
  leaf: Leaf, package: Package, kit: Package, shieldcheck: ShieldCheck,
  utensils: Utensils, food: Utensils,
};
export function EditorialIcon({ name }: { name?: string | null }) {
  const key = typeof name === 'string' ? name.replace(/[-_\s]/g, '').toLowerCase() : '';
  const Icon = editorialIcons[key] || HandHeart;
  return <Icon size={28} strokeWidth={1.5} aria-hidden="true" />;
}

export function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
export function safeLink(value: unknown, fallback = '#donacion'): string {
  if (!hasText(value)) return fallback;
  const href = value.trim();
  if (/[\u0000-\u001f\u007f\\]/.test(href)) return fallback;
  if (href.startsWith('#') || /^\/(?!\/)/.test(href)) return href;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
  } catch { return fallback; }
}
export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
}
export function positiveNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}
