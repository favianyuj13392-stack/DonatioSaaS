import { useEffect, useState } from 'react';

interface UseCountUpOptions {
  target: number;
  duration?: number; // ms
  enabled?: boolean;
}

export function useCountUp({ target, duration = 1500, enabled = false }: UseCountUpOptions): string {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled || target <= 0) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, enabled]);

  return value.toLocaleString('es-BO');
}
