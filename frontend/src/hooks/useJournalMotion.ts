import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const reducedQuery = '(prefers-reduced-motion: reduce)';
const getReducedMotion = () => typeof window === 'undefined' || !window.matchMedia || window.matchMedia(reducedQuery).matches;
const subscribeToMotion = (notify: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(reducedQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
export function useReducedMotion() {
  return useSyncExternalStore(subscribeToMotion, getReducedMotion, () => true);
}

/** Callback refs also observe sections mounted after optional API data arrives. */
export function useViewportEntry<T extends HTMLElement>(identity: string) {
  const [node, setNode] = useState<T | null>(null);
  const [entered, setEntered] = useState<{ node: T; identity: string } | null>(null);
  const reduced = useReducedMotion();
  const supported = typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';
  const visible = reduced || !supported || (entered?.node === node && entered?.identity === identity);
  useEffect(() => {
    if (!node) return;
    if (reduced || !supported) {
      setEntered({ node, identity });
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered({ node, identity });
        observer.disconnect();
      }
    }, { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, identity, reduced, supported]);
  return { ref: setNode, visible, reduced, supported };
}

export function useViewportProgress<T extends HTMLElement>(identity: string) {
  const { ref, visible, reduced, supported } = useViewportEntry<T>(identity);
  const [animation, setAnimation] = useState({ identity, fraction: 0 });
  const completed = useRef<string | null>(null);
  useEffect(() => {
    if (reduced || !supported) {
      completed.current = identity;
      setAnimation({ identity, fraction: 1 });
      return;
    }
    if (!visible || completed.current === identity) return;
    let frame = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const elapsed = Math.min(1, (now - start) / 1200);
      setAnimation({ identity, fraction: 1 - (1 - elapsed) ** 3 });
      if (elapsed < 1) frame = window.requestAnimationFrame(tick);
      else completed.current = identity;
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [identity, visible, reduced, supported]);
  const fraction = reduced || !supported ? 1
    : visible && animation.identity === identity ? animation.fraction : 0;
  return { ref, fraction };
}

/** Only the image is transformed; payment overlays never acquire a containing block. */
export function useImageParallax(identity: string) {
  const [frameNode, setFrameNode] = useState<HTMLElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const photo = imageRef.current;
    if (!frameNode || !photo) return;
    photo.style.transform = '';
    if (reduced || typeof window.IntersectionObserver !== 'function') return;
    let frame = 0;
    let listening = false;
    const travelNode = frameNode.closest<HTMLElement>('.journal-story') || frameNode;
    const update = () => {
      frame = 0;
      const bounds = travelNode.getBoundingClientRect();
      const travel = Math.max(1, window.innerHeight + bounds.height);
      const offset = Math.max(-12, Math.min(12, (window.innerHeight / 2 - bounds.top - bounds.height / 2) / travel * 24));
      photo.style.transform = 'translate3d(0, ' + offset.toFixed(2) + 'px, 0)';
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const stop = () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(frame);
      frame = 0;
      listening = false;
      photo.style.willChange = '';
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !listening) {
        listening = true;
        photo.style.willChange = 'transform';
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        schedule();
      } else if (!entry.isIntersecting) stop();
    });
    observer.observe(frameNode);
    return () => {
      observer.disconnect();
      stop();
      photo.style.transform = '';
    };
  }, [frameNode, identity, reduced]);
  return { frameRef: setFrameNode, imageRef };
}
