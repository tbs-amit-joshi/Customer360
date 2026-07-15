import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Filter, LayoutGrid, List, CheckCircle, AlertCircle, 
  Trash2, Edit, Calendar, User, ArrowRight, DollarSign, X, AlertOctagon,
  Ticket, Tag, Percent, Send, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Clock, Gift,
  AlertTriangle, Sparkles
} from 'lucide-react';
import { Lead, LeadStatus, Priority, LeadCoupon, LeadTimelineEvent } from '../types';
import PolarisDiscountModal from './PolarisDiscountModal';

interface LeadManagementViewProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  initialOpenForm: boolean;
  onCloseForm: () => void;
}

export default function LeadManagementView({
  leads,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  initialOpenForm,
  onCloseForm
}: LeadManagementViewProps) {
  // UI layouts & controls
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [staffFilter, setStaffFilter] = useState<string>('All');
  const [cardStatusFilter, setCardStatusFilter] = useState<string>('All'); // Metric card filter

  // Form State
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(initialOpenForm);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Loading skeleton state
  const [isLoading, setIsLoading] = useState(false);

  // Form Field States
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [product, setProduct] = useState('Enterprise Cloud Hosting');
  const [variant, setVariant] = useState('');
  const [qty, setQty] = useState(1);
  const [expectedValue, setExpectedValue] = useState(0);
  const [status, setStatus] = useState<LeadStatus>('New');
  const [followUpDate, setFollowUpDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [source, setSource] = useState('Website Form');
  const [assignedStaff, setAssignedStaff] = useState('');
  
  // Coupon Section States
  const [activeCoupon, setActiveCoupon] = useState<LeadCoupon | null>(null);
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [isPolarisCouponModalOpen, setIsPolarisCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed Amount' | ''>('');
  const [discountValue, setDiscountValue] = useState<number | string>('');
  const [validTill, setValidTill] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [notifyVia, setNotifyVia] = useState<'Email' | 'WhatsApp' | 'Both' | ''>('');
  const [couponStatus, setCouponStatus] = useState<'Sent' | 'Redeemed' | 'Expired'>('Sent');
  const [orderPlaced, setOrderPlaced] = useState<'Yes' | 'No'>('No');
  const [tempTimelineEvents, setTempTimelineEvents] = useState<LeadTimelineEvent[]>([]);
  const [isCouponSectionExpanded, setIsCouponSectionExpanded] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [couponFormErrors, setCouponFormErrors] = useState<{[key: string]: string}>({});
  const [couponGridStatus, setCouponGridStatus] = useState<'Active' | 'In Active'>('Active');

  const [gridProducts, setGridProducts] = useState<any[]>([]);
  const [selectedGridProducts, setSelectedGridProducts] = useState<string[]>([]);
  const [minOrderValue, setMinOrderValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [showGraphQLPayload, setShowGraphQLPayload] = useState(false);
  const [isWarningPopupOpen, setIsWarningPopupOpen] = useState(false);
  const [warningConfirmCallback, setWarningConfirmCallback] = useState<(() => void) | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const hasExistingCode = selectedGridProducts.some(id => {
    const p = gridProducts.find(item => item.id === id);
    return p && p.discountCode && p.discountCode !== '—' && p.discountCode !== '';
  });

  const showLocalToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const getMinStartDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleRow1Change = (field: 'name' | 'variant' | 'qty' | 'price', value: any) => {
    if (field === 'name') {
      setProduct(value);
    } else if (field === 'variant') {
      setVariant(value);
    } else if (field === 'qty') {
      setQty(value);
    } else if (field === 'price') {
      setExpectedValue(value);
    }

    setGridProducts(prev => prev.map(p => {
      if (p.id === 'prod-1') {
        const updated = { ...p };
        if (field === 'name') updated.name = value;
        if (field === 'variant') updated.variant = value;
        if (field === 'qty') updated.qty = value;
        if (field === 'price') updated.price = value;
        return updated;
      }
      return p;
    }));
  };

  const handleCreateCouponTrigger = () => {
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

    const limitNum = parseInt(usageLimit.trim(), 10);
    if (!usageLimit.trim()) {
      errors.usageLimit = 'Usage Limit is required.';
    } else if (isNaN(limitNum) || limitNum < 1) {
      errors.usageLimit = 'Usage Limit must be at least 1.';
    }

    if (Object.keys(errors).length > 0) {
      setCouponFormErrors(errors);
      return;
    }

    setCouponFormErrors({});

    if (selectedGridProducts.length === 0) {
      alert('Please select at least one product row from the grid.');
      return;
    }

    const overwrittenProducts = gridProducts.filter(p => 
      selectedGridProducts.includes(p.id) && p.discountCode !== '—'
    );

    const onConfirmAction = () => {
      setGridProducts(prev => prev.map(p => {
        if (selectedGridProducts.includes(p.id)) {
          return {
            ...p,
            discountCode: couponCode.toUpperCase().trim(),
            discountType: discountType,
            discountValue: valNum,
            discountAmount: discountType === 'Percentage' ? `${discountValue}%` : `₹${valNum.toLocaleString()}`,
            validFrom: validFrom,
            validTill: validTill,
            notifyVia: notifyVia,
            usageLimit: usageLimit,
            status: couponGridStatus
          };
        }
        return p;
      }));

      const verifiedCoup: LeadCoupon = {
        couponCode: couponCode.toUpperCase().trim(),
        discountType: discountType as any,
        discountValue: valNum,
        validFrom: validFrom,
        validTill: validTill,
        notifyVia: notifyVia as any,
        status: 'Sent',
        orderPlaced: 'No'
      };
      setActiveCoupon(verifiedCoup);

      const discountDesc = discountType === 'Percentage' ? `${discountValue}% off` : `₹${discountValue.toLocaleString()} off`;
      const newEvent: LeadTimelineEvent = {
        id: 'ev_coup_' + Date.now(),
        timestamp: new Date().toISOString(),
        event: `Shopify Coupon ${couponCode.toUpperCase().trim()} (${discountDesc}) created & applied to selected cart items (${selectedGridProducts.length} rows) using Polaris grid.`
      };
      setTempTimelineEvents(prev => [...prev, newEvent]);

      alert(`Success! Shopify coupon ${couponCode.toUpperCase().trim()} created and applied to selected products in grid.`);

      // Reset coupon form details and clear checks to hide it
      setCouponCode('');
      setDiscountType('');
      setDiscountValue('');
      setValidFrom('');
      setValidTill('');
      setNotifyVia('');
      setUsageLimit('');
      setCouponGridStatus('Active');
      setCouponFormErrors({});
      setSelectedGridProducts([]);
    };

    onConfirmAction();
  };

  // Kanban Drag and Drop States & Handlers
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    const leadToUpdate = leads.find(l => l.id === leadId);
    if (leadToUpdate && leadToUpdate.status !== targetStatus) {
      let fUpDate = leadToUpdate.followUpDate;
      if (targetStatus === 'Follow-up' && !fUpDate) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        fUpDate = `${year}-${month}-${day}`;
      } else if (targetStatus !== 'Follow-up') {
        fUpDate = '';
      }

      const updatedLead: Lead = {
        ...leadToUpdate,
        status: targetStatus,
        followUpDate: fUpDate,
        timeline: [
          ...leadToUpdate.timeline,
          {
            id: 'ev_drag_' + Date.now(),
            timestamp: new Date().toISOString(),
            event: `Lead status updated to ${targetStatus} via drag & drop Kanban board.`
          }
        ]
      };
      onUpdateLead(updatedLead);
    }
  };

  // Available options
  const staffList = ['Emma Watson', 'David Miller', 'Rahul Dev', 'System Agent'];
  const productList = [
    'Enterprise Cloud Hosting',
    'Premium Support Plan',
    'Team Collaboration Suite',
    'IoT Hub Gateway',
    'Enterprise Cloud Firewall'
  ];
  const sourceList = ['Website Form', 'Abandoned Checkout', 'Direct Outreach', 'Referral'];

  const statusSelectColorMap: Record<LeadStatus, string> = {
    'New': 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500',
    'Follow-up': 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500',
    'In-complete': 'bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-500'
  };

  const prioritySelectColorMap: Record<Priority, string> = {
    'High': 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500',
    'Medium': 'bg-amber-50 text-amber-800 border-amber-200 focus:ring-amber-500',
    'Low': 'bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-500'
  };

  // Handle slideover open for add
  const handleNewLeadClick = () => {
    setEditingLead(null);
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setNotes('');
    setProduct('Enterprise Cloud Hosting');
    setVariant('Standard Tier');
    setQty(1);
    setExpectedValue(75000);
    setStatus('New');
    setFollowUpDate('');
    setPriority('Medium');
    setSource('Website Form');
    setAssignedStaff('');
    setErrors({});
    setCouponFormErrors({});
    
    // Initialize coupon states for a brand new lead
    setActiveCoupon(null);
    setIsCouponFormOpen(false);
    setCouponCode('');
    setDiscountType('');
    setDiscountValue('');
    setValidTill('');
    setValidFrom('');
    setNotifyVia('');
    setCouponStatus('Sent');
    setOrderPlaced('No');
    setMinOrderValue('');
    setUsageLimit('');
    setCouponGridStatus('Active');
    setShowGraphQLPayload(false);
    setTempTimelineEvents([]);
    setIsCouponSectionExpanded(true);

    setSelectedGridProducts([]);
    setGridProducts([
      {
        id: 'prod-1',
        name: 'Enterprise Cloud Hosting',
        variant: 'Standard Tier',
        qty: 1,
        price: 75000,
        discountCode: '—',
        discountType: '—',
        discountValue: '',
        discountAmount: '—',
        validFrom: '',
        validTill: '',
        notifyVia: '',
        usageLimit: '',
        status: '—'
      },
      {
        id: 'prod-2',
        name: 'Apex Premium Fleece Hoodie',
        variant: 'Charcoal / XL',
        qty: 1,
        price: 4500,
        discountCode: 'WELCOME10',
        discountType: 'Percentage',
        discountValue: 10,
        discountAmount: '10%',
        validFrom: '2026-07-06T09:00',
        validTill: '2026-07-31T18:00',
        notifyVia: 'Email',
        usageLimit: '1',
        status: 'Active'
      },
      {
        id: 'prod-3',
        name: 'Sleek Carbon Ergonomic Chair',
        variant: 'Midnight Black',
        qty: 1,
        price: 28999,
        discountCode: '—',
        discountType: '—',
        discountValue: '',
        discountAmount: '—',
        validFrom: '',
        validTill: '',
        notifyVia: '',
        usageLimit: '',
        status: '—'
      },
      {
        id: 'prod-4',
        name: 'SoundWave Active ANC Headphones',
        variant: 'Premium Silver',
        qty: 2,
        price: 16500,
        discountCode: 'SAVE1500',
        discountType: 'Fixed Amount',
        discountValue: 1500,
        discountAmount: '₹1,500',
        validFrom: '2026-07-07T10:00',
        validTill: '2026-07-15T17:00',
        notifyVia: 'WhatsApp',
        usageLimit: '5',
        status: 'Active'
      }
    ]);

    setIsSlideOverOpen(true);
  };

  // Handle slideover open for edit
  const handleEditLeadClick = (lead: Lead) => {
    setEditingLead(lead);
    setCustName(lead.customerName);
    setCustEmail(lead.email);
    setCustPhone(lead.phone);
    setNotes(lead.notes);
    setProduct(lead.productName);
    setVariant(lead.variant);
    setQty(lead.quantity);
    setExpectedValue(lead.expectedValue);
    setStatus(lead.status);
    setFollowUpDate(lead.followUpDate || '');
    setPriority(lead.priority);
    setSource(lead.source);
    setAssignedStaff(lead.assignedStaff);
    setErrors({});
    setCouponFormErrors({});
    
    setMinOrderValue('');
    setUsageLimit('');
    setShowGraphQLPayload(false);

    // Initialize coupon states for existing lead
    if (lead.coupon) {
      setActiveCoupon(lead.coupon);
      setIsCouponFormOpen(false);
      setCouponCode(lead.coupon.couponCode);
      setDiscountType(lead.coupon.discountType);
      setDiscountValue(lead.coupon.discountValue);
      setValidTill(lead.coupon.validTill);
      setValidFrom(lead.coupon.validFrom || '');
      setNotifyVia(lead.coupon.notifyVia);
      setCouponStatus(lead.coupon.status);
      setOrderPlaced(lead.coupon.orderPlaced);
      setCouponGridStatus('Active');
    } else {
      setActiveCoupon(null);
      setIsCouponFormOpen(false);
      setCouponCode('');
      setDiscountType('');
      setDiscountValue('');
      setValidTill('');
      setValidFrom('');
      setNotifyVia('');
      setCouponStatus('Sent');
      setOrderPlaced('No');
      setCouponGridStatus('Active');
    }
    setTempTimelineEvents([]);
    setIsCouponSectionExpanded(true);

    setSelectedGridProducts([]);
    setGridProducts([
      {
        id: 'prod-1',
        name: lead.productName || 'Enterprise Cloud Hosting',
        variant: lead.variant || 'Standard Tier',
        qty: lead.quantity || 1,
        price: lead.expectedValue || 0,
        discountCode: lead.coupon ? lead.coupon.couponCode : '—',
        discountType: lead.coupon ? lead.coupon.discountType : '—',
        discountValue: lead.coupon ? lead.coupon.discountValue : '',
        discountAmount: lead.coupon 
          ? (lead.coupon.discountType === 'Percentage' ? `${lead.coupon.discountValue}%` : `₹${lead.coupon.discountValue.toLocaleString()}`) 
          : '—',
        validFrom: lead.coupon ? (lead.coupon.validFrom || '') : '',
        validTill: lead.coupon ? lead.coupon.validTill : '',
        notifyVia: lead.coupon ? lead.coupon.notifyVia : '',
        usageLimit: lead.coupon ? '1' : '',
        status: lead.coupon ? 'Active' : '—'
      },
      {
        id: 'prod-2',
        name: 'Apex Premium Fleece Hoodie',
        variant: 'Charcoal / XL',
        qty: 1,
        price: 4500,
        discountCode: 'WELCOME10',
        discountType: 'Percentage',
        discountValue: 10,
        discountAmount: '10%',
        validFrom: '2026-07-06T09:00',
        validTill: '2026-07-31T18:00',
        notifyVia: 'Email',
        usageLimit: '1',
        status: 'Active'
      },
      {
        id: 'prod-3',
        name: 'Sleek Carbon Ergonomic Chair',
        variant: 'Midnight Black',
        qty: 1,
        price: 28999,
        discountCode: '—',
        discountType: '—',
        discountValue: '',
        discountAmount: '—',
        validFrom: '',
        validTill: '',
        notifyVia: '',
        usageLimit: '',
        status: '—'
      },
      {
        id: 'prod-4',
        name: 'SoundWave Active ANC Headphones',
        variant: 'Premium Silver',
        qty: 2,
        price: 16500,
        discountCode: 'SAVE1500',
        discountType: 'Fixed Amount',
        discountValue: 1500,
        discountAmount: '₹1,500',
        validFrom: '2026-07-07T10:00',
        validTill: '2026-07-15T17:00',
        notifyVia: 'WhatsApp',
        usageLimit: '5',
        status: 'Active'
      }
    ]);

    setIsSlideOverOpen(true);
  };

  // Submit Handler with validation
  const handleSaveLead = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!custEmail.trim()) {
      newErrors.custEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(custEmail)) {
      newErrors.custEmail = 'Please provide a valid email';
    }
    if (!assignedStaff.trim()) {
      newErrors.assignedStaff = 'Staff assignment is required';
    }
    if (status === 'Follow-up' && !followUpDate) {
      newErrors.followUpDate = 'Follow up date is required';
    }

    // Check Coupon Fields Validation if any products are selected in the grid
    let couponHasErrors = false;
    const newCouponErrors: { [key: string]: string } = {};

    if (selectedGridProducts.length > 0) {
      if (!discountType) {
        newCouponErrors.discountType = 'Discount Type is required.';
        couponHasErrors = true;
      }
      if (!couponCode.trim()) {
        newCouponErrors.couponCode = 'Coupon Code is required.';
        couponHasErrors = true;
      }
      const valNum = parseFloat(discountValue.toString());
      if (!discountValue.toString().trim()) {
        newCouponErrors.discountValue = 'Discount Value is required.';
        couponHasErrors = true;
      } else if (isNaN(valNum) || valNum <= 0) {
        newCouponErrors.discountValue = 'Discount Value must be greater than 0.';
        couponHasErrors = true;
      } else if (discountType === 'Percentage' && valNum > 100) {
        newCouponErrors.discountValue = 'Percentage discount cannot exceed 100%.';
        couponHasErrors = true;
      }
      if (!validFrom.trim()) {
        newCouponErrors.validFrom = 'Start Date is required.';
        couponHasErrors = true;
      }
      if (!validTill.trim()) {
        newCouponErrors.validTill = 'End Date is required.';
        couponHasErrors = true;
      } else if (validFrom.trim() && validTill.trim() && validFrom > validTill) {
        newCouponErrors.validTill = 'Start Date cannot be after End Date.';
        couponHasErrors = true;
      }
      if (!notifyVia) {
        newCouponErrors.notifyVia = 'Notify Customer Via is required.';
        couponHasErrors = true;
      }
      if (!usageLimit.trim()) {
        newCouponErrors.usageLimit = 'Usage Limit is required.';
        couponHasErrors = true;
      }

      if (couponHasErrors) {
        setCouponFormErrors(newCouponErrors);
      }
    }

    if (Object.keys(newErrors).length > 0 || couponHasErrors || Object.keys(couponFormErrors).length > 0) {
      setErrors(newErrors);
      showLocalToast("Required field is still pending!");

      // Scroll to the first invalid field automatically
      setTimeout(() => {
        const errorOrder = [
          { error: newErrors.custEmail, id: 'lead-custEmail' },
          { error: newErrors.assignedStaff, id: 'lead-assignedStaff' },
          { error: newErrors.followUpDate, id: 'lead-followUpDate' },
          { error: newCouponErrors.discountType || couponFormErrors.discountType, id: 'coupon-discountType' },
          { error: newCouponErrors.discountValue || couponFormErrors.discountValue, id: 'coupon-discountValue' },
          { error: newCouponErrors.couponCode || couponFormErrors.couponCode, id: 'coupon-couponCode' },
          { error: newCouponErrors.notifyVia || couponFormErrors.notifyVia, id: 'coupon-notifyVia' },
          { error: newCouponErrors.validFrom || couponFormErrors.validFrom, id: 'coupon-validFrom' },
          { error: newCouponErrors.validTill || couponFormErrors.validTill, id: 'coupon-validTill' },
          { error: newCouponErrors.usageLimit || couponFormErrors.usageLimit, id: 'coupon-usageLimit' }
        ];

        const firstErrorObj = errorOrder.find(item => item.error);
        if (firstErrorObj) {
          const el = document.getElementById(firstErrorObj.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }
      }, 100);

      return;
    }

    // Determine finalized lead coupon based on prod-1 or activeCoupon
    const mainProd = gridProducts.find(p => p.id === 'prod-1');
    let leadCoupon: LeadCoupon | undefined = undefined;
    if (mainProd && mainProd.discountCode && mainProd.discountCode !== '—') {
      leadCoupon = {
        couponCode: mainProd.discountCode,
        discountType: mainProd.discountType === 'Percentage' ? 'Percentage' : 'Fixed Amount',
        discountValue: typeof mainProd.discountValue === 'number' ? mainProd.discountValue : (parseFloat(mainProd.discountValue) || 0),
        validFrom: mainProd.validFrom,
        validTill: mainProd.validTill,
        notifyVia: mainProd.notifyVia === 'Email' || mainProd.notifyVia === 'WhatsApp' || mainProd.notifyVia === 'Both' ? mainProd.notifyVia : 'Email',
        status: 'Sent',
        orderPlaced: 'No'
      };
    } else if (activeCoupon) {
      leadCoupon = activeCoupon;
    }

    if (editingLead) {
      const updated: Lead = {
        ...editingLead,
        customerName: custName,
        email: custEmail,
        phone: custPhone,
        notes: notes,
        productName: product,
        variant: variant,
        quantity: qty,
        expectedValue: expectedValue,
        status: status,
        followUpDate: status === 'Follow-up' ? followUpDate : '',
        priority: priority,
        source: source,
        assignedStaff: assignedStaff,
        coupon: leadCoupon,
        timeline: [
          ...editingLead.timeline,
          ...tempTimelineEvents,
          {
            id: 'ev_u_' + Date.now(),
            timestamp: new Date().toISOString(),
            event: `Updated lead details: Status marked ${status}, Assigned to ${assignedStaff}.`
          }
        ]
      };
      onUpdateLead(updated);
    } else {
      const nextId = 'LD-' + (1000 + leads.length + 25);
      const created: Lead = {
        id: nextId,
        customerName: custName,
        email: custEmail,
        phone: custPhone,
        notes: notes,
        productName: product,
        variant: variant,
        quantity: qty,
        expectedValue: expectedValue,
        status: status,
        followUpDate: status === 'Follow-up' ? followUpDate : '',
        priority: priority,
        source: source,
        assignedStaff: assignedStaff,
        coupon: leadCoupon,
        timeline: [
          {
            id: 'ev_c_' + Date.now(),
            timestamp: new Date().toISOString(),
            event: `Lead manual creation finalized under reference ${nextId}.`
          },
          ...tempTimelineEvents
        ]
      };
      onAddLead(created);
    }
    setIsSlideOverOpen(false);
    onCloseForm();
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete the lead for "${name}"? This action is irreversible.`)) {
      onDeleteLead(id);
    }
  };

  // Metric computations for the sub-cards
  const statCounts = useMemo(() => {
    return {
      new: leads.filter(l => l.status === 'New').length,
      followUp: leads.filter(l => l.status === 'Follow-up').length,
      completed: leads.filter(l => l.status === 'Completed').length,
      incomplete: leads.filter(l => l.status === 'In-complete').length,
    };
  }, [leads]);

  // Filtered Leads list
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Metric Card filter
      if (cardStatusFilter === 'New' && lead.status !== 'New') return false;
      if (cardStatusFilter === 'Follow-up' && lead.status !== 'Follow-up') return false;
      if (cardStatusFilter === 'Completed' && lead.status !== 'Completed') return false;
      if (cardStatusFilter === 'In-complete' && lead.status !== 'In-complete') return false;

      // Dropdown filters
      if (priorityFilter !== 'All' && lead.priority !== priorityFilter) return false;
      if (sourceFilter !== 'All' && lead.source !== sourceFilter) return false;
      if (staffFilter !== 'All' && lead.assignedStaff !== staffFilter) return false;

      // Search Query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          lead.id.toLowerCase().includes(query) ||
          lead.customerName.toLowerCase().includes(query) ||
          lead.phone.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.productName.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [leads, searchQuery, priorityFilter, sourceFilter, staffFilter, cardStatusFilter]);

  // Helper to split filtered leads into Kanban Columns
  const kanbanColumns = useMemo(() => {
    const columns: Record<LeadStatus, Lead[]> = {
      'New': [],
      'Follow-up': [],
      'Completed': [],
      'In-complete': []
    };
    filteredLeads.forEach(lead => {
      columns[lead.status].push(lead);
    });
    return columns;
  }, [filteredLeads]);

  // Sorting & Pagination States
  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

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
    setCurrentPage(1);
  };

  const sortedLeads = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredLeads;
    return [...filteredLeads].sort((a, b) => {
      let valA = a[sortColumn as keyof Lead];
      let valB = b[sortColumn as keyof Lead];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? (valA > valB ? 1 : -1) 
          : (valB > valA ? 1 : -1);
      }
    });
  }, [filteredLeads, sortColumn, sortDirection]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedLeads.slice(startIndex, startIndex + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedLeads.length / pageSize) || 1;

  const SortArrow = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <span className="text-gray-300 ml-1">↕</span>;
    if (sortDirection === 'asc') return <span className="text-brand-primary font-bold ml-1">↑</span>;
    return <span className="text-brand-primary font-bold ml-1">↓</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Lead Management</h1>
          <p className="text-xs text-text-secondary mt-1">
            Track potential accounts, products expected value, and status progression.
          </p>
        </div>
      </div>

      {/* 4 COMPACT STAT CARDS */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setCardStatusFilter(cardStatusFilter === 'New' ? 'All' : 'New')}
          className={`flex items-center gap-2 border px-4 py-2.5 rounded-lg text-left cursor-pointer transition-all ${
            cardStatusFilter === 'New' 
              ? 'bg-brand-bg-active border-brand-primary text-brand-primary shadow-sm' 
              : 'bg-white border-border-subtle hover:bg-bg-neutral text-text-primary'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <div className="text-sm font-semibold">{statCounts.new} New</div>
        </button>

        <button
          onClick={() => setCardStatusFilter(cardStatusFilter === 'Follow-up' ? 'All' : 'Follow-up')}
          className={`flex items-center gap-2 border px-4 py-2.5 rounded-lg text-left cursor-pointer transition-all ${
            cardStatusFilter === 'Follow-up' 
              ? 'bg-brand-bg-active border-brand-primary text-brand-primary shadow-sm' 
              : 'bg-white border-border-subtle hover:bg-bg-neutral text-text-primary'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <div className="text-sm font-semibold">{statCounts.followUp} Follow-up</div>
        </button>

        <button
          onClick={() => setCardStatusFilter(cardStatusFilter === 'Completed' ? 'All' : 'Completed')}
          className={`flex items-center gap-2 border px-4 py-2.5 rounded-lg text-left cursor-pointer transition-all ${
            cardStatusFilter === 'Completed' 
              ? 'bg-brand-bg-active border-brand-primary text-brand-primary shadow-sm' 
              : 'bg-white border-border-subtle hover:bg-bg-neutral text-text-primary'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <div className="text-sm font-semibold">{statCounts.completed} Completed</div>
        </button>

        <button
          onClick={() => setCardStatusFilter(cardStatusFilter === 'In-complete' ? 'All' : 'In-complete')}
          className={`flex items-center gap-2 border px-4 py-2.5 rounded-lg text-left cursor-pointer transition-all ${
            cardStatusFilter === 'In-complete' 
              ? 'bg-brand-bg-active border-brand-primary text-brand-primary shadow-sm' 
              : 'bg-white border-border-subtle hover:bg-bg-neutral text-text-primary'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
          <div className="text-sm font-semibold">{statCounts.incomplete} In-complete</div>
        </button>

        {cardStatusFilter !== 'All' && (
          <button 
            onClick={() => setCardStatusFilter('All')}
            className="text-xs text-text-secondary hover:text-brand-primary hover:underline"
          >
            Clear Metric Filter
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-bg-neutral border border-border-subtle p-3 rounded-lg flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Search by ID, customer or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-white border border-border-subtle pl-9 pr-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-text-secondary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center justify-start lg:justify-end">
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-secondary font-medium whitespace-nowrap">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer"
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-text-secondary font-medium whitespace-nowrap">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer"
            >
              <option value="All">All Sources</option>
              {sourceList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-text-secondary font-medium whitespace-nowrap">Assigned:</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer"
            >
              <option value="All">All Staff</option>
              {staffList.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>

          <div className="h-6 w-px bg-border-subtle mx-1 hidden sm:block"></div>

          {/* Kanban / Table Toggle */}
          <div className="flex bg-white border border-border-subtle rounded p-0.5 shadow-xxs">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded cursor-pointer ${viewMode === 'kanban' ? 'bg-brand-bg-active text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded cursor-pointer ${viewMode === 'table' ? 'bg-brand-bg-active text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
              title="Table Grid View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* EMPTY STATE TRIGGER */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white border border-border-subtle p-12 text-center rounded-lg">
          <div className="w-16 h-16 bg-bg-neutral rounded-full flex items-center justify-center mx-auto mb-4 text-text-secondary">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">No leads yet matching your criteria</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-2">
            Create your first prospective lead to begin tracking order interest, assign staff, and follow up.
          </p>
          <button 
            onClick={handleNewLeadClick}
            className="mt-4 bg-brand-primary hover:bg-brand-primary-hover text-white py-1.5 px-4 rounded text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create a Lead
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['New', 'Follow-up', 'Completed', 'In-complete'] as LeadStatus[]).map(colStatus => {
            const list = kanbanColumns[colStatus];
            const colColors = {
              'New': 'border-t-blue-500 bg-blue-50/20 text-blue-800',
              'Follow-up': 'border-t-amber-500 bg-amber-50/20 text-amber-800',
              'Completed': 'border-t-emerald-500 bg-emerald-50/20 text-emerald-800',
              'In-complete': 'border-t-gray-400 bg-gray-50/20 text-gray-800'
            };

            return (
              <div 
                key={colStatus} 
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverColumn !== colStatus) {
                    setDragOverColumn(colStatus);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverColumn === colStatus) {
                    setDragOverColumn(null);
                  }
                }}
                onDrop={(e) => handleDrop(e, colStatus)}
                className={`border rounded-lg flex flex-col p-3 min-h-[450px] transition-colors duration-200 ${
                  dragOverColumn === colStatus 
                    ? 'bg-brand-bg-active/60 border-brand-primary ring-2 ring-brand-primary/20' 
                    : 'bg-bg-neutral border-border-subtle'
                }`}
              >
                {/* Column header */}
                <div className={`border-t-2 ${colColors[colStatus]} flex items-center justify-between p-2 rounded mb-3`}>
                  <span className="text-xs font-bold uppercase tracking-wider">{colStatus}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-white border border-border-subtle rounded-full text-text-primary">
                    {list.length}
                  </span>
                </div>

                {/* Card Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                  {list.map(lead => {
                    const initials = lead.assignedStaff.split(' ').map(n => n[0]).join('');
                    
                    const priorityStyles = {
                      'High': 'bg-red-50 text-red-700 border-red-100',
                      'Medium': 'bg-amber-50 text-amber-800 border-amber-100',
                      'Low': 'bg-gray-50 text-gray-700 border-gray-100'
                    };

                    return (
                      <div 
                        key={lead.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-white border border-border-subtle p-3.5 rounded-lg hover:shadow-sm hover:border-brand-primary transition-all group relative cursor-grab active:cursor-grabbing select-none"
                        onClick={() => handleEditLeadClick(lead)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-xxs text-text-secondary bg-bg-neutral px-1.5 py-0.5 rounded border border-border-subtle font-medium">
                            {lead.id}
                          </span>
                          <span className={`text-xxs px-2 py-0.5 border rounded-full font-medium ${priorityStyles[lead.priority]}`}>
                            {lead.priority} Priority
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-text-primary leading-tight group-hover:text-brand-primary transition-colors">
                          {lead.customerName || 'Unnamed'}
                        </h4>
                        
                        <p className="text-xxs text-text-secondary font-medium mt-1 truncate">
                          {lead.productName}
                        </p>

                        {lead.status === 'Follow-up' && lead.followUpDate && (
                          <div className="mt-1.5">
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 font-mono font-bold inline-block whitespace-nowrap">
                              F/U: {lead.followUpDate}
                            </span>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between items-center">
                          <div>
                            <span className="text-xxs text-text-secondary block font-normal">Expected value:</span>
                            <span className="text-xs font-bold text-text-primary">₹{lead.expectedValue.toLocaleString()}</span>
                          </div>

                          <div 
                            className="w-6.5 h-6.5 rounded-full bg-brand-bg-active text-brand-primary text-xxs font-bold flex items-center justify-center border border-brand-primary/20"
                            title={`Assigned to ${lead.assignedStaff}`}
                          >
                            {initials}
                          </div>
                        </div>

                        {/* Hover utility buttons */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white p-0.5 rounded shadow-sm border border-border-subtle transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLeadClick(lead);
                            }}
                            className="p-1 hover:bg-bg-neutral rounded text-text-primary"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(lead.id, lead.customerName);
                            }}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#B9D7FC] text-slate-900 text-[13px] font-bold border-b border-gray-300">
                  <th 
                    className="p-3 w-[10%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('id')}
                  >
                    Lead ID <SortArrow column="id" />
                  </th>
                  <th 
                    className="p-3 w-[16%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('customerName')}
                  >
                    Customer <SortArrow column="customerName" />
                  </th>
                  <th 
                    className="p-3 w-[15%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('email')}
                  >
                    Email / Phone <SortArrow column="email" />
                  </th>
                  <th 
                    className="p-3 w-[16%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('productName')}
                  >
                    Product Segment <SortArrow column="productName" />
                  </th>
                  <th 
                    className="p-3 w-[11%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('expectedValue')}
                  >
                    Value (₹) <SortArrow column="expectedValue" />
                  </th>
                  <th 
                    className="p-3 w-[9%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('source')}
                  >
                    Source <SortArrow column="source" />
                  </th>
                  <th 
                    className="p-3 w-[9%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('priority')}
                  >
                    Priority <SortArrow column="priority" />
                  </th>
                  <th 
                    className="p-3 w-[9%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('status')}
                  >
                    Status <SortArrow column="status" />
                  </th>
                  <th className="p-3 w-[5%] text-[13px] font-bold text-slate-900 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedLeads.map(lead => {
                  const priorityColors = {
                    'High': 'bg-red-50 text-red-700 border-red-200',
                    'Medium': 'bg-amber-50 text-amber-800 border-amber-200',
                    'Low': 'bg-gray-50 text-gray-700 border-gray-200'
                  };

                  const statusColors = {
                    'New': 'bg-blue-50 text-blue-700 border-blue-200',
                    'Follow-up': 'bg-amber-50 text-amber-700 border-amber-200',
                    'Completed': 'bg-emerald-50 text-brand-primary border-emerald-200',
                    'In-complete': 'bg-gray-50 text-gray-600 border-gray-200'
                  };

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors text-[13.5px]">
                      <td className="p-3 border-r border-b border-gray-200 align-middle font-mono font-bold text-text-primary">
                        <div className="truncate" title={lead.id}>{lead.id}</div>
                      </td>
                      <td className="p-3 border-r border-b border-gray-200 align-middle text-sm font-bold text-text-primary truncate" title={lead.customerName || '—'}>
                        {lead.customerName || '—'}
                      </td>
                      <td className="p-3 border-r border-b border-gray-200 align-middle">
                        <div className="text-xs text-text-primary truncate" title={lead.email}>{lead.email}</div>
                        <div className="text-xxs text-text-secondary mt-0.5">{lead.phone || '—'}</div>
                      </td>
                      <td className="p-3 border-r border-b border-gray-200 align-middle">
                        <div className="text-xs text-text-primary font-medium truncate" title={lead.productName}>{lead.productName}</div>
                        <div className="text-xxs text-text-secondary font-mono mt-0.5 truncate" title={`${lead.variant} (Qty: ${lead.quantity})`}>
                          {lead.variant} (Qty: {lead.quantity})
                        </div>
                      </td>
                      <td className="p-3 border-r border-b border-gray-200 align-middle text-sm font-bold text-text-primary">
                        ₹{lead.expectedValue.toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-b border-gray-200 align-middle">
                        <span className="text-xs text-text-secondary truncate" title={lead.source}>{lead.source}</span>
                      </td>
                      <td className="p-3 border-r border-b border-gray-200 align-middle text-center">
                        <span className={`text-[11px] px-2 py-0.5 border rounded-full font-bold uppercase inline-block ${priorityColors[lead.priority]}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="p-3 border-r border-b border-gray-200 align-middle text-center">
                        <span className={`text-[11px] px-2 py-0.5 border rounded-full font-bold uppercase inline-block ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                        {lead.status === 'Follow-up' && lead.followUpDate && (
                          <div className="block mt-1">
                            <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-1 py-0.5 font-mono font-bold inline-block whitespace-nowrap">
                              F/U: {lead.followUpDate}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 border-b border-gray-200 align-middle text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => handleEditLeadClick(lead)}
                            className="p-1 hover:bg-slate-100 rounded text-brand-primary border border-gray-300 hover:border-gray-400 cursor-pointer shadow-xxs transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(lead.id, lead.customerName)}
                            className="p-1 hover:bg-red-50 rounded text-red-600 border border-gray-300 hover:border-red-200 cursor-pointer shadow-xxs transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="border-t border-border-subtle px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card text-xs text-text-secondary">
            <div>
              Showing <span className="font-semibold text-text-primary">{Math.min((currentPage - 1) * pageSize + 1, sortedLeads.length)}</span> to{' '}
              <span className="font-semibold text-text-primary">{Math.min(currentPage * pageSize, sortedLeads.length)}</span> of{' '}
              <span className="font-semibold text-text-primary">{sortedLeads.length}</span> records
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Rows per page */}
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-bg-neutral border border-border-subtle rounded px-1.5 py-1 font-semibold cursor-pointer text-text-primary outline-none focus:border-brand-primary"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                >
                  Previous
                </button>

                {/* Pages */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 flex items-center justify-center rounded border transition-colors font-semibold cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-brand-primary border-brand-primary text-white'
                          : 'border-border-subtle bg-bg-neutral text-text-primary hover:bg-border-subtle'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 bg-bg-neutral border border-border-subtle rounded text-text-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-border-subtle font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SCREEN B — ADD/EDIT LEAD FORM (right-side slide-over panel) */}
      {isSlideOverOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay background */}
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-xxs transition-opacity"
            onClick={() => {
              setIsSlideOverOpen(false);
              onCloseForm();
            }}
          ></div>

          {/* Form container */}
          <div className="relative w-full max-w-[50rem] bg-white h-full shadow-xl flex flex-col z-10 transition-transform duration-300">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight">
                  {editingLead ? `Lead #${editingLead.id}` : 'Add New Lead Opportunity'}
                </h2>
              </div>
              <button 
                onClick={() => {
                  setIsSlideOverOpen(false);
                  onCloseForm();
                }}
                className="p-1.5 hover:bg-slate-200 rounded-full text-text-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveLead} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Alert note if source is from abandoned checkout */}
              {source === 'Abandoned Checkout' && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded text-xs text-amber-800 flex gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-semibold">Abandoned Checkout Auto-Lead:</span> This record is synchronized from Shopify abandoned cart events. Priority is pre-assigned.
                  </div>
                </div>
              )}

              {/* Section: Customer Details */}
              <div className="flex flex-col gap-4 pb-4">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider border-b border-gray-200 pb-2">
                  Customer Details
                </h3>
                
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Customer Name</label>
                  <input 
                    type="text"
                    id="lead-custName"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Enter customer full name"
                    className="w-full text-sm border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary border-border-subtle"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Email *</label>
                  <input 
                    type="text"
                    id="lead-custEmail"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="name@store.com"
                    className={`w-full text-sm border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary ${errors.custEmail ? 'border-red-500' : 'border-border-subtle'}`}
                  />
                  {errors.custEmail && <p className="text-xxs text-red-600 mt-1">{errors.custEmail}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Phone</label>
                  <input 
                    type="text"
                    id="lead-custPhone"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full text-sm border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary border-border-subtle"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Lead Notes & Context</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Specific requests, requirements or customer conversation history..."
                    rows={3}
                    className="w-full text-sm border border-border-subtle px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Section: Lead Details */}
              <div className="flex flex-col gap-4 pt-6 pb-4 border-t border-gray-200">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider border-b border-gray-200 pb-2">
                  Lead Details & Attributes
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Lead Status</label>
                  <select 
                    value={status}
                    onChange={(e) => {
                      const newStatus = e.target.value as LeadStatus;
                      setStatus(newStatus);
                      if (newStatus !== 'Follow-up') {
                        setFollowUpDate('');
                      }
                      if (errors.followUpDate) {
                        setErrors(prev => ({ ...prev, followUpDate: '' }));
                      }
                    }}
                    className={`w-full text-sm border px-3 py-2 rounded focus:outline-none cursor-pointer font-bold transition-colors ${statusSelectColorMap[status]}`}
                  >
                    <option value="New" className="bg-white text-text-primary font-normal">New Opportunity</option>
                    <option value="Follow-up" className="bg-white text-text-primary font-normal">In Follow-up</option>
                    <option value="Completed" className="bg-white text-text-primary font-normal">Completed (Won)</option>
                    <option value="In-complete" className="bg-white text-text-primary font-normal">In-complete (Lost)</option>
                  </select>
                </div>

                {status === 'Follow-up' && (
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Follow up date *</label>
                    <input 
                      type="date"
                      id="lead-followUpDate"
                      value={followUpDate}
                      onChange={(e) => {
                        setFollowUpDate(e.target.value);
                        if (errors.followUpDate) {
                          setErrors(prev => ({ ...prev, followUpDate: '' }));
                        }
                      }}
                      className={`w-full text-sm border px-3 py-2 rounded focus:outline-none bg-white ${
                        errors.followUpDate 
                          ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' 
                          : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                      }`}
                    />
                    {errors.followUpDate && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.followUpDate}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Priority Badge</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className={`w-full text-sm border px-3 py-2 rounded focus:outline-none cursor-pointer font-bold transition-colors ${prioritySelectColorMap[priority]}`}
                  >
                    <option value="High" className="bg-white text-text-primary font-normal">High Priority</option>
                    <option value="Medium" className="bg-white text-text-primary font-normal">Medium Priority</option>
                    <option value="Low" className="bg-white text-text-primary font-normal">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Lead Acquisition Source</label>
                  <select 
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full text-sm border border-border-subtle px-3 py-2 rounded focus:outline-none cursor-pointer bg-white"
                  >
                    {sourceList.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Assign Staff Member *</label>
                  <select 
                    id="lead-assignedStaff"
                    value={assignedStaff}
                    onChange={(e) => {
                      setAssignedStaff(e.target.value);
                      if (errors.assignedStaff) {
                        setErrors(prev => ({ ...prev, assignedStaff: '' }));
                      }
                    }}
                    className={`w-full text-sm border px-3 py-2 rounded focus:outline-none cursor-pointer bg-white ${
                      errors.assignedStaff 
                        ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' 
                        : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                    }`}
                  >
                    <option value="" disabled>Select Assigned Staff Member</option>
                    {staffList.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                  {errors.assignedStaff && (
                    <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.assignedStaff}</p>
                  )}
                </div>
              </div>
 
               {/* Section: Shopify Online Store Recovery & Discount Coupon Creator */}
               <div className="flex flex-col gap-4 pt-6 pb-4 border-t border-gray-200">
                 <div className="flex flex-col gap-1 border-b border-gray-200 pb-2">
                   <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                     Grid Products (Checkout Contents)
                   </div>
                   <div className="text-xs text-text-secondary font-medium">
                     Select products from the grid to configure and apply vouchers.
                   </div>
                 </div>

                 <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-xxs overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1250px]">
                      <thead>
                        <tr className="bg-[#EBF3FC] border-b border-gray-300 text-[10px] uppercase font-bold text-gray-800 select-none">
                          <th className="py-2.5 px-3 w-12 text-center border-r border-gray-300">
                            Select
                          </th>
                          <th className="py-2.5 px-3 border-r border-gray-300 min-w-[180px]">Product Name</th>
                          <th className="py-2.5 px-3 border-r border-gray-300 min-w-[120px] whitespace-nowrap">Variant / Option</th>
                          <th className="py-2.5 px-3 w-16 text-center border-r border-gray-300 whitespace-nowrap">Qty</th>
                          <th className="py-2.5 px-3 w-24 text-right border-r border-gray-300 whitespace-nowrap">Price (₹)</th>
                          <th className="py-2.5 px-3 text-center border-r border-gray-300 min-w-[125px] whitespace-nowrap">Discount Code</th>
                          <th className="py-2.5 px-3 text-center border-r border-gray-300 min-w-[115px] whitespace-nowrap">Discount Type</th>
                          <th className="py-2.5 px-3 text-center border-r border-gray-300 min-w-[95px] whitespace-nowrap">Notify Via</th>
                          <th className="py-2.5 px-3 text-center border-r border-gray-300 min-w-[130px] whitespace-nowrap">Start Date</th>
                          <th className="py-2.5 px-3 text-center border-r border-gray-300 min-w-[130px] whitespace-nowrap">End Date</th>
                          <th className="py-2.5 px-3 text-center border-r border-gray-300 min-w-[90px] whitespace-nowrap">Usage Limit</th>
                          <th className="py-2.5 px-3 text-center border-r border-gray-300 min-w-[85px] whitespace-nowrap">Status</th>
                          <th className="py-2.5 px-3 text-right min-w-[120px] whitespace-nowrap">Discount Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-xs text-text-primary bg-white">
                        {gridProducts.map((p) => {
                          const isSelected = selectedGridProducts.includes(p.id);

                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors hover:bg-slate-50 ${
                                isSelected ? 'bg-[#EBF3FC]/30' : ''
                              }`}
                            >
                              <td 
                                className="py-2 px-3 text-center w-12 border-r border-b border-gray-200 cursor-pointer hover:bg-slate-100/50"
                                onClick={() => {
                                  const targetState = !isSelected;
                                  if (targetState) {
                                    // Single-select: select only this product row
                                    setSelectedGridProducts([p.id]);
                                    setCouponFormErrors({});
                                    
                                    // Update the coupon form fields with this product's existing voucher details or clear them
                                    if (p.discountCode && p.discountCode !== '—') {
                                      setCouponCode(p.discountCode || '');
                                      setDiscountType((p.discountType === 'Percentage' || p.discountType === 'Fixed Amount') ? p.discountType : '');
                                      setDiscountValue(p.discountValue !== undefined ? p.discountValue : '');
                                      setValidFrom(p.validFrom || '');
                                      setValidTill(p.validTill || '');
                                      setNotifyVia((p.notifyVia === 'Email' || p.notifyVia === 'WhatsApp' || p.notifyVia === 'Both') ? p.notifyVia : '');
                                      setUsageLimit(p.usageLimit || '');
                                      setCouponGridStatus((p.status === 'Active' || p.status === 'In Active' || p.status === 'Inactive') ? (p.status === 'Inactive' ? 'In Active' : p.status) : 'Active');
                                    } else {
                                      setCouponCode('');
                                      setDiscountType('');
                                      setDiscountValue('');
                                      setValidFrom('');
                                      setValidTill('');
                                      setNotifyVia('');
                                      setUsageLimit('1');
                                      setCouponGridStatus('Active');
                                    }
                                  } else {
                                    // Unchecking the selected product row: clear selection and reset form fields
                                    setSelectedGridProducts([]);
                                    setCouponFormErrors({});
                                    setCouponCode('');
                                    setDiscountType('');
                                    setDiscountValue('');
                                    setValidFrom('');
                                    setValidTill('');
                                    setNotifyVia('');
                                    setUsageLimit('');
                                    setCouponGridStatus('Active');
                                    setActiveCoupon(null);
                                  }
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by td onClick
                                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer animate-none"
                                />
                              </td>
                              <td className="py-2 px-3 border-r border-b border-gray-200 font-semibold text-text-primary">
                                <span className="font-semibold text-text-primary">{p.name}</span>
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-text-secondary whitespace-nowrap">
                                <span>{p.variant || 'Standard Tier'}</span>
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-center text-text-primary whitespace-nowrap">
                                <span>{p.qty}</span>
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-right font-medium text-text-primary whitespace-nowrap">
                                <span className="font-medium text-text-primary">₹{p.price.toLocaleString()}</span>
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-center whitespace-nowrap">
                                {p.discountCode !== '—' ? (
                                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-xxs font-bold">
                                    {p.discountCode}
                                  </span>
                                ) : (
                                  <span className="text-text-secondary">—</span>
                                )}
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-center text-text-secondary whitespace-nowrap">
                                {p.discountType !== '—' ? p.discountType : '—'}
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-center text-text-secondary whitespace-nowrap">
                                {p.notifyVia && p.notifyVia !== '—' ? p.notifyVia : '—'}
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-center text-text-secondary whitespace-nowrap">
                                {p.validFrom && p.validFrom !== '—' ? p.validFrom.replace('T', ' ') : '—'}
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-center text-text-secondary whitespace-nowrap">
                                {p.validTill && p.validTill !== '—' ? p.validTill.replace('T', ' ') : '—'}
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-center text-text-secondary whitespace-nowrap">
                                {p.usageLimit && p.usageLimit !== '—' ? p.usageLimit : '—'}
                              </td>

                              <td className="py-2 px-3 border-r border-b border-gray-200 text-center whitespace-nowrap">
                                {p.status === 'Active' ? (
                                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xxs font-bold animate-none">
                                    Active
                                  </span>
                                ) : (p.status === 'In Active' || p.status === 'Inactive') ? (
                                  <span className="inline-flex items-center bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded-full text-xxs font-bold animate-none">
                                    In Active
                                  </span>
                                ) : (
                                  <span className="text-text-secondary">—</span>
                                )}
                              </td>

                              <td className="py-2 px-3 border-b border-gray-200 text-right font-semibold whitespace-nowrap">
                                {p.discountAmount !== '—' ? (
                                  <span className="text-emerald-600 font-bold">{p.discountAmount}</span>
                                ) : (
                                  <span className="text-text-secondary">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                {/* Coupon Details Fields Grid */}
                {selectedGridProducts.length > 0 && (
                  <div className="bg-bg-neutral/30 border border-border-subtle rounded-lg p-4 flex flex-col gap-4">
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border-subtle pb-1">
                      Voucher Discount & Configuration Options
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Column Left */}
                      <div className="flex flex-col gap-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                              Discount Type
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

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                              Discount Value ({discountType === 'Percentage' ? '%' : '₹'})
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
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                            Coupon Code
                          </label>
                          <div className="relative flex">
                            <input
                              type="text"
                              id="coupon-couponCode"
                              value={couponCode}
                              disabled={hasExistingCode}
                              onChange={(e) => {
                                setCouponCode(e.target.value.toUpperCase());
                                setCouponFormErrors(prev => ({ ...prev, couponCode: '' }));
                              }}
                              className={`w-full text-xs border ${
                                couponFormErrors.couponCode
                                  ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                                  : 'border-border-subtle focus:ring-1 focus:ring-brand-primary'
                              } px-3 py-2 rounded-l focus:outline-none font-mono font-bold uppercase text-brand-primary tracking-wide bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                            />
                            <button
                              type="button"
                              disabled={hasExistingCode}
                              onClick={() => {
                                const randSuffix = Math.floor(10000 + Math.random() * 90000);
                                const leadNumStr = editingLead ? editingLead.id.replace('LD-', '') : 'NEW';
                                setCouponCode(`LEAD${leadNumStr}${randSuffix}`);
                                setCouponFormErrors(prev => ({ ...prev, couponCode: '' }));
                              }}
                              className="bg-bg-neutral hover:bg-border-subtle border border-l-0 border-border-subtle px-3.5 rounded-r text-text-primary text-xs font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                            Notify Customer Via
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
                      </div>

                      {/* Column Right */}
                      <div className="flex flex-col gap-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                              Start Date
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

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                              End Date
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
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                              Usage Limit
                            </label>
                            <input
                              type="number"
                              id="coupon-usageLimit"
                              placeholder="e.g. 1"
                              min="1"
                              step="1"
                              value={usageLimit}
                              onKeyDown={(e) => {
                                if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const valStr = e.target.value;
                                if (valStr === '') {
                                  setUsageLimit('');
                                } else {
                                  const parsed = parseInt(valStr, 10);
                                  if (!isNaN(parsed)) {
                                    setUsageLimit(Math.max(1, parsed).toString());
                                  } else {
                                    setUsageLimit('1');
                                  }
                                }
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

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">
                              Voucher Status
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

                    {/* Trigger Action Bar */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={selectedGridProducts.length === 0}
                        onClick={() => handleCreateCouponTrigger()}
                        className={`text-xs font-bold px-5 py-2.5 rounded flex items-center gap-1.5 transition-colors ${
                          selectedGridProducts.length === 0
                            ? 'bg-brand-primary/40 text-white/70 cursor-not-allowed'
                            : 'bg-brand-primary hover:bg-brand-primary-hover text-white shadow-sm cursor-pointer'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Details</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Activity Timeline (edit mode only) */}
              {editingLead && (
                <div className="flex flex-col gap-4 pt-6 pb-4 border-t border-gray-200">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider border-b border-gray-200 pb-2">
                    Activity Timeline & Audit
                  </h3>
                  <div className="relative pl-4 border-l border-border-subtle flex flex-col gap-4">
                    {editingLead.timeline.map(ev => (
                      <div key={ev.id} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary border-2 border-white ring-2 ring-brand-bg-active"></span>
                        <div className="text-xs text-text-primary font-medium">{ev.event}</div>
                        <div className="text-xxs text-text-secondary mt-0.5">
                          {new Date(ev.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {/* Sticky footer with cancel/save */}
            <div className="border-t border-border-subtle p-4 bg-bg-neutral flex justify-between gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => {
                  setIsSlideOverOpen(false);
                  onCloseForm();
                }}
                className="px-4 py-2 border border-border-subtle hover:bg-white rounded text-sm text-text-primary font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveLead}
                className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {editingLead ? 'Save Updates' : 'Publish Lead'}
              </button>
            </div>
          </div>

          {/* Polaris Discount Coupon Code Modal */}
          {isPolarisCouponModalOpen && (
            <PolarisDiscountModal
              isOpen={isPolarisCouponModalOpen}
              onClose={() => setIsPolarisCouponModalOpen(false)}
              leadId={editingLead ? editingLead.id : 'LD-NEW'}
              leadName={custName || 'Draft Lead'}
              leadProduct={product}
              leadVariant={variant || 'Default Option'}
              leadQty={qty}
              leadValue={expectedValue}
              onCouponCreated={(newCoup) => {
                const verifiedCoup: LeadCoupon = {
                  couponCode: newCoup.couponCode,
                  discountType: newCoup.discountType,
                  discountValue: newCoup.discountValue,
                  validTill: newCoup.validTill,
                  notifyVia: newCoup.notifyVia,
                  status: newCoup.status,
                  orderPlaced: newCoup.orderPlaced
                };
                setActiveCoupon(verifiedCoup);
                
                // Add timeline event
                const discountDesc = newCoup.discountType === 'Percentage' 
                  ? `${newCoup.discountValue}% off` 
                  : `₹${newCoup.discountValue.toLocaleString()} off`;
                const newEvent: LeadTimelineEvent = {
                  id: 'ev_coup_' + Date.now(),
                  timestamp: new Date().toISOString(),
                  event: `Shopify Coupon ${newCoup.couponCode} (${discountDesc}) created and dispatched via ${newCoup.notifyVia} using Polaris.`
                };
                setTempTimelineEvents(prev => [...prev, newEvent]);
              }}
            />
          )}

          {/* Local Toast Notification overlay */}
          {toast && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 bg-slate-950 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-350">
              {toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
