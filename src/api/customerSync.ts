import { Customer, CustomerProduct, CustomerRefund, CustomerDiscount, CustomerSegment, LeadStatus,CustomerAbandonedCheckout } from '../types';
import { getKnownStatusCode, normalizeStatusCode } from '../utils/orderStatus';
import * as XLSX from 'xlsx';

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
  deliveredAt?: string | null;
  displayFinancialStatus?: string | null;
  paymentGatewayNames?: string[] | null;
  displayFulfillmentStatus?: string | null;
  totalPriceSet?: ShopifyAbandonedCheckoutMoneyDto | null;
  totalDiscountsSet?: ShopifyAbandonedCheckoutMoneyDto | null;
  refunds?: ShopifyOrderRefundDto[] | null;
  discountApplications?: ShopifyOrderDiscountApplicationDto[] | null;
  lineItems?: ShopifyOrderLineItemDto[] | null;
  fulfillments?: {
    displayStatus?: string | null;
    deliveredAt?: string | null;
  }[] | null;
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
  customerType?: CustomerSegment | string | null;
  defaultAddress?: ShopifyAddressDto | null;
  addresses?: ShopifyAddressDto[] | null;
  orders?: ShopifyOrderDto[] | null;
  abandonedCheckoutCount?: number | string | null;
  abandonedCheckoutsCount?: number | string | null;
  abandonedCheckouts?: ShopifyAbandonedCheckoutDto[] | null;
}

interface ShopifyRefundLineItemDto {
  quantity?: number | null;
  lineItem?: {
    id?: string | null;
    title?: string | null;
    sku?: string | null;
  } | null;
}
 
interface ShopifyRefundTransactionDto {
  id?: string | null;
  kind?: string | null;
  status?: string | null;
  gateway?: string | null;
  amountSet?: ShopifyAbandonedCheckoutMoneyDto | null;
}
 
interface ShopifyOrderRefundDto {
  id?: string | null;
  createdAt?: string | null;
  note?: string | null;
  totalRefundedSet?: ShopifyAbandonedCheckoutMoneyDto | null;
  refundLineItems?: ShopifyRefundLineItemDto[] | null;
  transactions?: ShopifyRefundTransactionDto[] | null;
}
 
interface ShopifyOrderDiscountApplicationDto {
  typeName?: string | null;
  allocationMethod?: string | null;
  targetSelection?: string | null;
  targetType?: string | null;
  amount?: number | string | null;
  currencyCode?: string | null;
  percentage?: number | string | null;
  code?: string | null;
  title?: string | null;
  description?: string | null;
}
 
interface ShopifyAbandonedCheckoutLineItemDto {
  title?: string | null;
  quantity?: number | null;
  variant?: {
    title?: string | null;
    price?: number | string | null;
  } | null;
}
 
interface ShopifyAbandonedCheckoutMoneyDto {
  amount?: number | string | null;
  currencyCode?: string | null;
}
 
interface ShopifyAbandonedCheckoutDto {
  id?: string | null;
  createdAt?: string | null;
  subtotalPriceSet?: ShopifyAbandonedCheckoutMoneyDto | null;
  totalPriceSet?: ShopifyAbandonedCheckoutMoneyDto | null;
  lineItems?: ShopifyAbandonedCheckoutLineItemDto[] | null;
  nextScheduleEmail?: string | null;
}

interface AbandonedCheckoutApiEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
  data?: ShopifyAbandonedCheckoutDto[] | null;
}
 
interface CustomerRefundsApiEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
  data?: {
    customer?: ShopifyCustomerDto | null;
    orders?: ShopifyOrderDto[] | null;
  } | null;
}
 
interface CustomerDiscountsApiEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
  data?: {
    customer?: ShopifyCustomerDto | null;
    orders?: ShopifyOrderDto[] | null;
  } | null;
}

interface ShopifyChartDetailsCustomerDto {
  customerName?: string | null;
  lifeSpend?: number | string | null;
  orderCount?: number | string | null;
  customerId?: string | null;
  segment?: CustomerSegment | string | null;
}

interface ShopifyChartDetailsRevenueDto {
  orderDate?: string | null;
  revenue?: number | string | null;
}

interface ShopifyChartDetailsDto {
  mostValuableCustomers?: ShopifyChartDetailsCustomerDto[] | null;
  highestOrderCustomers?: ShopifyChartDetailsCustomerDto[] | null;
  revenueAnalytics?: ShopifyChartDetailsRevenueDto[] | null;
}

export interface CustomerChartDetails {
  mostValuableCustomers: Array<{
    customerName: string;
    lifeSpend: number;
    customerId?: string;
    segment?: CustomerSegment | string;
  }>;
  highestOrderCustomers: Array<{
    customerName: string;
    orderCount: number;
    customerId?: string;
    segment?: CustomerSegment | string;
  }>;
  revenueAnalytics: Array<{
    orderDate: string;
    revenue: number;
  }>;
}

interface ShopifyPageInfo {
  hasNextPage?: boolean;
  endCursor?: string | null;
}

interface ShopifyCustomerSyncResult {
  pageNo?: number;
  pageSize?: number;
  totalCustomerCount?: number | null;
  totalcustomercount?: number | null;
  pageInfo?: ShopifyPageInfo | null;
  customers?: ShopifyCustomerDto[] | null;
}

interface ApiResponseEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
  data?: ShopifyCustomerSyncResult | null;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export interface CustomerSyncPageResult {
  customers: Customer[];
  totalCustomerCount: number;
  pageNo: number;
  pageSize: number;
}

export interface CustomerSyncOptions {
  apiBaseUrl?: string;
  shopDomain?: string;
  storeId?: string;
  pageNo?: number;
  pageSize?: number;
  customerType?: 'All' | CustomerSegment;
  customerNameOrId?: string;
  emailOrPhone?: string;
  country?: string;
  lifetimeSpend?: string | number;
  lifetimeSpendMin?: string | number;
  lifetimeSpendMax?: string | number;
  orderId?: string;
  orderDateFrom?: string;
  orderDateTo?: string;
  paymentStatus?: string;
  lastOrderDateFrom?: string;
  lastOrderDateTo?: string;
  lastLoginFrom?: string;
  lastLoginTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  deliveryFrom?: string;
  deliveryTo?: string;
  fulfillmentStatus?: string;
  deliveryStatus?: string;
  productName?: string;
  productVariant?: string;
  signal?: AbortSignal;
}

export interface CustomerExportOptions {
  apiBaseUrl?: string;
  shopDomain?: string;
  storeId?: string;
  type?: 'excel' | 'chart';
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
  signal?: AbortSignal;
}

export interface AbandonedCheckoutSyncOptions {
  apiBaseUrl?: string;
  shopDomain?: string;
  customerId: string;
  signal?: AbortSignal;
}
 
export interface CustomerRefundSyncOptions {
  apiBaseUrl?: string;
  shopDomain?: string;
  customerId: string;
  signal?: AbortSignal;
}
 
export interface CustomerDiscountSyncOptions {
  apiBaseUrl?: string;
  shopDomain?: string;
  storeId?: string;
  customerId: string;
  signal?: AbortSignal;
}

const DEFAULT_SHOP_DOMAIN = import.meta.env.VITE_CUSTOMER_SYNC_SHOP_DOMAIN?.trim() || 'tech-crm.myshopify.com';
const DEFAULT_STORE_ID = import.meta.env.VITE_CUSTOMER_SYNC_STORE_ID?.trim() || 'gid://shopify/Shop/75792154792';
const DEFAULT_EXPORT_FILE_NAME = 'shopify_chart_details_export.xlsx';
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

const getShopifyCurrencyCode = (
  moneySet?: ShopifyAbandonedCheckoutMoneyDto | null
): string | undefined => {
  return moneySet?.currencyCode?.trim() || undefined;
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

const normalizeCustomerType = (value?: string | null): CustomerSegment | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === 'VIP' || normalized === 'REGULAR' || normalized === 'NEW' || normalized === 'INACTIVE') {
    return normalized.charAt(0) + normalized.slice(1).toLowerCase() as CustomerSegment;
  }

  return undefined;
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

const getAbandonedCheckoutCount = (customer: ShopifyCustomerDto): number | undefined => {
  const directCount = parseNumber(customer.abandonedCheckoutCount);
  if (directCount !== undefined) {
    return directCount;
  }

  const pluralCount = parseNumber(customer.abandonedCheckoutsCount);
  if (pluralCount !== undefined) {
    return pluralCount;
  }

  if (Array.isArray(customer.abandonedCheckouts)) {
    return customer.abandonedCheckouts.length;
  }

  return undefined;
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
      const orderStatus = getKnownStatusCode('order', order.displayFulfillmentStatus);
      const paymentStatus = getKnownStatusCode('payment', order.displayFinancialStatus);
      const deliveryStatus = getKnownStatusCode(
        'delivery',
        order.fulfillments?.find((fulfillment) => normalizeStatusCode(fulfillment?.displayStatus))?.displayStatus
      );
      const deliveredAt =
        parseDateString(order.deliveredAt) ||
        parseDateString(order.fulfillments?.find((fulfillment) => normalizeStatusCode(fulfillment?.displayStatus))?.deliveredAt) ||
        '';
      const orderId = getShopifyNumericId(order.id) || orderName;

      return {
        orderId,
        name: orderName,
        date: createdDate || parseDateString(order.createdAt) || '-',
        deliveredAt,
        amount: totalAmount,
        status: orderStatus,
        paymentStatus,
        fulfillmentStatus: orderStatus,
        deliveryStatus,
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

const readApiBaseUrl = (): string => {
  return import.meta.env.VITE_CUSTOMER_SYNC_API_BASE_URL?.trim() || '';
};

const buildCustomerSyncEndpoint = (requestPath: string, apiBaseUrl: string): string => {
  return apiBaseUrl ? new URL(requestPath, apiBaseUrl).toString() : requestPath;
};

const buildCustomerSyncQuery = (options: {
  shopDomain: string;
  type?: 'excel' | 'chart';
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
  customerType?: 'All' | CustomerSegment;
  customerNameOrId?: string;
  emailOrPhone?: string;
  country?: string;
  lifetimeSpend?: string | number;
  orderId?: string;
  orderDateFrom?: string;
  orderDateTo?: string;
  paymentStatus?: string;
  lastOrderDateFrom?: string;
  lastOrderDateTo?: string;
  lastLoginFrom?: string;
  lastLoginTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  deliveryFrom?: string;
  deliveryTo?: string;
  fulfillmentStatus?: string;
  deliveryStatus?: string;
  productName?: string;
  productVariant?: string;
  pageNo?: number;
  pageSize?: number;
  lifetimeSpendMin?: string | number;
  lifetimeSpendMax?: string | number;
}): string => {
  const query = new URLSearchParams();

  if (options.shopDomain) {
    query.set('shopDomain', options.shopDomain);
  }

  if (options.type?.trim()) {
    query.set('type', options.type.trim());
  }
 
  if (options.dateFilter?.trim()) {
    query.set('dateFilter', options.dateFilter.trim());
  }
 
  if (options.startDate !== undefined) {
    query.set('startDate', options.startDate);
  }
 
  if (options.endDate !== undefined) {
    query.set('endDate', options.endDate);
  }

  if (options.customerType) {
    query.set('customerType', options.customerType);
  }

  if (options.customerNameOrId?.trim()) {
    query.set('customerNameOrId', options.customerNameOrId.trim());
  }

  if (options.emailOrPhone?.trim()) {
    query.set('emailOrPhone', options.emailOrPhone.trim());
  }

  if (options.country?.trim()) {
    query.set('country', options.country.trim());
  }

  if (options.lifetimeSpend !== undefined && options.lifetimeSpend !== null && `${options.lifetimeSpend}`.trim() !== '') {
    query.set('lifetimeSpend', String(options.lifetimeSpend).replace(/,/g, '').trim());
  }

  if (options.lifetimeSpendMin !== undefined && options.lifetimeSpendMin !== null && `${options.lifetimeSpendMin}`.trim() !== '') {
    query.set('lifetimeSpendMin', String(options.lifetimeSpendMin).replace(/,/g, '').trim());
  }

  if (options.lifetimeSpendMax !== undefined && options.lifetimeSpendMax !== null && `${options.lifetimeSpendMax}`.trim() !== '') {
    query.set('lifetimeSpendMax', String(options.lifetimeSpendMax).replace(/,/g, '').trim());
  }

  if (options.orderId?.trim()) {
    query.set('orderId', options.orderId.trim());
  }

  if (options.orderDateFrom?.trim()) {
    query.set('orderDateFrom', options.orderDateFrom.trim());
  }

  if (options.orderDateTo?.trim()) {
    query.set('orderDateTo', options.orderDateTo.trim());
  }

  if (options.paymentStatus?.trim()) {
    query.set('paymentStatus', options.paymentStatus.trim());
  }

  if (options.lastOrderDateFrom?.trim()) {
    query.set('LastOrderDateFrom', options.lastOrderDateFrom.trim());
  }

  if (options.lastOrderDateTo?.trim()) {
    query.set('LastOrderDateTo', options.lastOrderDateTo.trim());
  }

  if (options.lastLoginFrom?.trim()) {
    query.set('LastLoginFrom', options.lastLoginFrom.trim());
  }

  if (options.lastLoginTo?.trim()) {
    query.set('LastLoginTo', options.lastLoginTo.trim());
  }

  if (options.createdDateFrom?.trim()) {
    query.set('CreatedDateFrom', options.createdDateFrom.trim());
  }

  if (options.createdDateTo?.trim()) {
    query.set('CreatedDateTo', options.createdDateTo.trim());
  }

  if (options.deliveryFrom?.trim()) {
    query.set('deliveryFrom', options.deliveryFrom.trim());
  }

  if (options.deliveryTo?.trim()) {
    query.set('deliveryTo', options.deliveryTo.trim());
  }

  if (options.fulfillmentStatus?.trim()) {
    query.set('FulfillmentStatus', options.fulfillmentStatus.trim());
  }

  if (options.deliveryStatus?.trim()) {
    query.set('DeliveryStatus', options.deliveryStatus.trim());
  }

  if (options.productName?.trim()) {
    query.set('productName', options.productName.trim());
  }

  if (options.productVariant?.trim()) {
    query.set('productVariant', options.productVariant.trim());
  }

  if (options.pageNo !== undefined) {
    query.set('pageNo', String(options.pageNo));
  }

  if (options.pageSize !== undefined) {
    query.set('pageSize', String(options.pageSize));
  }

  return query.toString();
};

const readResponseText = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

const parseErrorMessage = (payloadText: string, status: number): string => {
  const trimmedText = payloadText.trim();

  if (!trimmedText) {
    return `Request failed with status ${status}.`;
  }

  try {
    const parsed = JSON.parse(trimmedText) as ApiErrorResponse | string;

    if (typeof parsed === 'string') {
      return parsed.trim() || `Request failed with status ${status}.`;
    }

    return parsed.error || parsed.message || trimmedText || `Request failed with status ${status}.`;
  } catch {
    return trimmedText;
  }
};

const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');

  downloadLink.href = blobUrl;
  downloadLink.download = filename;
  downloadLink.rel = 'noopener';
  downloadLink.style.display = 'none';

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 0);
};

type ChartDetailsRecord = Record<string, unknown>;

interface WorkbookColumnDefinition {
  header: string;
  width: number;
}

const asRecord = (value: unknown): ChartDetailsRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as ChartDetailsRecord;
};

const getNestedValue = (source: ChartDetailsRecord | null, keys: string[]): unknown => {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const toText = (value: unknown, fallback = '-'): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    const joined = value.map((item) => toText(item, '')).filter(Boolean).join(', ');
    return joined || fallback;
  }

  const nestedRecord = asRecord(value);
  if (nestedRecord) {
    const nestedLabel = getNestedValue(nestedRecord, ['name', 'title', 'label', 'value', 'displayName', 'fullName', 'customerName', 'orderName']);
    if (nestedLabel !== undefined) {
      return toText(nestedLabel, fallback);
    }
  }

  return fallback;
};

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '').trim();
    if (!cleaned) {
      return undefined;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const nestedRecord = asRecord(value);
  if (!nestedRecord) {
    return undefined;
  }

  return toNumber(getNestedValue(nestedRecord, ['amount', 'price', 'totalAmount', 'value', 'qty', 'quantity', 'subtotal', 'shopMoney']));
};

const formatDateForSheet = (value: unknown): string => {
  const text = toText(value, '');
  if (!text) {
    return '-';
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  return parsed.toISOString().split('T')[0];
};

const formatCurrencyForSheet = (value: unknown, currencyCode?: unknown): string => {
  const amount = toNumber(value);
  if (amount === undefined) {
    return '-';
  }

  const code = toText(currencyCode, '').trim();
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

  return code ? `${code} ${formattedAmount}` : formattedAmount;
};

const extractChartDetailsRows = (value: unknown): ChartDetailsRecord[] => {
  if (Array.isArray(value)) {
    return value.map((item) => asRecord(item)).filter((item): item is ChartDetailsRecord => item !== null);
  }

  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const keysToInspect = ['customers', 'customerList', 'customerDetails', 'data', 'result', 'rows'];

  for (const key of keysToInspect) {
    if (!(key in record)) {
      continue;
    }

    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested.map((item) => asRecord(item)).filter((item): item is ChartDetailsRecord => item !== null);
    }

    if (nested && typeof nested === 'object') {
      const nestedRows = extractChartDetailsRows(nested);
      if (nestedRows.length > 0) {
        return nestedRows;
      }
    }
  }

  return [];
};

const extractChartDetailsPayload = (value: unknown): ChartDetailsRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const chartDetails = getNestedValue(record, ['chartDetails', 'chart_details']);
  if (chartDetails && typeof chartDetails === 'object' && !Array.isArray(chartDetails)) {
    return chartDetails as ChartDetailsRecord;
  }

  const data = getNestedValue(record, ['data']);
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const nested = extractChartDetailsPayload(data);
    if (nested) {
      return nested;
    }
  }

  return null;
};

const normalizeChartDetails = (value: unknown): CustomerChartDetails | null => {
  const record = extractChartDetailsPayload(value);
  if (!record) {
    return null;
  }

  const mostValuableCustomers = extractNestedRecords(record, ['mostValuableCustomers']).map((item, index) => ({
    customerName: toText(getNestedValue(item, ['customerName', 'name', 'fullName']), `Customer ${index + 1}`),
    lifeSpend: toNumber(getNestedValue(item, ['lifeSpend', 'lifetimeSpend', 'spend', 'value'])) ?? 0,
    customerId: toText(getNestedValue(item, ['customerId', 'id']), '').trim() || undefined,
    segment: normalizeCustomerType(toText(getNestedValue(item, ['segment', 'customerType']), '')) ?? undefined
  }));

  const highestOrderCustomers = extractNestedRecords(record, ['highestOrderCustomers']).map((item, index) => ({
    customerName: toText(getNestedValue(item, ['customerName', 'name', 'fullName']), `Customer ${index + 1}`),
    orderCount: toNumber(getNestedValue(item, ['orderCount', 'orders', 'count', 'value'])) ?? 0,
    customerId: toText(getNestedValue(item, ['customerId', 'id']), '').trim() || undefined,
    segment: normalizeCustomerType(toText(getNestedValue(item, ['segment', 'customerType']), '')) ?? undefined
  }));

  const revenueAnalytics = extractNestedRecords(record, ['revenueAnalytics']).map((item) => ({
    orderDate: toText(getNestedValue(item, ['orderDate', 'date', 'createdAt']), '').trim(),
    revenue: toNumber(getNestedValue(item, ['revenue', 'amount', 'value'])) ?? 0
  })).filter((item) => item.orderDate);

  return {
    mostValuableCustomers,
    highestOrderCustomers,
    revenueAnalytics
  };
};

const extractNestedRecords = (source: unknown, keys: string[]): ChartDetailsRecord[] => {
  const record = asRecord(source);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const nested = record[key];

    if (Array.isArray(nested)) {
      return nested.map((item) => asRecord(item)).filter((item): item is ChartDetailsRecord => item !== null);
    }

    if (nested && typeof nested === 'object') {
      const nestedRows = extractNestedRecords(nested, keys);
      if (nestedRows.length > 0) {
        return nestedRows;
      }
    }
  }

  return [];
};

const getCustomerDisplayName = (customer: ChartDetailsRecord, fallbackIndex: number): string => {
  const firstName = toText(getNestedValue(customer, ['firstName', 'first_name']), '').trim();
  const lastName = toText(getNestedValue(customer, ['lastName', 'last_name']), '').trim();
  const combinedName = `${firstName} ${lastName}`.trim();

  if (combinedName) {
    return combinedName;
  }

  const directName = toText(getNestedValue(customer, ['name', 'customerName', 'fullName']), '').trim();
  if (directName) {
    return directName;
  }

  const email = toText(getNestedValue(customer, ['email']), '').trim();
  if (email) {
    return email;
  }

  const customerId = toText(getNestedValue(customer, ['id', 'customerId']), '').trim();
  if (customerId) {
    return customerId;
  }

  return `Customer ${fallbackIndex + 1}`;
};

const getShopifyDisplayId = (value: unknown, fallbackPrefix: string, index: number): string => {
  const text = toText(value, '').trim();
  if (!text) {
    return `${fallbackPrefix}-${String(index + 1).padStart(4, '0')}`;
  }

  const gidParts = text.split('/');
  return gidParts[gidParts.length - 1] || text;
};

const getCustomerOrders = (customer: ChartDetailsRecord): ChartDetailsRecord[] => {
  return extractNestedRecords(customer, ['orders', 'customerOrders', 'orderDetails']);
};

const getOrderLineItems = (order: ChartDetailsRecord): ChartDetailsRecord[] => {
  return extractNestedRecords(order, ['lineItems', 'line_items', 'items', 'products']);
};

const buildChartDetailsWorkbook = (customers: ChartDetailsRecord[]): XLSX.WorkBook => {
  const customerSummaryRows: ChartDetailsRecord[] = [];
  const orderRows: ChartDetailsRecord[] = [];
  const lineItemRows: ChartDetailsRecord[] = [];

  customers.forEach((customer, customerIndex) => {
    const customerName = getCustomerDisplayName(customer, customerIndex);
    const customerId = getShopifyDisplayId(getNestedValue(customer, ['id', 'customerId']), 'CUST', customerIndex);
    const currencyCode = toText(getNestedValue(customer, ['currencyCode', 'currency']), '').trim();
    const orders = getCustomerOrders(customer);
    const summaryAmount = formatCurrencyForSheet(getNestedValue(customer, ['amountSpent', 'totalSpent', 'lifetimeSpend', 'spend']), currencyCode);
    const totalOrders = toNumber(getNestedValue(customer, ['numberOfOrders', 'totalOrders'])) ?? orders.length;
    const lastOrderDate = formatDateForSheet(getNestedValue(customer, ['lastOrderDate', 'updatedAt', 'createdAt']));
    const joinedDate = formatDateForSheet(getNestedValue(customer, ['createdAt', 'joinedDate', 'joinedAt']));
    const tags = toText(getNestedValue(customer, ['tags']), '-');
    const country = toText(getNestedValue(customer, ['country', 'defaultCountry']), '-');
    const location = toText(getNestedValue(customer, ['location', 'address', 'defaultAddress']), '-');
    const lastLogin = formatDateForSheet(getNestedValue(customer, ['lastLogin', 'last_login']));
    const segment = toText(getNestedValue(customer, ['segment', 'customerType']), 'Inactive');
    const state = toText(getNestedValue(customer, ['state', 'status']), '-');

    customerSummaryRows.push({
      'Customer ID': customerId,
      'Customer Name': customerName,
      Email: toText(getNestedValue(customer, ['email']), '-'),
      Phone: toText(getNestedValue(customer, ['phone']), '-'),
      Country: country,
      Location: location,
      '# Orders': totalOrders,
      'Lifetime Spend': summaryAmount,
      'Last Order Date': lastOrderDate,
      'Last Login': lastLogin,
      Segment: segment,
      State: state,
      Tags: tags,
      'Joined Date': joinedDate
    });

    orders.forEach((order, orderIndex) => {
      const orderId = getShopifyDisplayId(getNestedValue(order, ['id', 'orderId']), 'ORD', orderIndex);
      const orderName = toText(getNestedValue(order, ['name', 'orderName']), `Order ${orderId}`);
      const orderDate = formatDateForSheet(getNestedValue(order, ['createdAt', 'date', 'orderDate']));
      const financialStatus = toText(getNestedValue(order, ['displayFinancialStatus', 'financialStatus']), '-');
      const fulfillmentStatus = toText(getNestedValue(order, ['displayFulfillmentStatus', 'fulfillmentStatus']), '-');
      const deliveryStatus = toText(getNestedValue(order, ['deliveryStatus']), '-');
      const paymentGateway = toText(getNestedValue(order, ['paymentGatewayNames']), '-');
      const orderAmount = formatCurrencyForSheet(getNestedValue(order, ['totalAmount', 'amount', 'subtotalPrice']), currencyCode);
      const orderLineItems = getOrderLineItems(order);

      orderRows.push({
        'Customer ID': customerId,
        'Customer Name': customerName,
        'Order ID': orderId,
        'Order Name': orderName,
        'Order Date': orderDate,
        'Financial Status': financialStatus,
        'Fulfillment Status': fulfillmentStatus,
        'Delivery Status': deliveryStatus,
        'Payment Gateway': paymentGateway,
        'Total Amount': orderAmount,
        'Currency': currencyCode || '-',
        '# Line Items': orderLineItems.length
      });

      orderLineItems.forEach((lineItem, lineItemIndex) => {
        const product = asRecord(getNestedValue(lineItem, ['product']));
        const productName = toText(getNestedValue(lineItem, ['title', 'name']), `Item ${lineItemIndex + 1}`);
        const productType = toText(getNestedValue(lineItem, ['productType']), toText(getNestedValue(product, ['productType']), '-'));
        const vendor = toText(getNestedValue(lineItem, ['vendor']), toText(getNestedValue(product, ['vendor']), '-'));
        const variant = toText(getNestedValue(lineItem, ['variantTitle', 'variant']), '-');
        const sku = toText(getNestedValue(lineItem, ['sku']), '-');
        const quantity = toNumber(getNestedValue(lineItem, ['quantity', 'qty'])) ?? 0;
        const unitPrice = formatCurrencyForSheet(getNestedValue(lineItem, ['price', 'unitPrice', 'originalUnitPriceSet', 'discountedUnitPriceSet']), currencyCode);
        const lineTotal = formatCurrencyForSheet(getNestedValue(lineItem, ['totalPrice', 'lineTotal', 'subtotal', 'amount']), currencyCode);

        lineItemRows.push({
          'Customer ID': customerId,
          'Customer Name': customerName,
          'Order ID': orderId,
          'Order Name': orderName,
          'Product Name': productName,
          'Product Type': productType,
          Vendor: vendor,
          Variant: variant,
          SKU: sku,
          Qty: quantity,
          'Unit Price': unitPrice,
          'Line Total': lineTotal
        });
      });
    });
  });

  const workbook = XLSX.utils.book_new();
  const appendSheet = (sheetName: string, rows: ChartDetailsRecord[], columns: WorkbookColumnDefinition[]): void => {
    const headerRow = columns.map((column) => column.header);
    const worksheet = XLSX.utils.aoa_to_sheet([headerRow]);

    if (rows.length > 0) {
      XLSX.utils.sheet_add_json(worksheet, rows, {
        origin: 'A2',
        skipHeader: true,
        header: headerRow
      });
    }

    worksheet['!cols'] = columns.map((column) => ({ wch: column.width }));
    if (worksheet['!ref']) {
      worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  };

  appendSheet('Customers Summary', customerSummaryRows, [
    { header: 'Customer ID', width: 18 },
    { header: 'Customer Name', width: 28 },
    { header: 'Email', width: 30 },
    { header: 'Phone', width: 18 },
    { header: 'Country', width: 18 },
    { header: 'Location', width: 28 },
    { header: '# Orders', width: 12 },
    { header: 'Lifetime Spend', width: 18 },
    { header: 'Last Order Date', width: 16 },
    { header: 'Last Login', width: 16 },
    { header: 'Segment', width: 14 },
    { header: 'State', width: 14 },
    { header: 'Tags', width: 24 },
    { header: 'Joined Date', width: 16 }
  ]);

  appendSheet('Orders', orderRows, [
    { header: 'Customer ID', width: 18 },
    { header: 'Customer Name', width: 28 },
    { header: 'Order ID', width: 18 },
    { header: 'Order Name', width: 28 },
    { header: 'Order Date', width: 16 },
    { header: 'Financial Status', width: 18 },
    { header: 'Fulfillment Status', width: 18 },
    { header: 'Delivery Status', width: 18 },
    { header: 'Payment Gateway', width: 24 },
    { header: 'Total Amount', width: 18 },
    { header: 'Currency', width: 12 },
    { header: '# Line Items', width: 14 }
  ]);

  appendSheet('Order Line Items', lineItemRows, [
    { header: 'Customer ID', width: 18 },
    { header: 'Customer Name', width: 28 },
    { header: 'Order ID', width: 18 },
    { header: 'Order Name', width: 28 },
    { header: 'Product Name', width: 28 },
    { header: 'Product Type', width: 22 },
    { header: 'Vendor', width: 22 },
    { header: 'Variant', width: 28 },
    { header: 'SKU', width: 18 },
    { header: 'Qty', width: 10 },
    { header: 'Unit Price', width: 16 },
    { header: 'Line Total', width: 16 }
  ]);

  return workbook;
};

const downloadWorkbook = (workbook: XLSX.WorkBook, filename: string): void => {
  const workbookArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([workbookArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  triggerBrowserDownload(blob, filename);
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

const isAbandonedCheckoutApiEnvelope = (
  payload: AbandonedCheckoutApiEnvelope | ShopifyAbandonedCheckoutDto[]
): payload is AbandonedCheckoutApiEnvelope => {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload) && (
    'success' in payload ||
    'message' in payload ||
    'error' in payload ||
    'data' in payload
  );
};

export async function fetchCustomer360Customers(options: CustomerSyncOptions = {}): Promise<CustomerSyncPageResult> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || readApiBaseUrl());
  const shopDomain = options.shopDomain?.trim() || DEFAULT_SHOP_DOMAIN;
  const pageNo = options.pageNo ?? DEFAULT_PAGE_NO;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const query = buildCustomerSyncQuery({
    shopDomain,
    customerType: options.customerType,
    customerNameOrId: options.customerNameOrId,
    emailOrPhone: options.emailOrPhone,
    country: options.country,
    lifetimeSpend: options.lifetimeSpend,
    lifetimeSpendMin: options.lifetimeSpendMin,
    lifetimeSpendMax: options.lifetimeSpendMax,
    orderId: options.orderId,
    orderDateFrom: options.orderDateFrom,
    orderDateTo: options.orderDateTo,
    paymentStatus: options.paymentStatus,
    lastOrderDateFrom: options.lastOrderDateFrom,
    lastOrderDateTo: options.lastOrderDateTo,
    lastLoginFrom: options.lastLoginFrom,
    lastLoginTo: options.lastLoginTo,
    createdDateFrom: options.createdDateFrom,
    createdDateTo: options.createdDateTo,
    deliveryFrom: options.deliveryFrom,
    deliveryTo: options.deliveryTo,
    fulfillmentStatus: options.fulfillmentStatus,
    deliveryStatus: options.deliveryStatus,
    productName: options.productName,
    productVariant: options.productVariant,
    pageNo,
    pageSize
  });

  const requestPath = `/api/shopify/sync/customer-data?${query}`;
  const endpoint = buildCustomerSyncEndpoint(requestPath, apiBaseUrl);

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

  const mappedCustomers = normalized.customers.map((customer, index) => {
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
    const customerType = normalizeCustomerType(customer.customerType) ?? getCustomerSegment(customer, orderCount, totalSpend);
    const abandonedCheckoutCount = getAbandonedCheckoutCount(customer);

  return {
    id: customerId,
    name: customerName,
    email: customer.email?.trim() || '-',
    phone: customer.phone?.trim() || customer.defaultAddress?.phone?.trim() || '-',
    createdAt: parseDateString(customer.createdAt) || '-',
    updatedAt: parseDateString(customer.updatedAt) || '-',
    currencyCode: customer.amountSpent?.currencyCode?.trim() || undefined,
    country,
    location,
    address1: customer.defaultAddress?.address1?.trim() || undefined,
    address2: customer.defaultAddress?.address2?.trim() || undefined,
    city: customer.defaultAddress?.city?.trim() || undefined,
    state: customer.defaultAddress?.province?.trim() || customer.state?.trim() || undefined,
    postalCode: customer.defaultAddress?.zip?.trim() || undefined,
    countryCode: customer.defaultAddress?.countryCodeV2?.trim() || undefined,
    verifiedEmail: customer.verifiedEmail ?? undefined,
    taxExempt: customer.taxExempt ?? undefined,
    note: customer.note?.trim() || undefined,
    tags: customer.tags?.filter(Boolean).map(tag => tag.trim()) || undefined,
    lastLogin: '-',
    totalOrders: orderCount,
    totalSpend,
    lastOrderDate,
      leadNo: 'None',
      leadStatus,
      segment: customerType,
      customerType,
      abandonedCheckoutCount,
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

  const totalCustomerCount =
    normalized.totalCustomerCount ??
    normalized.totalcustomercount ??
    mappedCustomers.length;

  return {
    customers: mappedCustomers,
    totalCustomerCount,
    pageNo: normalized.pageNo ?? pageNo,
    pageSize: normalized.pageSize ?? pageSize
  };
}

const mapAbandonedCheckout = (checkout: ShopifyAbandonedCheckoutDto, index: number): CustomerAbandonedCheckout => {
  const lineItems = checkout.lineItems || [];
  const productNames = lineItems
    .map((lineItem) => lineItem.title?.trim() || '-');
  const variantTitles = lineItems
    .map((lineItem) => lineItem.variant?.title?.trim() || '-');
  const variantPrices = lineItems
    .map((lineItem) => parseNumber(lineItem.variant?.price));
 
  const qty = lineItems.reduce((sum, lineItem) => {
    const itemQty = lineItem.quantity ?? 1;
    return sum + itemQty;
  }, 0);
 
  const subtotalAmount = parseNumber(checkout.subtotalPriceSet?.amount) ?? parseNumber(checkout.totalPriceSet?.amount) ?? 0;
  const currencyCode = getShopifyCurrencyCode(checkout.subtotalPriceSet) || getShopifyCurrencyCode(checkout.totalPriceSet);
 
  return {
    id: checkout.id?.trim() || `ABANDONED-${String(index + 1).padStart(4, '0')}`,
    checkoutId: getShopifyNumericId(checkout.id),
    productNames: productNames.length > 0 ? productNames : ['-'],
    variantTitles: variantTitles.length > 0 ? variantTitles : ['-'],
    variantPrices: variantPrices.length > 0 ? variantPrices : [null],
    price: subtotalAmount,
    qty: qty > 0 ? qty : lineItems.length || 0,
    nextScheduleEmail: checkout.nextScheduleEmail?.trim() || '-',
    abandonedAt: parseDateString(checkout.createdAt) || '-',
    currencyCode
  };
};
 
const mapCustomerRefundRows = (orders: ShopifyOrderDto[]): CustomerRefund[] => {
  const rows: CustomerRefund[] = [];
 
  orders.forEach((order) => {
    (order.refunds || []).forEach((refund, refundIndex) => {
      const refundId = getShopifyNumericId(refund.id) || `REFUND-${String(refundIndex + 1).padStart(4, '0')}`;
      const refundedAt = parseDateString(refund.createdAt) || '-';
      const amount = parseNumber(refund.totalRefundedSet?.amount) ?? 0;
      const currencyCode = getShopifyCurrencyCode(refund.totalRefundedSet);
      const status = refund.transactions?.find((transaction) => transaction.status?.trim())?.status?.trim() || 'Unknown';
 
    (refund.refundLineItems || []).forEach((lineItem) => {
      rows.push({
        id: refundId,
          date: refundedAt,
          productName: lineItem.lineItem?.title?.trim() || '-',
          quantity: lineItem.quantity ?? 1,
          sku: lineItem.lineItem?.sku?.trim() || '-',
          amount,
          currencyCode,
          status,
          // Preserve multiple line items from the same refund by order of appearance.
        });
      });
 
      if ((refund.refundLineItems || []).length === 0) {
        rows.push({
          id: refundId,
          date: refundedAt,
          productName: '-',
          quantity: 1,
          sku: '-',
          amount,
          currencyCode,
          status,
        });
      }
    });
  });
 
  return rows;
};
 
const mapCustomerDiscountRows = (orders: ShopifyOrderDto[]): CustomerDiscount[] => {
  const rows: CustomerDiscount[] = [];
 
  orders
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .forEach((order) => {
      const orderId = getShopifyNumericId(order.id) || order.name?.trim() || '-';
      const orderPrice = (parseNumber(order.totalPriceSet?.amount) ?? 0) + (parseNumber(order.totalDiscountsSet?.amount) ?? 0);
      const discountAmount = parseNumber(order.totalDiscountsSet?.amount) ?? 0;
      const currencyCode = getShopifyCurrencyCode(order.totalPriceSet) || getShopifyCurrencyCode(order.totalDiscountsSet);
 
      (order.discountApplications || []).forEach((application) => {
        rows.push({
          orderId,
          code: application.code?.trim() || '-',
          percentage: application.percentage ?? null,
          amount: application.amount ?? null,
          description: application.description?.trim() || application.title?.trim() || '-',
          orderPrice,
          discountAmount,
          currencyCode,
          status: application.typeName?.trim() || 'Applied'
        });
      });
    });
 
  return rows;
};
 
export async function fetchAbandonedCheckoutsByCustomerId(
  options: AbandonedCheckoutSyncOptions
): Promise<CustomerAbandonedCheckout[]> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || '');
  const shopDomain = options.shopDomain?.trim() || DEFAULT_SHOP_DOMAIN;
  const customerId = options.customerId.trim();
 
  if (!customerId) {
    throw new Error('Customer ID is required to load abandoned checkouts.');
  }
 
  const query = new URLSearchParams();
  if (shopDomain) {
    query.set('shopDomain', shopDomain);
  }
  query.set('customerId', customerId);
 
  const requestPath = `/api/shopify/sync/abandoned-checkouts?${query.toString()}`;
  const endpoint = apiBaseUrl ? new URL(requestPath, apiBaseUrl).toString() : requestPath;
 
  const response = await fetch(endpoint, {
    method: 'POST',
    signal: options.signal
  });
 
  const payload = (await response.json()) as AbandonedCheckoutApiEnvelope | ShopifyAbandonedCheckoutDto[];
  const normalized = isAbandonedCheckoutApiEnvelope(payload) ? payload.data : payload;
 
  if (!response.ok) {
    const envelope = payload as AbandonedCheckoutApiEnvelope;
    throw new Error(envelope.error || envelope.message || `Abandoned checkout sync request failed with status ${response.status}.`);
  }
 
  if (!Array.isArray(normalized)) {
    throw new Error('Abandoned checkout sync response did not include checkout rows.');
  }
 
  return normalized
    .map(mapAbandonedCheckout)
    .sort((a, b) => {
      const dateA = new Date(a.abandonedAt || 0).getTime();
      const dateB = new Date(b.abandonedAt || 0).getTime();
      return dateB - dateA;
    });
}
 
export async function fetchCustomerRefundsByCustomerId(
  options: CustomerRefundSyncOptions
): Promise<CustomerRefund[]> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || '');
  const shopDomain = options.shopDomain?.trim() || DEFAULT_SHOP_DOMAIN;
  const customerId = options.customerId.trim();
 
  if (!customerId) {
    throw new Error('Customer ID is required to load refunds.');
  }
 
  const query = new URLSearchParams();
  if (shopDomain) {
    query.set('shopDomain', shopDomain);
  }
  query.set('customerId', customerId);
 
  const requestPath = `/api/shopify/sync/customer-refunds?${query.toString()}`;
  const endpoint = apiBaseUrl ? new URL(requestPath, apiBaseUrl).toString() : requestPath;
 
  const response = await fetch(endpoint, {
    method: 'POST',
    signal: options.signal
  });
 
  const payload = (await response.json()) as CustomerRefundsApiEnvelope | { customer?: ShopifyCustomerDto | null; orders?: ShopifyOrderDto[] | null };
  const normalized = typeof payload === 'object' && payload !== null && 'success' in payload && 'data' in payload
    ? payload.data
    : payload;
 
  if (!response.ok) {
    const envelope = payload as CustomerRefundsApiEnvelope;
    throw new Error(envelope.error || envelope.message || `Customer refund sync request failed with status ${response.status}.`);
  }
 
  if (!normalized || !Array.isArray((normalized as { orders?: ShopifyOrderDto[] | null }).orders)) {
    throw new Error('Customer refund sync response did not include order rows.');
  }
 
  return mapCustomerRefundRows((normalized as { orders?: ShopifyOrderDto[] | null }).orders || []).sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });
}
 
export async function fetchCustomerDiscountsByCustomerId(
  options: CustomerDiscountSyncOptions
): Promise<CustomerDiscount[]> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || '');
  const shopDomain = options.shopDomain?.trim() || 'tech-crm';
  const storeId = options.storeId?.trim() || DEFAULT_STORE_ID;
  const customerId = options.customerId.trim();
 
  if (!customerId) {
    throw new Error('Customer ID is required to load discounts.');
  }
 
  const query = new URLSearchParams();
  if (shopDomain) {
    query.set('shopDomain', shopDomain);
  }
  if (storeId) {
    query.set('storeId', storeId);
  }
  query.set('customerId', customerId);
 
  const requestPath = `/api/shopify/sync/customer-discounts?${query.toString()}`;
  const endpoint = apiBaseUrl ? new URL(requestPath, apiBaseUrl).toString() : requestPath;
 
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: '*/*'
    },
    signal: options.signal
  });
 
  const payload = (await response.json()) as CustomerDiscountsApiEnvelope | { customer?: ShopifyCustomerDto | null; orders?: ShopifyOrderDto[] | null };
  const normalized = typeof payload === 'object' && payload !== null && 'success' in payload && 'data' in payload
    ? payload.data
    : payload;
 
  if (!response.ok) {
    const envelope = payload as CustomerDiscountsApiEnvelope;
    throw new Error(envelope.error || envelope.message || `Customer discount sync request failed with status ${response.status}.`);
  }
 
  if (!normalized || !Array.isArray((normalized as { orders?: ShopifyOrderDto[] | null }).orders)) {
    throw new Error('Customer discount sync response did not include order rows.');
  }
 
  return mapCustomerDiscountRows((normalized as { orders?: ShopifyOrderDto[] | null }).orders || []);
}
 
export async function exportCustomer360Customers(options: CustomerExportOptions & { type: 'chart' }): Promise<CustomerChartDetails | null>;
export async function exportCustomer360Customers(options?: CustomerExportOptions): Promise<string>;
export async function exportCustomer360Customers(options: CustomerExportOptions = {}): Promise<string | CustomerChartDetails | null> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || readApiBaseUrl());
  const shopDomain = options.shopDomain?.trim() || DEFAULT_SHOP_DOMAIN;
  const requestType = options.type === 'chart' ? 'chart' : 'excel';
  const query = buildCustomerSyncQuery({
    shopDomain,
    type: requestType,
    dateFilter: options.dateFilter,
    startDate: options.startDate,
    endDate: options.endDate
  });
  const requestPath = `/api/shopify/sync/getchartdetails?${query}`;
  const endpoint = buildCustomerSyncEndpoint(requestPath, apiBaseUrl);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: '*/*'
    },
    signal: options.signal
  });

  const payloadText = await readResponseText(response);
  if (!payloadText.trim()) {
    throw new Error('Chart details response was empty.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadText) as unknown;
  } catch {
    throw new Error('Chart details response was not valid JSON.');
  }

  if (!response.ok) {
    const envelope = asRecord(payload);
    throw new Error(
      toText(getNestedValue(envelope, ['error', 'message']), `Chart details sync request failed with status ${response.status}.`)
    );
  }

  if (requestType === 'chart') {
    return normalizeChartDetails(payload);
  }

  const customers = extractChartDetailsRows(payload);
  if (customers.length === 0) {
    throw new Error('Chart details export did not include any customer rows.');
  }

  const workbook = buildChartDetailsWorkbook(customers);
  const filename = DEFAULT_EXPORT_FILE_NAME;
  downloadWorkbook(workbook, filename);

  return filename;
}
 
