const DEFAULT_CURRENCY_CODE = 'INR';

const normalizeCurrencyCode = (currencyCode?: string | null): string => {
  const normalized = currencyCode?.trim().toUpperCase();
  return normalized || DEFAULT_CURRENCY_CODE;
};

export const formatCurrencyAmount = (
  amount: number,
  currencyCode?: string | null,
  locale = 'en-US'
): string => {
  if (!Number.isFinite(amount)) {
    return '-';
  }

  const resolvedCurrency = normalizeCurrencyCode(currencyCode);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: resolvedCurrency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${resolvedCurrency} ${amount.toLocaleString(locale)}`;
  }
};
