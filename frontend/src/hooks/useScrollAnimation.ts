import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useJournalMotion';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', triggerOnce = true } = options;
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();
  const observerAvailable = typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (reducedMotion || !observerAvailable) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, reducedMotion, observerAvailable]);

  return { ref, isVisible: reducedMotion || !observerAvailable || isVisible };
}
