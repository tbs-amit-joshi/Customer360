import { Lead, Complaint, Customer, Campaign, EmailTemplate, ActivityLog, SettingsState } from './types';

// Helper to format date relative to today
const getDateDaysAgo = (daysAgo: number, timeStr: string = '10:00'): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dateStr = d.toISOString().split('T')[0];
  return `${dateStr}T${timeStr}:00`;
};

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'LD-1024',
    customerName: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    notes: 'Inquired about the enterprise server hosting package. Highly interested in high bandwidth options.',
    productName: 'Enterprise Cloud Hosting',
    variant: '128GB RAM / 32 Cores',
    quantity: 1,
    expectedValue: 125000,
    priority: 'High',
    source: 'Website Form',
    assignedStaff: 'Emma Watson',
    status: 'New',
    timeline: [
      { id: 'ev1', timestamp: getDateDaysAgo(2, '09:30'), event: 'Lead auto-created from Shopify Website Form.' },
      { id: 'ev2', timestamp: getDateDaysAgo(1, '14:20'), event: 'Assigned to Emma Watson by system.' }
    ]
  },
  {
    id: 'LD-1025',
    customerName: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+91 87654 32109',
    notes: 'Abandoned checkout customer. Offered a 10% discount template via automated follow-up.',
    productName: 'Premium Support Plan',
    variant: 'Annual Contract',
    quantity: 1,
    expectedValue: 45000,
    priority: 'Medium',
    source: 'Abandoned Checkout',
    assignedStaff: 'Emma Watson',
    status: 'Follow-up',
    timeline: [
      { id: 'ev3', timestamp: getDateDaysAgo(4, '11:15'), event: 'Lead created via Abandoned Checkout trigger.' },
      { id: 'ev4', timestamp: getDateDaysAgo(3, '10:00'), event: 'Sent Follow-up Coupon Email (Template: Welcome Promo).' }
    ]
  },
  {
    id: 'LD-1026',
    customerName: 'Rohan Verma',
    email: 'rohan.v@example.co.in',
    phone: '+91 76543 21098',
    notes: 'Requires bulk license for 50 users. Price negotiations completed.',
    productName: 'Team Collaboration Suite',
    variant: '50-User Pack',
    quantity: 1,
    expectedValue: 220000,
    priority: 'High',
    source: 'Direct Outreach',
    assignedStaff: 'David Miller',
    status: 'Completed',
    timeline: [
      { id: 'ev5', timestamp: getDateDaysAgo(10, '15:45'), event: 'Lead registered by David Miller.' },
      { id: 'ev6', timestamp: getDateDaysAgo(8, '11:00'), event: 'Product demo completed.' },
      { id: 'ev7', timestamp: getDateDaysAgo(2, '17:00'), event: 'Invoice paid. Status marked Completed.' }
    ]
  },
  {
    id: 'LD-1027',
    customerName: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    phone: '+91 65432 10987',
    notes: 'Looking for physical hardware integrations. Postponed purchase till next quarter.',
    productName: 'IoT Hub Gateway',
    variant: 'Pro Edition',
    quantity: 5,
    expectedValue: 85000,
    priority: 'Low',
    source: 'Referral',
    assignedStaff: 'Rahul Dev',
    status: 'In-complete',
    timeline: [
      { id: 'ev8', timestamp: getDateDaysAgo(15, '10:30'), event: 'Lead referred by client.' },
      { id: 'ev9', timestamp: getDateDaysAgo(12, '16:00'), event: 'Marked In-complete: Budget deferred to next financial year.' }
    ]
  },
  {
    id: 'LD-1028',
    customerName: 'Arnav Sen',
    email: 'arnav.sen@example.com',
    phone: '+91 99887 76655',
    notes: 'Interested in upgrading to a bulk package of Smart Home Hub Pros for his newly built housing society complex.',
    productName: 'Smart Home Hub Pro',
    variant: '10-Pack Bundle',
    quantity: 1,
    expectedValue: 120000,
    priority: 'High',
    source: 'Google Search',
    assignedStaff: 'Emma Watson',
    status: 'New',
    timeline: [
      { id: 'ev10', timestamp: getDateDaysAgo(1, '09:00'), event: 'Lead created. Inquired about bulk discount.' }
    ]
  },
  {
    id: 'LD-1029',
    customerName: 'Sophia Martinez',
    email: 'sophia.m@example.com',
    phone: '+1 415 555 1234',
    notes: 'Requested product comparison sheet between noise-cancelling headphones and earbuds.',
    productName: 'Noise-Cancelling Bluetooth Headphones',
    variant: 'Midnight Blue',
    quantity: 2,
    expectedValue: 37998,
    priority: 'Medium',
    source: 'Instagram Ad',
    assignedStaff: 'David Miller',
    status: 'Follow-up',
    timeline: [
      { id: 'ev11', timestamp: getDateDaysAgo(3, '14:20'), event: 'Lead auto-created from Instagram Ad campaign.' },
      { id: 'ev12', timestamp: getDateDaysAgo(2, '11:00'), event: 'Sent comparison PDF brochure.' }
    ]
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'CP-4081',
    customerName: 'Emma Watson',
    customerEmail: 'emma.watson@example.com',
    orderId: '#SH-90412',
    description: 'The enterprise router received has a physically damaged WAN port on the back chassis and refuses to establish an uplink connection. Same-day shipping replacement is requested by the client.',
    category: 'Hardware Defect',
    priority: 'High',
    complaintDate: getDateDaysAgo(1, '10:15').split('T')[0],
    assignedTo: 'Rahul Dev',
    slaDueDate: getDateDaysAgo(-1, '10:15').split('T')[0], // tomorrow
    slaStatus: 'Due Soon',
    status: 'In Progress',
    documents: [
      { id: 'doc1', name: 'broken_wan_port.png', type: 'image/png', size: '1.2 MB', url: '#' },
      { id: 'doc2', name: 'invoice_SH90412.pdf', type: 'application/pdf', size: '420 KB', url: '#' }
    ]
  },
  {
    id: 'CP-4082',
    customerName: 'Emma Watson',
    customerEmail: 'emma.watson@example.com',
    orderId: '#SH-90412',
    description: 'The packaging of the Enterprise Edge Gateway was intact but the SFP+ transceiver module slot inside was completely empty. Fiber link deployment is blocked.',
    category: 'Hardware Defect',
    priority: 'Medium',
    complaintDate: getDateDaysAgo(2, '11:00').split('T')[0],
    assignedTo: 'David Miller',
    slaDueDate: getDateDaysAgo(-1, '11:00').split('T')[0], // tomorrow
    slaStatus: 'Due Soon',
    status: 'Open',
    documents: [
      { id: 'doc3', name: 'empty_slot_photo.jpg', type: 'image/jpeg', size: '1.5 MB', url: '#' }
    ]
  },
  {
    id: 'CP-4083',
    customerName: 'Kabir Mehta',
    customerEmail: 'kabir.mehta@example.com',
    orderId: '#SH-87110',
    description: 'Licensing key is invalid on activation screen. Urgent key refresh required.',
    category: 'Software Key',
    priority: 'High',
    complaintDate: getDateDaysAgo(5, '11:00').split('T')[0],
    assignedTo: 'Rahul Dev',
    slaDueDate: getDateDaysAgo(3, '11:00').split('T')[0],
    slaStatus: 'Completed',
    status: 'Resolved',
    documents: []
  },
  {
    id: 'CP-4084',
    customerName: 'Meera Deshmukh',
    customerEmail: 'meera.deshmukh@example.com',
    orderId: '#SH-86400',
    description: 'Late package delivery. Product arrived 4 days after the estimated delivery date.',
    category: 'Logistics',
    priority: 'Low',
    complaintDate: getDateDaysAgo(10, '14:00').split('T')[0],
    assignedTo: 'System Agent',
    slaDueDate: getDateDaysAgo(7, '14:00').split('T')[0],
    slaStatus: 'Completed',
    status: 'Closed',
    documents: []
  },
  {
    id: 'CP-4085',
    customerName: 'Hans Mueller',
    customerEmail: 'hans.m@example.de',
    orderId: '#EL-10208',
    description: 'Smart Home Hub Pro completely lost Wi-Fi connectivity and refuses to join the mesh network. Firmware resets do not solve the loop.',
    category: 'Firmware Loop',
    priority: 'High',
    complaintDate: getDateDaysAgo(3, '09:00').split('T')[0],
    assignedTo: 'Rahul Dev',
    slaDueDate: getDateDaysAgo(1, '09:00').split('T')[0],
    slaStatus: 'Completed',
    status: 'Resolved',
    documents: []
  },
  {
    id: 'CP-4086',
    customerName: 'Li Wei',
    customerEmail: 'li.wei@example.com',
    orderId: '#EL-10203',
    description: 'The ergonomic wireless mouse has a loose scroll wheel that rattles during movement. Requires replacement clicker kit.',
    category: 'Hardware Defect',
    priority: 'Low',
    complaintDate: getDateDaysAgo(4, '15:30').split('T')[0],
    assignedTo: 'Emma Watson',
    slaDueDate: getDateDaysAgo(1, '15:30').split('T')[0],
    slaStatus: 'Due Soon',
    status: 'In Progress',
    documents: []
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-8821',
    name: 'Emma Watson',
    email: 'emma.watson@example.com',
    phone: '+91 99999 88888',
    country: 'United States',
    location: 'New York',
    lastLogin: '2026-07-08 14:02',
    totalOrders: 25,
    totalSpend: 1640000,
    lastOrderDate: getDateDaysAgo(3, '14:30').split('T')[0],
    leadNo: 'LD-1025',
    leadStatus: 'Follow-up',
    segment: 'VIP',
    orders: [
      { orderId: '#SH-90412', date: '2026-06-29', amount: 100000, status: 'Fulfilled' },
      { orderId: '#SH-90411', date: '2026-06-28', amount: 45000, status: 'Fulfilled' },
      { orderId: '#SH-90410', date: '2026-06-27', amount: 55000, status: 'Fulfilled' },
      { orderId: '#SH-90409', date: '2026-06-25', amount: 100000, status: 'Fulfilled' },
      { orderId: '#SH-90408', date: '2026-06-24', amount: 45000, status: 'Pending' },
      { orderId: '#SH-90407', date: '2026-06-22', amount: 55000, status: 'Fulfilled' },
      { orderId: '#SH-90406', date: '2026-06-20', amount: 45000, status: 'Fulfilled' },
      { orderId: '#SH-90405', date: '2026-06-18', amount: 100000, status: 'Fulfilled' },
      { orderId: '#SH-90404', date: '2026-06-15', amount: 55000, status: 'Pending' },
      { orderId: '#SH-90403', date: '2026-06-12', amount: 45000, status: 'Fulfilled' },
      { orderId: '#SH-90402', date: '2026-06-10', amount: 100000, status: 'Fulfilled' },
      { orderId: '#SH-90401', date: '2026-06-08', amount: 55000, status: 'Fulfilled' },
      { orderId: '#SH-90400', date: '2026-06-05', amount: 45000, status: 'Fulfilled' },
      { orderId: '#SH-90399', date: '2026-06-02', amount: 100000, status: 'Fulfilled' },
      { orderId: '#SH-90398', date: '2026-05-30', amount: 55000, status: 'Pending' },
      { orderId: '#SH-90397', date: '2026-05-28', amount: 45000, status: 'Fulfilled' },
      { orderId: '#SH-90396', date: '2026-05-25', amount: 100000, status: 'Fulfilled' },
      { orderId: '#SH-90395', date: '2026-05-22', amount: 55000, status: 'Fulfilled' },
      { orderId: '#SH-90394', date: '2026-05-20', amount: 45000, status: 'Fulfilled' },
      { orderId: '#SH-90393', date: '2026-05-18', amount: 100000, status: 'Fulfilled' },
      { orderId: '#SH-90392', date: '2026-05-15', amount: 55000, status: 'Pending' },
      { orderId: '#SH-90391', date: '2026-05-12', amount: 45000, status: 'Fulfilled' },
      { orderId: '#SH-90390', date: '2026-05-10', amount: 100000, status: 'Fulfilled' },
      { orderId: '#SH-90389', date: '2026-05-08', amount: 55000, status: 'Fulfilled' },
      { orderId: '#SH-90388', date: '2026-05-05', amount: 45000, status: 'Fulfilled' }
    ],
    products: [
      { name: 'Support Package', variant: '24/7 Priority SLA', qty: 1, price: 45000 },
      { name: 'Enterprise Edge Gateway', variant: '10Gbps SFP+ Ports', qty: 1, price: 55000 }
    ],
    complaints: [
      { id: 'CP-4081', subject: 'Damaged router port replacement', status: 'In Progress' },
      { id: 'CP-4082', subject: 'SFP+ transceiver missing from packaging', status: 'Open' }
    ],
    refunds: [
      { id: 'RF-9002', date: getDateDaysAgo(40, '12:00').split('T')[0], amount: 5000, status: 'Approved' },
      { id: 'RF-9003', date: getDateDaysAgo(1, '15:30').split('T')[0], amount: 3000, status: 'Pending' }
    ],
    discounts: [
      { code: 'VIP15', description: 'Storewide 15% discount code applied', status: 'Active' },
      { code: 'WELCOME10', description: 'First-order 10% off coupon', status: 'Expired' }
    ],
    storeInfo: {
      joinedDate: '2024-01-15',
      notes: 'Extremely loyal client. Uses multiple service channels. Always assign to head engineers.',
      lifecycleStage: 'Active VIP'
    }
  },
  {
    id: 'CUST-8822',
    name: 'David Miller',
    email: 'david.miller@example.com',
    phone: '+91 91111 22222',
    country: 'United Kingdom',
    location: 'London',
    lastLogin: '2026-07-08 09:15',
    totalOrders: 15,
    totalSpend: 195000,
    lastOrderDate: getDateDaysAgo(8, '10:00').split('T')[0],
    leadNo: 'LD-1026',
    leadStatus: 'Completed',
    segment: 'VIP',
    orders: [
      { orderId: '#SH-89801', date: getDateDaysAgo(8, '10:00').split('T')[0], amount: 95000, status: 'Fulfilled' },
      { orderId: '#SH-87110', date: getDateDaysAgo(60, '12:00').split('T')[0], amount: 100000, status: 'Fulfilled' }
    ],
    products: [
      { name: 'Pro Smart Router', variant: 'Enterprise Bundle', qty: 1, price: 95000 },
      { name: 'Developer Toolkits', variant: '5 Licenses', qty: 5, price: 20000 }
    ],
    complaints: [
      { id: 'CP-4083', subject: 'Invalid key warning', status: 'Resolved' }
    ],
    refunds: [],
    discounts: [
      { code: 'LOYALTY20', description: 'Customer Loyalty Reward Coupon', status: 'Active' }
    ],
    storeInfo: {
      joinedDate: '2024-04-10',
      notes: 'Merchant partner. Interested in joint beta testing opportunities.',
      lifecycleStage: 'Active VIP'
    }
  },
  {
    id: 'CUST-8823',
    name: 'Anish Grover',
    email: 'anish.g@example.com',
    phone: '+91 88888 77777',
    country: 'India',
    location: 'New Delhi',
    lastLogin: '2026-07-07 18:45',
    totalOrders: 1,
    totalSpend: 15000,
    lastOrderDate: getDateDaysAgo(12, '16:00').split('T')[0],
    leadNo: 'None',
    leadStatus: 'New',
    segment: 'New',
    orders: [
      { orderId: '#SH-88710', date: getDateDaysAgo(12, '16:00').split('T')[0], amount: 15000, status: 'Fulfilled' }
    ],
    products: [
      { name: 'Basic Networking Hub', variant: '8-Port', qty: 1, price: 15000 }
    ],
    complaints: [],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2026-06-15',
      notes: 'New signup from social campaigns.',
      lifecycleStage: 'Onboarding'
    }
  },
  {
    id: 'CUST-8824',
    name: 'Vikram Seth',
    email: 'vikram.seth@example.com',
    phone: '+91 77777 66666',
    country: 'Canada',
    location: 'Toronto',
    lastLogin: '2026-07-05 11:30',
    totalOrders: 4,
    totalSpend: 62000,
    lastOrderDate: getDateDaysAgo(180, '11:00').split('T')[0],
    leadNo: 'None',
    leadStatus: 'In-complete',
    segment: 'Inactive',
    orders: [
      { orderId: '#SH-71100', date: getDateDaysAgo(180, '11:00').split('T')[0], amount: 62000, status: 'Fulfilled' }
    ],
    products: [
      { name: 'Advanced NAS Storage', variant: '4TB RAID', qty: 1, price: 62000 }
    ],
    complaints: [],
    refunds: [],
    discounts: [
      { code: 'WINBACK50', description: 'Re-engagement 50% discount coupon', status: 'Active' }
    ],
    storeInfo: {
      joinedDate: '2025-05-20',
      notes: 'At risk customer. Silent for over 6 months.',
      lifecycleStage: 'At Risk'
    }
  },
  {
    id: 'CUST-8825',
    name: 'Arnav Sen',
    email: 'arnav.sen@example.com',
    phone: '+91 99887 76655',
    country: 'India',
    location: 'Mumbai',
    lastLogin: '2026-07-09 10:15',
    totalOrders: 3,
    totalSpend: 78998,
    lastOrderDate: getDateDaysAgo(2).split('T')[0],
    leadNo: 'LD-1028',
    leadStatus: 'New',
    segment: 'VIP',
    orders: [
      { orderId: '#EL-10201', date: getDateDaysAgo(2).split('T')[0], amount: 45000, status: 'Fulfilled', deliveryStatus: 'In Transit' },
      { orderId: '#EL-10202', date: getDateDaysAgo(12).split('T')[0], amount: 18999, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10203', date: getDateDaysAgo(25).split('T')[0], amount: 14999, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Noise-Cancelling Bluetooth Headphones', variant: 'Carbon Black', qty: 1, price: 18999 },
      { name: '4K Ultra HD LED Projector', variant: 'Home Edition', qty: 1, price: 45000 },
      { name: 'Wi-Fi 6 Mesh Router System', variant: 'Tri-Band Pro', qty: 1, price: 14999 }
    ],
    complaints: [],
    refunds: [],
    discounts: [
      { code: 'ELEC10', description: 'Exclusive electronics store discount code applied', status: 'Active' }
    ],
    storeInfo: {
      joinedDate: '2026-04-12',
      notes: 'Premium tech enthusiast. Prefers priority delivery. Subscribed to newsletters.',
      lifecycleStage: 'Active VIP'
    }
  },
  {
    id: 'CUST-8826',
    name: 'Olivia Bennett',
    email: 'olivia.bennett@example.com',
    phone: '+1 512 555 0192',
    country: 'United States',
    location: 'Austin',
    lastLogin: '2026-07-08 16:30',
    totalOrders: 3,
    totalSpend: 31498,
    lastOrderDate: getDateDaysAgo(4).split('T')[0],
    leadNo: 'None',
    leadStatus: 'New',
    segment: 'VIP',
    orders: [
      { orderId: '#EL-10204', date: getDateDaysAgo(4).split('T')[0], amount: 12999, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10205', date: getDateDaysAgo(15).split('T')[0], amount: 8500, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10206', date: getDateDaysAgo(28).split('T')[0], amount: 9999, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Smart Home Hub Pro', variant: 'All-in-One Gateway', qty: 1, price: 12999 },
      { name: 'Mechanical Gaming Keyboard RGB', variant: 'Cherry MX Brown', qty: 1, price: 8500 },
      { name: 'Portable SSD 1TB USB 3.2', variant: 'Ultra Speed Red', qty: 1, price: 9999 }
    ],
    complaints: [],
    refunds: [
      { id: 'RF-9004', date: getDateDaysAgo(15).split('T')[0], amount: 1500, status: 'Approved' }
    ],
    discounts: [],
    storeInfo: {
      joinedDate: '2025-11-20',
      notes: 'Smart home integrator client. Regularly purchases gadgets.',
      lifecycleStage: 'Active VIP'
    }
  },
  {
    id: 'CUST-8827',
    name: 'Li Wei',
    email: 'li.wei@example.com',
    phone: '+1 604 555 7812',
    country: 'Canada',
    location: 'Vancouver',
    lastLogin: '2026-07-06 11:20',
    totalOrders: 2,
    totalSpend: 7699,
    lastOrderDate: getDateDaysAgo(5).split('T')[0],
    leadNo: 'None',
    leadStatus: 'Completed',
    segment: 'Regular',
    orders: [
      { orderId: '#EL-10207', date: getDateDaysAgo(5).split('T')[0], amount: 4200, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10208', date: getDateDaysAgo(18).split('T')[0], amount: 3499, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Ergonomic Wireless Mouse', variant: 'Silent Click Edition', qty: 1, price: 4200 },
      { name: 'MagSafe Power Bank 10000mAh', variant: 'Space Gray', qty: 1, price: 3499 }
    ],
    complaints: [
      { id: 'CP-4086', subject: 'Ergonomic wireless mouse scroll wheel loose', status: 'In Progress' }
    ],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2026-02-14',
      notes: 'Office peripherals customer.',
      lifecycleStage: 'Stable Regular'
    }
  },
  {
    id: 'CUST-8828',
    name: 'Sophia Martinez',
    email: 'sophia.m@example.com',
    phone: '+1 415 555 1234',
    country: 'United States',
    location: 'San Francisco',
    lastLogin: '2026-07-07 14:45',
    totalOrders: 2,
    totalSpend: 21498,
    lastOrderDate: getDateDaysAgo(3).split('T')[0],
    leadNo: 'LD-1029',
    leadStatus: 'Follow-up',
    segment: 'New',
    orders: [
      { orderId: '#EL-10209', date: getDateDaysAgo(3).split('T')[0], amount: 18999, status: 'Pending', deliveryStatus: 'Processing' },
      { orderId: '#EL-10210', date: getDateDaysAgo(10).split('T')[0], amount: 2499, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Noise-Cancelling Bluetooth Headphones', variant: 'Midnight Blue', qty: 1, price: 18999 },
      { name: 'Dual-Port USB-C GaN Charger 65W', variant: 'White Matte', qty: 1, price: 2499 }
    ],
    complaints: [],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2026-06-30',
      notes: 'Signed up from Instagram advertisement. Purchased headset first.',
      lifecycleStage: 'Fresh Onboarding'
    }
  },
  {
    id: 'CUST-8829',
    name: 'Kabir Malhotra',
    email: 'kabir.malhotra@example.com',
    phone: '+91 80555 61728',
    country: 'India',
    location: 'Bangalore',
    lastLogin: '2026-07-09 20:50',
    totalOrders: 3,
    totalSpend: 68499,
    lastOrderDate: getDateDaysAgo(1).split('T')[0],
    leadNo: 'None',
    leadStatus: 'New',
    segment: 'VIP',
    orders: [
      { orderId: '#EL-10211', date: getDateDaysAgo(1).split('T')[0], amount: 45000, status: 'Fulfilled', deliveryStatus: 'Processing' },
      { orderId: '#EL-10212', date: getDateDaysAgo(11).split('T')[0], amount: 14999, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10213', date: getDateDaysAgo(22).split('T')[0], amount: 8500, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: '4K Ultra HD LED Projector', variant: 'Premium Theater', qty: 1, price: 45000 },
      { name: 'Wi-Fi 6 Mesh Router System', variant: 'Tri-Band Pro', qty: 1, price: 14999 },
      { name: 'Mechanical Gaming Keyboard RGB', variant: 'Linear Yellow Switch', qty: 1, price: 8500 }
    ],
    complaints: [],
    refunds: [],
    discounts: [
      { code: 'VIP20', description: 'VIP Premium member discounts', status: 'Active' }
    ],
    storeInfo: {
      joinedDate: '2025-08-10',
      notes: 'Developer and home automation enthusiast. High value orders.',
      lifecycleStage: 'Active VIP'
    }
  },
  {
    id: 'CUST-8830',
    name: 'Amara Okafor',
    email: 'amara.o@example.co.uk',
    phone: '+44 7911 123456',
    country: 'United Kingdom',
    location: 'London',
    lastLogin: '2026-07-04 18:22',
    totalOrders: 2,
    totalSpend: 17998,
    lastOrderDate: getDateDaysAgo(8).split('T')[0],
    leadNo: 'None',
    leadStatus: 'Completed',
    segment: 'Regular',
    orders: [
      { orderId: '#EL-10214', date: getDateDaysAgo(8).split('T')[0], amount: 11499, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10215', date: getDateDaysAgo(20).split('T')[0], amount: 6499, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Smart Thermostat with Alexa Support', variant: 'Home Pro v2', qty: 1, price: 11499 },
      { name: 'True Wireless Earbuds ANC', variant: 'Polar White', qty: 1, price: 6499 }
    ],
    complaints: [],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2026-01-08',
      notes: 'Regular retail shopper looking for energy-efficient products.',
      lifecycleStage: 'Loyal Regular'
    }
  },
  {
    id: 'CUST-8831',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@example.jp',
    phone: '+81 90 1234 5678',
    country: 'Japan',
    location: 'Tokyo',
    lastLogin: '2026-06-11 09:00',
    totalOrders: 1,
    totalSpend: 5999,
    lastOrderDate: getDateDaysAgo(29).split('T')[0],
    leadNo: 'None',
    leadStatus: 'In-complete',
    segment: 'Inactive',
    orders: [
      { orderId: '#EL-10216', date: getDateDaysAgo(29).split('T')[0], amount: 5999, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: '4K Web Camera with Dual Microphone', variant: 'Auto-Focus Pro', qty: 1, price: 5999 }
    ],
    complaints: [],
    refunds: [],
    discounts: [
      { code: 'COMEBACK15', description: 'Re-engagement offer 15% discount', status: 'Active' }
    ],
    storeInfo: {
      joinedDate: '2025-06-05',
      notes: 'Purchased webcam for work-from-home, silent since.',
      lifecycleStage: 'At Risk'
    }
  },
  {
    id: 'CUST-8832',
    name: 'Hans Mueller',
    email: 'hans.m@example.de',
    phone: '+49 89 5551234',
    country: 'Germany',
    location: 'Munich',
    lastLogin: '2026-07-09 11:30',
    totalOrders: 3,
    totalSpend: 46997,
    lastOrderDate: getDateDaysAgo(6).split('T')[0],
    leadNo: 'None',
    leadStatus: 'Completed',
    segment: 'VIP',
    orders: [
      { orderId: '#EL-10217', date: getDateDaysAgo(6).split('T')[0], amount: 12999, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10218', date: getDateDaysAgo(14).split('T')[0], amount: 18999, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10219', date: getDateDaysAgo(26).split('T')[0], amount: 14999, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Smart Home Hub Pro', variant: 'All-in-One Gateway', qty: 1, price: 12999 },
      { name: 'Noise-Cancelling Bluetooth Headphones', variant: 'Carbon Black', qty: 1, price: 18999 },
      { name: 'Wi-Fi 6 Mesh Router System', variant: 'Tri-Band Pro', qty: 1, price: 14999 }
    ],
    complaints: [
      { id: 'CP-4085', subject: 'Smart Home Hub Wi-Fi connectivity loop', status: 'Resolved' }
    ],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2024-09-18',
      notes: 'Frequently buys new tech releases. Responds well to loyalty mailers.',
      lifecycleStage: 'Active VIP'
    }
  },
  {
    id: 'CUST-8833',
    name: 'Riya Sen',
    email: 'riya.sen@example.com',
    phone: '+91 93333 44444',
    country: 'India',
    location: 'Kolkata',
    lastLogin: '2026-07-08 10:15',
    totalOrders: 1,
    totalSpend: 1599,
    lastOrderDate: getDateDaysAgo(2).split('T')[0],
    leadNo: 'None',
    leadStatus: 'New',
    segment: 'New',
    orders: [
      { orderId: '#EL-10220', date: getDateDaysAgo(2).split('T')[0], amount: 1599, status: 'Fulfilled', deliveryStatus: 'In Transit' }
    ],
    products: [
      { name: 'Smart LED RGB Light Strip 5m', variant: 'App Controlled', qty: 1, price: 1599 }
    ],
    complaints: [],
    refunds: [],
    discounts: [
      { code: 'FIRSTNEW', description: 'New registration welcome voucher code', status: 'Active' }
    ],
    storeInfo: {
      joinedDate: '2026-07-05',
      notes: 'New account. Purchased lights for decoration.',
      lifecycleStage: 'Onboarding'
    }
  },
  {
    id: 'CUST-8834',
    name: 'Lucas Silva',
    email: 'lucas.silva@example.com.br',
    phone: '+55 11 98765 4321',
    country: 'Brazil',
    location: 'Sao Paulo',
    lastLogin: '2026-07-05 13:40',
    totalOrders: 2,
    totalSpend: 12498,
    lastOrderDate: getDateDaysAgo(7).split('T')[0],
    leadNo: 'None',
    leadStatus: 'Completed',
    segment: 'Regular',
    orders: [
      { orderId: '#EL-10221', date: getDateDaysAgo(7).split('T')[0], amount: 9999, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10222', date: getDateDaysAgo(21).split('T')[0], amount: 2499, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Portable SSD 1TB USB 3.2', variant: 'Space Gray Pro', qty: 1, price: 9999 },
      { name: 'Dual-Port USB-C GaN Charger 65W', variant: 'Black Matte', qty: 1, price: 2499 }
    ],
    complaints: [],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2025-10-14',
      notes: 'Developer purchasing portable storage accessories.',
      lifecycleStage: 'Stable Regular'
    }
  },
  {
    id: 'CUST-8835',
    name: 'Zara El Amin',
    email: 'zara.elamin@example.ae',
    phone: '+971 50 555 1290',
    country: 'United Arab Emirates',
    location: 'Dubai',
    lastLogin: '2026-07-09 17:15',
    totalOrders: 3,
    totalSpend: 62998,
    lastOrderDate: getDateDaysAgo(3).split('T')[0],
    leadNo: 'None',
    leadStatus: 'New',
    segment: 'VIP',
    orders: [
      { orderId: '#EL-10223', date: getDateDaysAgo(3).split('T')[0], amount: 45000, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10224', date: getDateDaysAgo(13).split('T')[0], amount: 11499, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10225', date: getDateDaysAgo(27).split('T')[0], amount: 6499, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: '4K Ultra HD LED Projector', variant: 'Premium Theater', qty: 1, price: 45000 },
      { name: 'Smart Thermostat with Alexa Support', variant: 'Home Pro v2', qty: 1, price: 11499 },
      { name: 'True Wireless Earbuds ANC', variant: 'Polar White', qty: 1, price: 6499 }
    ],
    complaints: [],
    refunds: [],
    discounts: [
      { code: 'DUBAIVIP', description: 'Dubai High Net Worth Account Code', status: 'Active' }
    ],
    storeInfo: {
      joinedDate: '2025-05-11',
      notes: 'VIP customer from UAE district. Interested in luxury custom integrations.',
      lifecycleStage: 'Active VIP'
    }
  },
  {
    id: 'CUST-8836',
    name: 'Chloe Dupont',
    email: 'chloe.dupont@example.fr',
    phone: '+33 6 5555 0124',
    country: 'France',
    location: 'Paris',
    lastLogin: '2026-07-03 15:45',
    totalOrders: 2,
    totalSpend: 9699,
    lastOrderDate: getDateDaysAgo(9).split('T')[0],
    leadNo: 'None',
    leadStatus: 'Completed',
    segment: 'Regular',
    orders: [
      { orderId: '#EL-10226', date: getDateDaysAgo(9).split('T')[0], amount: 8500, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10227', date: getDateDaysAgo(23).split('T')[0], amount: 1199, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Mechanical Gaming Keyboard RGB', variant: 'Cherry MX Blue', qty: 1, price: 8500 },
      { name: 'Smart Wi-Fi Plug with Energy Monitor', variant: 'Single Pack v3', qty: 1, price: 1199 }
    ],
    complaints: [],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2025-12-01',
      notes: 'Regular gamer client.',
      lifecycleStage: 'Stable Regular'
    }
  },
  {
    id: 'CUST-8837',
    name: 'Mateo Rossi',
    email: 'mateo.rossi@example.it',
    phone: '+39 02 555 4567',
    country: 'Italy',
    location: 'Milan',
    lastLogin: '2026-07-06 14:12',
    totalOrders: 1,
    totalSpend: 5999,
    lastOrderDate: getDateDaysAgo(4).split('T')[0],
    leadNo: 'None',
    leadStatus: 'New',
    segment: 'New',
    orders: [
      { orderId: '#EL-10228', date: getDateDaysAgo(4).split('T')[0], amount: 5999, status: 'Fulfilled', deliveryStatus: 'In Transit' }
    ],
    products: [
      { name: '4K Web Camera with Dual Microphone', variant: 'Auto-Focus Pro', qty: 1, price: 5999 }
    ],
    complaints: [],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2026-07-02',
      notes: 'New sign up. Purchases for remote office layout.',
      lifecycleStage: 'Onboarding'
    }
  },
  {
    id: 'CUST-8838',
    name: 'Aisha Rahman',
    email: 'aisha.rahman@example.com',
    phone: '+880 2 555 9811',
    country: 'Bangladesh',
    location: 'Dhaka',
    lastLogin: '2026-07-07 19:10',
    totalOrders: 3,
    totalSpend: 37997,
    lastOrderDate: getDateDaysAgo(5).split('T')[0],
    leadNo: 'None',
    leadStatus: 'New',
    segment: 'VIP',
    orders: [
      { orderId: '#EL-10229', date: getDateDaysAgo(5).split('T')[0], amount: 12999, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10230', date: getDateDaysAgo(16).split('T')[0], amount: 14999, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10231', date: getDateDaysAgo(24).split('T')[0], amount: 9999, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Smart Home Hub Pro', variant: 'All-in-One Gateway', qty: 1, price: 12999 },
      { name: 'Wi-Fi 6 Mesh Router System', variant: 'Tri-Band Pro', qty: 1, price: 14999 },
      { name: 'Portable SSD 1TB USB 3.2', variant: 'Ultra Speed Red', qty: 1, price: 9999 }
    ],
    complaints: [],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2025-07-15',
      notes: 'Enterprise consultant. Appreciates high reliability networking kit.',
      lifecycleStage: 'Active VIP'
    }
  },
  {
    id: 'CUST-8839',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+61 2 5555 8822',
    country: 'Australia',
    location: 'Sydney',
    lastLogin: '2026-07-01 10:45',
    totalOrders: 2,
    totalSpend: 7699,
    lastOrderDate: getDateDaysAgo(10).split('T')[0],
    leadNo: 'None',
    leadStatus: 'Completed',
    segment: 'Regular',
    orders: [
      { orderId: '#EL-10232', date: getDateDaysAgo(10).split('T')[0], amount: 4200, status: 'Fulfilled', deliveryStatus: 'Delivered' },
      { orderId: '#EL-10233', date: getDateDaysAgo(25).split('T')[0], amount: 3499, status: 'Fulfilled', deliveryStatus: 'Delivered' }
    ],
    products: [
      { name: 'Ergonomic Wireless Mouse', variant: 'Silent Click Edition', qty: 1, price: 4200 },
      { name: 'MagSafe Power Bank 10000mAh', variant: 'Space Gray', qty: 1, price: 3499 }
    ],
    complaints: [],
    refunds: [],
    discounts: [],
    storeInfo: {
      joinedDate: '2025-02-10',
      notes: 'Regular tech buyer. Prefers buying during store-wide clearance events.',
      lifecycleStage: 'Stable Regular'
    }
  }
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'TMP-001',
    name: 'VIP Customer Thank You',
    title: 'Thank you for being our valued VIP Merchant!',
    body: `Dear {{customer_name}},\n\nWe want to express our deepest gratitude for your continued partnership. As one of our top VIP customers, your satisfaction is our absolute priority.\n\nHere's an exclusive 20% discount coupon code: **VIPPRO20** for your next order.\n\nBest Regards,\nTech Support Team`,
    channelType: 'Email'
  },
  {
    id: 'TMP-002',
    name: 'Abandoned Checkout Recovery',
    title: 'Complete your purchase and enjoy 10% off!',
    body: `Hi {{customer_name}},\n\nWe noticed you left some great items in your cart. To help you get started, we're offering an instant 10% discount on your checkout.\n\nUse Code: **WELCOME10** at the checkout screen.\n\nShould you have any questions, simply reply to this email!\n\nBest,\nMerchant Relations`,
    channelType: 'Email'
  },
  {
    id: 'TMP-003',
    name: 'Service Follow-up',
    title: 'Regarding your recent support ticket',
    body: `Hello {{customer_name}},\n\nOur engineering team has marked your recent issue as resolved. We want to check in and verify if everything is working perfectly on your end.\n\nIf you still need assistance, feel free to reply directly here.\n\nWarm regards,\nClient Services`,
    channelType: 'Email'
  },
  {
    id: 'TMP-ACB-01',
    name: 'You left something behind',
    title: 'You left something behind',
    body: `Hi {{customer_name}},\n\nWe noticed you left some great items in your cart. Complete your order now before they sell out!\n\nBest,\nSupport Team`,
    channelType: 'WhatsApp'
  },
  {
    id: 'TMP-ACB-02',
    name: 'Your cart is waiting',
    title: 'Your cart is waiting',
    body: `Hi {{customer_name}},\n\nYour cart is waiting for you. We've saved your items so you can pick up right where you left off.\n\nBest,\nSupport Team`,
    channelType: 'WhatsApp'
  },
  {
    id: 'TMP-ACB-03',
    name: 'Complete your order today',
    title: 'Complete your order today',
    body: `Hi {{customer_name}},\n\nComplete your order today. If you need any help with your checkout, our customer success team is here to assist you.\n\nBest,\nSupport Team`,
    channelType: 'Notification'
  },
  {
    id: 'TMP-ACB-04',
    name: 'Limited stock available',
    title: 'Limited stock available',
    body: `Hi {{customer_name}},\n\nSome of the items in your cart are in high demand and running low on stock. Grab them now before they are gone!\n\nBest,\nSupport Team`,
    channelType: 'Notification'
  },
  {
    id: 'TMP-ACB-05',
    name: 'Still interested?',
    title: 'Still interested?',
    body: `Hi {{customer_name}},\n\nAre you still interested in completing your purchase? Here is a special 10% discount to make it even easier.\n\nUse code: **STILL10**\n\nBest,\nSupport Team`,
    channelType: 'Email'
  },
  {
    id: 'TMP-ACB-06',
    name: 'Don\'t miss your items',
    title: 'Don\'t miss your items',
    body: `Hi {{customer_name}},\n\nDon't miss your items! They are still waiting in your cart, but we can't hold them forever.\n\nBest,\nSupport Team`,
    channelType: 'Email'
  },
  {
    id: 'TMP-ACB-07',
    name: 'Final reminder before your cart expires',
    title: 'Final reminder before your cart expires',
    body: `Hi {{customer_name}},\n\nThis is our final reminder before your cart expires. Complete your purchase now or use coupon **FINAL15** for 15% off.\n\nBest,\nSupport Team`,
    channelType: 'Email'
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'CMP-501',
    name: 'Monsoon Mega Sale Promo',
    type: 'Email',
    status: 'Sent',
    audience: 'All Customers',
    sentCount: 2300,
    deliverySettings: { sendType: 'Now' },
    templateId: 'TMP-002'
  },
  {
    id: 'CMP-502',
    name: 'VIP Executive Early Access',
    type: 'Email',
    status: 'Scheduled',
    audience: 'VIP Customers',
    sentCount: 82,
    deliverySettings: { sendType: 'Schedule', scheduleDate: '2026-07-15', scheduleTime: '09:00' },
    templateId: 'TMP-001'
  },
  {
    id: 'CMP-503',
    name: 'WhatsApp Support Channel Launch',
    type: 'WhatsApp',
    status: 'Draft',
    audience: 'At Risk Customers',
    sentCount: 0,
    deliverySettings: { sendType: 'Now' }
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    timestamp: getDateDaysAgo(0, '08:30'),
    user: { name: 'Emma Watson', avatar: 'EW' },
    module: 'Leads',
    action: 'Status Updated',
    recordId: 'LD-1025',
    recordName: 'Priya Patel',
    userType: 'Staff',
    ipAddress: '192.168.1.12',
    changeInfo: { fieldName: 'Status', oldValue: 'New', newValue: 'Follow-up' }
  },
  {
    id: 'LOG-002',
    timestamp: getDateDaysAgo(0, '09:15'),
    user: { name: 'David Miller', avatar: 'DM' },
    module: 'Complaints',
    action: 'Created Ticket',
    recordId: 'CP-4081',
    recordName: 'Amit Verma',
    userType: 'Staff',
    ipAddress: '192.168.1.15'
  },
  {
    id: 'LOG-003',
    timestamp: getDateDaysAgo(1, '11:45'),
    user: { name: 'System Agent', avatar: 'SY' },
    module: 'Customers',
    action: 'Customer Segment Change',
    recordId: 'CUST-8821',
    recordName: 'Emma Watson',
    userType: 'System',
    ipAddress: '127.0.0.1',
    changeInfo: { fieldName: 'Segment', oldValue: 'Regular', newValue: 'VIP' }
  },
  {
    id: 'LOG-004',
    timestamp: getDateDaysAgo(2, '14:00'),
    user: { name: 'Emma Watson', avatar: 'EW' },
    module: 'Settings',
    action: 'SMTP Configuration Saved',
    recordId: 'SMTP',
    recordName: 'Email Settings',
    userType: 'Staff',
    ipAddress: '192.168.1.12'
  }
];

export const INITIAL_SETTINGS: SettingsState = {
  activityLog: {
    enabled: true,
    modulesToTrack: {
      leads: true,
      complaints: true,
      customers: true,
      campaigns: true,
      settings: true
    },
    retention: 'Forever',
    allowExport: true
  },
  campaign: {
    defaultChannel: 'Email',
    smtpHost: 'smtp.shopify-crm.io',
    smtpPort: '587',
    username: 'merchant_sales@gmail.com',
    senderEmail: 'sales@merchant-store.com',
    senderName: 'Apex Merchant Sales'
  },
  notifications: {
    leads: {
      created: true,
      assigned: true,
      reminder: true,
      goingCold: false
    },
    complaints: {
      created: true,
      assigned: true,
      statusChanged: true,
      dueSoon: true,
      overdueReminder: true
    },
    campaigns: {
      completed: true,
      failed: true
    },
    customers: {
      vipNotification: true,
      atRiskNotification: true
    }
  },
  theme: {
    accentColor: '#475569',
    backgroundMode: 'off-white',
    fontFamily: 'Inter',
    fontSize: 'Default'
  }
};
