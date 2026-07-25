export type Priority = 'High' | 'Medium' | 'Low';

export type LeadStatus = 'New' | 'Follow-up' | 'Completed' | 'In-complete';

export interface LeadTimelineEvent {
  id: string;
  timestamp: string;
  event: string;
}

export interface LeadCoupon {
  couponCode: string;
  discountType: 'Percentage' | 'Fixed Amount';
  discountValue: number;
  validFrom?: string;
  validTill: string;
  notifyVia: 'Email' | 'WhatsApp' | 'Both';
  status: 'Sent' | 'Redeemed' | 'Expired';
  orderPlaced: 'Yes' | 'No';
}

export interface Lead {
  id: string; // e.g. "LD-1024"
  customerName: string;
  email: string;
  phone: string;
  notes: string;
  productName: string;
  variant: string;
  quantity: number;
  expectedValue: number;
  priority: Priority;
  source: string;
  assignedStaff: string;
  status: LeadStatus;
  followUpDate?: string;
  timeline: LeadTimelineEvent[];
  coupon?: LeadCoupon;
}

export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Escalated';
export type SLAStatus = 'Pending' | 'Due Soon' | 'Overdue' | 'Completed';

export interface ComplaintDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface Complaint {
  id: string; // e.g. "CP-4081"
  customerName: string;
  customerEmail: string;
  orderId: string;
  description: string;
  category: string;
  priority: Priority;
  complaintDate: string;
  assignedTo: string;
  slaDueDate: string;
  slaStatus: SLAStatus;
  status: ComplaintStatus;
  documents: ComplaintDocument[];
}

export type CustomerSegment = 'VIP' | 'Regular' | 'New' | 'Inactive';

export interface CustomerOrder {
  orderId: string;
  name?: string;
  date: string;
  deliveredAt?: string;
  amount: number;
  status: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  deliveryStatus?: string;
  totalAmount?: number;
  lineItems?: CustomerProduct[];
}

export interface CustomerProduct {
  name: string;
  productType?: string;
  vendor?: string;
  orderId?: string;
  orderName?: string;
  sku?: string;
  variant: string;
  qty: number;
  price: number;
}

export interface CustomerRefund {
  id: string;
  date: string;
  productName?: string;
  quantity?: number;
  sku?: string;
  amount: number;
  currencyCode?: string;
  status: string;
}

export interface CustomerDiscount {
  code: string;
  description: string;
  status: string;
  orderId?: string;
  percentage?: string | number | null;
  amount?: string | number | null;
  orderPrice?: number;
  discountAmount?: number;
  currencyCode?: string;
}
 
export interface CustomerAbandonedCheckout {
  id: string;
  checkoutId: string;
  productNames: string[];
  variantTitles: string[];
  variantPrices: Array<number | null>;
  price: number;
  qty: number;
  nextScheduleEmail?: string;
  abandonedAt: string;
  currencyCode?: string;
}

export interface Customer {
  id: string; // Customer Number
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
  currencyCode?: string;
  country: string;
  location: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  verifiedEmail?: boolean;
  taxExempt?: boolean;
  note?: string;
  tags?: string[];
  lastLogin: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  abandonedCheckoutCount?: number;
  leadNo: string;
  leadStatus: LeadStatus;
  segment: CustomerSegment;
  customerType?: CustomerSegment;
  orders: CustomerOrder[];
  products: CustomerProduct[];
  complaints: { id: string; subject: string; status: ComplaintStatus }[];
  refunds: CustomerRefund[];
  discounts: CustomerDiscount[];
  storeInfo: {
    joinedDate: string;
    notes: string;
    lifecycleStage: string;
  };
}

export type CampaignType = 'Email' | 'WhatsApp';
export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sent' | 'Failed';

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  audience: string; // e.g. "All Customers", "VIP Customers", etc.
  sentCount: number;
  deliverySettings: {
    sendType: 'Now' | 'Schedule';
    scheduleDate?: string;
    scheduleTime?: string;
  };
  templateId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  channelType?: 'Email' | 'WhatsApp' | 'Notification';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: {
    name: string;
    avatar: string;
  };
  module: 'Leads' | 'Complaints' | 'Customers' | 'Campaigns' | 'Templates' | 'Settings';
  action: string;
  recordId: string;
  recordName: string;
  userType: 'Staff' | 'System';
  ipAddress: string;
  changeInfo?: {
    fieldName: string;
    oldValue: string;
    newValue: string;
  };
}

export interface ThemeSettings {
  accentColor: string;
  backgroundMode: 'off-white' | 'pure-white' | 'dark-mode';
  fontFamily: 'Inter' | 'System UI' | 'Roboto' | 'Poppins';
  fontSize: 'Compact' | 'Default' | 'Comfortable';
}

export interface SettingsState {
  activityLog: {
    enabled: boolean;
    modulesToTrack: {
      leads: boolean;
      complaints: boolean;
      customers: boolean;
      campaigns: boolean;
      settings: boolean;
    };
    retention: '30 Days' | '90 Days' | '6 Months' | '1 Year' | 'Forever';
    allowExport: boolean;
  };
  campaign: {
    defaultChannel: CampaignType;
    smtpHost: string;
    smtpPort: string;
    username: string;
    senderEmail: string;
    senderName: string;
  };
  notifications: {
    leads: {
      created: boolean;
      assigned: boolean;
      reminder: boolean;
      goingCold: boolean;
    };
    complaints: {
      created: boolean;
      assigned: boolean;
      statusChanged: boolean;
      dueSoon: boolean;
      overdueReminder: boolean;
    };
    campaigns: {
      completed: boolean;
      failed: boolean;
    };
    customers: {
      vipNotification: boolean;
      atRiskNotification: boolean;
    };
  };
  theme?: ThemeSettings;
}
