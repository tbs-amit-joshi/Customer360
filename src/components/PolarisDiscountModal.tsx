import React, { useState, useEffect, useMemo } from 'react';
import {
  AppProvider,
  Modal,
  IndexTable,
  Select,
  TextField,
  Button,
  Banner,
  BlockStack,
  InlineStack,
  Box,
  Text,
  Badge
} from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import { Gift, RefreshCw, AlertCircle, Sparkles, Check } from 'lucide-react';

import '@shopify/polaris/build/esm/styles.css';

interface PolarisDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  leadProduct: string;
  leadVariant: string;
  leadQty: number;
  leadValue: number;
  onCouponCreated: (coupon: {
    couponCode: string;
    discountType: 'Percentage' | 'Fixed Amount';
    discountValue: number;
    validTill: string;
    notifyVia: 'Email' | 'WhatsApp' | 'Both';
    status: 'Sent';
    orderPlaced: 'No';
  }) => void;
}

interface AbandonedProduct {
  id: string;
  name: string;
  variant: string;
  qty: number;
  price: number;
  discountCode: string;
  discountType: string;
  discountAmount: string;
  status?: string;
}

export default function PolarisDiscountModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  leadProduct,
  leadVariant,
  leadQty,
  leadValue,
  onCouponCreated
}: PolarisDiscountModalProps) {
  // Mock Shopify Abandoned Checkout Products
  const products: AbandonedProduct[] = useMemo(() => [
    {
      id: 'prod-1',
      name: leadProduct || 'Enterprise Cloud Hosting',
      variant: leadVariant || 'Standard Option',
      qty: leadQty || 1,
      price: leadValue || 0,
      discountCode: '—',
      discountType: '—',
      discountAmount: '—',
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
      discountAmount: '10%',
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
      discountAmount: '—',
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
      discountAmount: '₹1,500',
      status: 'Active'
    }
  ], [leadProduct, leadVariant, leadQty, leadValue]);

  // States
  const [selectedResources, setSelectedResources] = useState<string[]>(['prod-1']);
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed Amount'>('Percentage');
  const [discountValue, setDiscountValue] = useState<string>('10');
  const [couponCode, setCouponCode] = useState<string>('');
  const getMinStartDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [validFrom, setValidFrom] = useState<string>(getMinStartDateTime());
  const [validTill, setValidTill] = useState<string>('');
  const [minOrderValue, setMinOrderValue] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [notifyVia, setNotifyVia] = useState<'Email' | 'WhatsApp' | 'Both'>('Email');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showGraphQLPayload, setShowGraphQLPayload] = useState(false);

  // Helper to generate code
  const generateCouponCode = () => {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const cleanId = leadId ? leadId.replace('LD-', '') : 'NEW';
    return `LEAD${cleanId}${suffix}`;
  };

  // Generate Coupon Code on Mount or Open
  useEffect(() => {
    if (isOpen) {
      setCouponCode(generateCouponCode());
      setErrorBanner(null);
      setIsSubmitting(false);
    }
  }, [isOpen, leadId]);

  // Handler for row selections
  const handleSelectionChange = (
    selectionType: any,
    toggleType: any,
    selection?: any,
  ) => {
    if (selectionType === 'all') {
      setSelectedResources(products.map((p) => p.id));
    } else if (selectionType === 'none') {
      setSelectedResources([]);
    } else if ((selectionType === 'single' || selectionType === 'multi') && typeof selection === 'string') {
      if (toggleType) {
        if (!selectedResources.includes(selection)) {
          setSelectedResources([...selectedResources, selection]);
        }
      } else {
        setSelectedResources(selectedResources.filter((item) => item !== selection));
      }
    }
  };

  // Simulated GraphQL mutation execution details
  const graphQLPayload = useMemo(() => {
    const selectedProductsDetails = products.filter(p => selectedResources.includes(p.id));
    return {
      query: `mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
      codeDiscount {
        ... on DiscountCodeBasic {
          title
          codes(first: 10) {
            nodes { code }
          }
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}`,
      variables: {
        basicCodeDiscount: {
          code: couponCode,
          title: `Lead recovery discount for ${leadName}`,
          startsAt: validFrom.includes('T') ? `${validFrom}:00Z` : `${validFrom}T00:00:00Z`,
          endsAt: validTill ? (validTill.includes('T') ? `${validTill}:00Z` : `${validTill}T23:59:59Z`) : null,
          customerGets: {
            items: {
              products: selectedProductsDetails.map(p => `gid://shopify/Product/${p.id}`)
            },
            value: {
              [discountType === 'Percentage' ? 'percentage' : 'fixedAmount']: discountType === 'Percentage' 
                ? parseFloat(discountValue) / 100 
                : parseFloat(discountValue)
            }
          },
          minimumRequirement: minOrderValue ? {
            subtotal: {
              greaterThanOrEqualToSubtotal: parseFloat(minOrderValue)
            }
          } : null,
          usageLimit: usageLimit ? parseInt(usageLimit, 10) : null
        }
      }
    };
  }, [couponCode, leadName, validFrom, validTill, discountType, discountValue, selectedResources, minOrderValue, usageLimit, products]);

  // Create Coupon validation & simulation
  const handleCreateCoupon = async () => {
    setErrorBanner(null);

    // 1. Validation
    if (selectedResources.length === 0) {
      setErrorBanner('Please select at least one product row from the grid.');
      return;
    }

    const valueNum = parseFloat(discountValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      setErrorBanner(`Please enter a valid discount value greater than 0.`);
      return;
    }

    if (discountType === 'Percentage' && valueNum > 100) {
      setErrorBanner('Percentage discount value cannot exceed 100%.');
      return;
    }

    if (!couponCode.trim()) {
      setErrorBanner('Coupon code cannot be empty.');
      return;
    }

    setIsSubmitting(true);

    // 2. Simulate API Request
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Add a random 10% chance error for realism if they didn't fill out correctly
          if (couponCode.toLowerCase().includes('error')) {
            reject(new Error('Shopify API Error: Coupon code already exists in this store.'));
          } else {
            resolve(true);
          }
        }, 1200);
      });

      // 3. Success Callback
      onCouponCreated({
        couponCode: couponCode.toUpperCase().trim(),
        discountType,
        discountValue: valueNum,
        validTill: validTill || 'Unlimited',
        notifyVia,
        status: 'Sent',
        orderPlaced: 'No'
      });

      onClose();
    } catch (e: any) {
      setErrorBanner(e.message || 'An unexpected Shopify GraphQL API error occurred.');
      setIsSubmitting(false);
    }
  };

  // Table row markup
  const rowMarkup = products.map(
    ({ id, name, variant, qty, price, discountCode, discountType: dType, discountAmount, status: prodStatus }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        position={index}
        selected={selectedResources.includes(id)}
      >
        <IndexTable.Cell>
          <div style={{ fontWeight: '600', color: '#111827' }}>{name}</div>
        </IndexTable.Cell>
        <IndexTable.Cell>{variant}</IndexTable.Cell>
        <IndexTable.Cell>{qty}</IndexTable.Cell>
        <IndexTable.Cell>₹{price.toLocaleString()}</IndexTable.Cell>
        <IndexTable.Cell>
          {discountCode !== '—' ? (
            <Badge tone="success">{discountCode}</Badge>
          ) : (
            <span style={{ color: '#9ca3af' }}>—</span>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {dType !== '—' ? dType : <span style={{ color: '#9ca3af' }}>—</span>}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {discountCode !== '—' || prodStatus === 'Active' ? (
            <Badge tone="success">Active</Badge>
          ) : (
            <span style={{ color: '#9ca3af' }}>—</span>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {discountAmount !== '—' ? (
            <span style={{ fontWeight: '600', color: '#10b981' }}>{discountAmount}</span>
          ) : (
            <span style={{ color: '#9ca3af' }}>—</span>
          )}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <AppProvider i18n={enTranslations}>
      {/* CSS overrides to ensure Polaris styling matches deep teal #0F6D5E theme and custom scrollbar */}
      <style>{`
        .Polaris-Modal-Dialog__container {
          z-index: 1000 !important;
        }
        .custom-teal-btn {
          background-color: #0F6D5E !important;
          border-color: #0F6D5E !important;
          color: #ffffff !important;
          transition: background-color 0.2s ease !important;
        }
        .custom-teal-btn:hover {
          background-color: #0A4E43 !important;
          border-color: #0A4E43 !important;
        }
        .custom-teal-btn:disabled {
          background-color: #c9dbd7 !important;
          border-color: #c9dbd7 !important;
          color: #ffffff !important;
          cursor: not-allowed !important;
        }
        .Polaris-Button--plain {
          color: #374151 !important;
          text-decoration: none !important;
        }
        .Polaris-Button--plain:hover {
          color: #111827 !important;
        }
        .shopify-payload-box {
          font-family: monospace;
          background-color: #0f172a;
          color: #38bdf8;
          border-radius: 6px;
          padding: 10px;
          font-size: 11px;
          max-height: 200px;
          overflow-y: auto;
        }
      `}</style>

      <Modal
        open={isOpen}
        onClose={onClose}
        title="Create Shopify Discount Coupon"
        size="large"
      >
        <Modal.Section>
          <div className="space-y-6">
            {/* Header info / Context Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-text-secondary font-medium">Drafting Coupon For Lead</div>
                <div className="text-sm font-bold text-text-primary mt-0.5">{leadName} ({leadId})</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 font-semibold self-start md:self-auto">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Shopify Online Store Recovery</span>
              </div>
            </div>

            {/* ERROR BANNER */}
            {errorBanner && (
              <Banner tone="critical" title="Required input validation error">
                <div className="flex items-center gap-1.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorBanner}</span>
                </div>
              </Banner>
            )}

            {/* Section 1 — Interested Product (Target) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Section 1 — Interested Product (Target)
                </div>
                <div className="text-xxs text-slate-500 font-medium">
                  Select target items for discount. Read-only columns show existing checkout code values.
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <IndexTable
                  resourceName={{ singular: 'product', plural: 'products' }}
                  itemCount={products.length}
                  selectedItemsCount={
                    selectedResources.length === products.length ? 'All' : selectedResources.length
                  }
                  onSelectionChange={handleSelectionChange}
                  headings={[
                    { title: 'Product Name' },
                    { title: 'Variant / Option' },
                    { title: 'Quantity' },
                    { title: 'Estimated Value (₹)' },
                    { title: 'Discount Code' },
                    { title: 'Discount Type' },
                    { title: 'Status' },
                    { title: 'Discount Amount' }
                  ]}
                >
                  {rowMarkup}
                </IndexTable>
              </div>

              {selectedResources.length === 0 && (
                <p className="text-xxs text-amber-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> Select at least one product row to enable coupon creation.
                </p>
              )}
            </div>

            {/* Form Fields Grid */}
            {selectedResources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Column: Coupon Details */}
                <div className="space-y-4">
                  
                  {/* Section 2 & 3: Discount Type & Discount Value */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Select
                        label="DISCOUNT TYPE"
                        options={[
                          { label: 'Percentage (%)', value: 'Percentage' },
                          { label: 'Fixed Amount (₹)', value: 'Fixed Amount' }
                        ]}
                        value={discountType}
                        onChange={(value) => {
                          const val = value as 'Percentage' | 'Fixed Amount';
                          setDiscountType(val);
                          setDiscountValue(val === 'Percentage' ? '10' : '1000');
                        }}
                      />
                    </div>

                    <div>
                      <TextField
                        label={`DISCOUNT VALUE (${discountType === 'Percentage' ? '%' : '₹'})`}
                        type="number"
                        value={discountValue}
                        onChange={(value) => setDiscountValue(value)}
                        suffix={discountType === 'Percentage' ? '%' : '₹'}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Section 4: Coupon Code */}
                  <div>
                    <TextField
                      label="COUPON CODE"
                      value={couponCode}
                      onChange={(value) => setCouponCode(value.toUpperCase())}
                      autoComplete="off"
                      helpText="Unique checkout voucher code required on Shopify checkout screen."
                      connectedRight={
                        <Button 
                          icon={() => <RefreshCw className="w-4 h-4 text-gray-500 hover:text-gray-800" />} 
                          onClick={() => setCouponCode(generateCouponCode())}
                          accessibilityLabel="Regenerate code"
                        />
                      }
                    />
                  </div>

                  {/* Section 8: Notify Customer Via */}
                  <div>
                    <Select
                      label="NOTIFY CUSTOMER VIA"
                      options={[
                        { label: 'Email', value: 'Email' },
                        { label: 'WhatsApp', value: 'WhatsApp' },
                        { label: 'Both channels', value: 'Both' }
                      ]}
                      value={notifyVia}
                      onChange={(value) => setNotifyVia(value as 'Email' | 'WhatsApp' | 'Both')}
                    />
                  </div>

                </div>

                {/* Right Column: Constraints & Validity */}
                <div className="space-y-4">
                  
                  {/* Section 5: Valid From & Valid Till */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <TextField
                        label="START DATE"
                        type="datetime-local"
                        value={validFrom}
                        onChange={(value) => setValidFrom(value)}
                        autoComplete="off"
                        min={getMinStartDateTime()}
                      />
                    </div>

                    <div>
                      <TextField
                        label="END DATE"
                        type="datetime-local"
                        value={validTill}
                        onChange={(value) => setValidTill(value)}
                        autoComplete="off"
                        min={validFrom || getMinStartDateTime()}
                      />
                    </div>
                  </div>

                  {/* Section 6: Minimum Order Value */}
                  <div>
                    <TextField
                      label="MINIMUM ORDER VALUE (₹) — OPTIONAL"
                      type="number"
                      value={minOrderValue}
                      onChange={(value) => setMinOrderValue(value)}
                      placeholder="e.g. 500"
                      helpText="Discount applies only if cart value exceeds this amount"
                      autoComplete="off"
                    />
                  </div>

                  {/* Section 7: Usage Limit */}
                  <div>
                    <TextField
                      label="USAGE LIMIT — OPTIONAL"
                      type="number"
                      value={usageLimit}
                      onChange={(value) => setUsageLimit(value)}
                      placeholder="e.g. 1"
                      helpText="Leave blank for unlimited usage"
                      autoComplete="off"
                    />
                  </div>

                </div>

              </div>
            )}

            {/* Toggleable Shopify GraphQL API Payload Viewer for developers */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-slate-50">
              <button
                type="button"
                onClick={() => setShowGraphQLPayload(!showGraphQLPayload)}
                className="w-full text-left px-4 py-2.5 text-xxs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>Shopify GraphQL Payload Details (discountCodeBasicCreate)</span>
                <span>{showGraphQLPayload ? '▲ Hide payload' : '▼ View Payload'}</span>
              </button>
              {showGraphQLPayload && (
                <div className="p-4 border-t border-gray-200 space-y-3">
                  <div className="text-xxs text-slate-500">
                    This payload will be dispatched to Shopify's GraphQL Admin API Endpoint: <code className="bg-slate-200 px-1 rounded text-slate-800 font-mono font-bold">/admin/api/2026-07/graphql.json</code>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mutation Query</div>
                      <pre className="shopify-payload-box">{graphQLPayload.query}</pre>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Variables Payload</div>
                      <pre className="shopify-payload-box">{JSON.stringify(graphQLPayload.variables, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions Row */}
            <div className="border-t border-gray-200 pt-5 flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-transparent rounded hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Discard
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleCreateCoupon}
                  disabled={selectedResources.length === 0 || isSubmitting}
                  className="custom-teal-btn px-5 py-2.5 text-xs font-semibold rounded shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Coupon...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-3.5 h-3.5 text-white" />
                      <span>Create Coupon</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </Modal.Section>
      </Modal>
    </AppProvider>
  );
}
