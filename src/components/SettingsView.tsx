import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Settings, Mail, MessageSquare, Check, X, Search, Plus, Eye, Pencil, Trash2, 
  Play, Pause, Calendar, Clock, Globe, Shield, Send, CheckCircle2, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, Users, Zap
} from 'lucide-react';
import {
  fetchCustomerSegmentationSettings,
  saveCustomerSegmentationSettings,
} from '../api/customerSegmentation';

interface CampaignTemplate {
  id: string;
  name: string;
  type: 'Email' | 'WhatsApp';
  status: 'Active' | 'Inactive';
  subject?: string;
  content: string;
  createdDate: string;
  lastUpdated: string;
  eventType?: 'Customer Action' | 'Scheduled notification' | 'Festival';
  customerActionType?: 'All Customer' | 'Abounded checkout' | 'new customer' | 'In Active customer' | 'VIP Customer';
}

interface CampaignAutomation {
  id: string;
  name: string;
  templateId: string;
  cadence: 'Daily' | 'Weekly' | 'Hourly' | 'Once';
  time: string;
  timezone: string;
  status: 'Active' | 'Inactive';
  startDate: string;
  triggerCategory: 'Recurring' | 'Event-based' | 'State-change';
  frequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Custom Interval';
  daysOfWeek?: string[];
  dateOfMonth?: number;
  customIntervalDays?: number;
  event?: 'Order Placed' | 'Cart Abandoned' | 'Order Delivered' | 'Payment Failed' | 'Refund Processed' | 'Complaint Raised' | 'Customer Created';
  timing?: 'Immediately' | 'After Delay' | 'Batch at Fixed Time';
  delayValue?: number;
  delayUnit?: 'Minutes' | 'Hours' | 'Days';
  batchTime?: string;
  condition?: 'VIP Tier Reached' | 'Inactive for X Days' | 'Birthday/Anniversary' | 'Tag Added' | 'Min Spend Threshold Reached';
  inactiveDays?: number;
  minSpendThreshold?: number;
  audienceType?: 'All Customers' | 'New Customers Only' | 'VIP Customers Only' | 'Specific Location' | 'Minimum Order Value' | '';
  specificLocations?: string[];
  minOrderValue?: number;
  lastTriggered?: string;
  startDateTime?: string;
  endDateTime?: string;
  dispatchTime?: string;
}

interface MergeTag {
  category: 'Customer' | 'Order' | 'Discount' | 'Store' | 'Festival/Occasion';
  tag: string;
  description: string;
}

const AVAILABLE_TAGS: MergeTag[] = [
  { category: 'Customer', tag: '{{customer_name}}', description: "Inserts customer's full name" },
  { category: 'Customer', tag: '{{customer_email}}', description: "Inserts customer's email address" },
  { category: 'Order', tag: '{{order_id}}', description: "Inserts the order ID" },
  { category: 'Order', tag: '{{amount}}', description: "Inserts the order amount" },
  { category: 'Discount', tag: '{{discount_code}}', description: "Inserts coupon or discount code" },
  { category: 'Discount', tag: '{{discount_percent}}', description: "Inserts the discount percentage" },
  { category: 'Store', tag: '{{store_name}}', description: "Inserts the store name" },
  { category: 'Store', tag: '{{store_url}}', description: "Inserts the online store URL" },
  { category: 'Festival/Occasion', tag: '{{festival_name}}', description: "Inserts festival name (e.g. Christmas, New Year)" },
  { category: 'Festival/Occasion', tag: '{{holiday_offer}}', description: "Inserts special holiday offer text" }
];

function formatTime12Hour(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${min} ${ampm}`;
}

function getTodayDateString(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getNextDayString(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-based
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type SegmentationFieldErrors = {
  minSpend: string;
  maxSpend: string;
  minOrderCount: string;
  maxOrderCount: string;
};

const EMPTY_SEGMENTATION_FIELD_ERRORS: SegmentationFieldErrors = {
  minSpend: '',
  maxSpend: '',
  minOrderCount: '',
  maxOrderCount: '',
};

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

function formatSpendInputValue(value: string): string {
  const cleaned = value.replace(/,/g, '').replace(/[^0-9.]/g, '');

  if (!cleaned) {
    return '';
  }

  const dotIndex = cleaned.indexOf('.');
  const integerRaw = dotIndex === -1 ? cleaned : cleaned.slice(0, dotIndex);
  const decimalRaw = dotIndex === -1 ? '' : cleaned.slice(dotIndex + 1).replace(/\./g, '');
  const integerDigits = integerRaw.replace(/\D/g, '');
  const formattedInteger = formatIndianInteger(integerDigits);

  if (dotIndex === -1) {
    return formattedInteger;
  }

  return `${formattedInteger || '0'}.${decimalRaw}`;
}

function sanitizeOrderCountInput(value: string): string {
  const cleaned = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
  const dotIndex = cleaned.indexOf('.');

  if (dotIndex === -1) {
    return cleaned;
  }

  return `${cleaned.slice(0, dotIndex)}.${cleaned.slice(dotIndex + 1).replace(/\./g, '')}`;
}

function parseSpendValue(value: string): number {
  const cleaned = value.replace(/,/g, '').trim();
  return cleaned ? Number(cleaned) : NaN;
}

function parseOrderCountValue(value: string): number {
  const cleaned = value.replace(/,/g, '').trim();
  return cleaned ? Number(cleaned) : NaN;
}

function formatOrderCountDisplay(value: string): string {
  return formatIndianInteger(value.replace(/,/g, '').trim());
}

function isWholeNumberValue(value: string): boolean {
  const cleaned = value.replace(/,/g, '').trim();
  return cleaned !== '' && /^\d+$/.test(cleaned);
}

function validateSegmentationRangeForm(values: {
  minSpend: string;
  maxSpend: string;
  minOrderCount: string;
  maxOrderCount: string;
}): SegmentationFieldErrors {
  const errors: SegmentationFieldErrors = { ...EMPTY_SEGMENTATION_FIELD_ERRORS };

  const minSpendRaw = values.minSpend.trim();
  const maxSpendRaw = values.maxSpend.trim();
  const minOrderCountRaw = values.minOrderCount.trim();
  const maxOrderCountRaw = values.maxOrderCount.trim();

  const minSpendValue = parseSpendValue(minSpendRaw);
  const maxSpendValue = maxSpendRaw ? parseSpendValue(maxSpendRaw) : NaN;
  const minOrderCountValue = parseOrderCountValue(minOrderCountRaw);
  const maxOrderCountValue = maxOrderCountRaw ? parseOrderCountValue(maxOrderCountRaw) : NaN;

  if (!minSpendRaw) {
    errors.minSpend = 'Min spend is required.';
  } else if (!Number.isFinite(minSpendValue)) {
    errors.minSpend = 'Enter a valid spend amount.';
  } else if (minSpendValue < 0) {
    errors.minSpend = 'Min spend cannot be negative.';
  }

  if (maxSpendRaw) {
    if (!Number.isFinite(maxSpendValue)) {
      errors.maxSpend = 'Enter a valid spend amount.';
    } else if (maxSpendValue < 0) {
      errors.maxSpend = 'Max spend cannot be negative.';
    } else if (!errors.minSpend && maxSpendValue < minSpendValue) {
      errors.maxSpend = `Max value cannot be less than Min value (${formatSpendInputValue(minSpendRaw)}).`;
    }
  }

  if (!minOrderCountRaw) {
    errors.minOrderCount = 'Min orders is required.';
  } else if (!isWholeNumberValue(minOrderCountRaw)) {
    errors.minOrderCount = 'Order count must be a whole number';
  } else if (!Number.isFinite(minOrderCountValue)) {
    errors.minOrderCount = 'Enter a valid order count.';
  } else if (minOrderCountValue <= 0) {
    errors.minOrderCount = 'Min orders must be greater than 0.';
  }

  if (maxOrderCountRaw) {
    if (!isWholeNumberValue(maxOrderCountRaw)) {
      errors.maxOrderCount = 'Order count must be a whole number';
    } else if (!Number.isFinite(maxOrderCountValue)) {
      errors.maxOrderCount = 'Enter a valid order count.';
    } else if (maxOrderCountValue < 0) {
      errors.maxOrderCount = 'Max orders cannot be negative.';
    } else if (!errors.minOrderCount && maxOrderCountValue < minOrderCountValue) {
      errors.maxOrderCount = `Max value cannot be less than Min value (${formatOrderCountDisplay(minOrderCountRaw)}).`;
    }
  }

  return errors;
}

function getTriggerCadenceDescription(a: CampaignAutomation, templates?: CampaignTemplate[]): string {
  const template = templates?.find(t => t.id === a.templateId);
  if (template && template.eventType) {
    if (template.eventType === 'Customer Action') {
      const trigger = template.customerActionType;
      const triggerLabel = trigger === 'new customer' ? 'New Customer' : trigger === 'Abounded checkout' ? 'Abandoned Checkout' : trigger === 'In Active customer' ? 'Inactive Customer' : trigger === 'VIP Customer' ? 'VIP Customer' : trigger || '';
      return `On Customer Action: ${triggerLabel}`;
    }
    if (template.eventType === 'Festival') {
      return `On Festival`;
    }
    return `On Scheduled Notification`;
  }
  if (a.triggerCategory === 'Recurring') {
    const timeStr = a.time || '12:00';
    if (a.frequency === 'Daily') {
      return `Daily at ${timeStr}`;
    } else if (a.frequency === 'Weekly') {
      const days = a.daysOfWeek && a.daysOfWeek.length > 0 ? a.daysOfWeek.join(', ') : 'Weekly';
      return `Weekly [${days}] at ${timeStr}`;
    } else if (a.frequency === 'Monthly') {
      return `Monthly (Day ${a.dateOfMonth || 1}) at ${timeStr}`;
    } else if (a.frequency === 'Custom Interval') {
      return `Every ${a.customIntervalDays || 1} days at ${timeStr}`;
    }
    return `${a.cadence || 'Daily'} at ${timeStr}`;
  } else if (a.triggerCategory === 'Event-based') {
    if (a.timing === 'Immediately') {
      return `On ${a.event || 'Order Placed'}`;
    } else if (a.timing === 'After Delay') {
      const unitLabel = a.delayUnit === 'Hours' ? 'hr' : a.delayUnit === 'Minutes' ? 'min' : 'day';
      return `${a.delayValue || 1}${unitLabel}${a.delayValue && a.delayValue > 1 ? 's' : ''} after ${a.event || 'Cart Abandoned'}`;
    } else if (a.timing === 'Batch at Fixed Time') {
      const formattedBatchTime = formatTime12Hour(a.batchTime);
      return `Batch ${formattedBatchTime} (${a.event || 'Cart Abandoned'})`;
    }
    return `On ${a.event || 'Order Placed'}`;
  } else if (a.triggerCategory === 'State-change') {
    if (a.condition === 'VIP Tier Reached') {
      return 'On VIP Tier Reached';
    } else if (a.condition === 'Inactive for X Days') {
      return `On Inactive ${a.inactiveDays || 30}+ days`;
    } else if (a.condition === 'Birthday/Anniversary') {
      return 'On Birthday/Anniversary';
    } else if (a.condition === 'Tag Added') {
      return 'On Tag Added';
    } else if (a.condition === 'Min Spend Threshold Reached') {
      return `On Min Spend > â‚¹${(a.minSpendThreshold || 50000).toLocaleString()}`;
    }
    return `On ${a.condition || 'State Change'}`;
  }
  return `${a.cadence} at ${a.time}`;
}

interface SettingsViewProps {
  settings?: any;
  onUpdateSettings?: (newSettings: any) => void;
  onNavigate?: (tab: string, actionModifier?: string) => void;
}

export default function SettingsView({ settings, onUpdateSettings, onNavigate }: SettingsViewProps) {
  // --- Active Tab for API Configuration ---
  const [activeApiTab, setActiveApiTab] = useState<'email' | 'whatsapp'>('email');

  // --- API Settings state ---
  const [smtpHost, setSmtpHost] = useState('smtp.techcrm.gateway.io');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecurity, setSmtpSecurity] = useState('STARTTLS (Port 587 - Recommended)');
  const [smtpUsername, setSmtpUsername] = useState('relay@techcrm-store.com');
  const [smtpPassword, setSmtpPassword] = useState('â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢');
  const [senderName, setSenderName] = useState('TechCRM Store Customer Care');
  const [senderEmail, setSenderEmail] = useState('office@techcrm-store.com');

  const [waPhoneNumber, setWaPhoneNumber] = useState('+91 90000 12345');
  const [waApiVersion, setWaApiVersion] = useState('v20.0');
  const [waAppId, setWaAppId] = useState('4567812345');
  const [waAccessToken, setWaAccessToken] = useState('â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢');
  const [waDisplayName, setWaDisplayName] = useState('TechCRM Customer Care');

  // Toasts / Status messages for forms
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSavingSegmentation, setIsSavingSegmentation] = useState(false);
  const [isLoadingSegmentation, setIsLoadingSegmentation] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- 2. Campaign Templates State ---
  const [templates, setTemplates] = useState<CampaignTemplate[]>([
    {
      id: 'TEMP-001',
      name: 'Welcome New Customer Campaign',
      type: 'Email',
      status: 'Active',
      subject: 'Welcome to TechCRM Store! ðŸŽ',
      content: 'Hi {{customer_name}},\n\nWelcome to TechCRM Store! We are thrilled to have you as part of our exclusive community. Enjoy a welcome discount on your next purchase using coupon code WELCOME10.\n\nBest regards,\nThe TechCRM Team',
      createdDate: '2026-06-10',
      lastUpdated: '2026-07-01',
      eventType: 'Customer Action',
      customerActionType: 'new customer'
    },
    {
      id: 'TEMP-002',
      name: 'Order Confirmation Receipt',
      type: 'WhatsApp',
      status: 'Active',
      content: 'Hello {{customer_name}}! ðŸ›ï¸ Your order {{order_id}} of {{amount}} is confirmed. We are preparing it for shipment. Track your delivery status directly here: https://techcrm.store/track/{{order_id}}',
      createdDate: '2026-06-15',
      lastUpdated: '2026-07-05',
      eventType: 'Scheduled notification'
    },
    {
      id: 'TEMP-003',
      name: 'Cart Abandonment Alert',
      type: 'Email',
      status: 'Active',
      subject: 'Did you forget something? ðŸ›’',
      content: 'Hi {{customer_name}},\n\nIt looks like you left some amazing items in shopping cart. Don\'t miss outâ€”complete your order now and secure free shipping!\n\nRetrieve your cart: https://techcrm.store/cart\n\nCheers,\nTechCRM Care',
      createdDate: '2026-06-20',
      lastUpdated: '2026-07-06',
      eventType: 'Customer Action',
      customerActionType: 'Abounded checkout'
    }
  ]);

  // Template Search & Filters
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateTypeFilter, setTemplateTypeFilter] = useState<'All' | 'Email' | 'WhatsApp'>('All');
  const [templateStatusFilter, setTemplateStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Collapse/Expand state for Sections - Notification Configuration expanded by default
  const [isSection1Expanded, setIsSection1Expanded] = useState(true);
  const [isSectionVipExpanded, setIsSectionVipExpanded] = useState(false);
  const [isSection2Expanded, setIsSection2Expanded] = useState(false);
  const [isSection3Expanded, setIsSection3Expanded] = useState(false);

  // New Horizontal Tab selection for Settings Panel - Notifications open by default
  const [activeTab, setActiveTab] = useState<'notifications' | 'segmentation' | 'templates' | 'scheduling'>('notifications');

  // VIP Customer Segmentation States
  const [isDynamicSegmentationOn, setIsDynamicSegmentationOn] = useState(false);
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [minOrderCount, setMinOrderCount] = useState('');
  const [maxOrderCount, setMaxOrderCount] = useState('');
  const [segmentationFieldErrors, setSegmentationFieldErrors] = useState<SegmentationFieldErrors>(EMPTY_SEGMENTATION_FIELD_ERRORS);

  // Modal States for Templates
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<CampaignTemplate>>({
    name: '',
    type: 'Email',
    status: 'Active',
    subject: '',
    content: ''
  });

  // Click-to-Insert Tag Popover states & refs
  const [isTagsPopoverOpen, setIsTagsPopoverOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [savedCursorPos, setSavedCursorPos] = useState<number>(0);

  // Grouped and filtered tags helper
  const groupedAndFilteredTags = useMemo(() => {
    const query = tagSearchQuery.toLowerCase().trim();
    const filtered = AVAILABLE_TAGS.filter(item => 
      item.tag.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );

    // Group them
    const groups: Record<string, typeof AVAILABLE_TAGS> = {};
    filtered.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [tagSearchQuery]);

  // Handle click outside of tag popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsTagsPopoverOpen(false);
      }
    }
    if (isTagsPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagsPopoverOpen]);

  // Safe handler to track textarea cursor position
  const handleTextareaSelection = () => {
    if (textareaRef.current) {
      setSavedCursorPos(textareaRef.current.selectionStart);
    }
  };

  const handleOpenTagsPopover = () => {
    if (textareaRef.current) {
      setSavedCursorPos(textareaRef.current.selectionStart);
    }
    setIsTagsPopoverOpen(prev => !prev);
    setTagSearchQuery('');
  };

  const handleInsertTag = (tag: string) => {
    const currentContent = templateForm.content || '';
    const startText = currentContent.slice(0, savedCursorPos);
    const endText = currentContent.slice(savedCursorPos);
    const newContent = startText + tag + endText;
    
    setTemplateForm(prev => ({ ...prev, content: newContent }));
    setIsTagsPopoverOpen(false);
    
    const newCursorPos = savedCursorPos + tag.length;
    
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // --- 3. Campaign Scheduling State ---
  const [automations, setAutomations] = useState<CampaignAutomation[]>([
    {
      id: 'AUTO-001',
      name: 'Daily Customer Welcome Campaign',
      templateId: 'TEMP-001',
      cadence: 'Daily',
      time: '09:00',
      timezone: 'Asia/Kolkata (IST)',
      status: 'Active',
      startDate: '2026-07-10',
      triggerCategory: 'Recurring',
      frequency: 'Daily',
      audienceType: 'All Customers',
      lastTriggered: '2026-07-09 09:00 AM'
    },
    {
      id: 'AUTO-002',
      name: 'Instant Order Confirmations WhatsApp',
      templateId: 'TEMP-002',
      cadence: 'Once',
      time: '10:30',
      timezone: 'Asia/Kolkata (IST)',
      status: 'Active',
      startDate: '2026-07-08',
      triggerCategory: 'Event-based',
      event: 'Order Placed',
      timing: 'Immediately',
      audienceType: 'All Customers',
      lastTriggered: '2026-07-09 10:30 AM'
    }
  ]);

  // Modal States for Automation
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<CampaignAutomation | null>(null);
  const [automationForm, setAutomationForm] = useState<Partial<CampaignAutomation>>({
    name: '',
    templateId: '',
    cadence: 'Daily',
    time: '12:00',
    timezone: 'Asia/Kolkata (IST)',
    status: 'Active',
    triggerCategory: 'Recurring',
    frequency: 'Daily',
    daysOfWeek: [],
    dateOfMonth: 1,
    customIntervalDays: 1,
    event: 'Order Placed',
    timing: 'Immediately',
    delayValue: 1,
    delayUnit: 'Hours',
    batchTime: '18:00',
    condition: 'VIP Tier Reached',
    inactiveDays: 30,
    minSpendThreshold: 50000,
    audienceType: '',
    specificLocations: [],
    minOrderValue: 1000,
    lastTriggered: 'Never',
    startDateTime: '',
    endDateTime: '',
    dispatchTime: ''
  });

  // Pagination for templates
  const [templatePage, setTemplatePage] = useState(1);
  const templatesPerPage = 3;

  // Pagination for campaign scheduling & registry
  const [schedulingPage, setSchedulingPage] = useState(1);
  const schedulingPerPage = 5;
  const [registryPage, setRegistryPage] = useState(1);
  const registryPerPage = 5;

  // --- Automation Campaign Tab States ---
  const [automationSubTab, setAutomationSubTab] = useState<'designer' | 'registry'>('designer');
  const [activeTrigger, setActiveTrigger] = useState<'Abandoned Checkout' | 'Inactive Customer'>('Abandoned Checkout');
  
  interface SequenceDaySetting {
    day: string;
    enabled: boolean;
    time: string;
    templateId: string;
  }

  const [sequenceDays, setSequenceDays] = useState<Record<string, SequenceDaySetting[]>>({
    'Abandoned Checkout': [
      { day: 'Monday', enabled: true, time: '10:00', templateId: 'TMP-ACB-01' },
      { day: 'Tuesday', enabled: false, time: '10:00', templateId: 'TMP-ACB-02' },
      { day: 'Wednesday', enabled: false, time: '10:00', templateId: 'TMP-ACB-03' },
      { day: 'Thursday', enabled: false, time: '10:00', templateId: 'TMP-ACB-04' },
      { day: 'Friday', enabled: false, time: '10:00', templateId: 'TMP-ACB-05' },
      { day: 'Saturday', enabled: false, time: '10:00', templateId: 'TMP-ACB-06' },
      { day: 'Sunday', enabled: false, time: '10:00', templateId: 'TMP-ACB-07' }
    ],
    'Inactive Customer': [
      { day: 'Monday', enabled: false, time: '09:00', templateId: 'TMP-ACB-01' },
      { day: 'Tuesday', enabled: true, time: '11:00', templateId: 'TEMP-001' },
      { day: 'Wednesday', enabled: false, time: '11:00', templateId: 'TMP-ACB-03' },
      { day: 'Thursday', enabled: true, time: '15:00', templateId: 'TEMP-003' },
      { day: 'Friday', enabled: false, time: '11:00', templateId: 'TMP-ACB-05' },
      { day: 'Saturday', enabled: false, time: '11:00', templateId: 'TMP-ACB-06' },
      { day: 'Sunday', enabled: false, time: '11:00', templateId: 'TMP-ACB-07' }
    ]
  });

  interface RegistryCampaign {
    id: string;
    name: string;
    startDate: string;
    dispatchTime: string;
    templates: string[]; // up to 8 sequence templates
    segment: 'Abandoned Checkout' | 'Inactive Customer' | '';
    status: 'Active' | 'Inactive' | '';
    type: 'Daily' | 'Alternative' | 'Weekly' | '';
    channelType: 'Email' | 'Whatsapp' | '';
  }

  const [registryCampaigns, setRegistryCampaigns] = useState<RegistryCampaign[]>([
    {
      id: 'AC-201',
      name: 'Cart Abandoned Recovery Campaign',
      startDate: '2026-07-15',
      dispatchTime: '10:00',
      templates: ['TMP-ACB-01', 'TMP-ACB-02', 'TMP-ACB-03'],
      segment: 'Abandoned Checkout',
      status: 'Active',
      type: 'Daily',
      channelType: 'Email'
    },
    {
      id: 'AC-202',
      name: 'Inactive Re-Engagement Sequence',
      startDate: '2026-07-20',
      dispatchTime: '14:30',
      templates: ['TEMP-001', 'TEMP-003'],
      segment: 'Inactive Customer',
      status: 'Inactive',
      type: 'Alternative',
      channelType: 'Email'
    }
  ]);

  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);
  const [selectedRegistryCampaign, setSelectedRegistryCampaign] = useState<RegistryCampaign | null>(null);
  const [registryForm, setRegistryForm] = useState<Partial<RegistryCampaign>>({
    name: '',
    startDate: '',
    dispatchTime: '',
    templates: ['', '', '', '', '', '', '', ''],
    segment: '',
    status: '',
    type: '',
    channelType: ''
  });
  const [registryErrors, setRegistryErrors] = useState<Record<string, string>>({});

  const [previewingTemplateObj, setPreviewingTemplateObj] = useState<{ name: string; subject: string; body: string } | null>(null);

  const sequenceTemplates = [
    { id: 'TMP-ACB-01', name: 'You left something behind', subject: 'Did you forget something in your cart?', body: 'Hi {{customer_name}},\n\nWe noticed you left some amazing items in your shopping cart. Don\'t miss outâ€”complete your order now and secure free shipping!\n\nRetrieve your cart: https://techcrm.store/cart\n\nCheers,\nTechCRM Care' },
    { id: 'TMP-ACB-02', name: 'Your cart is waiting', subject: 'Your cart is waiting! ðŸ›ï¸', body: 'Hello {{customer_name}}! We are holding your items for a little longer. Use coupon code CARTWAIT for a special 10% discount at checkout.\n\nShop now: https://techcrm.store/checkout' },
    { id: 'TMP-ACB-03', name: 'Complete your order today', subject: 'Last chance to complete your order!', body: 'Hi {{customer_name}},\n\nYour shopping cart is about to expire. Grab your favorite items before they go out of stock!\n\nLink to cart: https://techcrm.store/cart' },
    { id: 'TMP-ACB-04', name: 'Limited stock available', subject: 'Hurry! Items in your cart are selling fast âš¡', body: 'Hi {{customer_name}},\n\nWe wanted to let you know that one or more items in your cart are low in stock. Checkout now to avoid disappointment!\n\nComplete purchase: https://techcrm.store/cart' },
    { id: 'TMP-ACB-05', name: 'Still interested?', subject: 'Still thinking about it? Here is 10% off!', body: 'Hello {{customer_name}},\n\nWe noticed you are still considering your purchase. Here is an exclusive 10% discount coupon to make it easier: CARTSTILL10.\n\nCheckout: https://techcrm.store/cart' },
    { id: 'TMP-ACB-06', name: 'Don\'t miss your items', subject: 'Don\'t miss out on your curated items!', body: 'Hi {{customer_name}},\n\nYour selected items are still reserved for you, but we can only hold them for a brief period. Click below to checkout safely.\n\nRetrieve cart: https://techcrm.store/cart' },
    { id: 'TMP-ACB-07', name: 'Final reminder before your cart expires', subject: 'FINAL NOTICE: Your cart is expiring in 2 hours â°', body: 'Dear {{customer_name}},\n\nThis is your absolute final notice before your shopping cart expires and your items are returned to stock. Complete your purchase now for 15% off with code FINAL15.\n\nCheckout: https://techcrm.store/cart' },
    { id: 'TEMP-001', name: 'Welcome New Customer Campaign', subject: 'Welcome to TechCRM Store! ðŸŽ', body: 'Hi {{customer_name}},\n\nWelcome to TechCRM Store! We are thrilled to have you as part of our exclusive community. Enjoy a welcome discount on your next purchase using coupon code WELCOME10.\n\nBest regards,\nThe TechCRM Team' },
    { id: 'TEMP-003', name: 'Cart Abandonment Alert', subject: 'Did you forget something? ðŸ›’', body: 'Hi {{customer_name}},\n\nIt looks like you left some amazing items in shopping cart. Don\'t miss outâ€”complete your order now and secure free shipping!\n\nRetrieve your cart: https://techcrm.store/cart\n\nCheers,\nTechCRM Care' }
  ];

  // --- Handlers for Email/WhatsApp Settings ---
  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      if (activeApiTab === 'email') {
        showToast('SMTP Outbound Relay handshake successful! Connection status is CONNECTED.', 'success');
      } else {
        showToast('WhatsApp Cloud API authentication token verified successfully! Webhook ping active.', 'success');
      }
    }, 1500);
  };

  const handleSaveApiConfig = () => {
    showToast(`${activeApiTab === 'email' ? 'SMTP Email' : 'WhatsApp Cloud API'} configuration saved successfully!`, 'success');
  };

  const loadSegmentationSettings = async (signal?: AbortSignal) => {
    setIsLoadingSegmentation(true);
    setSegmentationFieldErrors(EMPTY_SEGMENTATION_FIELD_ERRORS);

    try {
      const data = await fetchCustomerSegmentationSettings({ signal });

      if (signal?.aborted) {
        return;
      }

      const nextMinSpend =
        data?.minTotalSpendThreshold ??
        data?.minSpend ??
        null;
      const nextMaxSpend =
        data?.maxTotalSpendThreshold ??
        data?.maxSpend ??
        null;
      const nextMinOrderCount =
        data?.minOrderCountThreshold ??
        data?.minOrderCount ??
        null;
      const nextMaxOrderCount =
        data?.maxOrderCountThreshold ??
        data?.maxOrderCount ??
        null;

      const nextMinSpendValue = nextMinSpend !== null && nextMinSpend !== undefined ? formatSpendInputValue(String(nextMinSpend)) : '';
      const nextMaxSpendValue = nextMaxSpend !== null && nextMaxSpend !== undefined ? formatSpendInputValue(String(nextMaxSpend)) : '';
      const nextMinOrderCountValue = nextMinOrderCount !== null && nextMinOrderCount !== undefined ? String(nextMinOrderCount) : '';
      const nextMaxOrderCountValue = nextMaxOrderCount !== null && nextMaxOrderCount !== undefined ? String(nextMaxOrderCount) : '';

      setIsDynamicSegmentationOn(data?.isDynamicSegmentationEnabled ?? false);
      setMinSpend(nextMinSpendValue);
      setMaxSpend(nextMaxSpendValue);
      setMinOrderCount(nextMinOrderCountValue);
      setMaxOrderCount(nextMaxOrderCountValue);
    } catch (error) {
      if (!signal?.aborted) {
        const message = error instanceof Error ? error.message : 'Failed to load segmentation settings.';
        showToast(message, 'error');
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoadingSegmentation(false);
      }
    }
  };

  const handleSaveSegmentationRules = async () => {
    const currentErrors = validateSegmentationRangeForm({
      minSpend,
      maxSpend,
      minOrderCount,
      maxOrderCount,
    });

    setSegmentationFieldErrors(currentErrors);

    if (Object.values(currentErrors).some(Boolean)) {
      return;
    }

    const minSpendValue = parseSpendValue(minSpend);
    const maxSpendValue = maxSpend.trim() ? parseSpendValue(maxSpend) : null;
    const minOrderCountValue = parseOrderCountValue(minOrderCount);
    const maxOrderCountValue = maxOrderCount.trim() ? parseOrderCountValue(maxOrderCount) : null;

    setIsSavingSegmentation(true);

    try {
      const message = await saveCustomerSegmentationSettings({
        isDynamicSegmentationEnabled: isDynamicSegmentationOn,
        minTotalSpendThreshold: minSpendValue,
        maxTotalSpendThreshold: maxSpendValue,
        minOrderCountThreshold: minOrderCountValue,
        maxOrderCountThreshold: maxOrderCountValue,
      });
      showToast(message, 'success');
      void loadSegmentationSettings();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save segmentation settings.';
      showToast(message, 'error');
    } finally {
      setIsSavingSegmentation(false);
    }
  };

  const handleClearSegmentationFields = () => {
    setMinSpend('');
    setMaxSpend('');
    setMinOrderCount('');
    setMaxOrderCount('');
    setSegmentationFieldErrors(EMPTY_SEGMENTATION_FIELD_ERRORS);
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadSegmentationSettings(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  // --- Handlers for Templates ---
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      // Type filter
      if (templateTypeFilter !== 'All' && t.type !== templateTypeFilter) return false;
      // Status filter
      if (templateStatusFilter !== 'All' && t.status !== templateStatusFilter) return false;
      // Search term
      if (templateSearch.trim() !== '') {
        const query = templateSearch.toLowerCase();
        return (
          t.name.toLowerCase().includes(query) ||
          (t.subject && t.subject.toLowerCase().includes(query)) ||
          t.content.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [templates, templateSearch, templateTypeFilter, templateStatusFilter]);

  const paginatedTemplates = useMemo(() => {
    const start = (templatePage - 1) * templatesPerPage;
    return filteredTemplates.slice(start, start + templatesPerPage);
  }, [filteredTemplates, templatePage]);

  const totalTemplatePages = Math.max(1, Math.ceil(filteredTemplates.length / templatesPerPage));

  const paginatedAutomations = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(automations.length / schedulingPerPage));
    const activePage = Math.min(schedulingPage, totalPages);
    const start = (activePage - 1) * schedulingPerPage;
    return automations.slice(start, start + schedulingPerPage);
  }, [automations, schedulingPage]);

  const totalSchedulingPages = Math.max(1, Math.ceil(automations.length / schedulingPerPage));

  const paginatedRegistryCampaigns = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(registryCampaigns.length / registryPerPage));
    const activePage = Math.min(registryPage, totalPages);
    const start = (activePage - 1) * registryPerPage;
    return registryCampaigns.slice(start, start + registryPerPage);
  }, [registryCampaigns, registryPage]);

  const totalRegistryPages = Math.max(1, Math.ceil(registryCampaigns.length / registryPerPage));

  const handleOpenTemplateModal = (template?: CampaignTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({ ...template });
    } else {
      setSelectedTemplate(null);
      const nextNum = templates.length > 0 
        ? Math.max(...templates.map(t => {
            const num = parseInt(t.id.replace('TEMP-', ''));
            return isNaN(num) ? 0 : num;
          })) + 1
        : 1;
      const nextId = `TEMP-${String(nextNum).padStart(3, '0')}`;
      setTemplateForm({
        id: nextId,
        name: '',
        type: 'Email',
        status: 'Active',
        subject: '',
        content: '',
        eventType: undefined,
        customerActionType: undefined
      });
    }
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.id || !templateForm.name || !templateForm.content || !templateForm.eventType) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (templateForm.eventType === 'Customer Action' && !templateForm.customerActionType) {
      showToast('Please select a customer action trigger.', 'error');
      return;
    }

    const templateId = templateForm.id.trim().toUpperCase();
    const idExists = templates.some(t => t.id === templateId && (!selectedTemplate || t.id !== selectedTemplate.id));
    if (idExists) {
      showToast(`Template ID "${templateId}" is already in use. Please choose a unique ID.`, 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (selectedTemplate) {
      // Edit
      setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? {
        ...t,
        id: templateId,
        name: templateForm.name!,
        type: templateForm.type!,
        status: templateForm.status!,
        subject: templateForm.type === 'Email' ? templateForm.subject : undefined,
        content: templateForm.content!,
        eventType: templateForm.eventType,
        customerActionType: templateForm.eventType === 'Customer Action' ? templateForm.customerActionType : undefined,
        lastUpdated: todayStr
      } as CampaignTemplate : t));

      // Update referencing automations if template ID changed
      if (selectedTemplate.id !== templateId) {
        setAutomations(prev => prev.map(a => a.templateId === selectedTemplate.id ? { ...a, templateId } : a));
      }
      showToast('Template updated successfully!', 'success');
    } else {
      // Create
      const newTemplate: CampaignTemplate = {
        id: templateId,
        name: templateForm.name!,
        type: templateForm.type!,
        status: templateForm.status!,
        subject: templateForm.type === 'Email' ? templateForm.subject : undefined,
        content: templateForm.content!,
        eventType: templateForm.eventType,
        customerActionType: templateForm.eventType === 'Customer Action' ? templateForm.customerActionType : undefined,
        createdDate: todayStr,
        lastUpdated: todayStr
      };
      setTemplates(prev => [...prev, newTemplate]);
      showToast('Campaign template created successfully!', 'success');
    }

    setIsTemplateModalOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template? Any scheduled automations using this template will be affected.')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast('Template deleted.', 'info');
    }
  };

  const handlePreviewTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  // --- Handlers for Automations ---
  const handleOpenAutomationModal = (automation?: CampaignAutomation) => {
    if (automation) {
      setSelectedAutomation(automation);
      setAutomationForm({
        ...automation,
        startDateTime: automation.startDateTime || '',
        endDateTime: automation.endDateTime || '',
        dispatchTime: automation.dispatchTime || '',
      });
    } else {
      setSelectedAutomation(null);
      const nextNum = automations.length > 0
        ? Math.max(...automations.map(a => {
            const num = parseInt(a.id.replace('AUTO-', ''));
            return isNaN(num) ? 0 : num;
          })) + 1
        : 1;
      const nextId = `AUTO-${String(nextNum).padStart(3, '0')}`;
      const todayStr = new Date().toISOString().split('T')[0];
      setAutomationForm({
        id: nextId,
        name: '',
        templateId: '',
        cadence: 'Daily',
        time: '12:00',
        timezone: 'Asia/Kolkata (IST)',
        status: 'Active',
        startDate: todayStr,
        triggerCategory: 'Recurring',
        frequency: 'Daily',
        daysOfWeek: [],
        dateOfMonth: 1,
        customIntervalDays: 1,
        event: 'Order Placed',
        timing: 'Immediately',
        delayValue: 1,
        delayUnit: 'Hours',
        batchTime: '18:00',
        condition: 'VIP Tier Reached',
        inactiveDays: 30,
        minSpendThreshold: 50000,
        audienceType: '',
        specificLocations: [],
        minOrderValue: 1000,
        lastTriggered: 'Never',
        startDateTime: '',
        endDateTime: '',
        dispatchTime: ''
      });
    }
    setIsAutomationModalOpen(true);
  };

  const handleSaveAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!automationForm.id || !automationForm.name || !automationForm.templateId) {
      showToast('Please provide all required fields.', 'error');
      return;
    }

    const automationId = automationForm.id.trim().toUpperCase();
    const idExists = automations.some(a => a.id === automationId && (!selectedAutomation || a.id !== selectedAutomation.id));
    if (idExists) {
      showToast(`Automation ID "${automationId}" is already in use.`, 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const finalStartDate = automationForm.startDate || todayStr;

    // Automatically set trigger category based on template's trigger configuration
    const selectedTemp = templates.find(t => t.id === automationForm.templateId);
    let triggerCategory: 'Recurring' | 'Event-based' | 'State-change' = 'Recurring';
    if (selectedTemp?.eventType === 'Customer Action') {
      if (selectedTemp.customerActionType === 'VIP Customer' || selectedTemp.customerActionType === 'In Active customer') {
        triggerCategory = 'State-change';
      } else {
        triggerCategory = 'Event-based';
      }
    } else if (selectedTemp?.eventType === 'Scheduled notification' || selectedTemp?.eventType === 'Festival') {
      triggerCategory = 'Recurring';
    }

    if (selectedAutomation) {
      // Edit
      setAutomations(prev => prev.map(a => a.id === selectedAutomation.id ? {
        ...a,
        id: automationId,
        name: automationForm.name!,
        templateId: automationForm.templateId!,
        cadence: automationForm.cadence || 'Daily',
        time: automationForm.time || '12:00',
        timezone: automationForm.timezone || 'Asia/Kolkata (IST)',
        status: automationForm.status || 'Active',
        startDate: finalStartDate,
        triggerCategory: triggerCategory,
        audienceType: automationForm.audienceType || 'All Customers',
        lastTriggered: a.lastTriggered || 'Never',
        startDateTime: automationForm.startDateTime || '',
        endDateTime: selectedTemp?.eventType === 'Festival' ? '' : (automationForm.endDateTime || ''),
        dispatchTime: automationForm.dispatchTime || ''
      } as CampaignAutomation : a));
      showToast('Automation schedule updated successfully!', 'success');
    } else {
      // Create
      const newAuto: CampaignAutomation = {
        id: automationId,
        name: automationForm.name!,
        templateId: automationForm.templateId!,
        cadence: 'Daily',
        time: '12:00',
        timezone: 'Asia/Kolkata (IST)',
        status: automationForm.status || 'Active',
        startDate: finalStartDate,
        triggerCategory: triggerCategory,
        audienceType: automationForm.audienceType || 'All Customers',
        lastTriggered: 'Never',
        startDateTime: automationForm.startDateTime || '',
        endDateTime: selectedTemp?.eventType === 'Festival' ? '' : (automationForm.endDateTime || ''),
        dispatchTime: automationForm.dispatchTime || ''
      };
      setAutomations(prev => [...prev, newAuto]);
      showToast('Campaign schedule automated successfully!', 'success');
    }

    setIsAutomationModalOpen(false);
  };

  const handleToggleAutomationStatus = (id: string) => {
    setAutomations(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'Active' ? 'Inactive' : 'Active';
        showToast(`Automation campaign is now ${nextStatus.toUpperCase()}`, 'info');
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const handleRunAutomationNow = (auto: CampaignAutomation) => {
    const template = templates.find(t => t.id === auto.templateId);
    showToast(`Simulation started! Campaign "${auto.name}" dispatched using ${template?.type || 'Email'} gateway to target audience.`, 'success');
  };

  const handleDeleteAutomation = (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled automation?')) {
      setAutomations(prev => prev.filter(a => a.id !== id));
      showToast('Automation campaign schedule deleted.', 'info');
    }
  };

  // --- Handlers for Automation Campaign Tab ---
  const handleToggleDay = (dayName: string) => {
    setSequenceDays(prev => {
      const current = prev[activeTrigger];
      const updated = current.map(d => d.day === dayName ? { ...d, enabled: !d.enabled } : d);
      return { ...prev, [activeTrigger]: updated };
    });
  };

  const handleDayTimeChange = (dayName: string, newTime: string) => {
    setSequenceDays(prev => {
      const current = prev[activeTrigger];
      const updated = current.map(d => d.day === dayName ? { ...d, time: newTime } : d);
      return { ...prev, [activeTrigger]: updated };
    });
  };

  const handleDayTemplateChange = (dayName: string, templateId: string) => {
    setSequenceDays(prev => {
      const current = prev[activeTrigger];
      const updated = current.map(d => d.day === dayName ? { ...d, templateId } : d);
      return { ...prev, [activeTrigger]: updated };
    });
  };

  const handlePreviewSequenceTemplate = (templateId: string) => {
    const temp = sequenceTemplates.find(t => t.id === templateId);
    if (temp) {
      setPreviewingTemplateObj({
        name: temp.name,
        subject: temp.subject,
        body: temp.body
      });
    }
  };

  const handleSaveSequenceSettings = () => {
    showToast(`Success: Sequence settings for "${activeTrigger}" saved successfully.`, 'success');
  };

  const handleRestoreSequenceDefaults = () => {
    if (confirm('Are you sure you want to revert these days to default settings?')) {
      setSequenceDays(prev => ({
        ...prev,
        [activeTrigger]: [
          { day: 'Monday', enabled: activeTrigger === 'Abandoned Checkout', time: '10:00', templateId: 'TMP-ACB-01' },
          { day: 'Tuesday', enabled: false, time: '10:00', templateId: 'TMP-ACB-02' },
          { day: 'Wednesday', enabled: false, time: '10:00', templateId: 'TMP-ACB-03' },
          { day: 'Thursday', enabled: false, time: '10:00', templateId: 'TMP-ACB-04' },
          { day: 'Friday', enabled: false, time: '10:00', templateId: 'TMP-ACB-05' },
          { day: 'Saturday', enabled: false, time: '10:00', templateId: 'TMP-ACB-06' },
          { day: 'Sunday', enabled: false, time: '10:00', templateId: 'TMP-ACB-07' }
        ]
      }));
      showToast('Sequence settings restored to default configuration.', 'info');
    }
  };

  const getSlotDateLabel = (slotIdx: number) => {
    const dateStr = registryForm.startDate || getTodayDateString();
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const targetDate = new Date(year, month, day);
    if (isNaN(targetDate.getTime())) return '';

    let multiplier = 0;
    if (registryForm.type === 'Daily') {
      multiplier = 1;
    } else if (registryForm.type === 'Alternative') {
      multiplier = 2;
    } else if (registryForm.type === 'Weekly') {
      multiplier = 7;
    } else {
      return '';
    }

    const offsetDays = slotIdx * multiplier;
    targetDate.setDate(targetDate.getDate() + offsetDays);

    const dd = String(targetDate.getDate()).padStart(2, '0');
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yyyy = targetDate.getFullYear();
    return ` (${dd}/${mm}/${yyyy})`;
  };

  // Registry campaign handlers
  const handleOpenRegistryModal = (campaign?: RegistryCampaign) => {
    setRegistryErrors({});
    if (campaign) {
      setSelectedRegistryCampaign(campaign);
      setRegistryForm({
        name: campaign.name,
        startDate: campaign.startDate,
        dispatchTime: campaign.dispatchTime,
        templates: [...campaign.templates, ...Array(8).fill('')].slice(0, 8),
        segment: campaign.segment,
        status: campaign.status,
        type: campaign.type || 'Daily',
        channelType: campaign.channelType || 'Email'
      });
    } else {
      setSelectedRegistryCampaign(null);
      setRegistryForm({
        name: '',
        startDate: '',
        dispatchTime: '',
        templates: ['', '', '', '', '', '', '', ''],
        segment: '',
        status: '',
        type: '',
        channelType: ''
      });
    }
    setIsRegistryModalOpen(true);
  };

  const handleSaveRegistryCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!registryForm.name || !registryForm.name.trim()) {
      errors.name = 'Campaign Name is required';
    }
    if (!registryForm.startDate) {
      errors.startDate = 'Campaign Start Date is required';
    }
    if (!registryForm.dispatchTime) {
      errors.dispatchTime = 'Dispatch Time is required';
    }
    if (!registryForm.segment) {
      errors.segment = 'Customer Segment Trigger is required';
    }
    if (!registryForm.status) {
      errors.status = 'Initial Status is required';
    }
    if (!registryForm.type) {
      errors.type = 'Type is required';
    }
    if (!registryForm.channelType) {
      errors.channelType = 'Channel Type is required';
    }

    if (Object.keys(errors).length > 0) {
      setRegistryErrors(errors);
      showToast('Please correct the highlighted fields.', 'error');
      return;
    }

    setRegistryErrors({});
    const cleanedTemplates = (registryForm.templates || []).filter(id => id !== '');

    if (selectedRegistryCampaign) {
      setRegistryCampaigns(prev => prev.map(c => c.id === selectedRegistryCampaign.id ? {
        ...c,
        name: registryForm.name!,
        startDate: registryForm.startDate!,
        dispatchTime: registryForm.dispatchTime!,
        templates: cleanedTemplates,
        segment: registryForm.segment! as any,
        status: registryForm.status! as any,
        type: registryForm.type! as any,
        channelType: registryForm.channelType! as any
      } : c));
      showToast(`Campaign "${registryForm.name}" updated successfully.`, 'success');
    } else {
      const newCampaign: RegistryCampaign = {
        id: 'AC-' + (200 + registryCampaigns.length + 1),
        name: registryForm.name!,
        startDate: registryForm.startDate!,
        dispatchTime: registryForm.dispatchTime!,
        templates: cleanedTemplates,
        segment: registryForm.segment! as any,
        status: registryForm.status! as any,
        type: registryForm.type! as any,
        channelType: registryForm.channelType! as any
      };
      setRegistryCampaigns(prev => [...prev, newCampaign]);
      showToast(`Campaign "${registryForm.name}" created successfully.`, 'success');
    }
    setIsRegistryModalOpen(false);
  };

  const handleDeleteRegistryCampaign = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setRegistryCampaigns(prev => prev.filter(c => c.id !== id));
      showToast('Campaign deleted successfully.', 'info');
    }
  };

  const handleToggleRegistryStatus = (id: string) => {
    setRegistryCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c));
    showToast('Campaign status updated.', 'success');
  };

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-300">
      {/* Toast Alert Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-xs font-bold animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
          toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          'bg-brand-bg-active border-brand-primary/30 text-brand-primary'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4.5 h-4.5 text-rose-600" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Horizontal Theme-Aware Tab Navigation Bar */}
      <div className="border border-border-subtle bg-bg-card rounded-t-2xl rounded-b-none p-1.5 flex flex-wrap md:flex-nowrap items-center gap-1.5 shadow-xxs mb-0 border-b-0">
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeTab === 'notifications'
              ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-xxs font-extrabold'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 border-transparent'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Notification Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('segmentation')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeTab === 'segmentation'
              ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-xxs font-extrabold'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Segmentation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeTab === 'templates'
              ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-xxs font-extrabold'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 border-transparent'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Notification Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scheduling')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeTab === 'scheduling'
              ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-xxs font-extrabold'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 border-transparent'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Campaign Scheduling</span>
        </button>
      </div>

      {/* SECTION 1: Campaign Service API Config */}
      {activeTab === 'notifications' && (
        <div className="bg-bg-card border border-border-subtle/80 border-t-0 rounded-b-2xl rounded-t-none p-6 shadow-xxs space-y-6 transition-all duration-200 mt-0">
          <div 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4 select-none"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  Notification Configuration
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Configure SMTP relays, Meta WhatsApp Gateway endpoints, and manage scheduling.
              </p>
            </div>
            {/* Toggle Pills */}
            <div 
              className="flex items-center p-1.5 bg-bg-viewport border border-border-subtle rounded-2xl text-[12.5px] font-bold select-none shadow-xxs"
            >
              <button
                type="button"
                onClick={() => { setActiveApiTab('email'); setToast(null); }}
                className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl transition-all cursor-pointer border ${
                  activeApiTab === 'email' 
                    ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-xxs font-extrabold' 
                    : 'text-text-secondary hover:text-text-primary border-transparent font-bold'
                }`}
              >
                <Mail className="w-4 h-4" /> Email Relay Configuration
              </button>
              <button
                type="button"
                onClick={() => { setActiveApiTab('whatsapp'); setToast(null); }}
                className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl transition-all cursor-pointer border ${
                  activeApiTab === 'whatsapp' 
                    ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-xxs font-extrabold' 
                    : 'text-text-secondary hover:text-text-primary border-transparent font-bold'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Cloud API
              </button>
            </div>
          </div>

          {/* Dynamic Form based on Tab */}
          {activeApiTab === 'email' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">SMTP Server Hostname</label>
                <input 
                  type="text" 
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Relay Outbound Port</label>
                <input 
                  type="text" 
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">SMTP Security Protocol</label>
                <select 
                  value={smtpSecurity}
                  onChange={(e) => setSmtpSecurity(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all cursor-pointer"
                >
                  <option>STARTTLS (Port 587 - Recommended)</option>
                  <option>SSL/TLS (Port 465)</option>
                  <option>Unsecured (Port 25)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Authentication Username</label>
                <input 
                  type="text" 
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">SMTP Password / API Token</label>
                <input 
                  type="password" 
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Sender Mask Friendly Name</label>
                <input 
                  type="text" 
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Verified Outbound Sender Email Address</label>
                <input 
                  type="email" 
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-border-subtle gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100 shadow-xxs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> CONNECTED / READY
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTestingConnection}
                  onClick={handleTestConnection}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[13px] font-bold hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 shadow-xxs"
                >
                  {isTestingConnection ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Relay...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Test Email Connection Relay
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiConfig}
                  className="px-5 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-[13px] font-bold transition-all cursor-pointer shadow-xxs"
                >
                  Save Email Configuration
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">WhatsApp Phone Number</label>
                <input 
                  type="text" 
                  value={waPhoneNumber}
                  onChange={(e) => setWaPhoneNumber(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Meta Cloud API Version</label>
                <input 
                  type="text" 
                  value={waApiVersion}
                  onChange={(e) => setWaApiVersion(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Meta Developer App ID</label>
                <input 
                  type="text" 
                  value={waAppId}
                  onChange={(e) => setWaAppId(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Sender Profile Display Name</label>
                <input 
                  type="text" 
                  value={waDisplayName}
                  onChange={(e) => setWaDisplayName(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Meta API Access Token</label>
                <input 
                  type="password" 
                  value={waAccessToken}
                  onChange={(e) => setWaAccessToken(e.target.value)}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-border-subtle gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100 shadow-xxs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> META SYSTEM TOKEN SECURED
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTestingConnection}
                  onClick={handleTestConnection}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[13px] font-bold hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5 shadow-xxs"
                >
                  {isTestingConnection ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pinging Meta Endpoint...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Test WhatsApp API Payload
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiConfig}
                  className="px-5 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-[13px] font-bold transition-all cursor-pointer shadow-xxs"
                >
                  Save WhatsApp Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

      {/* SECTION 2: Shopify Automated Customer Segmentation Rules */}
      {activeTab === 'segmentation' && (
        <div className="bg-bg-card border border-border-subtle/80 border-t-0 rounded-b-2xl rounded-t-none p-6 shadow-xxs space-y-6 transition-all duration-200 mt-0">
          <div 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4 select-none"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  VIP Customer Auto-Tagging Rules
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Automatically tag a customer as VIP when they cross these spend and order thresholds. Other segments (New, Regular, Inactive) are assigned automatically by the system and are not configurable here.
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-2 max-w-5xl mx-auto w-full">
            <div className="flex flex-col gap-4">
              {/* SEGMENTATION TRIGGER MODE */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-secondary tracking-wider uppercase block">
                  Segmentation Trigger Mode
                </span>
                <div className="flex items-center justify-between p-4 bg-bg-viewport border border-border-subtle rounded-xl min-h-[76px]">
                  <div className="flex items-center gap-3">
                    {/* Nice custom toggle switch */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIsDynamicSegmentationOn(!isDynamicSegmentationOn); }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                        isDynamicSegmentationOn ? 'bg-brand-bg-active border-brand-primary/25' : 'bg-gray-200 border-transparent'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isDynamicSegmentationOn ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-bold text-text-primary block">
                        VIP Auto-Tagging is {isDynamicSegmentationOn ? 'ON' : 'OFF'}
                      </span>
                      <span className="text-xs text-text-secondary block mt-0.5">
                        Toggle this to control whether the VIP rule is actively applied.
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      isDynamicSegmentationOn
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isDynamicSegmentationOn ? 'Rule is live' : 'Rule is paused'}
                  </span>
                </div>
              </div>

              {!isDynamicSegmentationOn && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <section className="rounded-2xl border border-border-subtle bg-white p-4 shadow-xxs">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-text-primary tracking-tight">Total Spend Range</h3>
                          <p className="text-xs text-text-secondary mt-1">
                            Set the minimum spend required. Leave max spend blank for no upper limit.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-secondary uppercase">
                            Min Spend
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={minSpend}
                            onChange={(e) => {
                              setMinSpend(formatSpendInputValue(e.target.value));
                              if (segmentationFieldErrors.minSpend) {
                                setSegmentationFieldErrors((prev) => ({ ...prev, minSpend: '', maxSpend: '' }));
                              }
                            }}
                            placeholder="Enter min spend"
                            className={`w-full px-3.5 py-2.5 bg-bg-viewport rounded-xl text-sm font-medium focus:outline-none focus:ring-2 placeholder-gray-400 text-text-primary ${
                              segmentationFieldErrors.minSpend
                                ? 'border border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : 'border border-border-subtle focus:ring-brand-primary/20 focus:border-brand-primary'
                            }`}
                          />
                          {segmentationFieldErrors.minSpend && (
                            <p className="text-[11px] font-medium text-red-600 leading-snug">{segmentationFieldErrors.minSpend}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-secondary uppercase">
                            Max Spend
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={maxSpend}
                            onChange={(e) => {
                              setMaxSpend(formatSpendInputValue(e.target.value));
                              if (segmentationFieldErrors.maxSpend) {
                                setSegmentationFieldErrors((prev) => ({ ...prev, maxSpend: '' }));
                              }
                            }}
                            placeholder="Enter Max Spend"
                            className={`w-full px-3.5 py-2.5 bg-bg-viewport rounded-xl text-sm font-medium focus:outline-none focus:ring-2 placeholder-gray-400 text-text-primary ${
                              segmentationFieldErrors.maxSpend
                                ? 'border border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : 'border border-border-subtle focus:ring-brand-primary/20 focus:border-brand-primary'
                            }`}
                          />
                          {segmentationFieldErrors.maxSpend && (
                            <p className="text-[11px] font-medium text-red-600 leading-snug">{segmentationFieldErrors.maxSpend}</p>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-border-subtle bg-white p-4 shadow-xxs">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-text-primary tracking-tight">Order Count Range</h3>
                          <p className="text-xs text-text-secondary mt-1">
                            Use whole numbers only. Leave max orders blank for no upper limit.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-secondary uppercase">
                            Min Orders
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={minOrderCount}
                            onChange={(e) => {
                              setMinOrderCount(sanitizeOrderCountInput(e.target.value));
                              if (segmentationFieldErrors.minOrderCount) {
                                setSegmentationFieldErrors((prev) => ({ ...prev, minOrderCount: '', maxOrderCount: '' }));
                              }
                            }}
                            placeholder="Enter min orders"
                            className={`w-full px-3.5 py-2.5 bg-bg-viewport rounded-xl text-sm font-medium focus:outline-none focus:ring-2 placeholder-gray-400 text-text-primary ${
                              segmentationFieldErrors.minOrderCount
                                ? 'border border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : 'border border-border-subtle focus:ring-brand-primary/20 focus:border-brand-primary'
                            }`}
                          />
                          {segmentationFieldErrors.minOrderCount && (
                            <p className="text-[11px] font-medium text-red-600 leading-snug">{segmentationFieldErrors.minOrderCount}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-secondary uppercase">
                            Max Orders
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={maxOrderCount}
                            onChange={(e) => {
                              setMaxOrderCount(sanitizeOrderCountInput(e.target.value));
                              if (segmentationFieldErrors.maxOrderCount) {
                                setSegmentationFieldErrors((prev) => ({ ...prev, maxOrderCount: '' }));
                              }
                            }}
                            placeholder="Enter Max Orders"
                            className={`w-full px-3.5 py-2.5 bg-bg-viewport rounded-xl text-sm font-medium focus:outline-none focus:ring-2 placeholder-gray-400 text-text-primary ${
                              segmentationFieldErrors.maxOrderCount
                                ? 'border border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : 'border border-border-subtle focus:ring-brand-primary/20 focus:border-brand-primary'
                            }`}
                          />
                          {segmentationFieldErrors.maxOrderCount && (
                            <p className="text-[11px] font-medium text-red-600 leading-snug">{segmentationFieldErrors.maxOrderCount}</p>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom button actions */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-border-subtle">
              <button
                type="button"
                disabled={isSavingSegmentation || isLoadingSegmentation}
                onClick={handleClearSegmentationFields}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[13px] font-bold hover:bg-slate-200 transition-colors cursor-pointer shadow-xxs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isSavingSegmentation || isLoadingSegmentation}
                onClick={handleSaveSegmentationRules}
                className="px-5 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-[13px] font-bold transition-all cursor-pointer shadow-xxs disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {(isSavingSegmentation || isLoadingSegmentation) && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isLoadingSegmentation ? 'Loading...' : isSavingSegmentation ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Campaign Templates */}
      {activeTab === 'templates' && (
        <div className="bg-bg-card border border-border-subtle/80 border-t-0 rounded-b-2xl rounded-t-none p-6 shadow-xxs space-y-4 transition-all duration-200 mt-0">
          <div 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4 select-none"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  Notification Templates
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Author inbound/outbound layouts for transactional email dispatches or direct mobile WhatsApp pings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenTemplateModal()}
              className="self-start sm:self-center px-4 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xxs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-900" /> Create Template
            </button>
          </div>

          <>
            {/* Filters and Search toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 pt-1">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  placeholder="Search templates by title, subject, or content body..." 
                  value={templateSearch}
                  onChange={(e) => { setTemplateSearch(e.target.value); setTemplatePage(1); }}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary placeholder:text-gray-400"
                />
              </div>

          {/* Type Filter */}
          <div className="flex flex-wrap items-center gap-1.5 bg-bg-viewport border border-border-subtle p-1.5 rounded-3xl text-[12px] font-bold self-start shadow-xxs">
            <button
              onClick={() => { setTemplateTypeFilter('All'); setTemplatePage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border ${
                templateTypeFilter === 'All' 
                  ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-sm scale-[1.03]' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => { setTemplateTypeFilter('Email'); setTemplatePage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border ${
                templateTypeFilter === 'Email' 
                  ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-sm scale-[1.03]' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              }`}
            >
              Emails
            </button>
            <button
              onClick={() => { setTemplateTypeFilter('WhatsApp'); setTemplatePage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border ${
                templateTypeFilter === 'WhatsApp' 
                  ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-sm scale-[1.03]' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              }`}
            >
              WhatsApp
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-1.5 bg-bg-viewport border border-border-subtle p-1.5 rounded-3xl text-[12px] font-bold self-start shadow-xxs">
            <button
              onClick={() => { setTemplateStatusFilter('All'); setTemplatePage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border ${
                templateStatusFilter === 'All' 
                  ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-sm scale-[1.03]' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => { setTemplateStatusFilter('Active'); setTemplatePage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border ${
                templateStatusFilter === 'Active' 
                  ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-sm scale-[1.03]' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => { setTemplateStatusFilter('Inactive'); setTemplatePage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border ${
                templateStatusFilter === 'Inactive' 
                  ? 'bg-[#B9D7FC] text-slate-900 border-[#96bae6] shadow-sm scale-[1.03]' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Templates Table Grid */}
        <div className="overflow-x-auto border border-border-subtle rounded-xl bg-white shadow-xs">
          <table className="w-full min-w-[1100px] text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-[37%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#B9D7FC] text-slate-900 text-[13px] font-bold border-b border-border-subtle">
                <th className="px-5 py-3 border-r border-border-subtle uppercase tracking-wider text-slate-900 text-[12px] font-bold">Template Name</th>
                <th className="px-5 py-3 border-r border-border-subtle uppercase tracking-wider text-slate-900 text-[12px] font-bold">Template Type</th>
                <th className="px-5 py-3 border-r border-border-subtle uppercase tracking-wider text-slate-900 text-[12px] font-bold">Status</th>
                <th className="px-5 py-3 border-r border-border-subtle uppercase tracking-wider text-slate-900 text-[12px] font-bold">Created Date</th>
                <th className="px-5 py-3 border-r border-border-subtle uppercase tracking-wider text-slate-900 text-[12px] font-bold">Last Updated</th>
                <th className="px-5 py-3 uppercase tracking-wider text-slate-900 text-[12px] font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-text-secondary font-bold text-[13px] border-b border-gray-200">
                    No campaign templates found matching the filtered parameters.
                  </td>
                </tr>
              ) : (
                paginatedTemplates.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors text-[13.5px]">
                    <td className="px-5 py-4 border-r border-b border-gray-200 align-middle">
                      <div className="font-extrabold text-[13.5px] text-text-primary group-hover:text-brand-primary transition-colors">{t.name}</div>
                      <div className="text-[10px] font-bold text-gray-500 mt-1 flex flex-wrap gap-2 items-center">
                        <span>ID: {t.id}</span>
                        {t.subject && (
                          <>
                            <span>â€¢</span>
                            <span className="truncate max-w-xs">Subject: {t.subject}</span>
                          </>
                        )}
                        {t.eventType && (
                          <>
                            <span>â€¢</span>
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">Event: {t.eventType}</span>
                          </>
                        )}
                        {t.customerActionType && (
                          <>
                            <span>â€¢</span>
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">Trigger: {t.customerActionType === 'new customer' ? 'New Customer' : t.customerActionType === 'Abounded checkout' ? 'Abandoned Checkout' : t.customerActionType === 'In Active customer' ? 'Inactive Customer' : t.customerActionType}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 border-r border-b border-gray-200 align-middle">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-xxs ${
                        t.type === 'Email' 
                          ? 'bg-brand-bg-active border-brand-primary/30 text-brand-primary' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        {t.type === 'Email' ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-r border-b border-gray-200 align-middle">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow-xxs border ${
                        t.status === 'Active' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-r border-b border-gray-200 align-middle font-mono font-semibold text-gray-600 text-[11.5px]">{t.createdDate}</td>
                    <td className="px-5 py-4 border-r border-b border-gray-200 align-middle font-mono font-semibold text-gray-600 text-[11.5px]">{t.lastUpdated}</td>
                    <td className="px-5 py-4 border-b border-gray-200 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePreviewTemplate(t)}
                          className="p-2 hover:bg-brand-bg-active hover:text-brand-primary rounded-xl text-text-secondary transition-all cursor-pointer border border-transparent hover:border-brand-primary/20"
                          title="Preview template"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenTemplateModal(t)}
                          className="p-2 hover:bg-amber-50 hover:text-amber-600 rounded-xl text-text-secondary transition-all cursor-pointer border border-transparent hover:border-amber-200"
                          title="Edit template"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-text-secondary transition-all cursor-pointer border border-transparent hover:border-rose-200"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs font-bold text-gray-400">
            Showing {(templatePage - 1) * templatesPerPage + 1} to {Math.min(templatePage * templatesPerPage, filteredTemplates.length)} of {filteredTemplates.length} templates
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setTemplatePage(p => Math.max(1, p - 1))}
              disabled={templatePage === 1}
              className="px-3.5 py-2 bg-bg-viewport border border-border-subtle text-text-primary rounded-xl hover:bg-bg-neutral/10 disabled:opacity-50 disabled:hover:bg-bg-viewport transition-colors cursor-pointer font-bold"
            >
              Previous
            </button>
            <button
              onClick={() => setTemplatePage(p => Math.min(totalTemplatePages, p + 1))}
              disabled={templatePage === totalTemplatePages}
              className="px-3.5 py-2 bg-bg-viewport border border-border-subtle text-text-primary rounded-xl hover:bg-bg-neutral/10 disabled:opacity-50 disabled:hover:bg-bg-viewport transition-colors cursor-pointer font-bold"
            >
              Next
            </button>
          </div>
        </div>
          </>
        </div>
      )}

      {/* SECTION 4: Campaign Scheduling */}
      {activeTab === 'scheduling' && (
        <div className="bg-bg-card border border-border-subtle/80 border-t-0 rounded-b-2xl rounded-t-none p-6 shadow-xxs space-y-4 transition-all duration-200 mt-0">
          <div 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4 select-none"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  Campaign Scheduling
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Tasks based on recurring time frames or received customer state changes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAutomationModal()}
              className="self-start sm:self-center px-4 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xxs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-900" /> Schedule
            </button>
          </div>

          <>
            {/* Scheduled Automation List Grid/Table Wrapper */}
        <div className="space-y-4">
          {/* Mobile Stacked Card Layout (<768px) */}
          <div className="block md:hidden space-y-4">
            {automations.length === 0 ? (
              <div className="p-8 text-center text-text-secondary font-bold text-[13px] border border-gray-200 rounded-xl bg-white shadow-xs">
                No scheduled campaigns registered. Select "Schedule" to begin.
              </div>
            ) : (
              paginatedAutomations.map(a => {
                const template = templates.find(t => t.id === a.templateId);
                return (
                  <div key={a.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="font-extrabold text-[14px] text-text-primary leading-snug">
                        {a.name}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border shadow-xxs shrink-0 ${
                        a.triggerCategory === 'Recurring' 
                          ? 'bg-blue-50 border-blue-100 text-blue-700' 
                          : a.triggerCategory === 'Event-based' 
                            ? 'bg-purple-50 border-purple-100 text-purple-700' 
                            : 'bg-orange-50 border-orange-100 text-orange-700'
                      }`}>
                        {a.triggerCategory || 'Recurring'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[12px]">
                      <div className="flex flex-col text-left">
                        <span className="text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">ID & Start Date</span>
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md w-fit">[ID]: {a.id}</span>
                          {a.startDateTime ? (
                            <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 leading-tight font-sans">
                              <span className="font-semibold text-slate-700">Start: {a.startDateTime}</span>
                              {a.endDateTime && <span className="font-semibold text-rose-600">End: {a.endDateTime}</span>}
                              {a.dispatchTime && (
                                <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/60 rounded px-1 py-0.5 mt-0.5 text-[9px] w-fit">
                                  Time: {formatTime12Hour(a.dispatchTime)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10.5px] font-semibold text-gray-500">Started: {a.startDate}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">Template Name</span>
                        <div className="mt-1">
                          {template ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold border shadow-xxs shrink-0 ${
                                template.type === 'Email' 
                                  ? 'bg-brand-bg-active border-brand-primary/30 text-brand-primary' 
                                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                              }`}>
                                {template.type.toUpperCase()}
                              </span>
                              <span className="font-bold text-[12px] text-text-primary break-words leading-tight">{template.name}</span>
                            </div>
                          ) : (
                            <span className="text-rose-500 font-extrabold flex items-center gap-1 text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" /> Missing Template
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col text-left col-span-2 sm:col-span-1">
                        <span className="text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">Trigger Cadence</span>
                        <div className="flex items-center gap-1.5 text-text-primary font-bold text-[12px] mt-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="leading-tight">{getTriggerCadenceDescription(a, templates)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-left col-span-2 sm:col-span-1">
                        <span className="text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">Timezone Scope</span>
                        <div className="flex items-center gap-1.5 font-semibold text-gray-600 text-[11.5px] mt-1">
                          <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{a.timezone}</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">Last Triggered</span>
                        <span className="font-mono font-semibold text-gray-500 text-[11px] mt-1">{a.lastTriggered || 'Never'}</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">Status</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold shadow-xxs border ${
                            a.status === 'Active' 
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                              : 'bg-rose-50 border border-rose-100 text-rose-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {a.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">Actions</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleAutomationStatus(a.id)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer border shadow-xxs flex items-center justify-center shrink-0 ${
                              a.status === 'Active' 
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={a.status === 'Active' ? 'DEACTIVATE' : 'ACTIVATE'}
                          >
                            {a.status === 'Active' ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunAutomationNow(a)}
                            className="p-1.5 bg-brand-bg-active hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 rounded-lg transition-all cursor-pointer shadow-xxs flex items-center justify-center shrink-0"
                            title="RUN NOW"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <div className="h-4 w-px bg-gray-200 shrink-0 mx-0.5"></div>
                          <button
                            type="button"
                            onClick={() => handleOpenAutomationModal(a)}
                            className="p-1.5 hover:bg-amber-50 hover:text-amber-600 rounded-lg text-text-secondary transition-all cursor-pointer border border-transparent hover:border-amber-200 flex items-center justify-center shrink-0"
                            title="Edit schedule"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAutomation(a.id)}
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-text-secondary transition-all cursor-pointer border border-transparent hover:border-rose-200 flex items-center justify-center shrink-0"
                            title="Delete schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table Layout (>=768px with auto sizing and horizontal scrolling) */}
          <div className="hidden md:block overflow-x-auto border border-border-subtle rounded-xl bg-white shadow-xs">
            <table className="w-full text-left border-collapse table-auto md:text-[13px] lg:text-[13.5px] min-w-[1100px]">
              <thead>
                <tr className="bg-[#B9D7FC] text-slate-900 border-b border-border-subtle font-bold">
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[140px] md:max-w-[240px] lg:max-w-[280px]">Campaign Name</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[115px] md:max-w-[140px] lg:max-w-[160px]">ID & Start Date</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[140px] md:max-w-[220px] lg:max-w-[260px]">Template Name</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[110px]">Trigger Category</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[150px] md:max-w-[220px] lg:max-w-[250px]">Trigger Cadence</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-center min-w-[110px] md:max-w-[140px] lg:max-w-[180px]">Timezone</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-center min-w-[125px]">Last Triggered</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-center min-w-[90px] md:max-w-[110px] lg:max-w-[130px]">Status</th>
                  <th className="px-3 lg:px-4 py-2.5 uppercase tracking-wider text-slate-900 text-[11px] lg:text-[12px] font-extrabold text-right min-w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {automations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-text-secondary font-bold text-[13px] border-b border-gray-200">
                      No scheduled campaigns registered. Select "Schedule" to begin.
                    </td>
                  </tr>
                ) : (
                  paginatedAutomations.map(a => {
                    const template = templates.find(t => t.id === a.templateId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle min-w-[140px] md:max-w-[240px] lg:max-w-[280px]">
                          <div className="font-extrabold text-[12.5px] lg:text-[13px] text-text-primary leading-tight break-words">
                            {a.name}
                          </div>
                        </td>
                        <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle min-w-[115px] md:max-w-[140px] lg:max-w-[160px]">
                          <div className="flex flex-col gap-1 text-left">
                            <span className="text-[9.5px] lg:text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md w-fit">[ID]: {a.id}</span>
                            {a.startDateTime ? (
                              <div className="flex flex-col gap-0.5 text-[9.5px] lg:text-[10px] text-gray-500 leading-tight font-sans">
                                <span className="font-semibold text-slate-700">Start: {a.startDateTime}</span>
                                {a.endDateTime && <span className="font-semibold text-rose-600">End: {a.endDateTime}</span>}
                                {a.dispatchTime && (
                                  <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/60 rounded px-1 py-0.5 mt-0.5 text-[9px] w-fit">
                                    Time: {formatTime12Hour(a.dispatchTime)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] lg:text-[10.5px] font-semibold text-gray-500">Started: {a.startDate}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle min-w-[140px] md:max-w-[220px] lg:max-w-[260px]">
                          {template ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center justify-center px-2 py-0.5 h-5 rounded-full text-[9px] lg:text-[10px] font-extrabold border shadow-xxs shrink-0 ${
                                template.type === 'Email' 
                                  ? 'bg-brand-bg-active border-brand-primary/30 text-brand-primary' 
                                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                              }`}>
                                {template.type.toUpperCase()}
                              </span>
                              <span className="font-bold text-[12.5px] lg:text-[13px] text-text-primary leading-tight break-words">{template.name}</span>
                            </div>
                          ) : (
                            <span className="text-rose-500 font-extrabold flex items-center gap-1 text-[12px]">
                              <AlertCircle className="w-4 h-4" /> Missing Template
                            </span>
                          )}
                        </td>
                        <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle min-w-[110px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-xxs ${
                            a.triggerCategory === 'Recurring' 
                              ? 'bg-blue-50 border-blue-100 text-blue-700' 
                              : a.triggerCategory === 'Event-based' 
                                ? 'bg-purple-50 border-purple-100 text-purple-700' 
                                : 'bg-orange-50 border-orange-100 text-orange-700'
                          }`}>
                            {a.triggerCategory || 'Recurring'}
                          </span>
                        </td>
                        <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle min-w-[150px] md:max-w-[220px] lg:max-w-[250px]">
                          <div className="flex items-center gap-1.5 text-text-primary font-bold text-[12.5px] lg:text-[13px]">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="break-words leading-tight">{getTriggerCadenceDescription(a, templates)}</span>
                          </div>
                        </td>
                        <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle text-center min-w-[110px] md:max-w-[140px] lg:max-w-[180px]">
                          <div className="inline-flex items-center justify-center gap-1.5 font-semibold text-gray-600 text-[11px] lg:text-[12px]">
                            <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="break-words">{a.timezone}</span>
                          </div>
                        </td>
                        <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle text-center min-w-[125px] font-mono font-semibold text-gray-500 text-[11.5px]">
                          {a.lastTriggered || 'Never'}
                        </td>
                        <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle text-center min-w-[90px] md:max-w-[110px] lg:max-w-[130px]">
                          <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] lg:text-[11px] font-extrabold shadow-xxs border ${
                              a.status === 'Active' 
                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                : 'bg-rose-50 border border-rose-100 text-rose-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {a.status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 lg:px-4 py-3 border-b border-gray-200 align-middle text-right min-w-[150px]">
                          <div className="flex items-center justify-end gap-2 lg:gap-3">
                            {/* Primary Actions - Compact and Tooltip on Hover */}
                            <div className="flex items-center gap-1.5 lg:gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleAutomationStatus(a.id)}
                                className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-all cursor-pointer border shadow-xxs flex items-center justify-center shrink-0 ${
                                  a.status === 'Active' 
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                                title={a.status === 'Active' ? 'DEACTIVATE' : 'ACTIVATE'}
                              >
                                {a.status === 'Active' ? (
                                  <Pause className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRunAutomationNow(a)}
                                className="p-1.5 lg:p-2 bg-brand-bg-active hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 rounded-lg lg:rounded-xl transition-all cursor-pointer shadow-xxs flex items-center justify-center shrink-0"
                                title="RUN NOW"
                              >
                                <Send className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              </button>
                            </div>
                            
                            {/* Vertical Divider */}
                            <div className="h-4 w-px bg-gray-200 shrink-0"></div>
                            
                            {/* Secondary Actions Group */}
                            <div className="flex items-center gap-1 lg:gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenAutomationModal(a)}
                                className="p-1.5 lg:p-2 hover:bg-amber-50 hover:text-amber-600 rounded-lg lg:rounded-xl text-text-secondary transition-all cursor-pointer border border-transparent hover:border-amber-200 flex items-center justify-center shrink-0"
                                title="Edit schedule"
                              >
                                <Pencil className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAutomation(a.id)}
                                className="p-1.5 lg:p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg lg:rounded-xl text-text-secondary transition-all cursor-pointer border border-transparent hover:border-rose-200 flex items-center justify-center shrink-0"
                                title="Delete schedule"
                              >
                                <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination for Campaign Scheduling */}
          {automations.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs font-bold text-gray-400">
                Showing {Math.min(automations.length, (schedulingPage - 1) * schedulingPerPage + 1)} to {Math.min(schedulingPage * schedulingPerPage, automations.length)} of {automations.length} campaigns
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setSchedulingPage(p => Math.max(1, p - 1))}
                  disabled={schedulingPage === 1}
                  className="px-3.5 py-2 bg-bg-viewport border border-border-subtle text-text-primary rounded-xl hover:bg-bg-neutral/10 disabled:opacity-50 disabled:hover:bg-bg-viewport transition-colors cursor-pointer font-bold"
                >
                  Previous
                </button>
                <button
                  onClick={() => setSchedulingPage(p => Math.min(totalSchedulingPages, p + 1))}
                  disabled={schedulingPage === totalSchedulingPages}
                  className="px-3.5 py-2 bg-bg-viewport border border-border-subtle text-text-primary rounded-xl hover:bg-bg-neutral/10 disabled:opacity-50 disabled:hover:bg-bg-viewport transition-colors cursor-pointer font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Divider */}
        <div className="border-t border-border-subtle/80 my-8"></div>

        {/* Campaign Registry Grid Section */}
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4 select-none">
            <div className="flex-1">
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                Campaign Registry Grid
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                View, manage, and scale your automated multi-template scheduling workflows here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenRegistryModal()}
              className="self-start sm:self-center px-4 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xxs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-900" /> Automation Campaign
            </button>
          </div>

          {/* Grid Table Card */}
          <div className="hidden md:block overflow-x-auto border border-border-subtle rounded-xl bg-white shadow-xs">
            <table className="w-full text-left border-collapse table-auto md:text-[13px] lg:text-[13.5px] min-w-[1100px]">
              <thead>
                <tr className="bg-[#B9D7FC] text-slate-900 border-b border-border-subtle font-bold">
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[200px]">Campaign Name</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[120px]">Start Date</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[320px]">Ongoing Template Set</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-left min-w-[160px]">Type / Segment</th>
                  <th className="px-3 lg:px-4 py-2.5 border-r border-border-subtle uppercase tracking-wider text-[11px] lg:text-[12px] font-extrabold text-center min-w-[110px]">Status</th>
                  <th className="px-3 lg:px-4 py-2.5 uppercase tracking-wider text-slate-900 text-[11px] lg:text-[12px] font-extrabold text-right min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {registryCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-secondary font-bold text-[13px] border-b border-gray-200">
                      No campaigns registered. Click "+ Automation Campaign" to start!
                    </td>
                  </tr>
                ) : (
                  paginatedRegistryCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle">
                        <div className="font-extrabold text-[12.5px] lg:text-[13px] text-text-primary leading-tight break-words">
                          {c.name}
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle">
                        <span className="text-[10px] lg:text-[10.5px] font-semibold text-gray-500">
                          {c.startDate}
                        </span>
                      </td>
                      <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {c.templates.map((tid, idx) => {
                            const temp = sequenceTemplates.find(t => t.id === tid);
                            return (
                              <span key={tid + idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-extrabold border bg-slate-50 border-gray-200 text-slate-700 shadow-xxs">
                                {idx + 1}: {temp ? temp.name : 'Unknown'}
                              </span>
                            );
                          })}
                          {c.templates.length === 0 && <span className="text-[11px] text-text-secondary italic">None Selected</span>}
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex flex-wrap gap-1">
                            {c.type && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xxs bg-blue-50 border-blue-100 text-blue-700">
                                {c.type}
                              </span>
                            )}
                            {c.channelType && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xxs bg-indigo-50 border-indigo-100 text-indigo-700">
                                {c.channelType}
                              </span>
                            )}
                          </div>
                          {c.segment && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xxs bg-gray-50 border-gray-200 text-slate-600">
                              {c.segment}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 border-r border-b border-gray-200 align-middle text-center">
                        <div className="flex items-center justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] lg:text-[11px] font-extrabold shadow-xxs border ${
                            c.status === 'Active' 
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                              : 'bg-rose-50 border border-rose-100 text-rose-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 border-b border-gray-200 align-middle text-right">
                        <div className="flex items-center justify-end gap-2 lg:gap-3">
                          <div className="flex items-center gap-1.5 lg:gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleRegistryStatus(c.id)}
                              className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-all cursor-pointer border shadow-xxs flex items-center justify-center shrink-0 ${
                                c.status === 'Active'
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                              title={c.status === 'Active' ? 'DEACTIVATE' : 'ACTIVATE'}
                            >
                              {c.status === 'Active' ? (
                                <Pause className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              ) : (
                                <Play className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              )}
                            </button>
                            <div className="h-4 w-px bg-gray-200 shrink-0 mx-0.5"></div>
                            <button
                              type="button"
                              onClick={() => handleOpenRegistryModal(c)}
                              className="p-1.5 hover:bg-amber-50 hover:text-amber-600 rounded-lg text-text-secondary transition-all cursor-pointer border border-transparent hover:border-amber-200 flex items-center justify-center shrink-0"
                              title="Edit Campaign"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRegistryCampaign(c.id)}
                              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-text-secondary transition-all cursor-pointer border border-transparent hover:border-rose-200 flex items-center justify-center shrink-0"
                              title="Delete Campaign"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination for Campaign Registry */}
          {registryCampaigns.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs font-bold text-gray-400">
                Showing {Math.min(registryCampaigns.length, (registryPage - 1) * registryPerPage + 1)} to {Math.min(registryPage * registryPerPage, registryCampaigns.length)} of {registryCampaigns.length} campaigns
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setRegistryPage(p => Math.max(1, p - 1))}
                  disabled={registryPage === 1}
                  className="px-3.5 py-2 bg-bg-viewport border border-border-subtle text-text-primary rounded-xl hover:bg-bg-neutral/10 disabled:opacity-50 disabled:hover:bg-bg-viewport transition-colors cursor-pointer font-bold"
                >
                  Previous
                </button>
                <button
                  onClick={() => setRegistryPage(p => Math.min(totalRegistryPages, p + 1))}
                  disabled={registryPage === totalRegistryPages}
                  className="px-3.5 py-2 bg-bg-viewport border border-border-subtle text-text-primary rounded-xl hover:bg-bg-neutral/10 disabled:opacity-50 disabled:hover:bg-bg-viewport transition-colors cursor-pointer font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        </div>
      )}



      {/* --- MODAL 1: Create or Edit Template --- */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-bg-card border border-border-subtle w-full max-w-xl max-h-[calc(100vh-2rem)] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                {selectedTemplate ? 'Edit Campaign Template' : 'Create Campaign Template'}
              </h3>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

             <form onSubmit={handleSaveTemplate} className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Event Type - Required, absolute first field */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Event Type *</label>
                <select 
                  required
                  value={templateForm.eventType || ''}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setTemplateForm(prev => {
                      const updated = { ...prev, eventType: val };
                      if (val !== 'Customer Action') {
                        delete updated.customerActionType;
                      }
                      return updated;
                    });
                  }}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all cursor-pointer"
                >
                  <option value="">Select Event Type...</option>
                  <option value="Customer Action">Customer Action</option>
                  <option value="Scheduled notification">Scheduled notification</option>
                  <option value="Festival">Festival</option>
                </select>
              </div>

              {/* Customer Action Type - Required, only visible when eventType is "Customer Action" */}
              {templateForm.eventType === 'Customer Action' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Customer Action Trigger *</label>
                  <select 
                    required
                    value={templateForm.customerActionType || ''}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, customerActionType: e.target.value as any }))}
                    className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all cursor-pointer"
                  >
                    <option value="">Select Customer Action...</option>
                    <option value="All Customer">All Customer</option>
                    <option value="new customer">New Customer</option>
                    <option value="Abounded checkout">Abandoned Checkout</option>
                    <option value="VIP Customer">VIP Customer</option>
                    <option value="In Active customer">Inactive Customer</option>
                  </select>
                </div>
              )}

              {/* Template Name - Required */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Template Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Welcome New Customer Campaign"
                  value={templateForm.name || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Channel Type</label>
                <select 
                  value={templateForm.type || 'Email'}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value as 'Email' | 'WhatsApp' }))}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all cursor-pointer"
                >
                  <option value="Email">Email Outbound</option>
                  <option value="WhatsApp">WhatsApp Outbound</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Status</label>
                <select 
                  value={templateForm.status || 'Active'}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {templateForm.type === 'Email' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email Subject Line *</label>
                  <input 
                    type="text"
                    required={templateForm.type === 'Email'}
                    placeholder="e.g. Welcome to our CRM Store! ðŸŽ"
                    value={templateForm.subject || ''}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5 relative">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Template Content Body *</label>
                  
                  <div className="relative" ref={popoverRef}>
                    <button
                      type="button"
                      onClick={handleOpenTagsPopover}
                      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xxs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Insert Tag
                    </button>

                    {isTagsPopoverOpen && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search tags..."
                            value={tagSearchQuery}
                            onChange={(e) => setTagSearchQuery(e.target.value)}
                            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/20 focus:border-brand-primary text-slate-800"
                          />
                        </div>
                        
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {Object.entries(groupedAndFilteredTags).map(([category, tags]) => (
                            <div key={category} className="space-y-1">
                              <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider px-2 py-0.5 bg-slate-50 rounded">
                                {category}
                              </div>
                              {tags.map((item) => (
                                <button
                                  key={item.tag}
                                  type="button"
                                  onClick={() => handleInsertTag(item.tag)}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer flex flex-col gap-0.5"
                                >
                                  <span className="text-xs font-mono font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                                    {item.tag}
                                  </span>
                                  <span className="text-[10px] text-gray-500 leading-normal">
                                    {item.description}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ))}
                          {Object.keys(groupedAndFilteredTags).length === 0 && (
                            <div className="text-center py-4 text-xs text-gray-400">
                              No tags found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <textarea 
                  ref={textareaRef}
                  required
                  rows={6}
                  placeholder={templateForm.type === 'Email' 
                    ? "Hi {{customer_name}},\n\nThank you for shopping with us..." 
                    : "Hello {{customer_name}}! Your order {{order_id}} has shipped..."}
                  value={templateForm.content || ''}
                  onChange={(e) => {
                    setTemplateForm(prev => ({ ...prev, content: e.target.value }));
                    handleTextareaSelection();
                  }}
                  onSelect={handleTextareaSelection}
                  onKeyUp={handleTextareaSelection}
                  onMouseUp={handleTextareaSelection}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-5 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[13px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-[13px] font-bold shadow-md transition-all cursor-pointer"
                >
                  {selectedTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Template Preview Dialog --- */}
      {isPreviewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-bg-card border border-border-subtle w-full max-w-xl max-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-xxs ${
                  selectedTemplate.type === 'Email' 
                    ? 'bg-brand-bg-active border-brand-primary/30 text-brand-primary' 
                    : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                }`}>
                  {selectedTemplate.type.toUpperCase()}
                </span>
                <span className="text-sm font-bold text-text-primary tracking-tight">{selectedTemplate.name}</span>
              </div>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Container */}
            <div className="bg-bg-viewport p-4 sm:p-6 flex-1 overflow-y-auto flex justify-center items-center">
              {selectedTemplate.type === 'Email' ? (
                /* Simulated Browser Email Client Preview */
                <div className="bg-white border border-slate-200 w-full rounded-xl shadow-xs overflow-hidden flex flex-col text-slate-800 font-sans">
                  {/* Top bar */}
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                    <div className="ml-4 bg-slate-200/60 text-[9px] font-semibold text-slate-400 px-3 py-0.5 rounded-md flex-1 text-center max-w-xs truncate">
                      Apex Outbound Email Gateway
                    </div>
                  </div>
                  {/* Headers */}
                  <div className="px-4 py-3 border-b border-slate-100 text-xs space-y-1 bg-slate-50/50">
                    <div className="flex text-slate-400 font-medium">
                      <span className="w-14">From:</span>
                      <span className="text-slate-700 font-semibold">{senderName} &lt;{senderEmail}&gt;</span>
                    </div>
                    <div className="flex text-slate-400 font-medium">
                      <span className="w-14">To:</span>
                      <span className="text-slate-700 font-semibold">Anish Grover &lt;anish.g@example.com&gt;</span>
                    </div>
                    <div className="flex text-slate-400 font-medium">
                      <span className="w-14">Subject:</span>
                      <span className="text-brand-primary font-bold">{selectedTemplate.subject}</span>
                    </div>
                  </div>
                  {/* Content body */}
                  <div className="p-5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                    {selectedTemplate.content.replace('{{customer_name}}', 'Anish Grover').replace('{{order_id}}', '#SH-88710').replace('{{amount}}', 'â‚¹15,000')}
                  </div>
                </div>
              ) : (
                /* Simulated Smartphone WhatsApp Mockup */
                <div className="bg-[#e5ddd5] border-8 border-slate-800 w-64 h-[380px] rounded-[32px] overflow-hidden flex flex-col relative text-slate-800 font-sans shadow-md">
                  {/* Camera hole & Notch spacer */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-full z-10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-900 ml-auto mr-1.5"></div>
                  </div>
                  {/* Header bar */}
                  <div className="bg-[#075e54] text-white pt-6 pb-2.5 px-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center font-bold text-[9px] text-[#075e54]">
                      TC
                    </div>
                    <div>
                      <div className="text-[10px] font-bold leading-tight">{waDisplayName}</div>
                      <div className="text-[7.5px] text-emerald-200 leading-none mt-0.5">Verified Business Profile</div>
                    </div>
                  </div>
                  {/* Chat messages background list */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col justify-end">
                    {/* Security Notice */}
                    <div className="bg-[#fcf8e3] border border-[#faebcc] text-[#8a6d3b] text-[7.5px] py-1 px-2 rounded-lg text-center font-semibold leading-relaxed self-center max-w-[180px]">
                      ðŸ”’ Messages are end-to-end encrypted via Apex Secure Link.
                    </div>
                    {/* Incoming/Outgoing Bubble */}
                    <div className="bg-white text-slate-800 p-2.5 rounded-xl rounded-tl-none text-[9.5px] leading-relaxed shadow-xxs max-w-[190px] self-start border border-slate-200">
                      <div className="whitespace-pre-wrap">{selectedTemplate.content.replace('{{customer_name}}', 'Anish Grover').replace('{{order_id}}', '#SH-88710').replace('{{amount}}', 'â‚¹15,000')}</div>
                      <div className="text-right text-[6.5px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                        14:24 â€¢ Delivered
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-border-subtle flex justify-end">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-[13px] font-bold transition-all shadow-md cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Schedule Campaign Automation --- */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-bg-card border border-border-subtle w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                {selectedAutomation ? 'Edit Automation Campaign Schedule' : 'Campaign Dispatch'}
              </h3>
              <button 
                onClick={() => setIsAutomationModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAutomation} className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[75vh]">
              {/* Select Template with dropdown only */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Select Template *</label>
                {templates.length > 0 ? (
                  <select 
                    required
                    value={automationForm.templateId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedTemp = templates.find(t => t.id === selectedId);
                      setAutomationForm(prev => {
                        const updated = { ...prev, templateId: selectedId };
                        if (selectedTemp && selectedTemp.eventType === 'Customer Action') {
                          if (selectedTemp.customerActionType === 'new customer') {
                            updated.audienceType = 'New Customers Only';
                          } else if (selectedTemp.customerActionType === 'VIP Customer') {
                            updated.audienceType = 'VIP Customers Only';
                          } else if (selectedTemp.customerActionType === 'All Customer') {
                            updated.audienceType = 'All Customers';
                          } else {
                            updated.audienceType = '';
                          }
                        } else {
                          updated.audienceType = '';
                        }
                        return updated;
                      });
                    }}
                    className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all cursor-pointer"
                  >
                    <option value="" disabled>-- Choose template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.type.toUpperCase()}] {t.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center animate-in fade-in duration-200">
                    <p className="text-xs text-amber-800 font-bold leading-relaxed">
                      No campaign templates found. Please create a template first under Section 3.
                    </p>
                  </div>
                )}
              </div>
              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Campaign Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Weekly VIP Rewards Dispatch"
                  value={automationForm.name || ''}
                  onChange={(e) => setAutomationForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                />
              </div>

              {/* Start & End Date Fields (Only shown if NOT customer action) */}
              {(() => {
                const selectedTemplateObj = templates.find(t => t.id === automationForm.templateId);
                if (selectedTemplateObj?.eventType === 'Customer Action') {
                  return null;
                }
                const isFestival = selectedTemplateObj?.eventType === 'Festival';
                const todayStr = getTodayDateString();
                const minEndDate = automationForm.startDateTime ? getNextDayString(automationForm.startDateTime) : getNextDayString(todayStr);
                return (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className={isFestival ? "grid grid-cols-1" : "grid grid-cols-2 gap-4"}>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Start Date *</label>
                        <input 
                          type="date"
                          required
                          min={todayStr}
                          value={automationForm.startDateTime || ''}
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            setAutomationForm(prev => {
                              const updated = { ...prev, startDateTime: newStartDate };
                              const nextMinEndDate = getNextDayString(newStartDate);
                              if (prev.endDateTime && prev.endDateTime < nextMinEndDate) {
                                updated.endDateTime = '';
                              }
                              return updated;
                            });
                          }}
                          className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                        />
                      </div>
                      {!isFestival && (
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">End Date *</label>
                          <input 
                            type="date"
                            required
                            min={minEndDate}
                            value={automationForm.endDateTime || ''}
                            onChange={(e) => setAutomationForm(prev => ({ ...prev, endDateTime: e.target.value }))}
                            className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                          />
                        </div>
                      )}
                    </div>

                    <div className="animate-in slide-in-from-top-1 duration-200">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Dispatch Time *</label>
                      <input 
                        type="time"
                        required
                        value={automationForm.dispatchTime || ''}
                        onChange={(e) => setAutomationForm(prev => ({ ...prev, dispatchTime: e.target.value }))}
                        className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Customer Segment */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Customer Segment *</label>
                <select
                  required
                  value={automationForm.audienceType || ''}
                  onChange={(e) => setAutomationForm(prev => ({ ...prev, audienceType: e.target.value as any }))}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Select Customer Segment --</option>
                  <option value="All Customers">All Customers</option>
                  <option value="New Customers Only">New Customers Only</option>
                  <option value="VIP Customers Only">VIP Customers Only</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Status</label>
                <select 
                  value={automationForm.status || 'Active'}
                  onChange={(e) => setAutomationForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full text-[13px] bg-bg-viewport border border-border-subtle px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary font-medium transition-all cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-5 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[13px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-[13px] font-bold shadow-md transition-all cursor-pointer"
                >
                  {selectedAutomation ? 'Save Schedule' : 'Arm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Create or Edit Registry Campaign --- */}
      {isRegistryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-bg-card border border-border-subtle w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-text-primary tracking-tight">
                {selectedRegistryCampaign ? 'Edit Automation Campaign' : 'Create Automation Campaign'}
              </h3>
              <button 
                onClick={() => setIsRegistryModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRegistryCampaign} noValidate className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campaign Name */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Campaign Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Black Friday Winback Chain"
                    value={registryForm.name || ''}
                    onChange={(e) => {
                      setRegistryForm(prev => ({ ...prev, name: e.target.value }));
                      if (registryErrors.name) setRegistryErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full text-xs font-bold bg-bg-viewport border ${
                      registryErrors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-border-subtle'
                    } px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary`}
                  />
                  {registryErrors.name && (
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mt-1 block">{registryErrors.name}</span>
                  )}
                </div>

                {/* Campaign Start Date */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Campaign Start Date</label>
                  <input
                    type="date"
                    value={registryForm.startDate || ''}
                    onChange={(e) => {
                      setRegistryForm(prev => ({ ...prev, startDate: e.target.value }));
                      if (registryErrors.startDate) setRegistryErrors(prev => ({ ...prev, startDate: '' }));
                    }}
                    className={`w-full text-xs font-bold bg-bg-viewport border ${
                      registryErrors.startDate ? 'border-red-500 ring-1 ring-red-500' : 'border-border-subtle'
                    } px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary cursor-pointer`}
                  />
                  {registryErrors.startDate && (
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mt-1 block">{registryErrors.startDate}</span>
                  )}
                </div>

                {/* Dispatch Time */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Dispatch Time</label>
                  <input
                    type="time"
                    value={registryForm.dispatchTime || ''}
                    onChange={(e) => {
                      setRegistryForm(prev => ({ ...prev, dispatchTime: e.target.value }));
                      if (registryErrors.dispatchTime) setRegistryErrors(prev => ({ ...prev, dispatchTime: '' }));
                    }}
                    className={`w-full text-xs font-bold bg-bg-viewport border ${
                      registryErrors.dispatchTime ? 'border-red-500 ring-1 ring-red-500' : 'border-border-subtle'
                    } px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary cursor-pointer`}
                  />
                  {registryErrors.dispatchTime && (
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mt-1 block">{registryErrors.dispatchTime}</span>
                  )}
                </div>

                {/* Segment Type */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Customer Segment Trigger</label>
                  <select
                    value={registryForm.segment || ''}
                    onChange={(e) => {
                      setRegistryForm(prev => ({ ...prev, segment: e.target.value as any }));
                      if (registryErrors.segment) setRegistryErrors(prev => ({ ...prev, segment: '' }));
                    }}
                    className={`w-full text-xs font-bold bg-bg-viewport border ${
                      registryErrors.segment ? 'border-red-500 ring-1 ring-red-500' : 'border-border-subtle'
                    } px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary cursor-pointer`}
                  >
                    <option value="">Select Segment</option>
                    <option value="Abandoned Checkout">Abandoned Checkout</option>
                    <option value="Inactive Customer">Inactive Customer</option>
                  </select>
                  {registryErrors.segment && (
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mt-1 block">{registryErrors.segment}</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Initial Status</label>
                  <select
                    value={registryForm.status || ''}
                    onChange={(e) => {
                      setRegistryForm(prev => ({ ...prev, status: e.target.value as any }));
                      if (registryErrors.status) setRegistryErrors(prev => ({ ...prev, status: '' }));
                    }}
                    className={`w-full text-xs font-bold bg-bg-viewport border ${
                      registryErrors.status ? 'border-red-500 ring-1 ring-red-500' : 'border-border-subtle'
                    } px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary cursor-pointer`}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {registryErrors.status && (
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mt-1 block">{registryErrors.status}</span>
                  )}
                </div>

                {/* Campaign Type Dropdown */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                  <select
                    value={registryForm.type || ''}
                    onChange={(e) => {
                      setRegistryForm(prev => ({ ...prev, type: e.target.value as any }));
                      if (registryErrors.type) setRegistryErrors(prev => ({ ...prev, type: '' }));
                    }}
                    className={`w-full text-xs font-bold bg-bg-viewport border ${
                      registryErrors.type ? 'border-red-500 ring-1 ring-red-500' : 'border-border-subtle'
                    } px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary cursor-pointer`}
                  >
                    <option value="">Select Type</option>
                    <option value="Daily">Daily</option>
                    <option value="Alternative">Alternative</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                  {registryErrors.type && (
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mt-1 block">{registryErrors.type}</span>
                  )}
                </div>

                {/* Channel Type Dropdown */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Channel Type</label>
                  <select
                    value={registryForm.channelType || ''}
                    onChange={(e) => {
                      setRegistryForm(prev => ({ ...prev, channelType: e.target.value as any }));
                      if (registryErrors.channelType) setRegistryErrors(prev => ({ ...prev, channelType: '' }));
                    }}
                    className={`w-full text-xs font-bold bg-bg-viewport border ${
                      registryErrors.channelType ? 'border-red-500 ring-1 ring-red-500' : 'border-border-subtle'
                    } px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary cursor-pointer`}
                  >
                    <option value="">Select Channel</option>
                    <option value="Email">Email</option>
                    <option value="Whatsapp">Whatsapp</option>
                  </select>
                  {registryErrors.channelType && (
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mt-1 block">{registryErrors.channelType}</span>
                  )}
                </div>
              </div>

              {/* Multi email template set - 1 to 8 */}
              <div className="border-t border-border-subtle pt-4 mt-2">
                <h4 className="text-xs font-extrabold text-text-primary tracking-tight mb-2">
                  Multi-Phase Template Sequence (Slots 1 - 8)
                </h4>
                <p className="text-[11px] text-text-secondary mb-4 leading-normal">
                  Configure up to 8 stages of automated templates. Only chosen slots will trigger subsequent emails in sequence order.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 8 }).map((_, slotIdx) => (
                    <div key={slotIdx} className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400">Template - Slot {slotIdx + 1}{getSlotDateLabel(slotIdx)}</label>
                      <select
                        value={(registryForm.templates || [])[slotIdx] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRegistryForm(prev => {
                            const updated = [...(prev.templates || Array(8).fill(''))];
                            updated[slotIdx] = val;
                            return { ...prev, templates: updated };
                          });
                        }}
                        className="w-full text-xs font-bold bg-bg-viewport border border-border-subtle px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary cursor-pointer"
                      >
                        <option value="">Select Template</option>
                        {sequenceTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsRegistryModalOpen(false)}
                  className="px-5 py-2.5 bg-bg-viewport border border-border-subtle hover:bg-bg-neutral text-[13px] font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#B9D7FC] hover:bg-[#9cbdf0] text-slate-900 border border-[#96bae6] rounded-xl text-[13px] font-bold shadow-md transition-all cursor-pointer"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: Email Template Live Preview --- */}
      {previewingTemplateObj && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-bg-card border border-border-subtle w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-neutral/20">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary" />
                <h4 className="text-xs font-extrabold text-text-primary tracking-tight">
                  Template Mailer Live Preview
                </h4>
              </div>
              <button 
                onClick={() => setPreviewingTemplateObj(null)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-neutral/10 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Fake Email Envelope Header */}
              <div className="bg-bg-viewport border border-border-subtle rounded-xl p-3 text-xs space-y-2 font-semibold">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>From: merchant-relations@techcrm.store</span>
                  <span className="font-mono text-[10px]">HTML5 Compliant</span>
                </div>
                <div className="text-text-secondary">
                  To: emma.watson@example.com <span className="text-[10px] bg-brand-bg-active text-brand-primary font-bold px-1.5 py-0.5 rounded ml-1">Test Recipient</span>
                </div>
                <div className="text-text-primary border-t border-border-subtle/50 pt-2 font-bold">
                  Subject: {previewingTemplateObj.subject}
                </div>
              </div>

              {/* Fake Email Content Body */}
              <div className="border border-border-subtle rounded-xl p-4 bg-white min-h-[160px] text-xs leading-relaxed text-slate-800 whitespace-pre-line shadow-inner max-h-[300px] overflow-y-auto">
                {previewingTemplateObj.body.replace('{{customer_name}}', 'Emma Watson')}
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewingTemplateObj(null)}
                  className="px-4 py-2 bg-brand-primary text-white hover:bg-brand-primary-hover text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xxs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
