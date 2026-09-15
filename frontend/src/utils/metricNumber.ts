export interface MetricNumber {
  value: number;
  format: (value: number) => string;
}

/** Reject ambiguous separators and compound quantities rather than invent a locale. */
export function parseMetricNumber(original: string): MetricNumber | null {
  const match = /^([^\d]*)(\d(?:[\d., \u00a0\u202f]*\d)?)([^\d]*)$/u.exec(original);
  if (!match) return null;
  const [, prefix, token, suffix] = match;
  let integer = token;
  let decimals = '';
  let decimalSeparator = '';
  let groupingSeparator = '';
  const punctuation = token.match(/[.,]/g) || [];
  const hasBoth = token.includes('.') && token.includes(',');
  if (hasBoth) {
    const split = Math.max(token.lastIndexOf('.'), token.lastIndexOf(','));
    decimalSeparator = token[split];
    integer = token.slice(0, split);
    decimals = token.slice(split + 1);
    groupingSeparator = decimalSeparator === ',' ? '.' : ',';
  } else if (punctuation.length === 1) {
    const split = token.search(/[.,]/);
    const tail = token.slice(split + 1);
    // A lone "1.234" might mean 1234 or 1.234; leave it untouched.
    if (tail.length === 3 && !/[ \u00a0\u202f]/.test(token)) return null;
    decimalSeparator = token[split];
    integer = token.slice(0, split);
    decimals = tail;
  } else if (punctuation.length > 1) {
    groupingSeparator = punctuation[0] ?? '';
  }
  const spaces = integer.match(/[ \u00a0\u202f]/g);
  if (spaces) {
    if (groupingSeparator || spaces.some((space) => space !== spaces[0])) return null;
    groupingSeparator = spaces[0];
  }
  if (decimals && !/^\d{1,6}$/.test(decimals)) return null;
  if (decimalSeparator && !decimals) return null;
  let digits = integer;
  if (groupingSeparator) {
    const groups = integer.split(groupingSeparator);
    if (!/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some((group) => !/^\d{3}$/.test(group))) return null;
    digits = groups.join('');
  }
  if (!/^\d+$/.test(digits)) return null;
  const value = Number(digits + (decimals ? '.' + decimals : ''));
  if (!Number.isFinite(value) || !Number.isSafeInteger(Number(digits + decimals))) return null;
  return {
    value,
    format: (current) => {
      const [whole, fraction] = Math.max(0, current).toFixed(decimals.length).split('.');
      const grouped = groupingSeparator ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, groupingSeparator) : whole;
      return prefix + grouped + (decimals ? decimalSeparator + fraction : '') + suffix;
    },
  };
}
