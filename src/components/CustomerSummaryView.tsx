import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, User, ArrowRight, DollarSign, 
  X, CheckSquare, Settings, Check, CreditCard, ShoppingBag, 
  Ticket, Gift, HelpCircle, ExternalLink, ChevronDown, ChevronRight,
  Mail, ChevronLeft, Edit, Eye, ChevronUp, RefreshCw, Users,
  Clock,
  Calendar, Sparkles, TrendingUp, LayoutGrid, Star
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { Customer, CustomerSegment, LeadStatus, CustomerOrder, CustomerRefund, CustomerDiscount,CustomerAbandonedCheckout, Lead, Complaint } from '../types';
import OrderProductBreakdown from './OrderProductBreakdown';
import CustomerDataLoader from './CustomerDataLoader';
import { formatCurrencyAmount } from '../utils/currency';
import { fetchAbandonedCheckoutsByCustomerId, fetchCustomerRefundsByCustomerId, fetchCustomerDiscountsByCustomerId, exportCustomer360Customers, type CustomerChartDetails} from '../api/customerSync';
import { DEFAULT_STATUS_BADGE_META, getStatusBadgeMeta, normalizeStatusCode, PAYMENT_STATUS_OPTIONS, FULFILLMENT_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS } from '../utils/orderStatus';
import { ResizeHandle, useResizableColumns, type ResizableColumnConfig } from './tableResize';
import { type CustomerSyncOptions } from '../api/customerSync';

const CUSTOMER_GRID_COLUMNS: ResizableColumnConfig[] = [
  { id: 'expander', width: 38, minWidth: 32, maxWidth: 80 },
  { id: 'profile', width: 116, minWidth: 104, maxWidth: 200 },
  { id: 'name', width: 120, minWidth: 100, maxWidth: 220 },
  { id: 'email', width: 140, minWidth: 118, maxWidth: 260 },
  { id: 'country', width: 80, minWidth: 70, maxWidth: 150 },
  { id: 'location', width: 150, minWidth: 130, maxWidth: 280 },
  { id: 'orders', width: 80, minWidth: 70, maxWidth: 150 },
  { id: 'spend', width: 96, minWidth: 84, maxWidth: 180 },
  { id: 'lastOrder', width: 100, minWidth: 84, maxWidth: 180 },
  { id: 'lastLogin', width: 88, minWidth: 80, maxWidth: 170 },
  { id: 'createdDate', width: 96, minWidth: 86, maxWidth: 180 },
  { id: 'segment', width: 104, minWidth: 94, maxWidth: 180 },
  { id: 'abandonedCheckout', width: 120, minWidth: 108, maxWidth: 200 },
  { id: 'action', width: 72, minWidth: 64, maxWidth: 100 }
];

const COMPACT_ORDER_GRID_COLUMNS: ResizableColumnConfig[] = [
  { id: 'expander', width: 32, minWidth: 28, maxWidth: 56 },
  { id: 'orderId', width: 104, minWidth: 84, maxWidth: 180 },
  { id: 'orderDate', width: 96, minWidth: 84, maxWidth: 160 },
  { id: 'orderStatus', width: 104, minWidth: 88, maxWidth: 180 },
  { id: 'paymentStatus', width: 112, minWidth: 92, maxWidth: 200 },
  { id: 'deliveryStatus', width: 112, minWidth: 92, maxWidth: 200 },
  { id: 'totalAmount', width: 96, minWidth: 84, maxWidth: 160 }
];

const DETAILED_ORDER_GRID_COLUMNS: ResizableColumnConfig[] = [
  { id: 'expander', width: 36, minWidth: 32, maxWidth: 72 },
  { id: 'orderId', width: 96, minWidth: 80, maxWidth: 220 },
  { id: 'orderName', width: 160, minWidth: 120, maxWidth: 280 },
  { id: 'orderDate', width: 80, minWidth: 72, maxWidth: 180 },
  { id: 'orderStatus', width: 80, minWidth: 72, maxWidth: 180 },
  { id: 'paymentStatus', width: 80, minWidth: 72, maxWidth: 180 },
  { id: 'fulfillmentStatus', width: 88, minWidth: 72, maxWidth: 200 },
  { id: 'deliveryStatus', width: 88, minWidth: 72, maxWidth: 200 },
  { id: 'totalAmount', width: 92, minWidth: 72, maxWidth: 200 }
];

function getFrontendOrderCount(customer?: Pick<Customer, 'orders'> | null): number {
  return customer?.orders?.length ?? 0;
}

const COUNTRY_OPTIONS = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  "Cote d'Ivoire",
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe'
] as const;

interface CustomerSummaryViewProps {
  customers: Customer[];
  leads?: Lead[];
  complaints?: Complaint[];
  onUpdateCustomer: (customer: Customer) => void;
  onNavigateToLead: (leadNo: string) => void;
  onNavigateToTemplate: (templateName: string) => void;
  initialSelectedCustomerName?: string;
  onClearSelectedCustomerName: () => void;
  isLoadingCustomers?: boolean;
  customerLoadError?: string | null;
  onRefreshCustomers: (customerType: 'All' | CustomerSegment) => void;
  customerPageNo: number;
  customerPageSize: number;
  totalCustomerCount: number;
  onCustomerPageChange: (pageNo: number) => void;
  onCustomerPageSizeChange: (pageSize: number) => void;
  onShowToast?: (message: string) => void;
  onCustomerQueryChange?: (filters: Pick<
    CustomerSyncOptions,
    | 'customerType'
    | 'customerNameOrId'
    | 'emailOrPhone'
    | 'country'
    | 'lifetimeSpend'
    | 'lifetimeSpendMin'
    | 'lifetimeSpendMax'
    | 'orderId'
    | 'orderDateFrom'
    | 'orderDateTo'
    | 'paymentStatus'
    | 'lastOrderDateFrom'
    | 'lastOrderDateTo'
    | 'lastLoginFrom'
    | 'lastLoginTo'
    | 'createdDateFrom'
    | 'createdDateTo'
    | 'deliveryFrom'
    | 'deliveryTo'
    | 'fulfillmentStatus'
    | 'deliveryStatus'
    | 'productName'
    | 'productVariant'
  >) => void;
}

function formatIndianInteger(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length <= 3) {
    return digits;
  }

  const lastThree = digits.slice(-3);
  const leadingDigits = digits.slice(0, -3);
  const formattedLeading = leadingDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedLeading},${lastThree}`;
}

function formatSpendFilterValue(value: string): string {
  return formatIndianInteger(value);
}

function parseSpendFilterValue(value: string): number {
  const cleaned = value.replace(/,/g, '').trim();
  return cleaned ? Number(cleaned) : NaN;
}

function validateSpendRange(minSpend: string, maxSpend: string): { minSpend: string; maxSpend: string } {
  const errors = { minSpend: '', maxSpend: '' };
  const minRaw = minSpend.trim();
  const maxRaw = maxSpend.trim();
  const minValue = minRaw ? parseSpendFilterValue(minRaw) : NaN;
  const maxValue = maxRaw ? parseSpendFilterValue(maxRaw) : NaN;

  if (minRaw) {
    if (!Number.isFinite(minValue)) {
      errors.minSpend = 'Enter a valid spend amount.';
    } else if (minValue < 0) {
      errors.minSpend = 'Min spend cannot be negative.';
    }
  }

  if (maxRaw) {
    if (!Number.isFinite(maxValue)) {
      errors.maxSpend = 'Enter a valid spend amount.';
    } else if (maxValue < 0) {
      errors.maxSpend = 'Max spend cannot be negative.';
    }
  }

  if (!errors.minSpend && !errors.maxSpend && minRaw && maxRaw && maxValue < minValue) {
    errors.minSpend = 'Min spend cannot be greater than Max spend.';
    errors.maxSpend = `Max value cannot be less than Min value (${formatSpendFilterValue(minRaw)}).`;
  }

  return errors;
}

function formatCustomerDisplayName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseFlexibleDateValue(value?: string | null): number {
  if (!value) {
    return NaN;
  }

  const text = value.trim();
  if (!text || text === '-') {
    return NaN;
  }

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (match) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      0
    ).getTime();
  }

  const parsed = new Date(text);
  return parsed.getTime();
}

function parseDateInputStart(value: string): number {
  if (!value.trim()) {
    return NaN;
  }

  const parsed = new Date(`${value.trim()}T00:00:00`);
  return parsed.getTime();
}

function parseDateInputEnd(value: string): number {
  if (!value.trim()) {
    return NaN;
  }

  const parsed = new Date(`${value.trim()}T23:59:59.999`);
  return parsed.getTime();
}

function isDateWithinRange(value: string | undefined, from: string, to: string): boolean {
  const timestamp = parseFlexibleDateValue(value);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const start = parseDateInputStart(from);
  const end = parseDateInputEnd(to);

  if (Number.isFinite(start) && timestamp < start) {
    return false;
  }

  if (Number.isFinite(end) && timestamp > end) {
    return false;
  }

  return true;
}

type RevenueChartGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

type ChartCustomerRow = {
  id: string;
  name: string;
  segment: CustomerSegment;
  value: number;
};

type ChartRevenuePoint = {
  label: string;
  value: number;
  displayValue: string;
};

const RUPEE_SYMBOL = '\u20B9';
const CHART_ROW_LIMIT = 10;

function formatRupeeAmount(value: number): string {
  return `${RUPEE_SYMBOL}${value.toLocaleString('en-IN')}`;
}

function resolveRevenueGranularity(
  dateRange: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom',
  startD: Date,
  endD: Date
): RevenueChartGranularity {
  if (dateRange === 'today' || dateRange === 'yesterday') {
    return 'hourly';
  }

  if (dateRange === 'last_7_days' || dateRange === 'last_30_days') {
    return 'daily';
  }

  if (dateRange === 'last_90_days') {
    return 'weekly';
  }

  if (dateRange === 'this_year') {
    return 'monthly';
  }

  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 2) {
    return 'hourly';
  }

  if (diffDays <= 45) {
    return 'daily';
  }

  if (diffDays <= 180) {
    return 'weekly';
  }

  return 'monthly';
}

function resolveRevenueTimelineLabel(
  dateRange: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom',
  granularity: RevenueChartGranularity
): string {
  if (dateRange === 'today') {
    return "TODAY'S TIMELINE";
  }

  if (dateRange === 'yesterday') {
    return "YESTERDAY'S TIMELINE";
  }

  if (dateRange === 'last_7_days') {
    return '7-DAY TIMELINE';
  }

  if (dateRange === 'last_30_days') {
    return '30-DAY TIMELINE';
  }

  if (dateRange === 'last_90_days') {
    return '90-DAY TIMELINE';
  }

  if (dateRange === 'this_year') {
    return 'YEARLY TIMELINE';
  }

  switch (granularity) {
    case 'hourly':
      return 'CUSTOM HOURLY TIMELINE';
    case 'daily':
      return 'CUSTOM DAILY TIMELINE';
    case 'weekly':
      return 'CUSTOM WEEKLY TIMELINE';
    default:
      return 'CUSTOM MONTHLY TIMELINE';
  }
}

function formatRevenuePointLabel(value: string, granularity: RevenueChartGranularity): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  if (granularity === 'hourly') {
    return parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  }

  if (granularity === 'monthly') {
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC'
    });
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function mapChartDateFilter(
  dateRange: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom'
): string {
  if (dateRange === 'today') {
    return 'today';
  }

  if (dateRange === 'yesterday') {
    return 'yesterday';
  }

  if (dateRange === 'last_7_days') {
    return 'last7days';
  }

  if (dateRange === 'last_30_days') {
    return 'last30days';
  }

  if (dateRange === 'last_90_days') {
    return 'last90days';
  }

  if (dateRange === 'this_year') {
    return 'thisyear';
  }

  return 'customdate';
}

function renderStatusBadge(
  category: 'order' | 'payment' | 'delivery' | 'fulfillment',
  value?: string | null,
  className = 'text-[11px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider border'
) {
  const trimmedValue = value?.trim() || '';
  if (!trimmedValue) {
    return <span className="text-[11px] text-text-secondary font-medium">-</span>;
  }

  const meta = getStatusBadgeMeta(category, trimmedValue);
  if (!meta) {
    return <span className={`${className} ${DEFAULT_STATUS_BADGE_META.className}`}>{trimmedValue}</span>;
  }

  return <span className={`${className} ${meta.className}`}>{meta.label}</span>;
}

function formatDeliveryDate(value?: string | null): string {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    return trimmed.split('T')[0];
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function renderDeliveryStatusCell(
  deliveryStatus?: string | null,
  deliveredAt?: string | null,
  align: 'left' | 'center' = 'left'
) {
  const deliveryDate = formatDeliveryDate(deliveredAt);

  return (
    <div className={`flex flex-row flex-wrap items-center gap-1.5 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
      {renderStatusBadge('delivery', deliveryStatus, 'text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border')}
      {deliveryDate && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-xxs whitespace-nowrap">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{deliveryDate}</span>
        </span>
      )}
    </div>
  );
}

function renderCheckoutStatusCell(
  completedAt?: string | null,
  align: 'left' | 'center' = 'left'
) {
  const trimmed = completedAt?.trim() || '';
  const hasCompletedAt = Boolean(trimmed) && trimmed !== '-';
  const statusLabel = hasCompletedAt ? 'Completed' : 'Pending';
  const statusDate = hasCompletedAt ? trimmed.split('T')[0] : '-';
  const statusClass = hasCompletedAt
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';
  const dateSlotClass = hasCompletedAt
    ? 'min-w-[88px] inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-semibold text-slate-600 shadow-xxs whitespace-nowrap font-mono'
    : 'min-w-[88px] inline-flex items-center justify-center px-2.5 py-1 text-[9px] font-semibold text-slate-500 whitespace-nowrap font-mono';

  return (
    <div className={`grid w-full grid-cols-[auto_minmax(88px,1fr)] items-center gap-2 whitespace-nowrap ${align === 'center' ? 'mx-auto' : ''}`}>
      <span className={`inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider border shadow-xxs whitespace-nowrap ${statusClass}`}>
        <span>{statusLabel}</span>
      </span>
      <span className={`justify-self-end ${dateSlotClass}`}>
        {statusDate}
      </span>
    </div>
  );
}

interface CustomerSegmentVisual {
  className: string;
  icon: React.ReactNode;
  label: string;
}

function renderCustomerSegmentVisual(value?: string | null): CustomerSegmentVisual {
  const normalized = value?.trim().toUpperCase() || '';

  switch (normalized) {
    case 'VIP':
      return {
        className: 'bg-[#fde047] text-[#713f12] border-[#f59e0b] shadow-[0_1px_0_rgba(245,158,11,0.25)] font-black',
        icon: <Star className="w-3.5 h-3.5 fill-[#d97706] text-[#b45309]" />,
        label: 'VIP'
      };
    case 'REGULAR':
      return {
        className: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: <Sparkles className="w-3 h-3" />,
        label: 'REGULAR'
      };
    case 'NEW':
      return {
        className: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: <Users className="w-3 h-3" />,
        label: 'NEW'
      };
    case 'INACTIVE':
      return {
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <X className="w-3 h-3" />,
        label: 'INACTIVE'
      };
    default:
      return {
        className: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: <Sparkles className="w-3 h-3" />,
        label: normalized || 'CUSTOMER'
      };
  }
}

const DATE_FILTER_ACCENT = '#4280ce';

export default function CustomerSummaryView({
  customers,
  leads = [],
  complaints = [],
  onUpdateCustomer,
  onNavigateToLead,
  onNavigateToTemplate,
  initialSelectedCustomerName,
  onClearSelectedCustomerName,
  isLoadingCustomers = false,
  customerLoadError = null,
  onRefreshCustomers,
  customerPageNo,
  customerPageSize,
  totalCustomerCount,
  onCustomerPageChange,
  onCustomerPageSizeChange,
  onShowToast,
  onCustomerQueryChange
}: CustomerSummaryViewProps) {
  // Navigation & Details States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);
  const [popupCustomer, setPopupCustomer] = useState<Customer | null>(null);
  const [popupActiveTab, setPopupActiveTab] = useState<'abandoned' | 'refunds' | 'discounts'>('abandoned');
  const [popupViewMode, setPopupViewMode] = useState<'full' | 'abandoned-only'>('full');
  const [abandonedCheckoutRows, setAbandonedCheckoutRows] = useState<CustomerAbandonedCheckout[]>([]);
  const [isAbandonedCheckoutsLoading, setIsAbandonedCheckoutsLoading] = useState(false);
  const [abandonedCheckoutsError, setAbandonedCheckoutsError] = useState<string | null>(null);
  const [abandonedCheckoutPage, setAbandonedCheckoutPage] = useState(1);
  const [refundRows, setRefundRows] = useState<CustomerRefund[]>([]);
  const [isRefundRowsLoading, setIsRefundRowsLoading] = useState(false);
  const [refundRowsError, setRefundRowsError] = useState<string | null>(null);
  const [refundPage, setRefundPage] = useState(1);
  const [discountRows, setDiscountRows] = useState<CustomerDiscount[]>([]);
  const [isDiscountRowsLoading, setIsDiscountRowsLoading] = useState(false);
  const [discountRowsError, setDiscountRowsError] = useState<string | null>(null);
  const [discountPage, setDiscountPage] = useState(1);
  const [activeQuickActionCustId, setActiveQuickActionCustId] = useState<string | null>(null);
  const [quickActionMenuPosition, setQuickActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  // Analytics Cards states
  const [chartDetails, setChartDetails] = useState<CustomerChartDetails | null>(null);
  const [isCard1Loading, setIsCard1Loading] = useState(true);
  const [isOtherCardsLoading, setIsOtherCardsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Date range filter states
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom'>(() => {
        return 'last_7_days';
  });
  
  const [customStart, setCustomStart] = useState<string>('');  
  const [customEnd, setCustomEnd] = useState<string>('')
  const [isDateRefetching, setIsDateRefetching] = useState(false);
  const [isSegmentRefetching, setIsSegmentRefetching] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  const [customerSegmentFilter, setCustomerSegmentFilter] = useState<'All' | 'VIP' | 'Regular' | 'New' | 'Inactive'>('All');
const closePopupCustomer = () => {
    setPopupCustomer(null);
    setPopupActiveTab('abandoned');
    setPopupViewMode('full');
    setAbandonedCheckoutRows([]);
    setAbandonedCheckoutsError(null);
    setIsAbandonedCheckoutsLoading(false);
    setAbandonedCheckoutPage(1);
    setRefundRows([]);
    setRefundRowsError(null);
    setIsRefundRowsLoading(false);
    setRefundPage(1);
    setDiscountRows([]);
    setDiscountRowsError(null);
    setIsDiscountRowsLoading(false);
    setDiscountPage(1);
  };
  // Helper to format Date as YYYY-MM-DD
  const getLocalDateString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const updateDateRange = (newRange: typeof dateRange) => {
    setDateRange(newRange);
  };

  const handleCustomStartChange = (val: string) => {
    setCustomStart(val);
  };

  const handleCustomEndChange = (val: string) => {
    setCustomEnd(val);
  };

  // Fallback dates if custom start/end are not chosen yet
  const fallbackStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return getLocalDateString(d);
  }, []);
  
  const fallbackEnd = useMemo(() => {
    return getLocalDateString(new Date());
  }, []);

  const [debouncedDate, setDebouncedDate] = useState({
    dateRange,
    customStart,
    customEnd
  });
  const [debouncedSegment, setDebouncedSegment] = useState<'All' | 'VIP' | 'Regular' | 'New' | 'Inactive'>('All');

  const prevValues = React.useRef({
    dateRange,
    customStart,
    customEnd,
    customerSegmentFilter
  });

  // Combine refetching and debounce logic
  React.useEffect(() => {
    const dateChanged = 
      dateRange !== prevValues.current.dateRange ||
      customStart !== prevValues.current.customStart ||
      customEnd !== prevValues.current.customEnd;
    
    const segmentChanged = customerSegmentFilter !== prevValues.current.customerSegmentFilter;

    if (dateChanged) {
      setIsDateRefetching(true);
    }
    if (segmentChanged) {
      setIsSegmentRefetching(true);
    }

    prevValues.current = { dateRange, customStart, customEnd, customerSegmentFilter };

    const timer = setTimeout(() => {
      if (dateChanged) {
        setDebouncedDate({ dateRange, customStart, customEnd });
        setIsDateRefetching(false);
      }
      if (segmentChanged) {
        setDebouncedSegment(customerSegmentFilter);
        setIsSegmentRefetching(false);
      }
    }, 250); // 250ms debounce window

    return () => clearTimeout(timer);
  }, [dateRange, customStart, customEnd, customerSegmentFilter]);

  const activeCustomStart = debouncedDate.customStart || fallbackStart;
  const activeCustomEnd = debouncedDate.customEnd || fallbackEnd;

    React.useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    const isCustomRange = debouncedDate.dateRange === 'custom';
    const customStartValue = customStart.trim();
    const customEndValue = customEnd.trim();
    const hasCustomDates = customStartValue.length > 0 && customEndValue.length > 0;

    if (isCustomRange && !hasCustomDates) {
      setIsCard1Loading(false);
      setIsOtherCardsLoading(false);
      return () => {
        controller.abort();
      };
    }

    setIsCard1Loading(true);
    setIsOtherCardsLoading(true);

    void (async () => {
      try {
        const requestOptions = {
          type: 'chart',
          dateFilter: mapChartDateFilter(debouncedDate.dateRange),
          signal: controller.signal
        } as const;

        const details = await exportCustomer360Customers(
          isCustomRange && hasCustomDates
            ? {
                ...requestOptions,
                startDate: customStartValue,
                endDate: customEndValue
              }
            : requestOptions
        );

        if (isActive) {
          setChartDetails(details);
        }
      } catch {
        if (isActive) {
          setChartDetails(null);
        }
      } finally {
        if (isActive) {
          setIsCard1Loading(false);
          setIsOtherCardsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [customEnd, customStart, debouncedDate.dateRange]);

  // 1. Get exact start/end dates for calculations based on debounced filter values
  const filterRange = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let start = new Date(today);
    start.setHours(0, 0, 0, 0);
    let end = new Date(today);
    
    const { dateRange: dRange } = debouncedDate;
    
    if (dRange === 'today') {
      // already today
    } else if (dRange === 'yesterday') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (dRange === 'last_7_days') {
      start.setDate(today.getDate() - 6);
    } else if (dRange === 'last_30_days') {
      start.setDate(today.getDate() - 29);
    } else if (dRange === 'last_90_days') {
      start.setDate(today.getDate() - 89);
    } else if (dRange === 'this_year') {
      start = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dRange === 'custom') {
      if (activeCustomStart) {
        start = new Date(activeCustomStart);
        start.setHours(0, 0, 0, 0);
      }
      if (activeCustomEnd) {
        end = new Date(activeCustomEnd);
        end.setHours(23, 59, 59, 999);
      }
    }
    
    return {
      startStr: getLocalDateString(start),
      endStr: getLocalDateString(end),
      startD: start,
      endD: end
    };
  }, [debouncedDate, activeCustomStart, activeCustomEnd]);

  const customerLookup = useMemo(() => {
    const lookup = new Map<string, Customer>();
 
    customers.forEach((customer) => {
      lookup.set(normalizeSearchText(customer.name), customer);
      lookup.set(customer.id, customer);
    });
 
    return lookup;
  }, [customers]);
 
  const resolveChartSegment = (
    entry: {
      customerName: string;
      customerId?: string;
      segment?: CustomerSegment | string;
    }
  ): CustomerSegment | undefined => {
    if (entry.segment === 'VIP' || entry.segment === 'Regular' || entry.segment === 'New' || entry.segment === 'Inactive') {
      return entry.segment;
    }
 
    if (entry.customerId && customerLookup.has(entry.customerId)) {
      return customerLookup.get(entry.customerId)?.segment;
    }
 
    return customerLookup.get(normalizeSearchText(entry.customerName))?.segment;
  };
 
  // 2. Compute dynamic data for cards
  const mostValuableData = useMemo(() => {
    const chartRows = chartDetails?.mostValuableCustomers || [];
    const segmentFilter = debouncedSegment;
 
    if (chartRows.length > 0) {
      const normalizedRows = chartRows
        .map((row, index) => ({
          id: row.customerId || `chart-spend-${index}`,
          name: formatCustomerDisplayName(row.customerName),
          segment: resolveChartSegment(row) || 'Inactive',
          value: row.lifeSpend
        }))
        .filter((item) => segmentFilter === 'All' || item.segment === segmentFilter)
        .slice(0, CHART_ROW_LIMIT);
 
      if (normalizedRows.length > 0 || segmentFilter === 'All') {
        return normalizedRows;
      }
    }
 
    const { startStr, endStr } = filterRange;
 
    return customers
      .map((customer) => {
        const filtered = (customer.orders || []).filter((order) => order.date >= startStr && order.date <= endStr);
        const spend = filtered.reduce((sum, order) => sum + order.amount, 0);
        return { id: customer.id, name: customer.name, segment: customer.segment, value: spend };
      })
      .filter((item) => {
        const matchesSegment = segmentFilter === 'All' || item.segment === segmentFilter;
        return matchesSegment && item.value > 0;
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, CHART_ROW_LIMIT);
  }, [chartDetails, customers, debouncedSegment, filterRange, customerLookup]);
 
  const highestOrderData = useMemo(() => {
    const chartRows = chartDetails?.highestOrderCustomers || [];
    const segmentFilter = debouncedSegment;
 
    if (chartRows.length > 0) {
      const normalizedRows = chartRows
        .map((row, index) => ({
          name: formatCustomerDisplayName(row.customerName),
          segment: resolveChartSegment(row) || 'Inactive',
          value: row.orderCount,
          id: row.customerId || `chart-order-${index}`
        }))
        .filter((item) => segmentFilter === 'All' || item.segment === segmentFilter)
        .slice(0, CHART_ROW_LIMIT);
 
      if (normalizedRows.length > 0 || segmentFilter === 'All') {
        return normalizedRows;
      }
    }
 
    const { startStr, endStr } = filterRange;
 
    return customers
      .map((customer) => {
        const filtered = (customer.orders || []).filter((order) => order.date >= startStr && order.date <= endStr);
        return { name: customer.name, segment: customer.segment, value: filtered.length };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, CHART_ROW_LIMIT);
  }, [chartDetails, customers, debouncedSegment, filterRange, customerLookup]);
  // 3. Compute dynamic line chart data for Revenue Analytics
  const currentChart = useMemo(() => {
    const revenueRows = chartDetails?.revenueAnalytics || [];
    const granularity = resolveRevenueGranularity(debouncedDate.dateRange, filterRange.startD, filterRange.endD);
    const chartTimelineLabel = resolveRevenueTimelineLabel(debouncedDate.dateRange, granularity);
 
    if (revenueRows.length > 0) {
      const points = [...revenueRows]
        .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())
        .map((row) => ({
          label: formatRevenuePointLabel(row.orderDate, granularity),
          value: row.revenue,
          displayValue: formatRupeeAmount(row.revenue)
        }));
 
      const totalRevenue = points.reduce((sum, point) => sum + point.value, 0);
 
      return {
        total: formatRupeeAmount(totalRevenue),
        timeline: resolveRevenueTimelineLabel(debouncedDate.dateRange, granularity),
        points
      };
    }
 
    return {
      total: formatRupeeAmount(0),
      timeline: chartTimelineLabel,
      points: []
    };
 
  }, [chartDetails, customers, debouncedDate.dateRange, filterRange]);
 

  const dateRangeLabels: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    last_7_days: 'Last 7 days',
    last_30_days: 'Last 30 days',
    last_90_days: 'Last 90 days',
    this_year: 'This year',
    custom: 'Custom range'
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const selectedLabel = dateRange === 'custom' && customStart && customEnd
    ? `${formatDisplayDate(customStart)} – ${formatDisplayDate(customEnd)}`
    : dateRangeLabels[dateRange];
  
  // Reset expanded order and filters on customer switch
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderMinAmount, setOrderMinAmount] = useState('');
  const [orderMaxAmount, setOrderMaxAmount] = useState('');
  const [selectedOrderStartDate, setSelectedOrderStartDate] = useState('');
  const [selectedOrderEndDate, setSelectedOrderEndDate] = useState('');
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] = useState('All');
  const [orderFulfillmentStatusFilter, setOrderFulfillmentStatusFilter] = useState('All');
  const [orderMinQty, setOrderMinQty] = useState('');
  const [orderMaxQty, setOrderMaxQty] = useState('');
  const [orderMinPrice, setOrderMinPrice] = useState('');
  const [orderMaxPrice, setOrderMaxPrice] = useState('');
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const orderPageSize = 20;

  React.useEffect(() => {
    setExpandedOrderIds({});
    setOrderSearchQuery('');
    setOrderStatusFilter('All');
    setOrderMinAmount('');
    setOrderMaxAmount('');
    setSelectedOrderStartDate('');
    setSelectedOrderEndDate('');
    setOrderPaymentStatusFilter('All');
    setOrderFulfillmentStatusFilter('All');
    setOrderMinQty('');
    setOrderMaxQty('');
    setOrderMinPrice('');
    setOrderMaxPrice('');
    setOrderCurrentPage(1);
  }, [selectedCustomer]);

  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1920));

  React.useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
    };
  }, []);

  const isCompactCustomerGrid = viewportWidth < 1750;
  const customerGridScale = isCompactCustomerGrid ? 0.82 : 1;
  const customerGridRowTextClass = isCompactCustomerGrid ? 'text-[11px] leading-tight' : 'text-[13.5px]';
  const customerGridHeaderTextClass = isCompactCustomerGrid ? 'text-[8.5px] leading-tight tracking-tight' : 'text-[10.5px] leading-none tracking-tight';
  const customerGridHeaderPaddingClass = isCompactCustomerGrid ? 'py-1 px-2' : 'py-2 px-3.5';
  const customerGridCellPaddingClass = isCompactCustomerGrid ? 'py-1 px-2' : 'py-2 px-3.5';
  const customerGridNameTextClass = isCompactCustomerGrid
    ? 'text-[11px] font-bold text-text-primary hover:text-brand-primary cursor-pointer hover:underline break-words leading-tight'
    : 'text-[14px] font-bold text-text-primary hover:text-brand-primary cursor-pointer hover:underline truncate';
  const customerGridEmailTextClass = isCompactCustomerGrid
    ? 'text-[11px] text-text-primary font-medium break-words leading-tight'
    : 'text-[14px] text-text-primary font-medium truncate';
  const customerGridCountryTextClass = isCompactCustomerGrid
    ? 'text-[11px] text-text-secondary font-medium break-words leading-tight'
    : 'text-[14px] text-text-secondary font-medium truncate';
  const customerGridLocationTextClass = isCompactCustomerGrid
    ? 'text-[10.5px] text-text-secondary font-medium whitespace-normal break-words leading-snug'
    : 'text-[13px] text-text-secondary font-medium whitespace-normal break-words leading-snug';
  const customerGridNumericTextClass = isCompactCustomerGrid
    ? 'text-[11px]'
    : 'text-[14px]';
  const customerGridBadgeTextClass = isCompactCustomerGrid
    ? 'text-[7.5px]'
    : 'text-[9px] sm:text-[10px] lg:text-[10.5px]';
  const customerGridActionCellClass = isCompactCustomerGrid ? 'py-1 px-2' : 'py-2 px-2';

  const [showSegmentSettings, setShowSegmentSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Individual filters states
  const [showFilterConsole, setShowFilterConsole] = useState(false);
  const [showOrderProductFilters, setShowOrderProductFilters] = useState(false);
  const [draftFilterCustomerName, setDraftFilterCustomerName] = useState('');
  const [draftFilterEmailPhone, setDraftFilterEmailPhone] = useState('');
  const [draftFilterCountry, setDraftFilterCountry] = useState('');
  const [draftFilterMinSpend, setDraftFilterMinSpend] = useState('');
  const [draftFilterMaxSpend, setDraftFilterMaxSpend] = useState('');
  const [draftFilterOrderId, setDraftFilterOrderId] = useState('');
  const [draftOrderStartDate, setDraftOrderStartDate] = useState('');
  const [draftOrderEndDate, setDraftOrderEndDate] = useState('');
  const [draftFilterPaymentStatus, setDraftFilterPaymentStatus] = useState('All');
  const [draftFilterLastOrderDateFrom, setDraftFilterLastOrderDateFrom] = useState('');
  const [draftFilterLastOrderDateTo, setDraftFilterLastOrderDateTo] = useState('');
  const [draftFilterLastLoginFrom, setDraftFilterLastLoginFrom] = useState('');
  const [draftFilterLastLoginTo, setDraftFilterLastLoginTo] = useState('');
  const [draftFilterCreatedDateFrom, setDraftFilterCreatedDateFrom] = useState('');
  const [draftFilterCreatedDateTo, setDraftFilterCreatedDateTo] = useState('');
  const [draftFilterDeliveryFrom, setDraftFilterDeliveryFrom] = useState('');
  const [draftFilterDeliveryTo, setDraftFilterDeliveryTo] = useState('');
  const [draftFilterFulfillmentStatus, setDraftFilterFulfillmentStatus] = useState('All');
  const [draftFilterDeliveryStatus, setDraftFilterDeliveryStatus] = useState('All');
  const [draftFilterProductName, setDraftFilterProductName] = useState('');
  const [draftFilterVariant, setDraftFilterVariant] = useState('');

  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterEmailPhone, setFilterEmailPhone] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterMinSpend, setFilterMinSpend] = useState('');
  const [filterMaxSpend, setFilterMaxSpend] = useState('');
  const [filterOrderId, setFilterOrderId] = useState('');
  const [filterOrderStartDate, setFilterOrderStartDate] = useState('');
  const [filterOrderEndDate, setFilterOrderEndDate] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState('All');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('All');
  const [filterLastOrderDateFrom, setFilterLastOrderDateFrom] = useState('');
  const [filterLastOrderDateTo, setFilterLastOrderDateTo] = useState('');
  const [filterLastLoginFrom, setFilterLastLoginFrom] = useState('');
  const [filterLastLoginTo, setFilterLastLoginTo] = useState('');
  const [filterCreatedDateFrom, setFilterCreatedDateFrom] = useState('');
  const [filterCreatedDateTo, setFilterCreatedDateTo] = useState('');
  const [filterDeliveryFrom, setFilterDeliveryFrom] = useState('');
  const [filterDeliveryTo, setFilterDeliveryTo] = useState('');
  const [filterFulfillmentStatus, setFilterFulfillmentStatus] = useState('All');
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState('All');
  const [filterProductName, setFilterProductName] = useState('');
  const [filterVariant, setFilterVariant] = useState('');

  const spendFilterErrors = React.useMemo(
    () => validateSpendRange(draftFilterMinSpend, draftFilterMaxSpend),
    [draftFilterMinSpend, draftFilterMaxSpend]
  );

  const [segmentFilter, setSegmentFilter] = useState('All');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');

  const compactFilterLabelClass = 'block text-[9.5px] font-bold text-gray-500 mb-1';
  const compactTextInputClass = 'w-full h-8 rounded-md border border-gray-300 bg-white px-2.5 text-[11px] text-gray-700 placeholder:text-gray-400 shadow-xxs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15';
  const compactDateInputClass = 'w-full h-8 rounded-md border border-gray-300 bg-white px-2 text-[11px] text-gray-700 shadow-xxs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15';
  const compactSelectClass = 'w-full h-8 rounded-md border border-gray-300 bg-white px-2.5 text-[11px] text-gray-700 shadow-xxs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 cursor-pointer';
  const compactActionButtonClass = 'w-full h-8 rounded-md px-2 text-[11px] font-bold shadow-xxs transition-all flex items-center justify-center gap-1 cursor-pointer';

  const applyCustomerFilters = () => {
    if (spendFilterErrors.minSpend || spendFilterErrors.maxSpend) {
      const validationMessage = [spendFilterErrors.minSpend, spendFilterErrors.maxSpend]
        .filter(Boolean)
        .join(' ');

      onShowToast?.(validationMessage || 'Please enter a valid lifetime spend range.');
      return;
    }

    setFilterCustomerName(draftFilterCustomerName);
    setFilterEmailPhone(draftFilterEmailPhone);
    setFilterCountry(draftFilterCountry);
    setFilterMinSpend(draftFilterMinSpend);
    setFilterMaxSpend(draftFilterMaxSpend);
    setFilterOrderId(draftFilterOrderId);
    setFilterOrderStartDate(draftOrderStartDate);
    setFilterOrderEndDate(draftOrderEndDate);
    setFilterPaymentStatus(draftFilterPaymentStatus);
    setOrderPaymentStatusFilter(draftFilterPaymentStatus);
    setFilterLastOrderDateFrom(draftFilterLastOrderDateFrom);
    setFilterLastOrderDateTo(draftFilterLastOrderDateTo);
    setFilterLastLoginFrom(draftFilterLastLoginFrom);
    setFilterLastLoginTo(draftFilterLastLoginTo);
    setFilterCreatedDateFrom(draftFilterCreatedDateFrom);
    setFilterCreatedDateTo(draftFilterCreatedDateTo);
    setFilterDeliveryFrom(draftFilterDeliveryFrom);
    setFilterDeliveryTo(draftFilterDeliveryTo);
    setFilterFulfillmentStatus(draftFilterFulfillmentStatus);
    setFilterDeliveryStatus(draftFilterDeliveryStatus);
    setFilterProductName(draftFilterProductName);
    setFilterVariant(draftFilterVariant);
    setSelectedCustomer(null);
    setExpandedOrderIds({});
    onCustomerPageChange(1);
  };

  const clearCustomerFilters = () => {
    setDraftFilterCustomerName('');
    setDraftFilterEmailPhone('');
    setDraftFilterCountry('');
    setDraftFilterMinSpend('');
    setDraftFilterMaxSpend('');
    setDraftFilterOrderId('');
    setDraftOrderStartDate('');
    setDraftOrderEndDate('');
    setDraftFilterPaymentStatus('All');
    setDraftFilterLastOrderDateFrom('');
    setDraftFilterLastOrderDateTo('');
    setDraftFilterLastLoginFrom('');
    setDraftFilterLastLoginTo('');
    setDraftFilterCreatedDateFrom('');
    setDraftFilterCreatedDateTo('');
    setDraftFilterDeliveryFrom('');
    setDraftFilterDeliveryTo('');
    setDraftFilterFulfillmentStatus('All');
    setDraftFilterDeliveryStatus('All');
    setDraftFilterProductName('');
    setDraftFilterVariant('');

    setFilterCustomerName('');
    setFilterEmailPhone('');
    setFilterCountry('');
    setFilterMinSpend('');
    setFilterMaxSpend('');
    setFilterOrderId('');
    setFilterOrderStartDate('');
    setFilterOrderEndDate('');
    setFilterPaymentStatus('All');
    setOrderPaymentStatusFilter('All');
    setFilterLastOrderDateFrom('');
    setFilterLastOrderDateTo('');
    setFilterLastLoginFrom('');
    setFilterLastLoginTo('');
    setFilterCreatedDateFrom('');
    setFilterCreatedDateTo('');
    setFilterDeliveryFrom('');
    setFilterDeliveryTo('');
    setFilterFulfillmentStatus('All');
    setFilterDeliveryStatus('All');
    setFilterProductName('');
    setFilterVariant('');
    setSelectedCustomer(null);
    setExpandedOrderIds({});
    onCustomerPageChange(1);
  };

  React.useEffect(() => {
    if (!onCustomerQueryChange) {
      return;
    }

    onCustomerQueryChange({
      customerType: segmentFilter as 'All' | CustomerSegment,
      customerNameOrId: filterCustomerName.trim(),
      emailOrPhone: filterEmailPhone.trim(),
      country: filterCountry.trim(),
      lifetimeSpend: filterMinSpend.trim(),
      lifetimeSpendMin: filterMinSpend.trim(),
      lifetimeSpendMax: filterMaxSpend.trim(),
      orderId: filterOrderId.trim(),
      orderDateFrom: filterOrderStartDate.trim(),
      orderDateTo: filterOrderEndDate.trim(),
      paymentStatus: filterPaymentStatus.trim(),
      lastOrderDateFrom: filterLastOrderDateFrom.trim(),
      lastOrderDateTo: filterLastOrderDateTo.trim(),
      lastLoginFrom: filterLastLoginFrom.trim(),
      lastLoginTo: filterLastLoginTo.trim(),
      createdDateFrom: filterCreatedDateFrom.trim(),
      createdDateTo: filterCreatedDateTo.trim(),
      deliveryFrom: filterDeliveryFrom.trim(),
      deliveryTo: filterDeliveryTo.trim(),
      fulfillmentStatus: filterFulfillmentStatus.trim(),
      deliveryStatus: filterDeliveryStatus.trim(),
      productName: filterProductName.trim(),
      productVariant: filterVariant.trim()
    });
  }, [
    segmentFilter,
    filterCustomerName,
    filterEmailPhone,
    filterCountry,
    filterMinSpend,
    filterMaxSpend,
    filterOrderId,
    filterOrderStartDate,
    filterOrderEndDate,
    filterPaymentStatus,
    filterLastOrderDateFrom,
    filterLastOrderDateTo,
    filterLastLoginFrom,
    filterLastLoginTo,
    filterCreatedDateFrom,
    filterCreatedDateTo,
    filterDeliveryFrom,
    filterDeliveryTo,
    filterFulfillmentStatus,
    filterDeliveryStatus,
    filterProductName,
    filterVariant,
    onCustomerQueryChange
  ]);

  // Customer Actions dropdown inside the panel
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showActionConfirmationModal, setShowActionConfirmationModal] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<'VIP' | 'Welcome' | 'Normal' | null>(null);

  // VIP Action Modal Checkboxes State
  const [vipCheckboxes, setVipCheckboxes] = useState({
    thankYou: true,
    benefits: true,
    discounts: true,
    earlyAccess: false,
    loyaltyInvite: false
  });

  // Selected customers for bulk rewards
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  
  // Send Reward Modal states
  const [isSendRewardModalOpen, setIsSendRewardModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed Amount' | ''>('');
  const [discountValue, setDiscountValue] = useState<number | string>('');
  const [couponCode, setCouponCode] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTill, setValidTill] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [minimumOrderAmount, setMinimumOrderAmount] = useState('');
  const [couponGridStatus, setCouponGridStatus] = useState<'Active' | 'In Active'>('Active');
  const [notifyVia, setNotifyVia] = useState<'Email' | 'WhatsApp' | 'Both' | ''>('');
  const [couponFormErrors, setCouponFormErrors] = useState<{[key: string]: string}>({});

  const getMinStartDateTime = () => {
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    return (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
  };

  // On mount/update check if we were passed an initial selected customer from another module
  React.useEffect(() => {
    if (!initialSelectedCustomerName || isLoadingCustomers) {
      return;
    }

    const match = customers.find(c => c.name.toLowerCase().includes(initialSelectedCustomerName.toLowerCase()));
    if (match) {
      setSelectedCustomer(match);
    }
    onClearSelectedCustomerName();
  }, [initialSelectedCustomerName, customers, isLoadingCustomers, onClearSelectedCustomerName]);

  // SEGMENTATION SETTINGS STATE
  const [dynamicSegEnabled, setDynamicSegEnabled] = useState(true);
  const [spendThreshold, setSpendThreshold] = useState(150000);
  const [orderThreshold, setOrderThreshold] = useState(10);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    if (isExportingExcel) {
      return;
    }

    setIsExportingExcel(true);

    try {
      const filename = await exportCustomer360Customers({ type: 'excel' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export customer data.';
      alert(message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setOrderSearchQuery('');
    clearCustomerFilters();
    setFilterOrderStatus('All');
    setSegmentFilter('All');
    setLeadStatusFilter('All');
    setSortColumn(null);
    setSortDirection(null);
    setSelectedCustomer(null);
    setShowFilterConsole(false);
    setShowOrderProductFilters(false);
    onCustomerPageChange(1);
    onRefreshCustomers('All');
  };

  const closeQuickActionMenu = () => {
    setActiveQuickActionCustId(null);
    setQuickActionMenuPosition(null);
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      // 1. Customer segment is now resolved by the backend customerType filter.
      // Keep local filtering for the other grid controls only.
      if (leadStatusFilter !== 'All' && cust.leadStatus !== leadStatusFilter) return false;

      // 2. Individual Customer Name filter
      if (filterCustomerName.trim() !== '') {
        const query = normalizeSearchText(filterCustomerName);
        if (!normalizeSearchText(cust.name).includes(query) && !normalizeSearchText(cust.id).includes(query)) {
          return false;
        }
      }

      // 3. Individual Email/Phone filter
      if (filterEmailPhone.trim() !== '') {
        const query = normalizeSearchText(filterEmailPhone);
        if (!normalizeSearchText(cust.email).includes(query) && !normalizeSearchText(cust.phone).includes(query)) {
          return false;
        }
      }

      // 4. Individual Country filter
      if (filterCountry.trim() !== '') {
        const query = normalizeSearchText(filterCountry);
        if (!normalizeSearchText(cust.country).includes(query)) {
          return false;
        }
      }

      // 5. Customer timeline filters
      if ((filterLastOrderDateFrom.trim() !== '' || filterLastOrderDateTo.trim() !== '') && !isDateWithinRange(cust.lastOrderDate, filterLastOrderDateFrom, filterLastOrderDateTo)) {
        return false;
      }

      if ((filterLastLoginFrom.trim() !== '' || filterLastLoginTo.trim() !== '') && !isDateWithinRange(cust.lastLogin, filterLastLoginFrom, filterLastLoginTo)) {
        return false;
      }

      const createdDateValue = cust.createdAt || cust.storeInfo?.joinedDate;
      if ((filterCreatedDateFrom.trim() !== '' || filterCreatedDateTo.trim() !== '') && !isDateWithinRange(createdDateValue, filterCreatedDateFrom, filterCreatedDateTo)) {
        return false;
      }

      if ((filterDeliveryFrom.trim() !== '' || filterDeliveryTo.trim() !== '')) {
        const hasMatchingDeliveryDate = cust.orders?.some(order => isDateWithinRange(order.deliveredAt, filterDeliveryFrom, filterDeliveryTo));
        if (!hasMatchingDeliveryDate) {
          return false;
        }
      }

      // 6. Individual Total Spend filter
      if (filterMinSpend.trim() !== '') {
        const minSpend = parseSpendFilterValue(filterMinSpend);
        if (Number.isFinite(minSpend) && cust.totalSpend < minSpend) {
          return false;
        }
      }

      if (filterMaxSpend.trim() !== '') {
        const maxSpend = parseSpendFilterValue(filterMaxSpend);
        if (Number.isFinite(maxSpend) && cust.totalSpend > maxSpend) {
          return false;
        }
      }

      // 7. Individual Order ID filter
      if (filterOrderId.trim() !== '') {
        const query = normalizeSearchText(filterOrderId);
        const hasMatchingOrder = cust.orders?.some(o => normalizeSearchText(o.orderId).includes(query));
        if (!hasMatchingOrder) return false;
      }

      // 8. Individual Order Status filter
      if (filterOrderStatus !== 'All') {
        const query = normalizeStatusCode(filterOrderStatus);
        const hasMatchingOrder = cust.orders?.some(o => normalizeStatusCode(o.status) === query);
        if (!hasMatchingOrder) return false;
      }

      // 9. Individual Payment Status filter
      if (filterPaymentStatus !== 'All') {
        const query = normalizeStatusCode(filterPaymentStatus);
        const hasMatchingOrder = cust.orders?.some(o => normalizeStatusCode(o.paymentStatus) === query);
        if (!hasMatchingOrder) return false;
      }

      // 10. Individual Fulfillment Status filter
      if (filterFulfillmentStatus !== 'All') {
        const query = normalizeStatusCode(filterFulfillmentStatus);
        const hasMatchingOrder = cust.orders?.some(o => normalizeStatusCode(o.fulfillmentStatus) === query);
        if (!hasMatchingOrder) return false;
      }

      // 11. Individual Delivery Status filter
      if (filterDeliveryStatus !== 'All') {
        const query = normalizeStatusCode(filterDeliveryStatus);
        const hasMatchingOrder = cust.orders?.some(o => normalizeStatusCode(o.deliveryStatus) === query);
        if (!hasMatchingOrder) return false;
      }

      // 12. Individual Product Name filter
      if (filterProductName.trim() !== '') {
        const query = normalizeSearchText(filterProductName);
        const hasMatchingProduct = cust.products?.some(p => {
          return [
            p.name,
            p.variant,
            p.productType,
            p.vendor,
            p.sku,
            p.orderName
          ].some((field) => field ? normalizeSearchText(field).includes(query) : false);
        });
        if (!hasMatchingProduct) return false;
      }

      // 13. Individual Variant filter
      if (filterVariant.trim() !== '') {
        const query = normalizeSearchText(filterVariant);
        const hasMatchingVariant = cust.products?.some(p => normalizeSearchText(p.variant).includes(query));
        if (!hasMatchingVariant) return false;
      }

      return true;
    });
  }, [
    customers,
    segmentFilter,
    leadStatusFilter,
    filterCustomerName,
    filterEmailPhone,
    filterCountry,
    filterMinSpend,
    filterMaxSpend,
    filterLastOrderDateFrom,
    filterLastOrderDateTo,
    filterLastLoginFrom,
    filterLastLoginTo,
    filterCreatedDateFrom,
    filterCreatedDateTo,
    filterDeliveryFrom,
    filterDeliveryTo,
    filterOrderId,
    filterOrderStatus,
    filterPaymentStatus,
    filterFulfillmentStatus,
    filterDeliveryStatus,
    filterProductName,
    filterVariant
  ]);

  // Filtered and paginated orders list
  const filteredAndPaginatedOrders = useMemo(() => {
    if (!selectedCustomer || !selectedCustomer.orders) {
      return { total: 0, items: [], totalPages: 1 };
    }

    let items = [...selectedCustomer.orders];

    const getOrderSearchText = (order: CustomerOrder) => {
      const lineItems = order.lineItems || [];
      const lineItemText = lineItems
        .map(item => [item.name, item.productType, item.vendor, item.variant, item.sku].filter(Boolean).join(' '))
        .join(' ');
      return normalizeSearchText([order.orderId, order.name, lineItemText].filter(Boolean).join(' '));
    };

    const getOrderSummary = (order: CustomerOrder) => {
      const lineItems = order.lineItems || [];
      const totalQty = lineItems.reduce((sum, item) => sum + (item.qty || 0), 0);
      const primaryItem = lineItems[0] || null;
      const maxUnitPrice = lineItems.reduce((max, item) => Math.max(max, item.price || 0), 0);
      return { lineItems, totalQty, primaryItem, maxUnitPrice };
    };

    // Filter by Order ID / Order Name / Product fields
    if (orderSearchQuery.trim() !== '') {
      const q = normalizeSearchText(orderSearchQuery);
      items = items.filter(o => {
        const searchText = getOrderSearchText(o);
        return searchText.includes(q);
      });
    }

    // Apply global individual filters if set
    if (filterOrderId.trim() !== '') {
      const q = normalizeSearchText(filterOrderId);
      items = items.filter(o => normalizeSearchText(o.orderId).includes(q));
    }
    if (filterOrderStatus !== 'All') {
      const q = normalizeStatusCode(filterOrderStatus);
      items = items.filter(o => normalizeStatusCode(o.status) === q);
    }
    if (filterPaymentStatus !== 'All') {
      const q = normalizeStatusCode(filterPaymentStatus);
      items = items.filter(o => normalizeStatusCode(o.paymentStatus) === q);
    }
    if (filterDeliveryFrom.trim() !== '' || filterDeliveryTo.trim() !== '') {
      items = items.filter(o => isDateWithinRange(o.deliveredAt, filterDeliveryFrom, filterDeliveryTo));
    }
    if (filterProductName.trim() !== '') {
      const q = normalizeSearchText(filterProductName);
      items = items.filter(o => {
        const summary = getOrderSummary(o);
        return summary.lineItems.some(item => {
          return [
            item.name,
            item.productType,
            item.vendor,
            item.variant,
            item.sku
          ].some((field) => field ? normalizeSearchText(field).includes(q) : false);
        });
      });
    }
    if (filterVariant.trim() !== '') {
      const q = normalizeSearchText(filterVariant);
      items = items.filter(o => {
        const summary = getOrderSummary(o);
        return summary.lineItems.some(item => normalizeSearchText(item.variant).includes(q));
      });
    }

    // Filter by Order Status
    if (orderStatusFilter !== 'All') {
      const q = normalizeStatusCode(orderStatusFilter);
      items = items.filter(o => normalizeStatusCode(o.status) === q);
    }

    // Filter by Fulfillment Status
    if (orderFulfillmentStatusFilter !== 'All') {
      const q = normalizeStatusCode(orderFulfillmentStatusFilter);
      items = items.filter(o => normalizeStatusCode(o.fulfillmentStatus) === q);
    }

    // Filter by Payment Status
    if (orderPaymentStatusFilter !== 'All') {
      const q = normalizeStatusCode(orderPaymentStatusFilter);
      items = items.filter(o => normalizeStatusCode(o.paymentStatus) === q);
    }

    // Filter by Order Amount (Between / Range)
    if (orderMinAmount.trim() !== '') {
      const minVal = parseFloat(orderMinAmount);
      if (!isNaN(minVal)) {
        items = items.filter(o => (o.totalAmount ?? o.amount) >= minVal);
      }
    }
    if (orderMaxAmount.trim() !== '') {
      const maxVal = parseFloat(orderMaxAmount);
      if (!isNaN(maxVal)) {
        items = items.filter(o => (o.totalAmount ?? o.amount) <= maxVal);
      }
    }

    // Filter by Order Date (Between / Range)
    if (selectedOrderStartDate.trim() !== '') {
      items = items.filter(o => o.date >= selectedOrderStartDate);
    }
    if (selectedOrderEndDate.trim() !== '') {
      items = items.filter(o => o.date <= selectedOrderEndDate);
    }

    // Filter by Child fields: Qty & Price
    items = items.filter(o => {
      const summary = getOrderSummary(o);
      const primaryItem = summary.primaryItem;
      const qtyValue = summary.totalQty;
      const priceValue = primaryItem?.price ?? 0;
      
      // Qty Range
      if (orderMinQty.trim() !== '') {
        const minQty = parseInt(orderMinQty, 10);
        if (!isNaN(minQty) && qtyValue < minQty) return false;
      }
      if (orderMaxQty.trim() !== '') {
        const maxQty = parseInt(orderMaxQty, 10);
        if (!isNaN(maxQty) && qtyValue > maxQty) return false;
      }

      // Price Range
      if (orderMinPrice.trim() !== '') {
        const minPrice = parseFloat(orderMinPrice);
        if (!isNaN(minPrice) && priceValue < minPrice) return false;
      }
      if (orderMaxPrice.trim() !== '') {
        const maxPrice = parseFloat(orderMaxPrice);
        if (!isNaN(maxPrice) && priceValue > maxPrice) return false;
      }

      return true;
    });

    const total = items.length;
    const totalPages = Math.ceil(total / orderPageSize);

    // Slice for current page
    const startIndex = (orderCurrentPage - 1) * orderPageSize;
    const paginatedItems = items.slice(startIndex, startIndex + orderPageSize);

    return {
      total,
      items: paginatedItems,
      totalPages: totalPages === 0 ? 1 : totalPages
    };
  }, [
    selectedCustomer,
    orderSearchQuery,
    orderStatusFilter,
    orderMinAmount,
    orderMaxAmount,
    selectedOrderStartDate,
    selectedOrderEndDate,
    orderPaymentStatusFilter,
    orderFulfillmentStatusFilter,
    orderMinQty,
    orderMaxQty,
    orderMinPrice,
    orderMaxPrice,
    orderCurrentPage,
    filterOrderId,
    filterOrderStatus,
    filterPaymentStatus,
    filterProductName,
    filterVariant
  ]);

  // Sorting & Pagination States
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const customerGrid = useResizableColumns(CUSTOMER_GRID_COLUMNS);
  const compactOrderGrid = useResizableColumns(COMPACT_ORDER_GRID_COLUMNS);
  const detailedOrderGrid = useResizableColumns(DETAILED_ORDER_GRID_COLUMNS);

  // Sorting Handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    onCustomerPageChange(1);
  };

  const renderResizableHeader = (
    grid: ReturnType<typeof useResizableColumns>,
    columnId: string,
    content: React.ReactNode,
    className: string,
    onClick?: () => void
  ) => {
    const clickable = Boolean(onClick);
    return (
      <th
        style={grid.getColStyle(columnId)}
        className={`${className} relative group overflow-hidden`}
        onClick={onClick}
      >
        <div className={`flex items-center ${isCompactCustomerGrid ? 'justify-start gap-0.5 pr-1' : 'justify-between gap-0.5 pr-2'} min-w-0 ${clickable ? 'cursor-pointer select-none' : ''}`}>
          <span className={`min-w-0 ${isCompactCustomerGrid ? 'flex-1 whitespace-normal break-words' : 'flex-none whitespace-nowrap'} ${customerGridHeaderTextClass}`}>{content}</span>
          <ResizeHandle
            columnId={columnId}
            onResizeStart={grid.startResize}
            onResizeMove={grid.handleResizeMove}
            onResizeEnd={grid.handleResizeEnd}
          />
        </div>
      </th>
    );
  };

  const sortedCustomers = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredCustomers;
    return [...filteredCustomers].sort((a, b) => {
      if (sortColumn === 'totalOrders') {
        const countA = getFrontendOrderCount(a);
        const countB = getFrontendOrderCount(b);
        return sortDirection === 'asc'
          ? countA - countB
          : countB - countA;
      }

      let valA = a[sortColumn as keyof Customer];
      let valB = b[sortColumn as keyof Customer];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string' || typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      } else {
        const numA = Number(valA);
        const numB = Number(valB);
        return sortDirection === 'asc' 
          ? (numA > numB ? 1 : -1) 
          : (numB > numA ? 1 : -1);
      }
    });
  }, [filteredCustomers, sortColumn, sortDirection]);

  const paginatedCustomers = useMemo(() => {
    return sortedCustomers.slice(0, customerPageSize);
  }, [sortedCustomers, customerPageSize]);

  const totalPages = Math.ceil(totalCustomerCount / customerPageSize) || 1;
  const abandonedCheckoutPageSize = 5;
  const abandonedCheckoutTotalPages = Math.ceil(abandonedCheckoutRows.length / abandonedCheckoutPageSize) || 1;
  const abandonedCheckoutPaginatedRows = useMemo(() => {
    const startIndex = (abandonedCheckoutPage - 1) * abandonedCheckoutPageSize;
    return abandonedCheckoutRows.slice(startIndex, startIndex + abandonedCheckoutPageSize);
  }, [abandonedCheckoutRows, abandonedCheckoutPage]);
  const refundPageSize = 5;
  const refundTotalPages = Math.ceil(refundRows.length / refundPageSize) || 1;
  const refundPaginatedRows = useMemo(() => {
    const startIndex = (refundPage - 1) * refundPageSize;
    return refundRows.slice(startIndex, startIndex + refundPageSize);
  }, [refundRows, refundPage]);
  const discountPageSize = 5;
  const discountTotalPages = Math.ceil(discountRows.length / discountPageSize) || 1;
  const discountPaginatedRows = useMemo(() => {
    const startIndex = (discountPage - 1) * discountPageSize;
    return discountRows.slice(startIndex, startIndex + discountPageSize);
  }, [discountRows, discountPage]);
 
  React.useEffect(() => {
    if (abandonedCheckoutPage > abandonedCheckoutTotalPages) {
      setAbandonedCheckoutPage(abandonedCheckoutTotalPages);
    }
  }, [abandonedCheckoutPage, abandonedCheckoutTotalPages]);
 
  React.useEffect(() => {
    if (refundPage > refundTotalPages) {
      setRefundPage(refundTotalPages);
    }
  }, [refundPage, refundTotalPages]);
 
  React.useEffect(() => {
    if (discountPage > discountTotalPages) {
      setDiscountPage(discountTotalPages);
    }
  }, [discountPage, discountTotalPages]);
  const SortArrow = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <span className="text-gray-300 ml-1">↕</span>;
    if (sortDirection === 'asc') return <span className="text-brand-primary font-bold ml-1">↑</span>;
    return <span className="text-brand-primary font-bold ml-1">↓</span>;
  };

    React.useEffect(() => {
    if (!popupCustomer || popupActiveTab !== 'abandoned') {
      return;
    }
 
    setAbandonedCheckoutPage(1);
 
    const controller = new AbortController();
    let isActive = true;
 
    const loadAbandonedCheckouts = async () => {
      setIsAbandonedCheckoutsLoading(true);
      setAbandonedCheckoutsError(null);
 
      try {
        const rows = await fetchAbandonedCheckoutsByCustomerId({
          customerId: popupCustomer.id,
          signal: controller.signal
        });
 
        if (!isActive) {
          return;
        }
 
        setAbandonedCheckoutRows(rows);
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }
 
        const message = error instanceof Error ? error.message : 'Failed to load abandoned checkout rows.';
        setAbandonedCheckoutRows([]);
        setAbandonedCheckoutsError(message);
      } finally {
        if (isActive) {
          setIsAbandonedCheckoutsLoading(false);
        }
      }
    };
 
    void loadAbandonedCheckouts();
 
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [popupCustomer?.id, popupActiveTab]);
 
  React.useEffect(() => {
    if (!popupCustomer || popupActiveTab !== 'refunds') {
      return;
    }
 
    setRefundPage(1);
 
    const controller = new AbortController();
    let isActive = true;
 
    const loadRefundRows = async () => {
      setIsRefundRowsLoading(true);
      setRefundRowsError(null);
 
      try {
        const rows = await fetchCustomerRefundsByCustomerId({
          customerId: popupCustomer.id,
          signal: controller.signal
        });
 
        if (!isActive) {
          return;
        }
 
        setRefundRows(rows);
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }
 
        const message = error instanceof Error ? error.message : 'Failed to load refund rows.';
        setRefundRows([]);
        setRefundRowsError(message);
      } finally {
        if (isActive) {
          setIsRefundRowsLoading(false);
        }
      }
    };
 
    void loadRefundRows();
 
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [popupCustomer?.id, popupActiveTab]);
 
  React.useEffect(() => {
    if (!popupCustomer || popupActiveTab !== 'discounts') {
      return;
    }
 
    setDiscountPage(1);
 
    const controller = new AbortController();
    let isActive = true;
 
    const loadDiscountRows = async () => {
      setIsDiscountRowsLoading(true);
      setDiscountRowsError(null);
 
      try {
        const rows = await fetchCustomerDiscountsByCustomerId({
          customerId: popupCustomer.id,
          signal: controller.signal
        });
 
        if (!isActive) {
          return;
        }
 
        setDiscountRows(rows);
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }
 
        const message = error instanceof Error ? error.message : 'Failed to load discount rows.';
        setDiscountRows([]);
        setDiscountRowsError(message);
      } finally {
        if (isActive) {
          setIsDiscountRowsLoading(false);
        }
      }
    };
 
    void loadDiscountRows();
 
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [popupCustomer?.id, popupActiveTab]);
 
  // Actions dropdown handler
  const handleActionClick = (type: 'VIP' | 'Welcome' | 'Normal') => {
    setSelectedActionType(type);
    setShowActionsDropdown(false);
    setShowActionConfirmationModal(true);
  };

  // Confirm communication action toast
  const handleConfirmAction = () => {
    setShowActionConfirmationModal(false);
    alert(`Communication Queued Successfully!\nAn email draft has been created for ${selectedCustomer?.name} via Shopify Admin template connection.`);
  };

  // Segmentation settings save trigger
  const handleSaveSegmentationSettings = () => {
    alert('CRM Customer Segmentation rules updated!\nCustomers will be dynamically re-categorized in the background based on the spend and order criteria.');
    setShowSegmentSettings(false);
  };

  const handleSendRewardSubmit = () => {
    const errors: {[key: string]: string} = {};

    if (!discountType) {
      errors.discountType = 'Discount Type is required.';
    }

    if (!couponCode.trim()) {
      errors.couponCode = 'Coupon Code is required.';
    }

    const valNum = parseFloat(discountValue.toString());
    if (!discountValue.toString().trim()) {
      errors.discountValue = 'Discount Value is required.';
    } else if (isNaN(valNum) || valNum <= 0) {
      errors.discountValue = 'Discount Value must be greater than 0.';
    } else if (discountType === 'Percentage' && valNum > 100) {
      errors.discountValue = 'Percentage discount cannot exceed 100%.';
    }

    if (!validFrom.trim()) {
      errors.validFrom = 'Start Date is required.';
    }

    if (!validTill.trim()) {
      errors.validTill = 'End Date is required.';
    } else if (validFrom.trim() && validTill.trim() && validFrom > validTill) {
      errors.validTill = 'Start Date cannot be after End Date.';
    }

    if (!notifyVia) {
      errors.notifyVia = 'Notify Customer Via is required.';
    }

    if (!usageLimit.trim()) {
      errors.usageLimit = 'Usage Limit is required.';
    }

    const minAmtNum = parseFloat(minimumOrderAmount);
    if (!minimumOrderAmount.trim()) {
      errors.minimumOrderAmount = 'Minimum Order Amount is required.';
    } else if (isNaN(minAmtNum) || minAmtNum < 0) {
      errors.minimumOrderAmount = 'Minimum Order Amount must be at least 0.';
    }

    if (Object.keys(errors).length > 0) {
      setCouponFormErrors(errors);
      return;
    }

    setCouponFormErrors({});

    if (selectedCustomerIds.length === 0) {
      alert('Please select at least one customer record.');
      return;
    }

    // Construct discount object
    const newDiscount: CustomerDiscount = {
      code: couponCode,
      description: `${discountType === 'Percentage' ? `${discountValue}%` : `₹${discountValue}`} Off (Min Order: ₹${minimumOrderAmount}) - Valid from ${validFrom.split('T')[0]} to ${validTill.split('T')[0]}`,
      status: couponGridStatus
    };

    // Update each customer
    selectedCustomerIds.forEach(id => {
      const cust = customers.find(c => c.id === id);
      if (cust) {
        const updated = {
          ...cust,
          discounts: [...(cust.discounts || []), newDiscount]
        };
        onUpdateCustomer(updated);
      }
    });

    alert(`Successfully sent ${couponCode} voucher to ${selectedCustomerIds.length} customer(s)!`);
    
    // Reset selection and close
    setSelectedCustomerIds([]);
    setIsSendRewardModalOpen(false);
    
    // Clear form fields
    setDiscountType('');
    setDiscountValue('');
    setCouponCode('');
    setValidFrom('');
    setValidTill('');
    setUsageLimit('');
    setMinimumOrderAmount('');
    setCouponGridStatus('Active');
    setNotifyVia('');
  };

  return (
    <div className="space-y-6 relative">

      {/* Top Header Row for Date Filter (positioned in standard layout with proper margin to ensure visible space) */}
      <div className="flex justify-end items-center mb-3">
        {/* Shopify Polaris style Date range dropdown button */}
        <div className="relative inline-block text-left z-30">
          <button
            type="button"
            onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border rounded-xl shadow-sm bg-white text-xs font-bold transition-all duration-150 cursor-pointer"
            style={{
              borderColor: isDateDropdownOpen ? `${DATE_FILTER_ACCENT}33` : '#dbe4f0',
              color: DATE_FILTER_ACCENT,
              boxShadow: isDateDropdownOpen ? '0 10px 24px rgba(66, 128, 206, 0.14)' : '0 1px 2px rgba(15, 23, 42, 0.05)'
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: DATE_FILTER_ACCENT }} />
            <span>{selectedLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: DATE_FILTER_ACCENT }}
            />
          </button>

          {isDateDropdownOpen && (
            <>
              {/* Backdrop to close the popover */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDateDropdownOpen(false)}
              />
              
              {/* Popover overlay */}
              <div
                className="absolute right-0 mt-2 w-[290px] rounded-2xl border bg-white shadow-xl z-50 animate-scale-up overflow-hidden"
                style={{ borderColor: `${DATE_FILTER_ACCENT}1f` }}
              >
                <div className="p-2 space-y-1">
                  {(['today', 'yesterday', 'last_7_days', 'last_30_days', 'last_90_days', 'this_year', 'custom'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        updateDateRange(opt);
                        if (opt !== 'custom') {
                          setIsDateDropdownOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                        dateRange === opt
                          ? 'bg-[#4280ce]/10 text-[#4280ce] shadow-[inset_0_0_0_1px_rgba(66,128,206,0.18)]'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#4280ce]'
                      }`}
                    >
                      <span>{dateRangeLabels[opt]}</span>
                      {dateRange === opt && <Check className="w-4 h-4" style={{ color: DATE_FILTER_ACCENT }} />}
                    </button>
                  ))}
                </div>

                {/* Inline custom range inputs inside the popover if dateRange is custom */}
                {dateRange === 'custom' && (
                  <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-3">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Custom Date Range</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => handleCustomStartChange(e.target.value)}
                          className="w-full text-[11px] font-semibold px-2 py-1.5 border border-[#dbe4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4280ce] focus:border-[#4280ce] bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => handleCustomEndChange(e.target.value)}
                          className="w-full text-[11px] font-semibold px-2 py-1.5 border border-[#dbe4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4280ce] focus:border-[#4280ce] bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsDateDropdownOpen(false)}
                        className="px-3 py-1.5 text-white text-[10px] font-extrabold rounded-md shadow-sm transition-colors duration-150 cursor-pointer hover:brightness-95"
                        style={{ backgroundColor: DATE_FILTER_ACCENT }}
                      >
                        Apply Range
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* THREE ANALYTICS CARDS (Most valuable customers, Highest Order Customers, Revenue Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Most valuable customers - Column Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-extrabold text-lg shadow-xxs">
                  ₹
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Most valuable customers</h3>
                </div>
              </div>
            </div>

            {/* Column Bar Chart with Loading state */}
            {isCard1Loading ? (
              <div className="h-[180px] flex items-center justify-center">
                <div className="animate-pulse space-y-3 w-full">
                  <div className="h-2.5 bg-slate-100 rounded-full w-4/5 mx-auto"></div>
                  <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                  </div>
                </div>
              </div>
            ) : mostValuableData.length === 0 ? (
              <div className="h-[180px] flex flex-col items-center justify-center text-gray-400 text-center px-4">
                <span className="text-xs font-semibold">No customers with orders in this range</span>
              </div>
            ) : (
              <div className="h-[180px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mostValuableData}
                    margin={{ top: 15, right: 5, left: 5, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(name) => {
                        const parts = name.split(' ');
                        return `${parts[0]} ${parts[1]?.[0] || ''}.`;
                      }}
                      tick={{ fill: '#4b5563', fontSize: 9.5, fontWeight: 700 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spend']}
                      contentStyle={{ fontSize: '11px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                      {mostValuableData.map((entry, index) => {
                        const AMBER_COLORS = ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fde68a'];
                        return <Cell key={`cell-${index}`} fill={AMBER_COLORS[index % AMBER_COLORS.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <div className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>
                Top spender: {isCard1Loading ? '...' : (mostValuableData[0] ? '₹' + mostValuableData[0].value.toLocaleString('en-IN') : '₹0')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Highest Order Customers - Horizontal Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#5b3bf5] shadow-xxs">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Highest Order Customers</h3>
                  <p className="text-[11px] text-gray-400 font-medium">By complete order counts in range</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 tracking-wider uppercase">
                Volume
              </span>
            </div>

            {/* Horizontal Bar Chart with Loading state */}
            {isOtherCardsLoading ? (
              <div className="h-[180px] flex items-center justify-center">
                <div className="animate-pulse space-y-3 w-full">
                  <div className="h-2.5 bg-slate-100 rounded-full w-4/5 mx-auto"></div>
                  <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                  </div>
                </div>
              </div>
            ) : highestOrderData.length === 0 ? (
              <div className="h-[180px] flex flex-col items-center justify-center text-gray-400">
                <span className="text-xs font-semibold">No orders in selected range</span>
              </div>
            ) : (
              <div className="h-[180px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={highestOrderData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tickLine={false} 
                      axisLine={false}
                      width={85}
                      tickFormatter={(name) => {
                        const parts = name.split(' ');
                        return `${parts[0]} ${parts[1]?.[0] || ''}.`;
                      }}
                      tick={{ fill: '#4b5563', fontSize: 9.5, fontWeight: 700 }}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} orders`, 'Volume']}
                      contentStyle={{ fontSize: '11px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                      {highestOrderData.map((entry, index) => {
                        const BLUE_COLORS = ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'];
                        return <Cell key={`cell-${index}`} fill={BLUE_COLORS[index % BLUE_COLORS.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <div className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>
                Top volume: {isOtherCardsLoading ? '...' : (highestOrderData[0] ? highestOrderData[0].value + ' orders' : '0 orders')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Revenue Analytics - Area Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xxs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Revenue Analytics</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Sales volume performance</p>
                </div>
              </div>
            </div>

            {/* Area Chart with Loading state */}
            {isOtherCardsLoading ? (
              <div className="h-[180px] flex items-center justify-center">
                <div className="animate-pulse space-y-3 w-full">
                  <div className="h-2.5 bg-slate-100 rounded-full w-4/5 mx-auto"></div>
                  <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-[180px] bg-slate-50/40 rounded-xl border border-slate-100 p-2 flex flex-col justify-end">
                <div className="h-[145px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={currentChart.points.map((pt, idx) => ({
                        name: pt.label,
                        value: pt.value,
                        displayValue: pt.displayValue,
                        idx
                      }))}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      onMouseMove={(state) => {
                        if (state && state.activeTooltipIndex !== undefined) {
                          setHoveredNode(Number(state.activeTooltipIndex));
                        }
                      }}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 'bold' }} 
                      />
                      <YAxis hide domain={['dataMin - 10000', 'dataMax + 10000']} />
                      <Tooltip 
                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="absolute top-2 right-2 bg-white border border-gray-200 shadow-xxs px-2 py-0.5 rounded text-[9px] font-extrabold text-gray-500 tracking-wider pointer-events-none">
                  {hoveredNode !== null && currentChart.points[hoveredNode] ? (
                    <span className="text-emerald-600 font-mono">
                      {currentChart.points[hoveredNode].label}: {currentChart.points[hoveredNode].displayValue}
                    </span>
                  ) : (
                    <span>Hover nodes to explore</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-extrabold">
                Total Rev: {isOtherCardsLoading ? '...' : currentChart.total}
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-wider">{currentChart.timeline}</span>
          </div>
        </div>
      </div>

      {true ? (
        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs">
          {/* Header block with Title, Filters & Controls */}
          <div className="p-5">
            {/* Top Row: Title, Icon, Filters & Action buttons merged */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Side: Title and Icon */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xxs">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Customer 360 Profiles</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Search and inspect relational order trails</p>
                </div>
              </div>

              {/* Right Side: Filters & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  
                  {/* Filter Pills */}
                  {[
                    { label: 'ALL', value: 'All' },
                    { label: 'VIP', value: 'VIP' },
                    { label: 'NEW', value: 'New' },
                    { label: 'REGULAR', value: 'Regular' },
                    { label: 'INACTIVE', value: 'Inactive' }
                  ].map(pill => {
                    const isActive = segmentFilter === pill.value;
                    return (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => {
                          setSegmentFilter(pill.value);
                          onCustomerPageChange(1);
                          setSortColumn(null);
                          setSortDirection(null);
                          setSelectedCustomer(null);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border ${
                          isActive 
                            ? 'bg-[#B9D7FC] text-slate-900 border-gray-300 shadow-xs scale-[1.02]' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
                        }`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>

                {/* Decorative separator line for wide displays */}
                <div className="hidden md:block h-5 w-px bg-gray-200"></div>

                {/* Right Side: Refresh, Export Excel */}
                <div className="flex items-center gap-1.5">
                  {/* Filter Toggle Button */}
                  <button 
                    onClick={() => setShowFilterConsole(!showFilterConsole)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xxs transition-all border ${
                      showFilterConsole 
                        ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-700 font-bold' 
                        : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    <Filter className={`w-3 h-3 ${showFilterConsole ? 'text-indigo-600' : 'text-gray-500'}`} /> Filters
                  </button>

                  {/* Refresh Button */}
                  <button 
                    onClick={handleRefresh}
                    className="bg-white hover:bg-gray-50 border border-gray-300 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-700 flex items-center gap-1 cursor-pointer shadow-xxs transition-all"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-600" /> Refresh
                  </button>

                  {/* Export Excel Button */}
                  <button 
                    onClick={handleExportExcel}
                    disabled={isExportingExcel}
                    className={`bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xxs transition-all border border-[#96bae6] ${isExportingExcel ? 'cursor-wait opacity-70 hover:bg-[#B9D7FC]' : 'cursor-pointer'}`}
                  >
                    <Download className="w-3 h-3 text-slate-900" /> {isExportingExcel ? 'Exporting...' : 'Export Excel'}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Multi-Grid Individual Filter Console */}
            {showFilterConsole && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 shadow-sm animate-fade-in">
                <div className="space-y-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-8 gap-x-2 gap-y-1">
                    <div className="min-w-0" style={{ order: 1 }}>
                      <label className={compactFilterLabelClass}>Customer Name / ID</label>
                      <input
                        type="text"
                        placeholder="Filter by name..."
                        value={draftFilterCustomerName}
                        onChange={(e) => setDraftFilterCustomerName(e.target.value)}
                        className={compactTextInputClass}
                      />
                    </div>
                    <div className="min-w-0" style={{ order: 1 }}>
                      <label className={compactFilterLabelClass}>Email / Phone</label>
                      <input
                        type="text"
                        placeholder="Filter by email or phone..."
                        value={draftFilterEmailPhone}
                        onChange={(e) => setDraftFilterEmailPhone(e.target.value)}
                        className={compactTextInputClass}
                      />
                    </div>
                    <div className="min-w-0" style={{ order: 1 }}>
                      <label className={compactFilterLabelClass}>Country</label>
                      <input
                        list="country-options"
                        type="text"
                        placeholder="Search country..."
                        value={draftFilterCountry}
                        onChange={(e) => setDraftFilterCountry(e.target.value)}
                        className={compactTextInputClass}
                      />
                      <datalist id="country-options">
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country} value={country} />
                        ))}
                      </datalist>
                    </div>
                    <div className="min-w-0" style={{ order: 1 }}>
                      <label className={compactFilterLabelClass}>Lifetime Spend</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={draftFilterMinSpend}
                          onChange={(e) => setDraftFilterMinSpend(formatSpendFilterValue(e.target.value))}
                          placeholder="Min"
                          className={compactTextInputClass}
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={draftFilterMaxSpend}
                          onChange={(e) => setDraftFilterMaxSpend(formatSpendFilterValue(e.target.value))}
                          placeholder="Max"
                          className={compactTextInputClass}
                        />
                      </div>
                    </div>
                    <div className="min-w-0" style={{ order: 1 }}>
                      <label className={compactFilterLabelClass}>Order ID</label>
                      <input
                        type="text"
                        placeholder="e.g. #SH-90392"
                        value={draftFilterOrderId}
                        onChange={(e) => setDraftFilterOrderId(e.target.value)}
                        className={compactTextInputClass}
                      />
                    </div>
                    <div className="min-w-0" style={{ order: 1 }}>
                      <label className={compactFilterLabelClass}>Order Date</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="date"
                          value={draftOrderStartDate}
                          onChange={(e) => setDraftOrderStartDate(e.target.value)}
                          className={compactDateInputClass}
                        />
                        <input
                          type="date"
                          value={draftOrderEndDate}
                          onChange={(e) => setDraftOrderEndDate(e.target.value)}
                          className={compactDateInputClass}
                        />
                      </div>
                    </div>
                    <div className="min-w-0" style={{ order: 1 }}>
                      <label className={compactFilterLabelClass}>Payment Status</label>
                      <select
                        value={draftFilterPaymentStatus}
                        onChange={(e) => setDraftFilterPaymentStatus(e.target.value)}
                        className={compactSelectClass}
                      >
                        {PAYMENT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0" style={{ order: 2 }}>
                      <label className={compactFilterLabelClass}>Product Name</label>
                      <input
                        type="text"
                        placeholder="Filter by product..."
                        value={draftFilterProductName}
                        onChange={(e) => setDraftFilterProductName(e.target.value)}
                        className={compactTextInputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-8 gap-x-2 gap-y-1">
                    <div className="min-w-0" style={{ order: 2 }}>
                      <label className={compactFilterLabelClass}>Product Variant</label>
                      <input
                        type="text"
                        placeholder="Filter by variant..."
                        value={draftFilterVariant}
                        onChange={(e) => setDraftFilterVariant(e.target.value)}
                        className={compactTextInputClass}
                      />
                    </div>
                    <div className="min-w-0" style={{ order: 2 }}>
                      <label className={compactFilterLabelClass}>Last Order Date</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="date"
                          value={draftFilterLastOrderDateFrom}
                          onChange={(e) => setDraftFilterLastOrderDateFrom(e.target.value)}
                          className={compactDateInputClass}
                        />
                        <input
                          type="date"
                          value={draftFilterLastOrderDateTo}
                          onChange={(e) => setDraftFilterLastOrderDateTo(e.target.value)}
                          className={compactDateInputClass}
                        />
                      </div>
                    </div>
                    <div className="min-w-0" style={{ order: 3 }}>
                      <label className={compactFilterLabelClass}>Last Login</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="date"
                          value={draftFilterLastLoginFrom}
                          onChange={(e) => setDraftFilterLastLoginFrom(e.target.value)}
                          className={compactDateInputClass}
                        />
                        <input
                          type="date"
                          value={draftFilterLastLoginTo}
                          onChange={(e) => setDraftFilterLastLoginTo(e.target.value)}
                          className={compactDateInputClass}
                        />
                      </div>
                    </div>
                    <div className="min-w-0" style={{ order: 3 }}>
                      <label className={compactFilterLabelClass}>Created Date</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="date"
                          value={draftFilterCreatedDateFrom}
                          onChange={(e) => setDraftFilterCreatedDateFrom(e.target.value)}
                          className={compactDateInputClass}
                        />
                        <input
                          type="date"
                          value={draftFilterCreatedDateTo}
                          onChange={(e) => setDraftFilterCreatedDateTo(e.target.value)}
                          className={compactDateInputClass}
                        />
                      </div>
                    </div>
                    <div className="min-w-0" style={{ order: 3 }}>
                      <label className={compactFilterLabelClass}>Delivery Date</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="date"
                          value={draftFilterDeliveryFrom}
                          onChange={(e) => setDraftFilterDeliveryFrom(e.target.value)}
                          className={compactDateInputClass}
                        />
                        <input
                          type="date"
                          value={draftFilterDeliveryTo}
                          onChange={(e) => setDraftFilterDeliveryTo(e.target.value)}
                          className={compactDateInputClass}
                        />
                      </div>
                    </div>
                    <div className="min-w-0" style={{ order: 3 }}>
                      <label className={compactFilterLabelClass}>Fulfillment Status</label>
                      <select
                        value={draftFilterFulfillmentStatus}
                        onChange={(e) => setDraftFilterFulfillmentStatus(e.target.value)}
                        className={compactSelectClass}
                      >
                        {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0" style={{ order: 3 }}>
                      <label className={compactFilterLabelClass}>Delivery Status</label>
                      <select
                        value={draftFilterDeliveryStatus}
                        onChange={(e) => setDraftFilterDeliveryStatus(e.target.value)}
                        className={compactSelectClass}
                      >
                        {DELIVERY_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0 sm:col-span-1 xl:col-span-1 flex items-end" style={{ order: 4 }}>
                      <div className="grid w-full grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={applyCustomerFilters}
                          className={`${compactActionButtonClass} border border-[#96bae6] bg-[#B9D7FC] text-slate-900 hover:bg-[#9cbdf0]`}
                        >
                           Search
                        </button>
                        <button
                          type="button"
                          onClick={clearCustomerFilters}
                          className={`${compactActionButtonClass} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CUSTOMERS GRID TABLE */}

          {isLoadingCustomers ? (
            <div className="border-t border-gray-200 bg-white">
              <CustomerDataLoader overlay={false} />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="border-t border-gray-200 p-12 text-center bg-white">
              <div className="w-16 h-16 bg-bg-neutral rounded-full flex items-center justify-center mx-auto mb-4 text-text-secondary">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">No customers found</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mt-2">
                No live Shopify customers matched your current search filters. Try widening search parameters or refresh the API data.
              </p>
            </div>
          ) : (
            <div className="border-t border-gray-300 overflow-hidden">
              <div className="hidden xl:block">
                <div className={isCompactCustomerGrid ? 'overflow-hidden' : 'overflow-x-auto'}>
                <table
                  className="w-full text-left border-collapse table-fixed"
                  style={{ minWidth: `${customerGrid.tableWidth * customerGridScale}px` }}
                >
                  <colgroup>
                    {CUSTOMER_GRID_COLUMNS.map((column) => (
                      <col key={column.id} style={{
                        width: `${Math.max(1, Math.round(Number.parseFloat(String(customerGrid.getColStyle(column.id).width)) * customerGridScale))}px`,
                        minWidth: `${Math.max(1, Math.round(Number.parseFloat(String(customerGrid.getColStyle(column.id).minWidth)) * customerGridScale))}px`,
                        maxWidth: `${Math.max(1, Math.round(Number.parseFloat(String(customerGrid.getColStyle(column.id).maxWidth)) * customerGridScale))}px`
                      }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className={`bg-[#B9D7FC] text-slate-900 font-bold border-b border-gray-300 ${customerGridRowTextClass}`}>
                      <th className={`${isCompactCustomerGrid ? 'py-1.5 px-2.5' : 'py-2 px-3'} text-center border-r border-gray-300 select-none relative group`}>
                        {/* No checkbox in header per user request */}
                        <ResizeHandle
                          columnId="expander"
                          onResizeStart={customerGrid.startResize}
                          onResizeMove={customerGrid.handleResizeMove}
                          onResizeEnd={customerGrid.handleResizeEnd}
                        />
                      </th>
                      {renderResizableHeader(customerGrid, 'profile', <>Profile</>, `${isCompactCustomerGrid ? 'py-1.5 px-2.5' : 'py-2 px-3'} text-slate-900 uppercase text-center border-r border-gray-300`)}
                      {renderResizableHeader(customerGrid, 'name', <>Customer Name / Id <SortArrow column="name" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('name'))}
                      {renderResizableHeader(customerGrid, 'email', <>Email / Phone <SortArrow column="email" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('email'))}
                      {renderResizableHeader(customerGrid, 'country', <>Country <SortArrow column="country" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('country'))}
                      {renderResizableHeader(customerGrid, 'location', <>Location <SortArrow column="location" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('location'))}
                      {renderResizableHeader(customerGrid, 'orders', <># Orders <SortArrow column="totalOrders" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('totalOrders'))}
                      {renderResizableHeader(customerGrid, 'spend', <>Lifetime Spend <SortArrow column="totalSpend" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('totalSpend'))}
                      {renderResizableHeader(customerGrid, 'lastOrder', <>Last Order Date <SortArrow column="lastOrderDate" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('lastOrderDate'))}
                      {renderResizableHeader(customerGrid, 'lastLogin', <>Last Login <SortArrow column="lastLogin" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('lastLogin'))}
                      {renderResizableHeader(customerGrid, 'createdDate', <>Created Date <SortArrow column="createdAt" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('createdAt'))}
                      {renderResizableHeader(customerGrid, 'segment', <>Customer Segment <SortArrow column="segment" /></>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase text-center cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300`, () => handleSort('segment'))}
                      {renderResizableHeader(customerGrid, 'abandonedCheckout', <>Abandoned Checkout</>, `${customerGridHeaderPaddingClass} text-slate-900 uppercase text-center border-r border-gray-300`)}
                      {renderResizableHeader(customerGrid, 'action', <>Action</>, `${isCompactCustomerGrid ? 'py-1.5 px-2' : 'py-2 px-2'} text-slate-900 uppercase text-center`)}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedCustomers.map((cust, idx) => {
                      const leadStatusStyles = {
                        'New': 'bg-blue-50 text-blue-700 border-blue-100',
                        'Follow-up': 'bg-amber-50 text-amber-700 border-amber-100',
                        'Completed': 'bg-emerald-50 text-brand-primary border-emerald-100',
                        'In-complete': 'bg-gray-50 text-gray-500 border-gray-100'
                      };

                      const isExpanded = selectedCustomer && selectedCustomer.id === cust.id;

                      return (
                        <React.Fragment key={cust.id}>
                          <tr className={`hover:bg-slate-50 transition-colors ${customerGridRowTextClass} ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                            <td className={`${customerGridCellPaddingClass} text-center border-r border-b border-gray-200 align-middle`}>
                              <button 
                                onClick={() => setSelectedCustomer(isExpanded ? null : cust)}
                                className="p-1 hover:bg-gray-100 rounded text-text-secondary hover:text-indigo-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-900 transition-all duration-200" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400 transition-all duration-200" />
                                )}
                              </button>
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle text-center`}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProfileCustomer(cust);
                                  closeQuickActionMenu();
                                }}
                                className="mx-auto inline-flex items-center justify-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[8px] sm:text-[9px] lg:text-[9.5px] leading-none font-bold uppercase tracking-wide text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm max-w-full"
                                title="View Profile"
                              >
                                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="whitespace-nowrap">View Profile</span>
                              </button>
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle`}>
                              <div 
                                onClick={() => setSelectedCustomer(isExpanded ? null : cust)}
                                className={customerGridNameTextClass}
                                title={cust.name}
                              >
                                {cust.name ? formatCustomerDisplayName(cust.name) : '-'}
                              </div>
                              <div className="text-[12px] text-text-secondary font-mono mt-0.5">{cust.id}</div>
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle`}>
                              <div className={customerGridEmailTextClass} title={cust.email}>{cust.email}</div>
                              <div className="text-[12px] text-text-secondary mt-0.5">{cust.phone}</div>
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle ${customerGridCountryTextClass}`} title={cust.country || '-'}>
                              {cust.country || '-'}
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle ${customerGridLocationTextClass}`} title={cust.location || '-'}>
                              {cust.location || '-'}
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle ${customerGridNumericTextClass} font-semibold text-text-primary`}>
                              {getFrontendOrderCount(cust)} orders
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle ${customerGridNumericTextClass} font-bold text-text-primary`}>
                              {cust.totalSpend > 0 ? formatCurrencyAmount(cust.totalSpend, cust.currencyCode) : '-'}
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle ${customerGridNumericTextClass} text-text-secondary`}>
                              {cust.lastOrderDate}
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle ${customerGridNumericTextClass} text-text-secondary whitespace-nowrap`}>
                              {cust.lastLogin || '-'}
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle ${customerGridNumericTextClass} text-text-secondary whitespace-nowrap`}>
                              {cust.createdAt || cust.storeInfo?.joinedDate || '-'}
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle text-center`}>
                              {(() => {
                                const customerType = cust.customerType ?? cust.segment;
                                const segmentVisual = renderCustomerSegmentVisual(customerType);

                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full ${customerGridBadgeTextClass} font-bold uppercase tracking-wide whitespace-nowrap ${segmentVisual.className}`}>
                                    {segmentVisual.icon}
                                    <span>{customerType}</span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td className={`${customerGridCellPaddingClass} border-r border-b border-gray-200 align-middle ${customerGridNumericTextClass} text-text-secondary whitespace-nowrap text-center`}>
                              {(() => {
                                const abandonedCheckoutCount = Number(cust.abandonedCheckoutCount ?? 0);

                                if (!abandonedCheckoutCount) {
                                  return '-';
                                }

                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPopupCustomer(cust);
                                      setPopupActiveTab('abandoned');
                                      setPopupViewMode('abandoned-only');
                                    }}
                                    className="mx-auto inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wide whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                                    title="Open abandoned checkout details"
                                  >
                                    <ShoppingBag className="w-3 h-3 text-amber-500" />
                                    <span>{abandonedCheckoutCount} Pending</span>
                                  </button>
                                );
                              })()}
                            </td>
                            <td className={`${customerGridActionCellClass} border-b border-gray-200 align-middle text-center`}>
                              <div className="relative flex justify-center group">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (activeQuickActionCustId === cust.id) {
                                      closeQuickActionMenu();
                                      return;
                                    }

                                    const buttonRect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                    const menuWidth = 220;
                                    const menuHeight = 144;
                                    const padding = 12;
                                    const openLeft = buttonRect.left - menuWidth - 12;
                                    const openRight = buttonRect.right + 12;
                                    const nextLeft = openLeft >= padding
                                      ? openLeft
                                      : Math.min(window.innerWidth - menuWidth - padding, openRight);
                                    const nextTop = Math.min(
                                      window.innerHeight - menuHeight - padding,
                                      Math.max(padding, buttonRect.top)
                                    );

                                    setQuickActionMenuPosition({
                                      top: nextTop,
                                      left: Math.max(padding, nextLeft)
                                    });
                                    setActiveQuickActionCustId(cust.id);
                                  }}
                                  className={`p-2 rounded-xl transition-all border-2 inline-flex items-center justify-center cursor-pointer ${
                                    activeQuickActionCustId === cust.id 
                                      ? 'border-amber-500 bg-[#e6f4ea] text-[#137333]' 
                                      : 'border-transparent bg-[#e6f4ea] text-[#137333] hover:bg-[#d2e3fc] hover:text-[#185abc]'
                                  }`}
                                  title="Quick Action"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Hover tooltip */}
                                <div className="pointer-events-none absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 text-[10px] font-bold text-white bg-slate-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md whitespace-nowrap z-50">
                                  Quick Action
                                </div>
                                
                                {activeQuickActionCustId === cust.id && (
                                  <>
                                    {/* Transparent backdrop to click anywhere and close */}
                                    <div 
                                      className="fixed inset-0 z-40 cursor-default bg-transparent" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        closeQuickActionMenu();
                                      }}
                                    />
                                    
                                    {/* Single Column List Popover Overlay */}
                                    <div 
                                      className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 w-[220px] animate-scale-up"
                                      style={{
                                        top: `${quickActionMenuPosition?.top ?? 0}px`,
                                        left: `${quickActionMenuPosition?.left ?? 0}px`
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex flex-col gap-1.5">
                                        {/* Row 1: Abandoned Checkout */}
                                        <div 
                                          onClick={() => {
                                            setPopupCustomer(cust);
                                            setPopupActiveTab('abandoned');
                                            setPopupViewMode('full');
                                            closeQuickActionMenu();
                                          }}
                                          className="bg-slate-50 hover:bg-[#ff4d6d]/5 border border-gray-100 hover:border-[#ff4d6d]/20 rounded-xl p-2 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] duration-150"
                                        >
                                          <ShoppingBag className="w-4 h-4 text-[#ff4d6d]" />
                                          <span className="text-[12px] font-bold text-gray-700">Abandoned checkout</span>
                                        </div>

                                        {/* Row 2: Refund status */}
                                        <div 
                                          onClick={() => {
                                            setPopupCustomer(cust);
                                            setPopupActiveTab('refunds');
                                            setPopupViewMode('full');
                                            closeQuickActionMenu();
                                          }}
                                          className="bg-slate-50 hover:bg-emerald-50/40 border border-gray-100 hover:border-emerald-200 rounded-xl p-2 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] duration-150"
                                        >
                                          <RefreshCw className="w-4 h-4 text-emerald-600" />
                                          <span className="text-[12px] font-bold text-gray-700">Refund status</span>
                                        </div>

                                        {/* Row 3: Applied discount */}
                                        <div 
                                          onClick={() => {
                                            setPopupCustomer(cust);
                                            setPopupActiveTab('discounts');
                                            setPopupViewMode('full');
                                            closeQuickActionMenu();
                                          }}
                                          className="bg-slate-50 hover:bg-purple-50/40 border border-gray-100 hover:border-purple-200 rounded-xl p-2 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] duration-150"
                                        >
                                          <Ticket className="w-4 h-4 text-purple-600" />
                                          <span className="text-[12px] font-bold text-gray-700">Applied discount</span>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-white">
                            <td colSpan={14} className="px-2 py-1.5 border-b border-gray-200 bg-slate-50/10">
                                <div className="relative border border-gray-300/80 rounded-xl shadow-xxs bg-white overflow-hidden">
                                  <div className="relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-r-full bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 opacity-85" />
                                    <div className="pt-3.5 pr-3.5 pb-3.5 pl-3">
                                      {/* Order list table */}
                                      <div className="overflow-x-auto border border-gray-300 rounded-xl bg-white shadow-xs">
                                        <table
                                          className="w-full text-left border-collapse table-fixed"
                                          style={{ minWidth: `${compactOrderGrid.tableWidth}px` }}
                                        >
                                          <colgroup>
                                            {COMPACT_ORDER_GRID_COLUMNS.map((column) => (
                                              <col key={column.id} style={compactOrderGrid.getColStyle(column.id)} />
                                            ))}
                                          </colgroup>
                                          <thead>
                                            <tr className="bg-[#edf4fe] text-slate-900 text-[13px] font-bold border-b border-gray-300">
                                              <th className="py-1.5 px-3 text-center border-r border-gray-300 relative group">
                                                <ResizeHandle
                                                  columnId="expander"
                                                  onResizeStart={compactOrderGrid.startResize}
                                                  onResizeMove={compactOrderGrid.handleResizeMove}
                                                  onResizeEnd={compactOrderGrid.handleResizeEnd}
                                                />
                                              </th>
                                              {renderResizableHeader(compactOrderGrid, 'orderId', <>Order ID</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
                                              {renderResizableHeader(compactOrderGrid, 'orderDate', <>Order Date</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold font-sans text-slate-900')}
                                              {renderResizableHeader(compactOrderGrid, 'orderStatus', <>Fulfillment status</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
                                              {renderResizableHeader(compactOrderGrid, 'paymentStatus', <>Payment Status</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
                                              {renderResizableHeader(compactOrderGrid, 'deliveryStatus', <>Delivery Status / Date</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
                                              {renderResizableHeader(compactOrderGrid, 'totalAmount', <>Total Amount</>, 'py-1.5 px-3 text-left font-bold text-slate-900 font-sans')}
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200">
                                            {filteredAndPaginatedOrders.items.length === 0 ? (
                                              <tr>
                                                <td colSpan={7} className="p-8 text-left text-text-secondary">
                                                  <div className="text-sm font-semibold text-text-primary mb-1">No orders match filter criteria</div>
                                                  <div className="text-xs">Try widening your search queries or resetting filters.</div>
                                                </td>
                                              </tr>
                                            ) : (
                                              filteredAndPaginatedOrders.items.map(o => {
                                                const orderLineItems = o.lineItems || [];
                                                const orderName = o.name || `Order ${o.orderId}`;
                                                const orderProductSummary = orderLineItems.length > 0
                                                  ? `${orderLineItems[0].name}${orderLineItems.length > 1 ? ` + ${orderLineItems.length - 1} more` : ''}`
                                                  : 'No products';
                                                const isExpandedOrder = !!expandedOrderIds[o.orderId];

                                                return (
                                                  <React.Fragment key={o.orderId}>
                                                    <tr 
                                                      onClick={() => setExpandedOrderIds(prev => ({ ...prev, [o.orderId]: !prev[o.orderId] }))}
                                                      className={`hover:bg-slate-50 transition-colors cursor-pointer text-[13.5px] ${isExpandedOrder ? 'bg-slate-100/70 font-medium' : ''}`}
                                                    >
                                                      {/* Chevron Action Column */}
                                                      <td className="py-1.5 px-3 text-center border-r border-b border-gray-200 align-middle">
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedOrderIds(prev => ({ ...prev, [o.orderId]: !prev[o.orderId] }));
                                                          }}
                                                          className="p-1 hover:bg-gray-200 rounded transition-colors text-text-secondary hover:text-text-primary inline-flex items-center justify-center cursor-pointer"
                                                          aria-label={isExpandedOrder ? "Collapse row" : "Expand row"}
                                                        >
                                                          {isExpandedOrder ? (
                                                            <ChevronDown className="w-4 h-4 text-slate-900 transform rotate-180 transition-transform duration-200" />
                                                          ) : (
                                                            <ChevronDown className="w-4 h-4 text-text-secondary transition-transform duration-200" />
                                                          )}
                                                        </button>
                                                      </td>

                                                  {/* Order ID */}
                                                  <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle font-mono font-bold text-brand-primary">
                                                    {o.orderId}
                                                  </td>

                                                  {/* Order Date */}
                                                  <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-text-secondary font-medium">
                                                    {o.date}
                                                  </td>

                                                  {/* Order Status */}
                                                  <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-left">
                                                    {renderStatusBadge('order', o.status, 'text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border')}
                                                  </td>

                                                  {/* Payment Status */}
                                                  <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-left">
                                                    {renderStatusBadge('payment', o.paymentStatus, 'text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border')}
                                                  </td>

                                                  {/* Delivery Status */}
                                                  <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-left">
                                                    {renderDeliveryStatusCell(o.deliveryStatus, o.deliveredAt, 'left')}
                                                  </td>

                                                  {/* Total Amount */}
                                                  <td className="py-1.5 px-3 border-b border-gray-200 align-middle text-left font-bold text-text-primary">
                                                    {o.totalAmount && o.totalAmount > 0
                                                      ? formatCurrencyAmount(o.totalAmount, selectedCustomer?.currencyCode)
                                                      : '-'}
                                                  </td>
                                                </tr>

                                                {/* Expandable Order Details Row */}
                                                {isExpandedOrder && (
                                                  <tr className="bg-slate-50/50">
                                                    <td colSpan={7} className="p-4 border-t border-b border-gray-300">
                                                      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs p-1">
                                                        <OrderProductBreakdown
                                                          orderId={o.orderId}
                                                          orderDate={o.date}
                                                          orderStatus={o.status}
                                                          totalAmount={o.totalAmount ?? o.amount}
                                                          currencyCode={selectedCustomer?.currencyCode}
                                                          customerId={cust.id}
                                                          customerName={cust.name}
                                                          orderName={o.name}
                                                          items={o.lineItems}
                                                        />
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                                  </React.Fragment>
                                                );
                                              })
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Inner Pagination */}
                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary bg-white">
                                  <div>
                                    Showing <span className="font-semibold text-text-primary">{filteredAndPaginatedOrders.total === 0 ? 0 : Math.min((orderCurrentPage - 1) * orderPageSize + 1, filteredAndPaginatedOrders.total)}</span> to{' '}
                                    <span className="font-semibold text-text-primary">{Math.min(orderCurrentPage * orderPageSize, filteredAndPaginatedOrders.total)}</span> of{' '}
                                    <span className="font-semibold text-text-primary">{filteredAndPaginatedOrders.total}</span> records
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOrderCurrentPage(prev => Math.max(prev - 1, 1));
                                      }}
                                      disabled={orderCurrentPage === 1}
                                      className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                                    >
                                      Previous
                                    </button>

                                    {/* Pages */}
                                    {Array.from({ length: Math.min(5, filteredAndPaginatedOrders.totalPages) }, (_, i) => {
                                      let pageNum = orderCurrentPage;
                                      if (orderCurrentPage <= 3) pageNum = i + 1;
                                      else if (orderCurrentPage >= filteredAndPaginatedOrders.totalPages - 2) pageNum = filteredAndPaginatedOrders.totalPages - 4 + i;
                                      else pageNum = orderCurrentPage - 2 + i;

                                      if (pageNum < 1 || pageNum > filteredAndPaginatedOrders.totalPages) return null;

                                      return (
                                        <button
                                          key={pageNum}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOrderCurrentPage(pageNum);
                                          }}
                                          className={`w-7 h-7 flex items-center justify-center rounded border transition-colors font-semibold cursor-pointer ${
                                            orderCurrentPage === pageNum
                                              ? 'bg-brand-primary border-brand-primary text-white'
                                              : 'border-border-subtle bg-bg-neutral text-text-primary hover:bg-border-subtle'
                                          }`}
                                        >
                                          {pageNum}
                                        </button>
                                      );
                                    })}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOrderCurrentPage(prev => Math.min(prev + 1, filteredAndPaginatedOrders.totalPages));
                                      }}
                                      disabled={orderCurrentPage === filteredAndPaginatedOrders.totalPages}
                                      className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>

              {/* MOBILE CUSTOMER CARDS */}
              <div className="xl:hidden bg-white">
                <div className="divide-y divide-gray-200">
                  {paginatedCustomers.map((cust) => {
                    const customerType = cust.customerType ?? cust.segment;
                    const segmentVisual = renderCustomerSegmentVisual(customerType);
                    const isExpanded = selectedCustomer && selectedCustomer.id === cust.id;

                    return (
                      <div key={cust.id} className={`p-4 ${isExpanded ? 'bg-slate-50/70' : 'bg-white'}`}>
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(isExpanded ? null : cust)}
                            className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-slate-700 shadow-xxs"
                            aria-label={isExpanded ? 'Collapse customer details' : 'Expand customer details'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-[15px] font-bold text-text-primary truncate">
                                    {cust.name ? formatCustomerDisplayName(cust.name) : '-'}
                                  </div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 border rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${segmentVisual.className}`}>
                                    {segmentVisual.icon}
                                    <span>{customerType}</span>
                                  </span>
                                </div>
                                <div className="text-[12px] text-text-secondary font-mono mt-0.5">{cust.id}</div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeQuickActionCustId === cust.id) {
                                    closeQuickActionMenu();
                                    return;
                                  }

                                  const buttonRect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                  const menuWidth = 220;
                                  const menuHeight = 144;
                                  const padding = 12;
                                  const openLeft = buttonRect.left - menuWidth - 12;
                                  const openRight = buttonRect.right + 12;
                                  const nextLeft = openLeft >= padding
                                    ? openLeft
                                    : Math.min(window.innerWidth - menuWidth - padding, openRight);
                                  const nextTop = Math.min(
                                    window.innerHeight - menuHeight - padding,
                                    Math.max(padding, buttonRect.top)
                                  );

                                  setQuickActionMenuPosition({
                                    top: nextTop,
                                    left: Math.max(padding, nextLeft)
                                  });
                                  setActiveQuickActionCustId(cust.id);
                                }}
                                className={`shrink-0 w-9 h-9 rounded-xl border-2 inline-flex items-center justify-center cursor-pointer transition-all ${
                                  activeQuickActionCustId === cust.id
                                    ? 'border-amber-500 bg-[#e6f4ea] text-[#137333]'
                                    : 'border-transparent bg-[#e6f4ea] text-[#137333] hover:bg-[#d2e3fc] hover:text-[#185abc]'
                                }`}
                                title="Quick Action"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                              <div className="rounded-xl border border-gray-200 bg-white p-2">
                                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Email / Phone</div>
                                <div className="mt-1 font-medium text-text-primary truncate" title={cust.email}>{cust.email}</div>
                                <div className="text-text-secondary mt-0.5">{cust.phone}</div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-2">
                                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Country</div>
                                <div className="mt-1 font-medium text-text-primary truncate" title={cust.country || '-'}>
                                  {cust.country || '-'}
                                </div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-2">
                                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Orders</div>
                                <div className="mt-1 font-semibold text-text-primary">{getFrontendOrderCount(cust)} orders</div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-2">
                                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Lifetime Spend</div>
                                <div className="mt-1 font-semibold text-text-primary">
                                  {cust.totalSpend > 0 ? formatCurrencyAmount(cust.totalSpend, cust.currencyCode) : '-'}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                              <div className="rounded-xl border border-gray-200 bg-white p-2">
                                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Last Order Date</div>
                                <div className="mt-1 font-medium text-text-primary">{cust.lastOrderDate || '-'}</div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-2">
                                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Last Login</div>
                                <div className="mt-1 font-medium text-text-primary">{cust.lastLogin || '-'}</div>
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-1 gap-2 text-[12px]">
                              <div className="rounded-xl border border-gray-200 bg-white p-2">
                                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Abandoned Checkout</div>
                                <div className="mt-1 font-medium text-text-primary">
                                  {(() => {
                                    const abandonedCheckoutCount = Number(cust.abandonedCheckoutCount ?? 0);

                                    if (!abandonedCheckoutCount) {
                                      return '-';
                                    }

                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPopupCustomer(cust);
                                          setPopupActiveTab('abandoned');
                                          setPopupViewMode('abandoned-only');
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[8.5px] font-bold uppercase tracking-wide whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                                        title="Open abandoned checkout details"
                                      >
                                        <ShoppingBag className="w-3 h-3 text-amber-500" />
                                        <span>{abandonedCheckoutCount} Pending</span>
                                      </button>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {isExpanded && selectedCustomer?.id === cust.id && (
                              <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Customer Details</div>
                                    <div className="text-sm font-bold text-text-primary mt-0.5">{cust.location || '-'}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomer(null)}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-gray-300 bg-white text-gray-700"
                                  >
                                    Collapse
                                  </button>
                                </div>

                                <div className="mt-4 space-y-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Orders</div>
                                    <div className="text-[11px] font-semibold text-text-secondary">
                                      {filteredAndPaginatedOrders.total} order{filteredAndPaginatedOrders.total === 1 ? '' : 's'}
                                    </div>
                                  </div>

                                  {filteredAndPaginatedOrders.items.length > 0 ? (
                                    filteredAndPaginatedOrders.items.map((order) => {
                                      const orderLineItems = order.lineItems || [];
                                      const orderName = order.name || `Order ${order.orderId}`;
                                      const isExpandedOrder = !!expandedOrderIds[order.orderId];

                                      return (
                                        <div key={order.orderId} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xxs">
                                          <button
                                            type="button"
                                            onClick={() => setExpandedOrderIds(prev => ({ ...prev, [order.orderId]: !prev[order.orderId] }))}
                                            className="w-full text-left p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors"
                                          >
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-text-primary font-mono">{order.orderId}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-wider ${getStatusBadgeMeta('payment', order.paymentStatus)?.className || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                  {(getStatusBadgeMeta('payment', order.paymentStatus)?.label || order.paymentStatus || '-')}
                                                </span>
                                              </div>
                                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary">
                                                <span>{order.date}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-wider ${getStatusBadgeMeta('order', order.status)?.className || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                  {(getStatusBadgeMeta('order', order.status)?.label || order.status || '-')}
                                                </span>
                                                {renderDeliveryStatusCell(order.deliveryStatus, order.deliveredAt, 'left')}
                                              </div>
                                              <div className="mt-2 text-[11px] text-text-secondary">
                                                {orderName}
                                              </div>
                                            </div>

                                            <div className="shrink-0 text-right">
                                              <div className="text-sm font-bold text-text-primary">
                                                {order.totalAmount && order.totalAmount > 0
                                                  ? formatCurrencyAmount(order.totalAmount, selectedCustomer?.currencyCode)
                                                  : '-'}
                                              </div>
                                              <div className="mt-2 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-slate-700">
                                                {isExpandedOrder ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                              </div>
                                            </div>
                                          </button>

                                          {isExpandedOrder && (
                                            <div className="border-t border-gray-200 bg-slate-50/40 p-3">
                                              <OrderProductBreakdown
                                                orderId={order.orderId}
                                                orderDate={order.date}
                                                orderStatus={order.status}
                                                totalAmount={order.totalAmount ?? order.amount}
                                                currencyCode={selectedCustomer?.currencyCode}
                                                customerId={cust.id}
                                                customerName={cust.name}
                                                orderName={order.name}
                                                items={orderLineItems}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="rounded-xl border border-dashed border-gray-200 p-3 text-[12px] text-text-secondary bg-white">
                                      No orders available for this customer.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {activeQuickActionCustId === cust.id && quickActionMenuPosition && (
                          <>
                            <div
                              className="fixed inset-0 z-40 cursor-default bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeQuickActionMenu();
                              }}
                            />
                            <div
                              className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 w-[220px] animate-scale-up"
                              style={{
                                top: `${quickActionMenuPosition.top}px`,
                                left: `${quickActionMenuPosition.left}px`
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex flex-col gap-1.5">
                                <div
                                  onClick={() => {
                                    setPopupCustomer(cust);
                                    setPopupActiveTab('abandoned');
                                    closeQuickActionMenu();
                                  }}
                                  className="bg-slate-50 hover:bg-[#ff4d6d]/5 border border-gray-100 hover:border-[#ff4d6d]/20 rounded-xl p-2 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] duration-150"
                                >
                                  <ShoppingBag className="w-4 h-4 text-[#ff4d6d]" />
                                  <span className="text-[12px] font-bold text-gray-700">Abandoned checkout</span>
                                </div>
                                <div
                                  onClick={() => {
                                    setPopupCustomer(cust);
                                    setPopupActiveTab('refunds');
                                    closeQuickActionMenu();
                                  }}
                                  className="bg-slate-50 hover:bg-emerald-50/40 border border-gray-100 hover:border-emerald-200 rounded-xl p-2 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] duration-150"
                                >
                                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                                  <span className="text-[12px] font-bold text-gray-700">Refund status</span>
                                </div>
                                <div
                                  onClick={() => {
                                    setPopupCustomer(cust);
                                    setPopupActiveTab('discounts');
                                    closeQuickActionMenu();
                                  }}
                                  className="bg-slate-50 hover:bg-purple-50/40 border border-gray-100 hover:border-purple-200 rounded-xl p-2 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] duration-150"
                                >
                                  <Ticket className="w-4 h-4 text-purple-600" />
                                  <span className="text-[12px] font-bold text-gray-700">Applied discount</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="border-t border-border-subtle px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card text-xs text-text-secondary">
                <div>
                  Showing <span className="font-semibold text-text-primary">{totalCustomerCount === 0 ? 0 : Math.min((customerPageNo - 1) * customerPageSize + 1, totalCustomerCount)}</span> to{' '}
                  <span className="font-semibold text-text-primary">{Math.min(customerPageNo * customerPageSize, totalCustomerCount)}</span> of{' '}
                  <span className="font-semibold text-text-primary">{totalCustomerCount}</span> records
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Rows per page */}
                  <div className="flex items-center gap-1.5">
                    <span>Rows per page:</span>
                    <select
                      value={customerPageSize}
                      onChange={(e) => {
                        onCustomerPageSizeChange(Number(e.target.value));
                      }}
                      className="bg-bg-neutral border border-border-subtle rounded px-1.5 py-1 font-semibold cursor-pointer text-text-primary outline-none focus:border-brand-primary"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onCustomerPageChange(Math.max(customerPageNo - 1, 1))}
                      disabled={customerPageNo === 1}
                      className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                    >
                      Previous
                    </button>

                    {/* Pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = customerPageNo;
                      if (customerPageNo <= 3) pageNum = i + 1;
                      else if (customerPageNo >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = customerPageNo - 2 + i;

                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => onCustomerPageChange(pageNum)}
                          className={`w-7 h-7 flex items-center justify-center rounded border transition-colors font-semibold cursor-pointer ${
                            customerPageNo === pageNum
                              ? 'bg-brand-primary border-brand-primary text-white'
                              : 'border-border-subtle bg-bg-neutral text-text-primary hover:bg-border-subtle'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => onCustomerPageChange(Math.min(customerPageNo + 1, totalPages))}
                      disabled={customerPageNo === totalPages}
                      className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SCREEN B — CUSTOMER DETAIL VIEW (POLISHED INLINE RECORD DETAILS MATCHING THE REQUESTED LAYOUT) */
        <div className="space-y-6 animate-fade-in">
          {/* Sticky Back Navigation Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md py-3.5 border-b border-border-subtle/50 flex items-center justify-between -mt-6 md:-mt-8 -mx-6 md:-mx-8 px-6 md:px-8 shadow-xxs">
            <button 
              onClick={() => setSelectedCustomer(null)}
              className="text-[13px] text-brand-primary hover:text-brand-primary-hover flex items-center gap-1.5 cursor-pointer transition-all font-semibold bg-brand-primary/5 hover:bg-brand-primary/10 px-3.5 py-1.5 rounded-lg border border-brand-primary/10"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Customers
            </button>
            <div className="text-[12px] text-text-secondary font-semibold font-mono">
              Active Profile: <span className="text-brand-primary font-bold">{selectedCustomer.name}</span>
            </div>
          </div>



          {/* 3-Column Compact Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Customer Details */}
            <div className="bg-white border border-border-subtle rounded-lg p-3.5 shadow-xxs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border-subtle pb-1.5 mb-2">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-text-secondary">Customer Details</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.2 border rounded font-bold uppercase tracking-wide ${renderCustomerSegmentVisual(selectedCustomer.customerType ?? selectedCustomer.segment).className}`}>
                    {renderCustomerSegmentVisual(selectedCustomer.customerType ?? selectedCustomer.segment).icon}
                    <span>{renderCustomerSegmentVisual(selectedCustomer.customerType ?? selectedCustomer.segment).label}</span>
                  </span>
                </div>
                <div className="space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Customer Name:</span>
                    <span className="font-semibold text-text-primary truncate" title={selectedCustomer.name}>{selectedCustomer.name}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Customer ID:</span>
                    <span className="font-mono font-semibold text-text-primary">{selectedCustomer.id}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Email:</span>
                    <span className="font-medium text-text-primary truncate max-w-[180px]" title={selectedCustomer.email}>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Phone:</span>
                    <span className="font-medium text-text-primary">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Created Date:</span>
                    <span className="font-medium text-text-primary">{selectedCustomer.createdAt || selectedCustomer.storeInfo?.joinedDate || '15/06/2023'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Order Information */}
            <div className="bg-white border border-border-subtle rounded-lg p-3.5 shadow-xxs flex flex-col justify-between">
              <div>
                <div className="border-b border-border-subtle pb-1.5 mb-2">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-text-secondary">Order Information</span>
                </div>
                <div className="space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium"># Orders:</span>
                    <span className="font-bold text-text-primary">{getFrontendOrderCount(selectedCustomer)} orders</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Lifetime Spend:</span>
                    <span className="font-bold text-emerald-600">
                      {selectedCustomer.totalSpend > 0
                        ? formatCurrencyAmount(selectedCustomer.totalSpend, selectedCustomer.currencyCode)
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Last Order Date:</span>
                    <span className="font-semibold text-text-primary">{selectedCustomer.lastOrderDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Lead Information */}
            <div className="bg-white border border-border-subtle rounded-lg p-3.5 shadow-xxs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border-subtle pb-1.5 mb-2">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-text-secondary">Lead Information</span>
                  {selectedCustomer.leadNo !== 'None' && (
                    <span className={`text-[10px] px-2 py-0.2 border rounded font-bold uppercase tracking-wide ${
                      selectedCustomer.leadStatus === 'Completed' ? 'bg-emerald-50 text-brand-primary border-emerald-200' :
                      selectedCustomer.leadStatus === 'Follow-up' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      selectedCustomer.leadStatus === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {selectedCustomer.leadStatus}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Lead Number:</span>
                    {selectedCustomer.leadNo !== 'None' ? (
                      <button 
                        onClick={() => onNavigateToLead(selectedCustomer.leadNo)}
                        className="font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {selectedCustomer.leadNo} <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-text-secondary italic">None</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-secondary font-medium">Assigned Staff:</span>
                    <span className="font-semibold text-text-primary">
                      {leads.find(l => l.customerName.toLowerCase() === selectedCustomer.name.toLowerCase())?.assignedStaff || 'John Doe'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Section (Clinical/Enterprise High-Contrast Grid) */}
          <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle/40">
              <div>
                <h3 className="text-[18px] font-semibold text-text-primary">Order Details</h3>
                <p className="text-[12px] text-text-secondary mt-1 font-medium">{selectedCustomer.orders?.length || 0} order(s) for {selectedCustomer.name}</p>
              </div>
            </div>

            {/* Filter Card for Order Details */}
            <div className="bg-bg-neutral border border-border-subtle p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-primary" />
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Filter Orders</h4>
                </div>
                <button
                  onClick={() => {
                    setOrderSearchQuery('');
                    setOrderStatusFilter('All');
                    setOrderMinAmount('');
                    setOrderMaxAmount('');
                    setSelectedOrderStartDate('');
                    setSelectedOrderEndDate('');
                    setOrderPaymentStatusFilter('All');
                    setOrderFulfillmentStatusFilter('All');
                    setOrderMinQty('');
                    setOrderMaxQty('');
                    setOrderMinPrice('');
                    setOrderMaxPrice('');
                    setOrderCurrentPage(1);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Field 1: Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => {
                      setOrderSearchQuery(e.target.value);
                      setOrderCurrentPage(1);
                    }}
                    placeholder="Search order, product, variant..."
                    className="w-full text-xs bg-white border border-border-subtle pl-9 pr-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-text-secondary font-semibold"
                  />
                </div>

                {/* Field 2: Order Status */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-text-secondary font-semibold whitespace-nowrap">Status:</span>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => {
                      setOrderStatusFilter(e.target.value);
                      setOrderCurrentPage(1);
                    }}
                    className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="Pending">Pending</option>
                    <option value="Unfulfilled">Unfulfilled</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                {/* Field 3: Payment Status */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-text-secondary font-semibold whitespace-nowrap">Payment:</span>
                  <select
                    value={orderPaymentStatusFilter}
                    onChange={(e) => {
                      setOrderPaymentStatusFilter(e.target.value);
                      setOrderCurrentPage(1);
                    }}
                    className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer font-semibold"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 4: Fulfillment Status */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-text-secondary font-semibold whitespace-nowrap">Fulfillment:</span>
                  <select
                    value={orderFulfillmentStatusFilter}
                    onChange={(e) => {
                      setOrderFulfillmentStatusFilter(e.target.value);
                      setOrderCurrentPage(1);
                    }}
                    className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>

                {/* Field 5: Order Start Date */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-text-secondary font-semibold whitespace-nowrap">Start:</span>
                  <input
                    type="date"
                    value={selectedOrderStartDate}
                    onChange={(e) => {
                      setSelectedOrderStartDate(e.target.value);
                      setOrderCurrentPage(1);
                    }}
                    className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none font-semibold text-text-primary"
                  />
                </div>

                {/* Field 6: Order End Date */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-text-secondary font-semibold whitespace-nowrap">End:</span>
                  <input
                    type="date"
                    value={selectedOrderEndDate}
                    onChange={(e) => {
                      setSelectedOrderEndDate(e.target.value);
                      setOrderCurrentPage(1);
                    }}
                    className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none font-semibold text-text-primary"
                  />
                </div>

                {/* Inline Action Buttons (Search & Clear) */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="h-8 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold px-3 rounded text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" /> Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderSearchQuery('');
                      setOrderStatusFilter('All');
                      setOrderMinAmount('');
                      setOrderMaxAmount('');
                      setSelectedOrderStartDate('');
                      setSelectedOrderEndDate('');
                      setOrderPaymentStatusFilter('All');
                      setOrderFulfillmentStatusFilter('All');
                      setOrderMinQty('');
                      setOrderMaxQty('');
                      setOrderMinPrice('');
                      setOrderMaxPrice('');
                      setOrderCurrentPage(1);
                    }}
                    className="h-8 bg-white border border-[#2563eb]/30 hover:border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/5 font-bold px-3 rounded text-xs transition-colors flex items-center justify-center cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Grid Table Container */}
            <div className="overflow-x-auto border border-gray-300 rounded-xl bg-white shadow-xs">
              <table
                className="w-full text-left border-collapse table-fixed"
                style={{ minWidth: `${detailedOrderGrid.tableWidth}px` }}
              >
                <colgroup>
                  {DETAILED_ORDER_GRID_COLUMNS.map((column) => (
                    <col key={column.id} style={detailedOrderGrid.getColStyle(column.id)} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-[#B9D7FC] text-slate-900 text-[13px] font-bold border-b border-gray-300">
                    <th className="py-1.5 px-3 text-center border-r border-gray-300 relative group">
                      <ResizeHandle
                        columnId="expander"
                        onResizeStart={detailedOrderGrid.startResize}
                        onResizeMove={detailedOrderGrid.handleResizeMove}
                        onResizeEnd={detailedOrderGrid.handleResizeEnd}
                      />
                    </th>
                    {renderResizableHeader(detailedOrderGrid, 'orderId', <>Order ID</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
                    {renderResizableHeader(detailedOrderGrid, 'orderName', <>Order Name</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
                    {renderResizableHeader(detailedOrderGrid, 'orderDate', <>Order Date</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold font-sans text-slate-900')}
                    {renderResizableHeader(detailedOrderGrid, 'orderStatus', <>Fulfillment status</>, 'py-1.5 px-3 text-center border-r border-gray-300 font-bold text-slate-900')}
                    {renderResizableHeader(detailedOrderGrid, 'paymentStatus', <>Payment Status</>, 'py-1.5 px-3 text-center border-r border-gray-300 font-bold text-slate-900')}
                    {renderResizableHeader(detailedOrderGrid, 'fulfillmentStatus', <>Fulfillment Status</>, 'py-1.5 px-3 text-center border-r border-gray-300 font-bold text-slate-900')}
                    {renderResizableHeader(detailedOrderGrid, 'deliveryStatus', <>Delivery Status / Date</>, 'py-1.5 px-3 text-center border-r border-gray-300 font-bold text-slate-900')}
                    {renderResizableHeader(detailedOrderGrid, 'totalAmount', <>Total Amount</>, 'py-1.5 px-3 text-right font-bold text-slate-900')}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndPaginatedOrders.items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-text-secondary">
                        <div className="text-sm font-semibold text-text-primary mb-1">No orders match filter criteria</div>
                        <div className="text-xs">Try widening your search queries or resetting filters.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndPaginatedOrders.items.map(o => {
                      const orderLineItems = o.lineItems || [];
                      const orderName = o.name || `Order ${o.orderId}`;
                      const orderProductSummary = orderLineItems.length > 0
                        ? `${orderLineItems[0].name}${orderLineItems.length > 1 ? ` + ${orderLineItems.length - 1} more` : ''}`
                        : 'No products';
                      const isExpanded = !!expandedOrderIds[o.orderId];

                      return (
                        <React.Fragment key={o.orderId}>
                          <tr 
                            onClick={() => setExpandedOrderIds(prev => ({ ...prev, [o.orderId]: !prev[o.orderId] }))}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer text-[13.5px] ${isExpanded ? 'bg-slate-100/70 font-medium' : ''}`}
                          >
                            {/* Chevron Action Column */}
                            <td className="py-1.5 px-3 text-center border-r border-b border-gray-200 align-middle">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedOrderIds(prev => ({ ...prev, [o.orderId]: !prev[o.orderId] }));
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors text-text-secondary hover:text-text-primary inline-flex items-center justify-center"
                                aria-label={isExpanded ? "Collapse row" : "Expand row"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-brand-primary transform rotate-180 transition-transform duration-200" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-text-secondary transition-transform duration-200" />
                                )}
                              </button>
                            </td>

                            {/* Order ID */}
                            <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle font-mono font-bold text-brand-primary">
                              {o.orderId}
                            </td>

                            {/* Order Name */}
                            <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle overflow-hidden">
                              <div className="font-semibold text-text-primary truncate" title={orderName}>{orderName}</div>
                              {orderLineItems.length > 0 && (
                                <div className="text-[11.5px] text-text-secondary font-medium mt-0.5 truncate" title={orderProductSummary}>
                                  {orderProductSummary}
                                </div>
                              )}
                            </td>

                            {/* Order Date */}
                            <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-text-secondary font-medium">
                              {o.date}
                            </td>

                            {/* Order Status */}
                            <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-center">
                              {renderStatusBadge('order', o.status)}
                            </td>

                            {/* Payment Status */}
                            <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-center">
                              {renderStatusBadge('payment', o.paymentStatus)}
                            </td>

                            {/* Fulfillment Status */}
                            <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-center">
                              {renderStatusBadge('fulfillment', o.fulfillmentStatus)}
                            </td>

                            {/* Delivery Status */}
                            <td className="py-1.5 px-3 border-r border-b border-gray-200 align-middle text-center">
                              {renderDeliveryStatusCell(o.deliveryStatus, o.deliveredAt, 'center')}
                            </td>

                            {/* Total Amount */}
                            <td className="py-1.5 px-3 border-b border-gray-200 align-middle text-right font-bold text-text-primary">
                              {o.totalAmount && o.totalAmount > 0
                                ? formatCurrencyAmount(o.totalAmount, selectedCustomer?.currencyCode)
                                : '-'}
                            </td>
                          </tr>

                          {/* Expandable Order Details Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={9} className="p-4 border-t border-b border-gray-300">
                                <div className="relative bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs p-1">
                                  <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-r-full bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 opacity-85" />
                                  <div className="pl-3">
                                    <OrderProductBreakdown
                                      orderId={o.orderId}
                                      orderDate={o.date}
                                      orderStatus={o.status}
                                      totalAmount={o.totalAmount ?? o.amount}
                                      currencyCode={selectedCustomer?.currencyCode}
                                      customerId={selectedCustomer.id}
                                      customerName={selectedCustomer.name}
                                      orderName={o.name}
                                      items={o.lineItems}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ORDERS PAGINATION CONTROLS */}
            <div className="border-t border-gray-200 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card text-xs text-text-secondary">
              <div>
                Showing <span className="font-semibold text-text-primary">{filteredAndPaginatedOrders.total === 0 ? 0 : Math.min((orderCurrentPage - 1) * orderPageSize + 1, filteredAndPaginatedOrders.total)}</span> to{' '}
                <span className="font-semibold text-text-primary">{Math.min(orderCurrentPage * orderPageSize, filteredAndPaginatedOrders.total)}</span> of{' '}
                <span className="font-semibold text-text-primary">{filteredAndPaginatedOrders.total}</span> records
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOrderCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={orderCurrentPage === 1}
                  className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                >
                  Previous
                </button>

                {/* Pages */}
                {Array.from({ length: Math.min(5, filteredAndPaginatedOrders.totalPages) }, (_, i) => {
                  let pageNum = orderCurrentPage;
                  if (orderCurrentPage <= 3) pageNum = i + 1;
                  else if (orderCurrentPage >= filteredAndPaginatedOrders.totalPages - 2) pageNum = filteredAndPaginatedOrders.totalPages - 4 + i;
                  else pageNum = orderCurrentPage - 2 + i;

                  if (pageNum < 1 || pageNum > filteredAndPaginatedOrders.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setOrderCurrentPage(pageNum)}
                      className={`w-7 h-7 flex items-center justify-center rounded border transition-colors font-semibold cursor-pointer ${
                        orderCurrentPage === pageNum
                          ? 'bg-brand-primary border-brand-primary text-white'
                          : 'border-border-subtle bg-bg-neutral text-text-primary hover:bg-border-subtle'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setOrderCurrentPage(prev => Math.min(prev + 1, filteredAndPaginatedOrders.totalPages))}
                  disabled={orderCurrentPage === filteredAndPaginatedOrders.totalPages}
                  className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR CUSTOMER ACTIONS */}
      {showActionConfirmationModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xxs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-border-subtle rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-[#B9D7FC] text-slate-900 p-4 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wide">Confirm Communication Dispatch</h3>
              <button 
                onClick={() => setShowActionConfirmationModal(false)} 
                className="text-slate-800 hover:text-slate-950 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-text-primary leading-relaxed">
                You are preparing a segment-specific dispatch draft for <strong className="text-brand-primary">{selectedCustomer?.name}</strong>. Choose template attachments to pre-wire:
              </p>

              {selectedActionType === 'VIP' ? (
                <div className="space-y-3 bg-bg-neutral p-3.5 rounded border border-border-subtle">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="act-ty" 
                      checked={vipCheckboxes.thankYou}
                      onChange={(e) => setVipCheckboxes({...vipCheckboxes, thankYou: e.target.checked})}
                    />
                    <label htmlFor="act-ty" className="text-xs text-text-primary cursor-pointer font-medium">Attach VIP Personal Thank You note</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="act-ben" 
                      checked={vipCheckboxes.benefits}
                      onChange={(e) => setVipCheckboxes({...vipCheckboxes, benefits: e.target.checked})}
                    />
                    <label htmlFor="act-ben" className="text-xs text-text-primary cursor-pointer font-medium">Include VIP Executive Service Benefits sheet</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="act-disc" 
                      checked={vipCheckboxes.discounts}
                      onChange={(e) => setVipCheckboxes({...vipCheckboxes, discounts: e.target.checked})}
                    />
                    <label htmlFor="act-disc" className="text-xs text-text-primary cursor-pointer font-medium">Generate fresh 15% discount code voucher (VIP15)</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="act-early" 
                      checked={vipCheckboxes.earlyAccess}
                      onChange={(e) => setVipCheckboxes({...vipCheckboxes, earlyAccess: e.target.checked})}
                    />
                    <label htmlFor="act-early" className="text-xs text-text-primary cursor-pointer font-medium">Include Early Access product line invitation links</label>
                  </div>
                </div>
              ) : selectedActionType === 'Welcome' ? (
                <div className="bg-bg-neutral p-3 rounded text-xs text-text-secondary leading-relaxed border border-border-subtle">
                  Welcome email template <strong className="text-pink-600 font-mono">WELCOME10</strong> will be compiled in Shopify Draft order dashboard instantly.
                </div>
              ) : (
                <div className="bg-bg-neutral p-3 rounded text-xs text-text-secondary leading-relaxed border border-border-subtle">
                  A normal merchant communications mail will open in draft mode. Includes general system health template links.
                </div>
              )}
            </div>

            <div className="bg-bg-neutral p-4 border-t border-border-subtle flex justify-end gap-2.5">
              <button 
                onClick={() => setShowActionConfirmationModal(false)}
                className="px-4 py-2 border border-border-subtle text-xs font-semibold text-text-primary bg-white rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction}
                className="px-5 py-2 bg-brand-primary text-white text-xs font-semibold rounded shadow-sm hover:bg-brand-primary-hover"
              >
                Confirm & Enqueue Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND REWARD MODAL */}
      {isSendRewardModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xxs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-border-subtle rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
            {/* Header */}
            <div className="bg-[#B9D7FC] text-slate-900 p-4 border-b border-gray-300 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-brand-primary animate-pulse" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">🎁 Issue Customer Reward Voucher</h3>
                  <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                    Configure a shopify voucher discount for the <span className="underline font-bold">{selectedCustomerIds.length}</span> selected customer(s).
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSendRewardModalOpen(false)} 
                className="text-slate-800 hover:text-slate-950 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Column Left */}
                <div className="flex flex-col gap-4">
                  {/* Discount Type */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      Discount Type *
                    </label>
                    <select
                      id="coupon-discountType"
                      value={discountType}
                      onChange={(e) => {
                        const val = e.target.value as 'Percentage' | 'Fixed Amount' | '';
                        setDiscountType(val);
                        setDiscountValue('');
                        setCouponFormErrors(prev => ({ ...prev, discountType: '', discountValue: '' }));
                      }}
                      className={`w-full text-xs border ${
                        couponFormErrors.discountType
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                          : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                      } px-3 py-2 rounded focus:outline-none cursor-pointer bg-white`}
                    >
                      <option value="" disabled>Select Discount Type</option>
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Fixed Amount">Fixed Amount (₹)</option>
                    </select>
                    {couponFormErrors.discountType && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                        {couponFormErrors.discountType}
                      </p>
                    )}
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      Discount Value ({discountType === 'Percentage' ? '%' : '₹'}) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="coupon-discountValue"
                        min={1}
                        max={discountType === 'Percentage' ? 100 : undefined}
                        value={discountValue}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr === '') {
                            setDiscountValue('');
                          } else {
                            setDiscountValue(Math.max(1, parseInt(valStr) || 0));
                          }
                          setCouponFormErrors(prev => ({ ...prev, discountValue: '' }));
                        }}
                        className={`w-full text-xs border ${
                          couponFormErrors.discountValue
                            ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                            : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                        } pl-3 pr-8 py-2 rounded focus:outline-none bg-white`}
                      />
                      <span className="absolute right-3 top-2.5 text-text-secondary text-xxs font-bold">
                        {discountType === 'Percentage' ? '%' : '₹'}
                      </span>
                    </div>
                    {couponFormErrors.discountValue && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                        {couponFormErrors.discountValue}
                      </p>
                    )}
                  </div>

                  {/* Coupon Code */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      Coupon Code *
                    </label>
                    <div className="relative flex">
                      <input
                        type="text"
                        id="coupon-couponCode"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponFormErrors(prev => ({ ...prev, couponCode: '' }));
                        }}
                        className={`w-full text-xs border ${
                          couponFormErrors.couponCode
                            ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                            : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                        } px-3 py-2 rounded-l focus:outline-none font-mono font-bold uppercase text-brand-primary tracking-wide bg-white`}
                        placeholder="e.g. WELCOME50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const randSuffix = Math.floor(10000 + Math.random() * 90000);
                          setCouponCode(`REWARD${randSuffix}`);
                          setCouponFormErrors(prev => ({ ...prev, couponCode: '' }));
                        }}
                        className="bg-bg-neutral hover:bg-border-subtle border border-l-0 border-border-subtle px-3.5 rounded-r text-text-primary text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Generate code
                      </button>
                    </div>
                    {couponFormErrors.couponCode && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                        {couponFormErrors.couponCode}
                      </p>
                    )}
                    <p className="text-[9px] text-text-secondary mt-1">
                      Voucher code required on Shopify checkout screen.
                    </p>
                  </div>

                  {/* Notify Customer Via */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      Notify Customer Via *
                    </label>
                    <select
                      id="coupon-notifyVia"
                      value={notifyVia}
                      onChange={(e) => {
                        setNotifyVia(e.target.value as any);
                        setCouponFormErrors(prev => ({ ...prev, notifyVia: '' }));
                      }}
                      className={`w-full text-xs border ${
                        couponFormErrors.notifyVia
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                          : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                      } px-3 py-2 rounded focus:outline-none cursor-pointer bg-white`}
                    >
                      <option value="" disabled>Select Notify Customer Via</option>
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Both">Both channels</option>
                    </select>
                    {couponFormErrors.notifyVia && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                        {couponFormErrors.notifyVia}
                      </p>
                    )}
                  </div>

                  {/* Minimum Order Amount */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      Minimum Order Amount (₹) *
                    </label>
                    <input
                      type="number"
                      id="coupon-minimumOrderAmount"
                      placeholder="e.g. 500"
                      min="0"
                      step="1"
                      value={minimumOrderAmount}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        if (valStr === '') {
                          setMinimumOrderAmount('');
                        } else {
                          const parsed = parseInt(valStr, 10);
                          if (!isNaN(parsed)) {
                            setMinimumOrderAmount(Math.max(0, parsed).toString());
                          } else {
                            setMinimumOrderAmount('0');
                          }
                        }
                        setCouponFormErrors(prev => ({ ...prev, minimumOrderAmount: '' }));
                      }}
                      className={`w-full text-xs border ${
                        couponFormErrors.minimumOrderAmount
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                          : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                      } px-3 py-2 rounded focus:outline-none bg-white`}
                    />
                    {couponFormErrors.minimumOrderAmount && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                        {couponFormErrors.minimumOrderAmount}
                      </p>
                    )}
                  </div>
                </div>

                {/* Column Right */}
                <div className="flex flex-col gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      id="coupon-validFrom"
                      min={getMinStartDateTime()}
                      value={validFrom}
                      onChange={(e) => {
                        setValidFrom(e.target.value);
                        setCouponFormErrors(prev => ({ ...prev, validFrom: '', validTill: '' }));
                      }}
                      className={`w-full text-xs border ${
                        couponFormErrors.validFrom
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                          : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                      } px-3 py-1.5 rounded focus:outline-none bg-white`}
                    />
                    {couponFormErrors.validFrom && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                        {couponFormErrors.validFrom}
                      </p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      id="coupon-validTill"
                      min={validFrom || getMinStartDateTime()}
                      value={validTill}
                      onChange={(e) => {
                        setValidTill(e.target.value);
                        setCouponFormErrors(prev => ({ ...prev, validTill: '', validFrom: '' }));
                      }}
                      className={`w-full text-xs border ${
                        couponFormErrors.validTill
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                          : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                      } px-3 py-1.5 rounded focus:outline-none bg-white`}
                    />
                    {couponFormErrors.validTill && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                        {couponFormErrors.validTill}
                      </p>
                    )}
                  </div>

                  {/* Usage Limit */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      Usage Limit *
                    </label>
                    <input
                      type="number"
                      id="coupon-usageLimit"
                      placeholder="e.g. 1"
                      value={usageLimit}
                      onChange={(e) => {
                        setUsageLimit(e.target.value);
                        setCouponFormErrors(prev => ({ ...prev, usageLimit: '' }));
                      }}
                      className={`w-full text-xs border ${
                        couponFormErrors.usageLimit
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                          : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                      } px-3 py-2 rounded focus:outline-none bg-white`}
                    />
                    {couponFormErrors.usageLimit && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">
                        {couponFormErrors.usageLimit}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                      Voucher Status *
                    </label>
                    <select
                      id="coupon-grid-status"
                      value={couponGridStatus}
                      onChange={(e) => {
                        setCouponGridStatus(e.target.value as 'Active' | 'In Active');
                      }}
                      className="w-full text-xs border border-border-subtle focus:ring-1 focus:ring-brand-primary px-3 py-2 rounded focus:outline-none cursor-pointer bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="In Active">In Active</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-bg-neutral p-4 border-t border-border-subtle flex justify-end gap-2.5">
              <button 
                type="button"
                onClick={() => setIsSendRewardModalOpen(false)}
                className="px-4 py-2 border border-border-subtle text-xs font-semibold text-text-primary bg-white rounded cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSendRewardSubmit}
                className="px-5 py-2 bg-brand-primary text-white text-xs font-semibold rounded shadow-sm hover:bg-brand-primary-hover cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* READ-ONLY CUSTOMER PROFILE MODAL */}
      {profileCustomer && (() => {
        const profileSegmentVisual = renderCustomerSegmentVisual(profileCustomer.customerType ?? profileCustomer.segment);
        const profileDisplayName = formatCustomerDisplayName(profileCustomer.name || '-');
        const profileTags = (profileCustomer.tags || []).filter(Boolean);
        const profileField = (label: string, value: React.ReactNode, fullWidth = false) => (
          <div className={`rounded-xl border border-gray-200 bg-white px-3 py-2.5 min-h-[72px] flex flex-col justify-center text-left ${fullWidth ? 'lg:col-span-3' : ''}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
            <div className="mt-1 w-full text-[13px] font-semibold text-slate-900 break-words">{value ?? '-'}</div>
          </div>
        );

        return (
          <div
            className="fixed inset-0 z-[55] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setProfileCustomer(null)}
          >
            <div
              className="bg-white rounded-3xl border border-border-subtle/80 shadow-[0_24px_80px_rgba(15,23,42,0.18)] w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-4 flex items-start justify-between border-b border-border-subtle/70 bg-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#185abc]">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-extrabold text-text-primary tracking-tight truncate">{profileDisplayName}</h2>
                      <div className="text-xs text-text-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono">Customer ID: {profileCustomer.id}</span>
                        <span className="text-border-subtle">|</span>
                        <span>{profileCustomer.email}</span>
                        <span className="text-border-subtle">|</span>
                        <span>{profileCustomer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[12px] text-text-secondary">
                    Read-only customer profile. No order details are shown here.
                  </div>
                </div>

                <button
                  onClick={() => setProfileCustomer(null)}
                  className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center hover:bg-[#4280ce]/10 text-text-secondary hover:text-[#4280ce] hover:border-[#4280ce]/20 transition-all cursor-pointer shadow-xxs"
                  aria-label="Close profile"
                >
                  <X className="w-5 h-5 text-current" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/40">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  {profileField('Customer Name', profileCustomer.name)}
                  {profileField('Created Date', profileCustomer.createdAt || profileCustomer.storeInfo?.joinedDate || '-')}
                  {profileField('Updated Date', profileCustomer.updatedAt || '-')}
                  {profileField('Email', profileCustomer.email)}
                  {profileField('Phone', profileCustomer.phone)}
                  {profileField('Verified Email', profileCustomer.verifiedEmail === undefined ? '-' : profileCustomer.verifiedEmail ? 'Yes' : 'No')}
                  {profileField('City', profileCustomer.city || '-')}
                  {profileField('State', profileCustomer.state || '-')}
                  {profileField('Postal Code', profileCustomer.postalCode || '-')}
                  {profileField('Country', profileCustomer.country || '-')}
                  {profileField('Country Code', profileCustomer.countryCode || '-')}
                  {profileField('Customer Type', profileCustomer.customerType ?? profileCustomer.segment)}
                  {profileField('Segment Label', profileSegmentVisual.label)}
                  {profileField('# Orders', `${getFrontendOrderCount(profileCustomer)} orders`)}
                  {profileField('Lifetime Spend', profileCustomer.totalSpend > 0 ? formatCurrencyAmount(profileCustomer.totalSpend, profileCustomer.currencyCode) : '-')}
                  {profileField('Last Order Date', profileCustomer.lastOrderDate || '-')}
                  {profileField('Last Login', profileCustomer.lastLogin || '-')}
                  {profileField('Lead Number', profileCustomer.leadNo || '-')}
                  {profileField('Lead Status', profileCustomer.leadStatus || '-')}
                  {profileField('Lifecycle Stage', profileCustomer.storeInfo?.lifecycleStage || '-')}
                  {profileField('Tax Exempt', profileCustomer.taxExempt === undefined ? '-' : profileCustomer.taxExempt ? 'Yes' : 'No')}
                  {profileField('Tags', profileTags.length > 0 ? profileTags.join(', ') : '-')}
                  {profileField('Notes', profileCustomer.note || profileCustomer.storeInfo?.notes || '-', true)}
                  {profileField('Location', profileCustomer.location || '-')}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CUSTOMER 360 PROFILE POPUP (Image 2 & 3 layout matching Fatima Al-Sayed) */}
​       {popupCustomer && (() => {
        const details = {
          wishlist: [] as Array<{
            productId: string;
            name: string;
            price: number;
            addedDate: string;
            stockStatus: string;
          }>
        };
        
        const popupSegmentVisual = renderCustomerSegmentVisual(popupCustomer.segment);
        const popupDisplayName = popupCustomer.name
          .split(/\s+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');

        return (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
            onClick={closePopupCustomer}
          >
            {/* Modal Box */}
            <div 
              className="bg-bg-card rounded-2xl sm:rounded-3xl border border-border-subtle/80 shadow-[0_24px_80px_rgba(15,23,42,0.18)] w-full max-w-[96vw] xl:max-w-6xl 2xl:max-w-7xl overflow-hidden flex flex-col min-h-0 max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header section (matching image 2) */}
              <div className="p-4 sm:p-6 pb-4 sm:pb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border-subtle/70 bg-white">
                <div className="min-w-0">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-lg font-extrabold text-text-primary tracking-tight">{popupDisplayName}</h2>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 border rounded-md tracking-wider ${popupSegmentVisual.className}`}>
                        {popupSegmentVisual.icon}
                        <span>{popupSegmentVisual.label}</span>
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 leading-5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#4280ce]" />
                        <span className="hover:underline">{popupCustomer.email}</span>
                      </span>
                      <span className="text-border-subtle">|</span>
                      <span className="font-semibold text-text-secondary">{popupCustomer.phone}</span>
                      <span className="text-border-subtle">|</span>
                      <span className="font-mono text-text-secondary font-bold">Customer ID: {popupCustomer.id}</span>
                    </div>
                  </div>
                </div>

                {/* Circular close button with border (matching image 2) */}
                <button 
                  onClick={closePopupCustomer}
                  className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center hover:bg-[#4280ce]/10 text-text-secondary hover:text-[#4280ce] hover:border-[#4280ce]/20 transition-all cursor-pointer shadow-xxs"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-current" />
                </button>
              </div>

              {popupViewMode === 'full' && (
                <div className="px-4 sm:px-6 py-2 sm:py-0 flex flex-wrap gap-2 sm:gap-6 border-b border-border-subtle/70 bg-white text-sm">
                  {/* Abandoned Checkout Tab */}
                  <button
                    onClick={() => setPopupActiveTab('abandoned')}
                    className={`py-2.5 px-3 rounded-full border transition-all duration-150 cursor-pointer focus:outline-none flex items-center gap-2 ${
                      popupActiveTab === 'abandoned'
                        ? 'border-[#4280ce]/20 bg-[#4280ce]/10 text-[#4280ce] font-bold'
                        : 'border-transparent text-text-secondary hover:text-text-primary font-medium hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-[#ff5a67]" />
                    <span>Abandoned Checkout</span>
                  </button>

                  {/* Refund Status Tab */}
                  <button
                    onClick={() => setPopupActiveTab('refunds')}
                    className={`py-2.5 px-3 rounded-full border transition-all duration-150 cursor-pointer focus:outline-none flex items-center gap-2 ${
                      popupActiveTab === 'refunds'
                        ? 'border-[#4280ce]/20 bg-[#4280ce]/10 text-[#4280ce] font-bold'
                        : 'border-transparent text-text-secondary hover:text-text-primary font-medium hover:bg-slate-50'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-500" />
                    <span>Refund Status</span>
                  </button>

                  {/* Applied Discount Tab */}
                  <button
                    onClick={() => setPopupActiveTab('discounts')}
                    className={`py-2.5 px-3 rounded-full border transition-all duration-150 cursor-pointer focus:outline-none flex items-center gap-2 ${
                      popupActiveTab === 'discounts'
                        ? 'border-[#4280ce]/20 bg-[#4280ce]/10 text-[#4280ce] font-bold'
                        : 'border-transparent text-text-secondary hover:text-text-primary font-medium hover:bg-slate-50'
                    }`}
                  >
                    <Ticket className="w-4 h-4 text-[#8b5cf6]" />
                    <span>Applied Discount</span>
                  </button>
                </div>
              )}

              {/* Content Grid Area (Matching columns, styling, and data fields in Image 2 & 3) */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/40 px-4 py-4 sm:px-6 sm:py-6">
                {popupActiveTab === 'abandoned' && (
                  <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-xs">
                    <div className="hidden 2xl:block overflow-x-auto">
                      {isAbandonedCheckoutsLoading ? (
                        <div className="min-h-[180px] flex items-center justify-center">
                          <CustomerDataLoader overlay={false} />
                        </div>
                      ) : abandonedCheckoutsError ? (
                        <div className="min-h-[180px] flex items-center justify-center text-gray-500 text-sm font-medium px-4 text-center">
                          No abandoned checkout records found for this customer.
                        </div>
                      ) : abandonedCheckoutRows.length === 0 ? (
                        <div className="min-h-[180px] flex items-center justify-center text-gray-500 text-sm font-medium px-4 text-center">
                          No abandoned checkout records found for this customer.
                        </div>
                      ) : (
                        <table className="w-full min-w-max text-left border-collapse table-auto">
                          <thead>
                            <tr className="bg-[#B9D7FC] text-slate-900 text-[11px] font-extrabold border-b border-gray-300 uppercase tracking-wider">
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight"><span className="block truncate">Checkout ID</span></th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight"><span className="block truncate">Product Name</span></th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight"><span className="block truncate">Checkout Status</span></th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight"><span className="block truncate">Variant</span></th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight"><span className="block truncate">Variant Price</span></th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight"><span className="block truncate">Price</span></th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap text-center leading-tight"><span className="block truncate">Qty</span></th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight text-[10px] text-center">
                                <span className="block whitespace-nowrap">Next Email Scheduled At</span>
                              </th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight"><span className="block truncate">Slot Status</span></th>
                              <th className="py-2.5 px-3 font-extrabold border-r border-gray-300 whitespace-nowrap leading-tight"><span className="block truncate">Abandoned At</span></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {abandonedCheckoutPaginatedRows.map((item, idx) => {
                              const rowCurrency = item.currencyCode || popupCustomer?.currencyCode;
                              const lineCount = Math.max(item.productNames.length, item.variantTitles.length, item.variantPrices.length, 1);

                              return (
                                <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors text-[13px] border-b border-gray-200 last:border-b-0">
                                  <td className="py-2.5 px-3 font-mono font-bold text-gray-600 border-r border-gray-200 align-middle">
                                    {item.checkoutId}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-gray-800 border-r border-gray-200 align-middle">
                                    <div className="flex flex-col gap-0.5">
                                      {Array.from({ length: lineCount }, (_, lineIdx) => (
                                        <span key={`${item.id}-product-${lineIdx}`} className="block truncate" title={item.productNames[lineIdx] || '-'}>
                                          {item.productNames[lineIdx] || '-'}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-600 font-medium border-r border-gray-200 align-middle">
                                    {renderCheckoutStatusCell(item.completedAt, 'center')}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-gray-800 border-r border-gray-200 align-middle">
                                    <div className="flex flex-col gap-0.5">
                                      {Array.from({ length: lineCount }, (_, lineIdx) => (
                                        <span key={`${item.id}-variant-${lineIdx}`} className="block truncate" title={item.variantTitles[lineIdx] || '-'}>
                                          {item.variantTitles[lineIdx] || '-'}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-semibold text-gray-900 border-r border-gray-200 align-middle">
                                    <div className="flex flex-col gap-0.5">
                                      {Array.from({ length: lineCount }, (_, lineIdx) => {
                                        const variantPrice = item.variantPrices[lineIdx];
                                        return (
                                          <span key={`${item.id}-variant-price-${lineIdx}`}>
                                            {variantPrice !== null && variantPrice !== undefined ? formatCurrencyAmount(variantPrice, rowCurrency) : '-'}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-gray-900 font-semibold border-r border-gray-200 align-middle">
                                    {formatCurrencyAmount(item.price, rowCurrency)}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-gray-900 border-r border-gray-200 align-middle text-center sm:text-left">
                                    {item.qty}
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-600 font-medium border-r border-gray-200 align-middle whitespace-nowrap">
                                    <span className="block truncate" title={item.nextEmailScheduledAt || '-'}>
                                      {item.nextEmailScheduledAt || '-'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-600 font-medium border-r border-gray-200 align-middle whitespace-nowrap">
                                    <span className="block truncate" title={item.slotStatus || '-'}>
                                      {item.slotStatus || '-'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-600 font-medium border-r border-gray-200 align-middle">
                                    {item.abandonedAt}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="2xl:hidden p-3 sm:p-4 space-y-3">
                      {isAbandonedCheckoutsLoading ? (
                        <div className="min-h-[180px] flex items-center justify-center">
                          <CustomerDataLoader overlay={false} />
                        </div>
                      ) : abandonedCheckoutsError ? (
                        <div className="min-h-[180px] flex items-center justify-center text-gray-500 text-sm font-medium text-center px-4">
                          No abandoned checkout records found for this customer.
                        </div>
                      ) : abandonedCheckoutRows.length === 0 ? (
                        <div className="min-h-[180px] flex items-center justify-center text-gray-500 text-sm font-medium text-center px-4">
                          No abandoned checkout records found for this customer.
                        </div>
                      ) : (
                        abandonedCheckoutPaginatedRows.map((item, idx) => {
                          const rowCurrency = item.currencyCode || popupCustomer?.currencyCode;
                          const lineCount = Math.max(item.productNames.length, item.variantTitles.length, item.variantPrices.length, 1);

                          return (
                            <div key={item.id || idx} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-3">
                                <div className="min-w-0">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Checkout ID</div>
                                  <div className="mt-1 font-mono text-sm font-bold text-gray-800 break-all">{item.checkoutId}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Abandoned At</div>
                                  <div className="mt-1 text-sm font-semibold text-gray-700">{item.abandonedAt || '-'}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
                                <div className="bg-white px-4 py-3">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Price</div>
                                  <div className="mt-1 font-mono text-sm font-bold text-gray-900">{formatCurrencyAmount(item.price, rowCurrency)}</div>
                                </div>
                                <div className="bg-white px-4 py-3">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Qty</div>
                                  <div className="mt-1 font-mono text-sm font-bold text-gray-900">{item.qty}</div>
                                </div>
                                <div className="bg-white px-4 py-3">
                                  <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">Checkout Status</div>
                                  <div className="mt-1">
                                    {renderCheckoutStatusCell(item.completedAt, 'left')}
                                  </div>
                                </div>
                                <div className="bg-white px-4 py-3">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Slot Status</div>
                                  <div className="mt-1 text-sm font-semibold text-gray-700 break-words">{item.slotStatus || '-'}</div>
                                </div>
                              </div>

                              <div className="px-4 py-4 space-y-4">
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Product Name</div>
                                  <div className="mt-2 space-y-1.5">
                                    {Array.from({ length: lineCount }, (_, lineIdx) => (
                                      <div key={`${item.id}-product-mobile-${lineIdx}`} className="text-sm font-semibold text-gray-800">
                                        {item.productNames[lineIdx] || '-'}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Variant</div>
                                    <div className="mt-2 space-y-1.5">
                                      {Array.from({ length: lineCount }, (_, lineIdx) => (
                                        <div key={`${item.id}-variant-mobile-${lineIdx}`} className="text-sm font-semibold text-gray-800">
                                          {item.variantTitles[lineIdx] || '-'}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Variant Price</div>
                                    <div className="mt-2 space-y-1.5">
                                      {Array.from({ length: lineCount }, (_, lineIdx) => {
                                        const variantPrice = item.variantPrices[lineIdx];
                                        return (
                                          <div key={`${item.id}-variant-price-mobile-${lineIdx}`} className="text-sm font-mono font-semibold text-gray-800">
                                            {variantPrice !== null && variantPrice !== undefined ? formatCurrencyAmount(variantPrice, rowCurrency) : '-'}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Next Email Scheduled At</div>
                                  <div className="mt-2 text-sm font-semibold text-gray-700 break-words">
                                    {item.nextEmailScheduledAt || '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {!isAbandonedCheckoutsLoading && !abandonedCheckoutsError && abandonedCheckoutRows.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card text-xs text-text-secondary">
                        <div>
                          Showing <span className="font-semibold text-text-primary">{Math.min((abandonedCheckoutPage - 1) * abandonedCheckoutPageSize + 1, abandonedCheckoutRows.length)}</span> to{' '}
                          <span className="font-semibold text-text-primary">{Math.min(abandonedCheckoutPage * abandonedCheckoutPageSize, abandonedCheckoutRows.length)}</span> of{' '}
                          <span className="font-semibold text-text-primary">{abandonedCheckoutRows.length}</span> records
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setAbandonedCheckoutPage((prev) => Math.max(prev - 1, 1))}
                            disabled={abandonedCheckoutPage === 1}
                            className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                          >
                            Previous
                          </button>

                          {Array.from({ length: Math.min(5, abandonedCheckoutTotalPages) }, (_, i) => {
                            let pageNum = abandonedCheckoutPage;
                            if (abandonedCheckoutPage <= 3) pageNum = i + 1;
                            else if (abandonedCheckoutPage >= abandonedCheckoutTotalPages - 2) pageNum = abandonedCheckoutTotalPages - 4 + i;
                            else pageNum = abandonedCheckoutPage - 2 + i;

                            if (pageNum < 1 || pageNum > abandonedCheckoutTotalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setAbandonedCheckoutPage(pageNum)}
                                className={`w-7 h-7 flex items-center justify-center rounded border transition-colors font-semibold cursor-pointer ${
                                  abandonedCheckoutPage === pageNum
                                    ? 'bg-brand-primary border-brand-primary text-white'
                                    : 'border-border-subtle bg-bg-neutral text-text-primary hover:bg-border-subtle'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setAbandonedCheckoutPage((prev) => Math.min(prev + 1, abandonedCheckoutTotalPages))}
                            disabled={abandonedCheckoutPage === abandonedCheckoutTotalPages}
                            className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {popupActiveTab === 'refunds' && (
                  <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      {isRefundRowsLoading ? (
                        <div className="min-h-[180px] flex items-center justify-center">
                          <CustomerDataLoader overlay={false} />
                        </div>
                      ) : refundRowsError ? (
                          <div className="min-h-[180px] flex items-center justify-center text-gray-500 text-sm font-medium">
                          No refunds found for this customer.
                        </div>
                      ) : refundRows.length === 0 ? (
                        <div className="min-h-[180px] flex items-center justify-center text-gray-500 text-sm font-medium">
                          No refunds found for this customer.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#B9D7FC] text-slate-900 text-[12px] font-extrabold border-b border-gray-300 uppercase tracking-wider">
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Refund ID</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Date</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Product Name</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap text-center">Quantity</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">SKU</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap text-right">Amount</th>
                              <th className="py-2.5 px-3.5 font-extrabold whitespace-nowrap text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {refundPaginatedRows.map((ref, idx) => {
                              const normalizedStatus = ref.status.toLowerCase();
                              const statusStyle =
                                normalizedStatus === 'approved' ||
                                normalizedStatus === 'refunded' ||
                                normalizedStatus === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : normalizedStatus === 'pending' || normalizedStatus === 'processing'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200';

                              return (
                                <tr key={`${ref.id}-${idx}`} className="hover:bg-slate-50 transition-colors text-[13px] border-b border-gray-200 last:border-b-0">
                                  <td className="py-2.5 px-3.5 font-mono font-bold text-gray-600 border-r border-gray-200 align-middle">
                                    {ref.id}
                                  </td>
                                  <td className="py-2.5 px-3.5 font-semibold text-gray-800 border-r border-gray-200 align-middle">
                                    {ref.date}
                                  </td>
                                  <td className="py-2.5 px-3.5 font-semibold text-gray-800 border-r border-gray-200 align-middle">
                                    {ref.productName || '-'}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-center border-r border-gray-200 align-middle">
                                    {ref.quantity ?? '-'}
                                  </td>
                                  <td className="py-2.5 px-3.5 font-mono text-gray-700 border-r border-gray-200 align-middle">
                                    {ref.sku || '-'}
                                  </td>
                                  <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-600 border-r border-gray-200 align-middle text-right">
                                    {formatCurrencyAmount(ref.amount, ref.currencyCode || popupCustomer?.currencyCode)}
                                  </td>
                                  <td className="py-2.5 px-3.5 align-middle text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyle}`}>
                                      {ref.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {!isRefundRowsLoading && !refundRowsError && refundRows.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card text-xs text-text-secondary">
                        <div>
                          Showing <span className="font-semibold text-text-primary">{Math.min((refundPage - 1) * refundPageSize + 1, refundRows.length)}</span> to{' '}
                          <span className="font-semibold text-text-primary">{Math.min(refundPage * refundPageSize, refundRows.length)}</span> of{' '}
                          <span className="font-semibold text-text-primary">{refundRows.length}</span> records
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setRefundPage((prev) => Math.max(prev - 1, 1))}
                            disabled={refundPage === 1}
                            className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                          >
                            Previous
                          </button>

                          {Array.from({ length: Math.min(5, refundTotalPages) }, (_, i) => {
                            let pageNum = refundPage;
                            if (refundPage <= 3) pageNum = i + 1;
                            else if (refundPage >= refundTotalPages - 2) pageNum = refundTotalPages - 4 + i;
                            else pageNum = refundPage - 2 + i;

                            if (pageNum < 1 || pageNum > refundTotalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setRefundPage(pageNum)}
                                className={`w-7 h-7 flex items-center justify-center rounded border transition-colors font-semibold cursor-pointer ${
                                  refundPage === pageNum
                                    ? 'bg-brand-primary border-brand-primary text-white'
                                    : 'border-border-subtle bg-bg-neutral text-text-primary hover:bg-border-subtle'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setRefundPage((prev) => Math.min(prev + 1, refundTotalPages))}
                            disabled={refundPage === refundTotalPages}
                            className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {popupActiveTab === 'discounts' && (
                  <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      {isDiscountRowsLoading ? (
                        <div className="min-h-[180px] flex items-center justify-center">
                          <CustomerDataLoader overlay={false} />
                        </div>
                      ) : discountRowsError ? (
                          <div className="min-h-[180px] flex items-center justify-center text-gray-500 text-sm font-medium">
                              No discounts found for this customer.
                        </div>
                      ) : discountRows.length === 0 ? (
                        <div className="min-h-[180px] flex items-center justify-center text-gray-500 text-sm font-medium">
                          No discounts found for this customer.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#B9D7FC] text-slate-900 text-[12px] font-extrabold border-b border-gray-300 uppercase tracking-wider">
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Order Id</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Coupon Code</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Percentage</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Amount</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Description</th>
                              <th className="py-2.5 px-3.5 font-extrabold border-r border-gray-300 whitespace-nowrap">Order Amount</th>
                              <th className="py-2.5 px-3.5 font-extrabold whitespace-nowrap">Discount Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {discountPaginatedRows.map((disc, idx) => (
                              <tr key={`${disc.orderId || 'order'}-${disc.code}-${idx}`} className="hover:bg-slate-50 transition-colors text-[13px] border-b border-gray-200 last:border-b-0">
                                <td className="py-2.5 px-3.5 font-mono font-bold text-gray-600 border-r border-gray-200 align-middle">
                                  {disc.orderId || '-'}
                                </td>
                                <td className="py-2.5 px-3.5 font-mono font-black text-indigo-600 border-r border-gray-200 align-middle">
                                  <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-xs">
                                    {disc.code || '-'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 font-semibold text-gray-800 border-r border-gray-200 align-middle">
                                  {disc.percentage !== undefined && disc.percentage !== null && disc.percentage !== ''
                                    ? `${disc.percentage}%`
                                    : '-'}
                                </td>
                                <td className="py-2.5 px-3.5 font-semibold text-gray-800 border-r border-gray-200 align-middle">
                                  {disc.amount !== undefined && disc.amount !== null && disc.amount !== ''
                                    ? formatCurrencyAmount(Number(disc.amount), disc.currencyCode || popupCustomer?.currencyCode)
                                    : '-'}
                                </td>
                                <td className="py-2.5 px-3.5 font-medium text-gray-800 border-r border-gray-200 align-middle">
                                  {disc.description || '-'}
                                </td>
                                <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-600 border-r border-gray-200 align-middle">
                                  {disc.orderPrice !== undefined && disc.orderPrice !== null
                                    ? formatCurrencyAmount(disc.orderPrice, disc.currencyCode || popupCustomer?.currencyCode)
                                    : '-'}
                                </td>
                                <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-600 align-middle">
                                  {disc.discountAmount !== undefined && disc.discountAmount !== null
                                    ? formatCurrencyAmount(disc.discountAmount, disc.currencyCode || popupCustomer?.currencyCode)
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {!isDiscountRowsLoading && !discountRowsError && discountRows.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card text-xs text-text-secondary">
                        <div>
                          Showing <span className="font-semibold text-text-primary">{Math.min((discountPage - 1) * discountPageSize + 1, discountRows.length)}</span> to{' '}
                          <span className="font-semibold text-text-primary">{Math.min(discountPage * discountPageSize, discountRows.length)}</span> of{' '}
                          <span className="font-semibold text-text-primary">{discountRows.length}</span> records
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDiscountPage((prev) => Math.max(prev - 1, 1))}
                            disabled={discountPage === 1}
                            className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                          >
                            Previous
                          </button>

                          {Array.from({ length: Math.min(5, discountTotalPages) }, (_, i) => {
                            let pageNum = discountPage;
                            if (discountPage <= 3) pageNum = i + 1;
                            else if (discountPage >= discountTotalPages - 2) pageNum = discountTotalPages - 4 + i;
                            else pageNum = discountPage - 2 + i;

                            if (pageNum < 1 || pageNum > discountTotalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setDiscountPage(pageNum)}
                                className={`w-7 h-7 flex items-center justify-center rounded border transition-colors font-semibold cursor-pointer ${
                                  discountPage === pageNum
                                    ? 'bg-brand-primary border-brand-primary text-white'
                                    : 'border-border-subtle bg-bg-neutral text-text-primary hover:bg-border-subtle'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setDiscountPage((prev) => Math.min(prev + 1, discountTotalPages))}
                            disabled={discountPage === discountTotalPages}
                            className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Footer Section (matching image 2) */}
              <div className="flex-none bg-slate-50/80 border-t border-gray-100 p-4 sm:p-5 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-end gap-3 text-xs">
                {/* Last activity / login */}
                <div className="max-w-full text-[11px] text-gray-400 font-medium font-mono text-center sm:text-right break-words">
                  Last Login: {popupCustomer.lastLogin} • Last Order: {popupCustomer.lastOrderDate}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showSegmentSettings && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xxs flex items-center justify-center p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50 px-5 py-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">Segmentation Settings</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Control VIP auto-tagging and threshold-based tagging.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSegmentSettings(false)}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close segmentation settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">VIP auto-tagging</div>
                  <div className="text-xs text-gray-500 mt-1">
                    When enabled, threshold fields are hidden and customers are auto-categorized.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDynamicSegEnabled((prev) => !prev)}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                    dynamicSegEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                  aria-pressed={dynamicSegEnabled}
                  aria-label="Toggle VIP auto-tagging"
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                      dynamicSegEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {!dynamicSegEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] font-bold text-gray-500 mb-1">Total Spend Range</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={spendThreshold}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSpendThreshold(value === '' ? 0 : Math.max(0, Number(value) || 0));
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xxs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 150000"
                    />
                    <p className="mt-1 text-[10px] text-gray-500">Customers at or above this spend become VIP.</p>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-gray-500 mb-1">Order Count Range</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={orderThreshold}
                      onChange={(e) => {
                        const value = e.target.value;
                        setOrderThreshold(value === '' ? 0 : Math.max(0, Number(value) || 0));
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xxs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 10"
                    />
                    <p className="mt-1 text-[10px] text-gray-500">Customers at or above this order count become VIP.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowSegmentSettings(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSegmentationSettings}
                className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-primary-hover"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
