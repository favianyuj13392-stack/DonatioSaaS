import React from 'react';
import { useViewportEntry, useViewportProgress } from '../hooks/useJournalMotion';
import { parseMetricNumber } from '../utils/metricNumber';

interface MetricProps {
  value: string;
  numericValue?: number;
  formatValue?: (value: number) => string;
}

function CountingMetric({ value, numericValue, formatValue }: Required<MetricProps>) {
  const { ref, fraction } = useViewportProgress<HTMLSpanElement>(value + '|' + numericValue);
  return <span ref={ref} className="journal-count">
    <span className="journal-sr-only">{value}</span>
    <span aria-hidden="true" data-count-value>{fraction === 1 ? value : formatValue(numericValue * fraction)}</span>
  </span>;
}

export function AnimatedMetric({ value, numericValue, formatValue }: MetricProps) {
  const parsed = numericValue === undefined ? parseMetricNumber(value) : null;
  const target = numericValue ?? parsed?.value;
  const format = formatValue ?? parsed?.format;
  if (target === undefined || !Number.isFinite(target) || !format) return <span>{value}</span>;
  return <CountingMetric value={value} numericValue={target} formatValue={format} />;
}

interface RevealProps {
  identity: string;
  index: number;
  className: string;
  children: React.ReactNode;
}

export function MotionReveal({ identity, index, className, children }: RevealProps) {
  const { ref, visible } = useViewportEntry<HTMLElement>(identity);
  const style = { '--journal-reveal-delay': Math.min(index, 6) * 100 + 'ms' } as React.CSSProperties;
  return <article ref={ref} className={className + ' journal-motion-reveal'} style={style} data-motion-pending={!visible}>
    {children}
  </article>;
}
