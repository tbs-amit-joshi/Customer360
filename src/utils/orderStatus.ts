export type OrderStatusCategory = 'order' | 'payment' | 'delivery';

export interface StatusBadgeMeta {
  label: string;
  className: string;
}

const STATUS_META: Record<OrderStatusCategory, Record<string, StatusBadgeMeta>> = {
  order: {
    UNFULFILLED: { label: 'Unfulfilled', className: 'bg-red-50 text-red-700 border-red-200' },
    PARTIALLY_FULFILLED: { label: 'Partially Fulfilled', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    FULFILLED: { label: 'Fulfilled', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    ON_HOLD: { label: 'On Hold', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    OPEN: { label: 'Open', className: 'bg-slate-50 text-slate-700 border-slate-200' },
    PENDING_FULFILLMENT: { label: 'Pending Fulfillment', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    REQUEST_DECLINED: { label: 'Request Declined', className: 'bg-red-50 text-red-700 border-red-200' },
    RESTOCKED: { label: 'Restocked', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    SCHEDULED: { label: 'Scheduled', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  },
  payment: {
    PENDING: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    AUTHORIZED: { label: 'Authorized', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    PARTIALLY_PAID: { label: 'Partially Paid', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PARTIALLY_REFUNDED: { label: 'Partially Refunded', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    REFUNDED: { label: 'Refunded', className: 'bg-slate-50 text-slate-700 border-slate-200' },
    VOIDED: { label: 'Voided', className: 'bg-red-50 text-red-700 border-red-200' },
    EXPIRED: { label: 'Expired', className: 'bg-red-50 text-red-700 border-red-200' }
  },
  delivery: {
    CONFIRMED: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    CARRIER_PICKED_UP: { label: 'Carrier Picked Up', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    IN_TRANSIT: { label: 'In Transit', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    ATTEMPTED_DELIVERY: { label: 'Attempted Delivery', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    DELAYED: { label: 'Delayed', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    DELIVERED: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELED: { label: 'Canceled', className: 'bg-red-50 text-red-700 border-red-200' },
    FAILURE: { label: 'Failure', className: 'bg-red-50 text-red-700 border-red-200' },
    FULFILLED: { label: 'Fulfilled', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }
};

export const normalizeStatusCode = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return value
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .toUpperCase();
};

export const getStatusBadgeMeta = (category: OrderStatusCategory, value?: string | null): StatusBadgeMeta | null => {
  const normalized = normalizeStatusCode(value);
  if (!normalized) {
    return null;
  }

  return STATUS_META[category][normalized] ?? null;
};

export const getKnownStatusCode = (category: OrderStatusCategory, value?: string | null): string => {
  const normalized = normalizeStatusCode(value);
  if (!normalized) {
    return '';
  }

  return STATUS_META[category][normalized] ? normalized : '';
};

