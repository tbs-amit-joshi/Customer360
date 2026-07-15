import { Customer, CustomerProduct, CustomerRefund, CustomerDiscount, CustomerSegment, LeadStatus } from '../types';

interface ShopifyMoneyDto {
  amount?: number | string | null;
  currencyCode?: string | null;
}

interface ShopifyAddressDto {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  province?: string | null;
  provinceCode?: string | null;
  country?: string | null;
  countryCodeV2?: string | null;
  zip?: string | null;
  phone?: string | null;
}

interface ShopifyOrderLineItemDto {
  title?: string | null;
  quantity?: number | null;
  sku?: string | null;
  variantTitle?: string | null;
  originalUnitPriceSet?: {
    amount?: number | string | null;
    currencyCode?: string | null;
    shopMoney?: ShopifyMoneyDto | null;
  } | null;
  discountedUnitPriceSet?: {
    amount?: number | string | null;
    currencyCode?: string | null;
    shopMoney?: ShopifyMoneyDto | null;
  } | null;
  totalDiscountSet?: {
    amount?: number | string | null;
    currencyCode?: string | null;
    shopMoney?: ShopifyMoneyDto | null;
  } | null;
  variant?: {
    id?: string | null;
    price?: number | string | null;
  } | null;
  product?: {
    id?: string | null;
    handle?: string | null;
    productType?: string | null;
    vendor?: string | null;
  } | null;
}

interface ShopifyOrderDto {
  id?: string | null;
  name?: string | null;
  createdAt?: string | null;
  displayFinancialStatus?: string | null;
  paymentGatewayNames?: string[] | null;
  displayFulfillmentStatus?: string | null;
  lineItems?: ShopifyOrderLineItemDto[] | null;
  fulfillments?: unknown[] | null;
}

interface ShopifyCustomerDto {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  numberOfOrders?: number | null;
  amountSpent?: ShopifyMoneyDto | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  note?: string | null;
  tags?: string[] | null;
  verifiedEmail?: boolean | null;
  state?: string | null;
  taxExempt?: boolean | null;
  defaultAddress?: ShopifyAddressDto | null;
  addresses?: ShopifyAddressDto[] | null;
  orders?: ShopifyOrderDto[] | null;
}

interface ShopifyPageInfo {
  hasNextPage?: boolean;
  endCursor?: string | null;
}

interface ShopifyCustomerSyncResult {
  pageNo?: number;
  pageSize?: number;
  totalCustomerCount?: number | null;
  pageInfo?: ShopifyPageInfo | null;
  customers?: ShopifyCustomerDto[] | null;
}

interface ApiResponseEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
  data?: ShopifyCustomerSyncResult | null;
}

export interface CustomerSyncOptions {
  apiBaseUrl?: string;
  shopDomain?: string;
  storeId?: string;
  pageNo?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

const DEFAULT_SHOP_DOMAIN = 'tech-crm.myshopify.com';
const DEFAULT_STORE_ID = 'gid://shopify/Shop/75792154792';
const DEFAULT_PAGE_NO = 1;
const DEFAULT_PAGE_SIZE = 11;

const parseNumber = (value: number | string | null | undefined): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDateString = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().split('T')[0];
};

const titleCase = (value: string): string => {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getMoneyAmount = (money?: ShopifyMoneyDto | null): number => {
  return parseNumber(money?.amount) ?? 0;
};

const getMoneyAmountFromSet = (
  moneySet?: {
    amount?: number | string | null;
    shopMoney?: ShopifyMoneyDto | null;
  } | null
): number => {
  return getMoneyAmount(moneySet?.shopMoney) || parseNumber(moneySet?.amount) || 0;
};

const getCustomerName = (customer: ShopifyCustomerDto): string => {
  const firstName = customer.firstName?.trim() || '';
  const lastName = customer.lastName?.trim() || '';
  const combined = `${firstName} ${lastName}`.trim();
  return combined || customer.email?.trim() || customer.id?.trim() || 'Unknown Customer';
};

const getCustomerId = (customer: ShopifyCustomerDto, index: number): string => {
  if (customer.id?.trim()) {
    const rawId = customer.id.trim();
    const gidParts = rawId.split('/');
    return gidParts[gidParts.length - 1] || rawId;
  }

  return `SYNC-${String(index + 1).padStart(4, '0')}`;
};

const getShopifyNumericId = (value: string | null | undefined): string => {
  if (!value?.trim()) {
    return '-';
  }

  const rawId = value.trim();
  const gidParts = rawId.split('/');
  return gidParts[gidParts.length - 1] || rawId;
};

const getCustomerSegment = (customer: ShopifyCustomerDto, orderCount: number, totalSpend: number): CustomerSegment => {
  const tags = (customer.tags || []).map((tag) => tag.toLowerCase());

  if (tags.some((tag) => tag.includes('vip')) || totalSpend >= 150000) {
    return 'VIP';
  }

  if (orderCount >= 5 || totalSpend >= 50000) {
    return 'Regular';
  }

  if (orderCount > 0) {
    return 'New';
  }

  return 'Inactive';
};

const getLeadStatus = (orderCount: number): LeadStatus => {
  return orderCount > 0 ? 'Completed' : 'New';
};

const getCountryDisplay = (customer: ShopifyCustomerDto): string => {
  const country = customer.defaultAddress?.country?.trim() || '';
  const countryCode = customer.defaultAddress?.countryCodeV2?.trim() || '';

  if (country && countryCode) {
    return `${country} (${countryCode})`;
  }

  return country || countryCode || '-';
};

const getLocationDisplay = (customer: ShopifyCustomerDto): string => {
  const address1 = customer.defaultAddress?.address1?.trim() || '';
  const city = customer.defaultAddress?.city?.trim() || '';
  const zip = customer.defaultAddress?.zip?.trim() || '';

  const parts = [address1, city, zip].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '-';
};

const mapProductsFromOrders = (orders: ShopifyOrderDto[]): CustomerProduct[] => {
  const products: CustomerProduct[] = [];

  orders.forEach((order) => {
    (order.lineItems || []).forEach((lineItem) => {
      const quantity = lineItem.quantity ?? 1;
      const unitPrice =
        getMoneyAmountFromSet(lineItem.discountedUnitPriceSet) ||
        getMoneyAmountFromSet(lineItem.originalUnitPriceSet) ||
        parseNumber(lineItem.variant?.price) ||
        0;

      products.push({
        name: lineItem.title?.trim() || 'Product',
        productType: lineItem.product?.productType?.trim() || '-',
        vendor: lineItem.product?.vendor?.trim() || '-',
        orderId: order.name?.trim() || getShopifyNumericId(order.id) || '-',
        orderName: order.name?.trim() || '-',
        sku: lineItem.sku?.trim() || '-',
        variant: lineItem.variantTitle?.trim() || lineItem.product?.productType?.trim() || 'Default',
        qty: quantity,
        price: unitPrice
      });
    });
  });

  return products;
};

const mapOrderLineItems = (order: ShopifyOrderDto): CustomerProduct[] => {
  return (order.lineItems || []).map((lineItem) => {
    const quantity = lineItem.quantity ?? 1;
    const unitPrice =
      getMoneyAmountFromSet(lineItem.discountedUnitPriceSet) ||
      getMoneyAmountFromSet(lineItem.originalUnitPriceSet) ||
      parseNumber(lineItem.variant?.price) ||
      0;

    return {
      name: lineItem.title?.trim() || 'Product',
      productType: lineItem.product?.productType?.trim() || '-',
      vendor: lineItem.product?.vendor?.trim() || '-',
      orderId: order.name?.trim() || getShopifyNumericId(order.id) || '-',
      orderName: order.name?.trim() || '-',
      sku: lineItem.sku?.trim() || '-',
      variant: lineItem.variantTitle?.trim() || lineItem.product?.productType?.trim() || 'Default',
      qty: quantity,
      price: unitPrice
    };
  });
};

const mapOrders = (orders: ShopifyOrderDto[]): { orders: Customer['orders']; lastOrderDate: string } => {
  let lastOrderDate = '';

  const mappedOrders = orders
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .map((order, index) => {
      const createdDate = parseDateString(order.createdAt);
      if (createdDate > lastOrderDate) {
        lastOrderDate = createdDate;
      }

      const lineItems = mapOrderLineItems(order);
      const totalAmount = lineItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const orderName = order.name?.trim() || `Order ${index + 1}`;
      const financialStatus = (order.displayFinancialStatus || '').trim() || 'Pending';
      const fulfillmentStatus = (order.displayFulfillmentStatus || '').trim() || 'Pending';
      const orderId = getShopifyNumericId(order.id) || orderName;

      return {
        orderId,
        name: orderName,
        date: createdDate || parseDateString(order.createdAt) || '-',
        amount: totalAmount,
        status: financialStatus,
        paymentStatus: 'Pending',
        fulfillmentStatus,
        deliveryStatus: 'Pending',
        totalAmount,
        lineItems
      };
    });

  return {
    orders: mappedOrders,
    lastOrderDate: lastOrderDate || (mappedOrders[0]?.date ?? '')
  };
};

const normalizeApiUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const isApiResponseEnvelope = (
  payload: ApiResponseEnvelope | ShopifyCustomerSyncResult
): payload is ApiResponseEnvelope => {
  return typeof payload === 'object' && payload !== null && (
    'success' in payload ||
    'message' in payload ||
    'error' in payload ||
    'data' in payload
  );
};

export async function fetchCustomer360Customers(options: CustomerSyncOptions = {}): Promise<Customer[]> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || '');
  const shopDomain = options.shopDomain?.trim() || DEFAULT_SHOP_DOMAIN;
  const storeId = options.storeId?.trim() || DEFAULT_STORE_ID;
  const pageNo = options.pageNo ?? DEFAULT_PAGE_NO;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const query = new URLSearchParams();
  if (shopDomain) {
    query.set('shopDomain', shopDomain);
  }
  if (storeId) {
    query.set('storeId', storeId);
  }
  query.set('pageNo', String(pageNo));
  query.set('pageSize', String(pageSize));

  const requestPath = `/api/shopify/sync/customer-data?${query.toString()}`;
  const endpoint = apiBaseUrl ? new URL(requestPath, apiBaseUrl).toString() : requestPath;

  const response = await fetch(endpoint, {
    method: 'POST',
    signal: options.signal
  });

  const payload = (await response.json()) as ApiResponseEnvelope | ShopifyCustomerSyncResult;
  const normalized = isApiResponseEnvelope(payload) ? payload.data : payload;

  if (!response.ok) {
    const envelope = payload as ApiResponseEnvelope;
    throw new Error(envelope.error || envelope.message || `Customer sync request failed with status ${response.status}.`);
  }

  if (!normalized || !normalized.customers) {
    throw new Error('Customer sync response did not include customer rows.');
  }

  return normalized.customers.map((customer, index) => {
    const orders = customer.orders || [];
    const orderSummary = mapOrders(orders);
    const products = mapProductsFromOrders(orders);
    const totalSpend = parseNumber(customer.amountSpent?.amount) ?? 0;
    const orderCount = customer.numberOfOrders ?? orderSummary.orders.length;
    const customerName = getCustomerName(customer);
    const customerId = getCustomerId(customer, index);
    const lastOrderDate = orderSummary.lastOrderDate || '-';
    const country = getCountryDisplay(customer);
    const location = getLocationDisplay(customer);
    const leadStatus = getLeadStatus(orderCount);
    const segment = getCustomerSegment(customer, orderCount, totalSpend);

    return {
      id: customerId,
      name: customerName,
      email: customer.email?.trim() || '-',
      phone: customer.phone?.trim() || customer.defaultAddress?.phone?.trim() || '-',
      currencyCode: customer.amountSpent?.currencyCode?.trim() || undefined,
      country,
      location,
      lastLogin: '-',
      totalOrders: orderCount,
      totalSpend,
      lastOrderDate,
      leadNo: 'None',
      leadStatus,
      segment,
      orders: orderSummary.orders,
      products,
      complaints: [],
      refunds: [] as CustomerRefund[],
      discounts: [] as CustomerDiscount[],
      storeInfo: {
        joinedDate: parseDateString(customer.createdAt) || '-',
        notes: customer.note?.trim() || (customer.tags || []).join(', ') || 'Live customer data loaded from Shopify API.',
        lifecycleStage: titleCase(customer.state || 'active') || 'Active'
      }
    };
  });
}
