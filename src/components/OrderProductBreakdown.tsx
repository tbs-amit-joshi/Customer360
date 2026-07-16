import React, { useState, useMemo, useEffect } from 'react';
import { 
  Ticket, Gift, Receipt, ChevronDown, ChevronUp, AlertCircle, 
  HelpCircle, Percent, ArrowRight, CornerDownRight, CheckCircle2,
  Eye, X, FileText, ExternalLink, ShieldAlert, Clock, User, Calendar,
  MessageSquare, Tag, Search
} from 'lucide-react';
import { formatCurrencyAmount } from '../utils/currency';
import { getStatusBadgeMeta } from '../utils/orderStatus';
import { ResizeHandle, useResizableColumns, type ResizableColumnConfig } from './tableResize';

const PRODUCT_GRID_COLUMNS: ResizableColumnConfig[] = [
  { id: 'index', width: 55, minWidth: 44, maxWidth: 100 },
  { id: 'name', width: 264, minWidth: 180, maxWidth: 420 },
  { id: 'type', width: 176, minWidth: 130, maxWidth: 300 },
  { id: 'vendor', width: 176, minWidth: 130, maxWidth: 300 },
  { id: 'variant', width: 275, minWidth: 180, maxWidth: 420 },
  { id: 'qty', width: 88, minWidth: 64, maxWidth: 160 },
  { id: 'price', width: 66, minWidth: 60, maxWidth: 180 }
];

interface LineItemComplaint {
  id: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Escalated';
  reason: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  complaintDate: string;
  assignedTo: string;
  slaDueDate: string;
  slaStatus: 'Pending' | 'Due Soon' | 'Overdue' | 'Completed';
  description: string;
  documents: { id: string; name: string; type: string; size: string; url: string; }[];
}

interface LineItemDiscount {
  code: string;
  percentage: number;
  amount: number;
  status: string;
}

interface LineItemRefund {
  id: string;
  status: 'Refunded' | 'Pending' | 'Approved';
  amount: number;
  type: string;
  restocked: boolean;
  date: string;
  gatewayStatus: string;
  method: string;
}

interface LineItem {
  id: string;
  name: string;
  productType?: string;
  vendor?: string;
  variant: string;
  qty: number;
  price: number;
  complaints?: LineItemComplaint[];
  discount?: LineItemDiscount;
  refunds?: LineItemRefund[];
}

interface ApiLineItem {
  id?: string;
  name: string;
  productType?: string;
  vendor?: string;
  variant: string;
  qty: number;
  price: number;
}

// Mock service mapping orders to their respective product line items with full fields
function getLineItemsForOrder(orderId: string, customerId: string, customerName: string): LineItem[] {
  const normName = customerName?.trim();

  if (normName === 'Emma Watson') {
    if (orderId === '#SH-90412') {
      return [
        {
          id: 'item-1',
          name: 'Support Package',
          variant: '24/7 Priority SLA',
          qty: 1,
          price: 45000,
          complaints: [
            { 
              id: 'CP-4081', 
              status: 'In Progress', 
              reason: 'Damaged router port replacement',
              category: 'Hardware Defect',
              priority: 'High',
              complaintDate: '2026-06-28',
              assignedTo: 'Rahul Dev',
              slaDueDate: '2026-06-30',
              slaStatus: 'Due Soon',
              description: 'The enterprise router received has a physically damaged WAN port on the back chassis and refuses to establish an uplink connection. Same-day shipping replacement is requested by the client.',
              documents: [
                { id: 'doc-1', name: 'broken_wan_port.png', type: 'image/png', size: '1.2 MB', url: '#' },
                { id: 'doc-2', name: 'invoice_SH90412.pdf', type: 'application/pdf', size: '420 KB', url: '#' }
              ]
            }
          ],
          discount: {
            code: 'VIP15',
            percentage: 15,
            amount: 6750,
            status: 'Active'
          },
          refunds: [
            { 
              id: 'RF-9002', 
              status: 'Refunded', 
              amount: 5000, 
              type: 'Partial Refund (Service Delay Compensation)', 
              restocked: false,
              date: '2026-05-22',
              gatewayStatus: 'Approved',
              method: 'Credit Card (Visa - 4242)'
            }
          ]
        },
        {
          id: 'item-2',
          name: 'Enterprise Edge Gateway',
          variant: '10Gbps SFP+ Ports',
          qty: 1,
          price: 55000,
          complaints: [
            { 
              id: 'CP-4082', 
              status: 'Open', 
              reason: 'SFP+ transceiver missing from packaging',
              category: 'Hardware Defect',
              priority: 'Medium',
              complaintDate: '2026-06-30',
              assignedTo: 'David Miller',
              slaDueDate: '2026-07-03',
              slaStatus: 'Pending',
              description: 'The packaging of the Enterprise Edge Gateway was intact but the SFP+ transceiver module slot inside was completely empty. Fiber link deployment is blocked.',
              documents: [
                { id: 'doc-3', name: 'empty_slot_photo.jpg', type: 'image/jpeg', size: '1.5 MB', url: '#' }
              ]
            }
          ],
          discount: {
            code: 'WELCOME10',
            percentage: 10,
            amount: 5500,
            status: 'Active'
          },
          refunds: [
            { 
              id: 'RF-9003', 
              status: 'Pending', 
              amount: 3000, 
              type: 'Partial Refund (Negotiated Compensation)', 
              restocked: false,
              date: '2026-07-01',
              gatewayStatus: 'Processing',
              method: 'Store Credit'
            }
          ]
        }
      ];
    }
  }

  if (normName === 'David Miller') {
    if (orderId === '#SH-89801') {
      return [
        {
          id: 'item-dm-1',
          name: 'Pro Smart Router',
          variant: 'Enterprise Bundle with rack ears',
          qty: 1,
          price: 95000,
          complaints: [],
          discount: {
            code: 'LOYALTY20',
            percentage: 20,
            amount: 19000,
            status: 'Active'
          },
          refunds: []
        }
      ];
    } else if (orderId === '#SH-87110') {
      return [
        {
          id: 'item-dm-2',
          name: 'Developer Toolkits',
          variant: '5 Commercial Licenses',
          qty: 5,
          price: 20000,
          complaints: [
            { 
              id: 'CP-4083', 
              status: 'Resolved', 
              reason: 'Invalid activation key warnings on startup screen',
              category: 'Software Key',
              priority: 'High',
              complaintDate: '2026-05-03',
              assignedTo: 'Rahul Dev',
              slaDueDate: '2026-05-05',
              slaStatus: 'Completed',
              description: 'The licensing validation key provided during purchase triggers an invalid license warning upon terminal reboot. A software update and key refresh solved the warning.',
              documents: []
            }
          ],
          refunds: []
        }
      ];
    }
  }

  if (normName === 'Anish Grover') {
    return [
      {
        id: 'item-ag-1',
        name: 'Basic Networking Hub',
        variant: '8-Port Desktop RJ45',
        qty: 1,
        price: 15000,
        complaints: [],
        refunds: []
      }
    ];
  }

  if (normName === 'Vikram Seth') {
    return [
      {
        id: 'item-vs-1',
        name: 'Advanced NAS Storage Server',
        variant: '4TB RAID-5 Configuration',
        qty: 1,
        price: 62000,
        complaints: [],
        discount: {
          code: 'WINBACK50',
          percentage: 50,
          amount: 31000,
          status: 'Active'
        },
        refunds: []
      }
    ];
  }

  // Fallback default based on the order's total price or general defaults
  return [
    {
      id: 'item-fallback',
      name: 'Tech Standard Enterprise Suite',
      variant: 'Standard Volume License',
      qty: 1,
      price: 45000,
      complaints: [],
      refunds: []
    }
  ];
}

interface ProductRowItemProps {
  key?: React.Key | string | number;
  item: LineItem;
  idx: number;
  currencyCode?: string;
}

function ProductRowItem({
  item,
  idx,
  currencyCode
}: ProductRowItemProps) {
  return (
    <tr className="hover:bg-slate-50 transition-colors text-[13.5px]">
      {/* Product Index / ID */}
      <td className="py-1.5 px-3 border-r border-b border-gray-200 font-bold text-gray-500 text-center bg-gray-50/50">
        #{idx + 1}
      </td>

      {/* Product Name */}
      <td className="py-1.5 px-3 border-r border-b border-gray-200 font-semibold text-text-primary truncate" title={item.name}>
        {item.name}
      </td>

      {/* Product Type */}
      <td className="py-1.5 px-3 border-r border-b border-gray-200 text-text-secondary font-medium truncate" title={item.productType || '-'}>
        {item.productType || '-'}
      </td>

      {/* Vendor */}
      <td className="py-1.5 px-3 border-r border-b border-gray-200 text-text-secondary font-medium truncate" title={item.vendor || '-'}>
        {item.vendor || '-'}
      </td>

      {/* Variant */}
      <td className="py-1.5 px-3 border-r border-b border-gray-200 text-text-secondary font-medium truncate" title={item.variant}>
        {item.variant}
      </td>

      {/* Qty */}
      <td className="py-1.5 px-3 border-r border-b border-gray-200 text-center font-bold text-text-primary">
        {item.qty}
      </td>

      {/* Price */}
      <td className="py-1.5 px-3 border-b border-gray-200 text-right font-semibold text-text-primary">
        {formatCurrencyAmount(item.price, currencyCode)}
      </td>
    </tr>
  );
}

interface OrderProductBreakdownProps {
  orderId: string;
  orderDate: string;
  orderStatus: string;
  totalAmount: number;
  currencyCode?: string;
  customerId: string;
  customerName: string;
  orderName?: string;
  items?: ApiLineItem[];
}

export default function OrderProductBreakdown({
  orderId,
  orderDate,
  orderStatus,
  totalAmount,
  currencyCode,
  customerId,
  customerName,
  orderName,
  items
}: OrderProductBreakdownProps) {
  const lineItems = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item, idx) => ({
        id: item.id || `api-item-${idx + 1}`,
        name: item.name,
        productType: item.productType || '-',
        vendor: item.vendor || '-',
        variant: item.variant,
        qty: item.qty,
        price: item.price,
        complaints: [],
        refunds: []
      }));
    }

    return getLineItemsForOrder(orderId, customerId, customerName);
  }, [items, orderId, customerId, customerName]);

  // Track expanded state for each product. By default, we expand the first one of the order.
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (lineItems.length > 0) {
      setExpandedProducts({ [lineItems[0].id]: true });
    } else {
      setExpandedProducts({});
    }
  }, [lineItems]);

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Modal active states (globally managed to allow simple overlay covers)
  const [activeComplaintModal, setActiveComplaintModal] = useState<LineItemComplaint | null>(null);
  const [activeRefundModal, setActiveRefundModal] = useState<LineItemRefund | null>(null);
  const [activeDetailModalProduct, setActiveDetailModalProduct] = useState<LineItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'refunds' | 'discounts'>('refunds');
  const orderStatusMeta = getStatusBadgeMeta('order', orderStatus);

  useEffect(() => {
    if (activeDetailModalProduct) {
      if (activeDetailModalProduct.refunds && activeDetailModalProduct.refunds.length > 0) {
        setActiveModalTab('refunds');
      } else if (activeDetailModalProduct.discount) {
        setActiveModalTab('discounts');
      } else {
        setActiveModalTab('refunds');
      }
    }
  }, [activeDetailModalProduct]);

  const activeDetailRefunds = activeDetailModalProduct?.refunds || [];
  const productGrid = useResizableColumns(PRODUCT_GRID_COLUMNS);

  const renderResizableHeader = (
    columnId: string,
    content: React.ReactNode,
    className: string
  ) => {
    return (
      <th
        style={productGrid.getColStyle(columnId)}
        className={`${className} relative group`}
      >
        <div className="flex items-center justify-between gap-2 pr-4">
          <span className="min-w-0 flex-1">{content}</span>
          <ResizeHandle
            columnId={columnId}
            onResizeStart={productGrid.startResize}
            onResizeMove={productGrid.handleResizeMove}
            onResizeEnd={productGrid.handleResizeEnd}
          />
        </div>
      </th>
    );
  };

  const getComplaintStatusStyles = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Resolved':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Closed':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'Escalated':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getRefundStatusStyles = (status: string) => {
    switch (status) {
      case 'Refunded':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'Approved':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getSLAStatusStyles = (slaStatus: string) => {
    switch (slaStatus) {
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Due Soon':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const getCategoryStyles = (category: string) => {
    const normalized = category?.toLowerCase().trim() || '';
    if (normalized.includes('hardware') || normalized.includes('defect')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (normalized.includes('billing') || normalized.includes('payment') || normalized.includes('price')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (normalized.includes('software') || normalized.includes('license') || normalized.includes('key')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (normalized.includes('logistics') || normalized.includes('shipping') || normalized.includes('delivery')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (normalized.includes('account') || normalized.includes('access') || normalized.includes('auth')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="w-full font-sans text-sm p-2 bg-slate-50/50 rounded-lg">
      {/* Product Items Sub-Table Grid */}
      <div className="relative overflow-hidden border border-gray-300 rounded-xl bg-white shadow-xxs">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-r-full bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 opacity-85" />
        <div className="pl-0">
        <table
          className="w-full text-left border-collapse table-fixed"
          style={{ minWidth: `${productGrid.tableWidth}px` }}
        >
          <colgroup>
            {PRODUCT_GRID_COLUMNS.map((column) => (
              <col key={column.id} style={productGrid.getColStyle(column.id)} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-[#B9D7FC] text-slate-900 text-[12.5px] font-bold border-b border-gray-300">
              {renderResizableHeader('index', <>#</>, 'py-1.5 px-3 text-center border-r border-gray-300 font-bold text-slate-900')}
              {renderResizableHeader('name', <>Product Name</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
              {renderResizableHeader('type', <>Product Type</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
              {renderResizableHeader('vendor', <>Vendor</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
              {renderResizableHeader('variant', <>Variant</>, 'py-1.5 px-3 text-left border-r border-gray-300 font-bold text-slate-900')}
              {renderResizableHeader('qty', <>Qty</>, 'py-1.5 px-3 text-center border-r border-gray-300 font-bold text-slate-900')}
              {renderResizableHeader('price', <>Price</>, 'py-1.5 px-3 text-right font-bold text-slate-900')}
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
            <ProductRowItem
              key={item.id}
              item={item}
              idx={idx}
              currencyCode={currencyCode}
            />
          ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* --- PRODUCT ORDER DETAIL MODAL --- */}
      {activeDetailModalProduct && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-border-subtle max-w-[1100px] w-full min-h-[620px] flex flex-col overflow-hidden my-8 animate-scale-up font-sans">
            
            {/* Modal Header */}
            <div className="bg-bg-neutral/40 border-b border-border-subtle/50 px-6 py-5 flex items-start justify-between relative bg-white">
              {/* Left Side */}
              <div className="pr-8">
                <h3 className="text-[18px] font-bold text-text-primary leading-snug font-sans tracking-tight">
                  {orderName || activeDetailModalProduct.name}
                </h3>
                <p className="text-xs text-text-secondary font-medium mt-1 font-sans">
                  {activeDetailModalProduct.variant} <span className="text-text-secondary/30 mx-1.5">•</span> Qty: {activeDetailModalProduct.qty}
                </p>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-4.5">
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-brand-primary tracking-tight">{orderId}</span>
                    {orderStatusMeta ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-wider ${orderStatusMeta.className}`}>
                        {orderStatusMeta.label}
                      </span>
                    ) : orderStatus?.trim() ? null : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-wider bg-slate-50 text-slate-600 border-slate-200">
                        -
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-secondary font-semibold">{orderDate}</span>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setActiveDetailModalProduct(null)}
                  className="p-1.5 hover:bg-bg-neutral rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer border border-border-subtle/10 bg-white"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border-subtle/50 bg-white px-6 flex items-center gap-6">
              {/* Tab 2: Refund Status */}
              <button
                onClick={() => setActiveModalTab('refunds')}
                className={`py-3.5 flex items-center gap-2 border-b-2 text-[14px] font-semibold transition-all relative cursor-pointer ${
                  activeModalTab === 'refunds' 
                    ? 'border-brand-primary text-text-primary font-bold' 
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                  activeModalTab === 'refunds'
                    ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary'
                    : 'bg-bg-neutral/40 border-border-subtle/40 text-text-secondary'
                }`}>
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <span>Refund Status</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeModalTab === 'refunds'
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'bg-bg-neutral text-text-secondary'
                }`}>
                  {activeDetailRefunds.length}
                </span>
              </button>

              {/* Tab 3: Applied Discount */}
              <button
                onClick={() => setActiveModalTab('discounts')}
                className={`py-3.5 flex items-center gap-2 border-b-2 text-[14px] font-semibold transition-all relative cursor-pointer ${
                  activeModalTab === 'discounts' 
                    ? 'border-brand-primary text-text-primary font-bold' 
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                  activeModalTab === 'discounts'
                    ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary'
                    : 'bg-bg-neutral/40 border-border-subtle/40 text-text-secondary'
                }`}>
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <span>Applied Discount</span>
                {activeDetailModalProduct.discount ? (
                  <span className={`text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    activeDetailModalProduct.discount.status.toLowerCase() === 'active' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}>
                    {activeDetailModalProduct.discount.status}
                  </span>
                ) : (
                  <span className="text-[11px] uppercase font-bold tracking-wider text-text-secondary bg-bg-neutral border border-border-subtle/40 px-2 py-0.5 rounded-full">
                    No Discount
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-white flex-1 min-h-[400px]">
              
              {/* TAB PANEL 2: Refund Status */}
              {activeModalTab === 'refunds' && (
                <div className="space-y-4">
                  {activeDetailRefunds.length === 0 ? (
                    <div className="py-12 px-4 border-2 border-dashed border-border-subtle/50 rounded-xl flex flex-col items-center justify-center text-center text-text-secondary bg-bg-neutral/10">
                      <HelpCircle className="w-8 h-8 text-text-secondary/40 mb-2" />
                      <p className="text-[14px] font-semibold text-text-secondary">No refunds for this product</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-300 rounded-xl bg-white shadow-xxs">
                      <table className="w-full text-left border-collapse text-xs table-fixed">
                        <thead>
                          <tr className="bg-[#B9D7FC] text-slate-900 text-[13px] font-bold border-b border-gray-300 h-10">
                            <th className="p-3 text-[13px] font-bold uppercase tracking-wider text-slate-900 whitespace-nowrap w-[20%] border-r border-gray-300">Refund ID</th>
                            <th className="p-3 text-[13px] font-bold uppercase tracking-wider text-slate-900 text-center whitespace-nowrap w-[20%] border-r border-gray-300">Status</th>
                            <th className="p-3 text-[13px] font-bold uppercase tracking-wider text-slate-900 text-right whitespace-nowrap w-[22%] border-r border-gray-300">Refund Amount</th>
                            <th className="p-3 text-[13px] font-bold uppercase tracking-wider text-slate-900 text-center whitespace-nowrap w-[18%] border-r border-gray-300">Restocked</th>
                            <th className="p-3 text-[13px] font-bold uppercase tracking-wider text-slate-900 text-center whitespace-nowrap w-[20%]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {activeDetailRefunds.map(ref => (
                            <tr key={ref.id} className="hover:bg-slate-50 transition-colors h-12 text-[13.5px]">
                              <td className="px-3 py-1 align-middle text-[14px] font-mono font-bold text-text-primary whitespace-nowrap border-r border-b border-gray-200">{ref.id}</td>
                              <td className="px-3 py-1 align-middle text-center whitespace-nowrap border-r border-b border-gray-200">
                                <span className={`text-[11px] px-2.5 py-1 rounded font-bold uppercase border inline-block ${getRefundStatusStyles(ref.status)}`}>
                                  {ref.status}
                                </span>
                              </td>
                              <td className="px-3 py-1 align-middle text-[14px] font-extrabold text-emerald-600 text-right whitespace-nowrap border-r border-b border-gray-200">
                                {formatCurrencyAmount(ref.amount, currencyCode)}
                              </td>
                              <td className="px-3 py-1 align-middle text-center text-[14px] font-semibold text-text-primary whitespace-nowrap border-r border-b border-gray-200">
                                {ref.restocked ? (
                                  <span className="text-emerald-600 font-bold">Yes (Returned)</span>
                                ) : (
                                  <span className="text-text-secondary">No</span>
                                )}
                              </td>
                              <td className="px-3 py-1 align-middle text-center whitespace-nowrap border-b border-gray-200">
                                <button
                                  onClick={() => {
                                    setActiveRefundModal(ref);
                                  }}
                                  className="w-8 h-8 inline-flex items-center justify-center bg-white hover:bg-slate-100 text-brand-primary border border-gray-300 hover:border-brand-primary/30 rounded-lg shadow-xxs transition-colors cursor-pointer"
                                  title="View Refund"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB PANEL 3: Applied Discount */}
              {activeModalTab === 'discounts' && (
                <div className="space-y-4">
                  {!activeDetailModalProduct.discount ? (
                    <div className="py-12 px-4 border-2 border-dashed border-border-subtle/50 rounded-xl flex flex-col items-center justify-center text-center text-text-secondary bg-bg-neutral/10">
                      <HelpCircle className="w-8 h-8 text-text-secondary/40 mb-2" />
                      <p className="text-xs font-semibold text-text-secondary">No discount applied on this product</p>
                    </div>
                  ) : (
                    <div className="bg-bg-neutral/10 border border-border-subtle p-5 rounded-xl space-y-4 hover:border-brand-primary/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Coupon Code:</span>
                          <span className="bg-brand-primary/10 text-brand-primary font-extrabold px-3 py-1 rounded-lg border border-brand-primary/20 font-mono text-sm shadow-xxs">
                            {activeDetailModalProduct.discount.code}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Status:</span>
                          <span className={`text-[11px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${
                            activeDetailModalProduct.discount.status.toLowerCase() === 'active' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200' 
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}>
                            {activeDetailModalProduct.discount.status}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-border-subtle/40 pt-4">
                        <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Coupon Contribution</span>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="text-2xl font-black text-brand-primary tracking-tight">
                            {activeDetailModalProduct.discount.percentage}% discount
                          </span>
                          <span className="text-sm font-semibold text-text-secondary">saved</span>
                          <span className="text-3xl font-black text-emerald-700 tracking-tight">
                            {formatCurrencyAmount(activeDetailModalProduct.discount.amount, currencyCode)}
                          </span>
                          <span className="text-xs text-text-secondary font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded ml-1">
                            Saved on this product
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-bg-neutral/40 border-t border-border-subtle/50 px-6 py-4 flex items-center justify-end bg-white">
              <button 
                onClick={() => setActiveDetailModalProduct(null)}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- COMPLAINT VIEW DETAILS MODAL OVERLAY --- */}
      {activeComplaintModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-[70] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-border-subtle max-w-2xl w-full overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="bg-bg-neutral/40 border-b border-border-subtle/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-red-500 animate-pulse" />
                <div>
                  <h3 className="text-base font-extrabold text-text-primary font-mono tracking-tight">
                    Complaint Dossier: {activeComplaintModal.id}
                  </h3>
                  <p className="text-xs text-text-secondary font-medium mt-0.5">
                    Order Reference: <span className="font-mono font-bold text-text-primary">{orderId}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveComplaintModal(null)}
                className="p-1.5 hover:bg-bg-neutral rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer border border-border-subtle/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body Grid */}
            <div className="p-6 space-y-5">
              
              {/* Grid of details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-bg-neutral/10 border border-border-subtle/50 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Customer Name</span>
                  <span className="text-sm font-extrabold text-text-primary">{customerName}</span>
                </div>
                <div>
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">SLA Priority</span>
                  <span className={`inline-block text-xs px-2.5 py-0.5 mt-1 rounded font-bold uppercase border ${getPriorityStyles(activeComplaintModal.priority)}`}>
                    {activeComplaintModal.priority}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Ticket Status</span>
                  <span className={`inline-block text-xs px-2.5 py-0.5 mt-1 rounded font-bold uppercase border ${getComplaintStatusStyles(activeComplaintModal.status)}`}>
                    {activeComplaintModal.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Classification</span>
                  <span className={`inline-block text-xs px-2.5 py-0.5 mt-1 rounded font-bold uppercase border ${getCategoryStyles(activeComplaintModal.category)}`}>
                    {activeComplaintModal.category}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Date Registered</span>
                  <span className="text-sm font-bold text-text-primary">{activeComplaintModal.complaintDate}</span>
                </div>
                <div>
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Assigned Engineer</span>
                  <span className="text-sm font-bold text-text-primary flex items-center gap-1 mt-0.5">
                    <User className="w-4 h-4 text-text-secondary" />
                    {activeComplaintModal.assignedTo}
                  </span>
                </div>
              </div>

              {/* SLA Target Section */}
              <div className="grid grid-cols-2 gap-4 bg-amber-50/20 border border-amber-100 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block">SLA Resolution Target</span>
                  <span className="text-sm font-extrabold text-amber-900 flex items-center gap-1.5 mt-1">
                    <Clock className="w-4.5 h-4.5 text-amber-600" />
                    {activeComplaintModal.slaDueDate}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block">Current SLA Stand</span>
                  <span className={`inline-block text-xs px-2.5 py-0.5 mt-1 rounded font-bold uppercase border ${getSLAStatusStyles(activeComplaintModal.slaStatus)}`}>
                    {activeComplaintModal.slaStatus}
                  </span>
                </div>
              </div>

              {/* Description Detail */}
              <div className="space-y-1.5">
                <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Problem Statement Description</span>
                <div className="bg-bg-neutral/20 border border-border-subtle/50 p-4 rounded-xl text-sm text-text-primary leading-relaxed font-semibold">
                  {activeComplaintModal.description}
                </div>
              </div>

              {/* Attached Evidence Files */}
              <div className="space-y-2">
                <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">
                  Attached Verification Evidence ({activeComplaintModal.documents.length})
                </span>
                {activeComplaintModal.documents.length === 0 ? (
                  <p className="text-sm text-text-secondary italic">No documents or files uploaded for this case.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeComplaintModal.documents.map(doc => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between bg-bg-neutral p-3 rounded-lg border border-border-subtle hover:border-text-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4.5 h-4.5 text-text-secondary" />
                          <div>
                            <p className="text-sm font-bold text-text-primary truncate max-w-[150px]">{doc.name}</p>
                            <p className="text-xs text-text-secondary font-semibold">{doc.size}</p>
                          </div>
                        </div>
                        <a 
                           href="#"
                           onClick={(e) => {
                             e.preventDefault();
                             alert(`Downloading file: ${doc.name}`);
                           }}
                           className="text-brand-primary hover:text-brand-primary-hover p-1.5 rounded hover:bg-brand-primary/10 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer buttons */}
            <div className="bg-bg-neutral/40 border-t border-border-subtle/50 px-6 py-4 flex items-center justify-end">
              <button 
                onClick={() => setActiveComplaintModal(null)}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Complaint dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REFUND VIEW DETAILS MODAL OVERLAY --- */}
      {activeRefundModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-[70] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-border-subtle max-w-md w-full overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="bg-bg-neutral/40 border-b border-border-subtle/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-extrabold text-text-primary font-mono tracking-tight">
                    Refund Record: {activeRefundModal.id}
                  </h3>
                  <p className="text-xs text-text-secondary font-medium mt-0.5">
                    Associated Order: <span className="font-mono font-bold text-text-primary">{orderId}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveRefundModal(null)}
                className="p-1.5 hover:bg-bg-neutral rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer border border-border-subtle/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              <div className="text-center bg-red-50/30 border border-red-100 p-5 rounded-2xl">
                <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Amount Disbursed</p>
                <p className="text-2xl font-black text-red-600 mt-1">
                  {formatCurrencyAmount(activeRefundModal.amount, currencyCode)}
                </p>
                <span className={`inline-block text-xs mt-2 px-2.5 py-0.5 rounded font-black uppercase border ${getRefundStatusStyles(activeRefundModal.status)}`}>
                  {activeRefundModal.status}
                </span>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div className="bg-bg-neutral/20 border border-border-subtle/40 p-3 rounded-lg">
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Refund Date</span>
                  <span className="text-sm font-extrabold text-text-primary mt-1 block">{activeRefundModal.date}</span>
                </div>
                <div className="bg-bg-neutral/20 border border-border-subtle/40 p-3 rounded-lg">
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Gateway Status</span>
                  <span className="text-sm font-extrabold text-brand-primary mt-1 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {activeRefundModal.gatewayStatus}
                  </span>
                </div>
                <div className="bg-bg-neutral/20 border border-border-subtle/40 p-3 rounded-lg col-span-2">
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Refund Compensation Reason</span>
                  <span className="text-sm font-bold text-text-primary mt-1 block leading-relaxed">
                    {activeRefundModal.type}
                  </span>
                </div>
                <div className="bg-bg-neutral/20 border border-border-subtle/40 p-3 rounded-lg">
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Item Restocked</span>
                  <span className="text-sm font-extrabold text-text-primary mt-1 block">
                    {activeRefundModal.restocked ? 'Yes (Returned to active stock)' : 'No (Written off / SLA Benefit)'}
                  </span>
                </div>
                <div className="bg-bg-neutral/20 border border-border-subtle/40 p-3 rounded-lg">
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wider block">Disbursal Method</span>
                  <span className="text-sm font-extrabold text-text-primary mt-1 block">
                    {activeRefundModal.method}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-bg-neutral/40 border-t border-border-subtle/50 px-6 py-4 flex items-center justify-end">
              <button 
                onClick={() => setActiveRefundModal(null)}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Refund record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
