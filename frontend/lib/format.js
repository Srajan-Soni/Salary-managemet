export function formatMoney(amount, currency = 'USD', { compact = false } = {}) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    ...(compact ? { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 } : {}),
  }).format(amount);
}

export const formatUsd = (amount, opts) => formatMoney(amount, 'USD', opts);

export const formatNumber = (n) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('en-US').format(n));

/** Compact range label for histogram buckets, e.g. "$40K–$60K". */
export const bucketLabel = ({ from, to }) => `${formatUsd(from, { compact: true })}–${formatUsd(to, { compact: true })}`;