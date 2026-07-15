import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Ticket, AlertTriangle, CheckCircle, Clock, 
  Trash2, Edit, ChevronRight, X, ExternalLink, Image, FileText, 
  Upload, Download, AlertCircle, ArrowLeft, RefreshCw, Eye, Plus,
  ShoppingBag, CreditCard, Gift, User, HelpCircle, DollarSign
} from 'lucide-react';
import { Complaint, ComplaintStatus, Priority, SLAStatus, ComplaintDocument, Customer } from '../types';
import { formatCurrencyAmount } from '../utils/currency';

interface ComplaintManagementViewProps {
  complaints: Complaint[];
  customers?: Customer[];
  onAddComplaint: (complaint: Complaint) => void;
  onUpdateComplaint: (complaint: Complaint) => void;
  onDeleteComplaint: (complaintId: string) => void;
  onNavigateToCustomer: (customerName: string) => void;
  initialOpenForm: boolean;
  onCloseForm: () => void;
}

export default function ComplaintManagementView({
  complaints,
  customers = [],
  onAddComplaint,
  onUpdateComplaint,
  onDeleteComplaint,
  onNavigateToCustomer,
  initialOpenForm,
  onCloseForm
}: ComplaintManagementViewProps) {
  // Navigation & UI Layouts
  const [selectedComplaintForDetail, setSelectedComplaintForDetail] = useState<Complaint | null>(null);
  const [showCustomerDetailsAtBottom, setShowCustomerDetailsAtBottom] = useState(false);

  const linkedCustomer = useMemo(() => {
    if (!selectedComplaintForDetail || !customers) return null;
    return customers.find(
      c => c.name.toLowerCase() === selectedComplaintForDetail.customerName.toLowerCase()
    ) || customers.find(
      c => c.name.toLowerCase().includes(selectedComplaintForDetail.customerName.toLowerCase())
    ) || null;
  }, [selectedComplaintForDetail, customers]);

  const handleOpenCustomerSummaryClick = () => {
    setShowCustomerDetailsAtBottom(prev => !prev);
    if (!showCustomerDetailsAtBottom) {
      setTimeout(() => {
        const element = document.getElementById('customer-summary-bottom-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [slaFilter, setSlaFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Slide-over state
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(initialOpenForm);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);

  // Form Fields State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware Defect');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [complaintDate, setComplaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedTo, setAssignedTo] = useState('Emma Watson');
  const [status, setStatus] = useState<ComplaintStatus>('Open');
  const [slaStatus, setSlaStatus] = useState<SLAStatus>('Pending');
  const [slaDueDate, setSlaDueDate] = useState('');

  // Simulating document upload states
  const [uploadedProductImg, setUploadedProductImg] = useState<ComplaintDocument | null>(null);
  const [uploadedInvoice, setUploadedInvoice] = useState<ComplaintDocument | null>(null);
  const [uploadedOther, setUploadedOther] = useState<ComplaintDocument | null>(null);

  // Form validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Similar complaint bypass flag
  const [ignoreWarning, setIgnoreWarning] = useState(false);

  // Option dropdown choices
  const categoryList = ['Hardware Defect', 'Billing Issue', 'Software Key', 'Logistics', 'Account Access'];
  const staffList = ['Emma Watson', 'David Miller', 'Rahul Dev', 'System Agent'];

  // Check if there is already another complaint for this exact Order ID
  const similarComplaintExists = useMemo(() => {
    if (!orderId.trim()) return null;
    // Find matching order in other complaints (exclude currently editing one)
    return complaints.find(
      c => c.orderId.toLowerCase() === orderId.trim().toLowerCase() && 
      (!editingComplaint || c.id !== editingComplaint.id)
    );
  }, [orderId, complaints, editingComplaint]);

  // SLA due-date helper (automatically set 2 days from the selected complaint date)
  React.useEffect(() => {
    if (complaintDate) {
      const date = new Date(complaintDate);
      date.setDate(date.getDate() + 2);
      setSlaDueDate(date.toISOString().split('T')[0]);
    }
  }, [complaintDate]);

  const handleNewClick = () => {
    setEditingComplaint(null);
    setCustomerName('');
    setCustomerEmail('');
    setOrderId('');
    setDescription('');
    setCategory('Hardware Defect');
    setPriority('Medium');
    setComplaintDate(new Date().toISOString().split('T')[0]);
    setAssignedTo('Emma Watson');
    setStatus('Open');
    setSlaStatus('Pending');
    setUploadedProductImg(null);
    setUploadedInvoice(null);
    setUploadedOther(null);
    setErrors({});
    setIgnoreWarning(false);
    setIsSlideOverOpen(true);
  };

  const handleEditClick = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setCustomerName(complaint.customerName);
    setCustomerEmail(complaint.customerEmail || '');
    setOrderId(complaint.orderId);
    setDescription(complaint.description);
    setCategory(complaint.category);
    setPriority(complaint.priority);
    setComplaintDate(complaint.complaintDate);
    setAssignedTo(complaint.assignedTo);
    setStatus(complaint.status);
    setSlaStatus(complaint.slaStatus);
    setSlaDueDate(complaint.slaDueDate);
    
    // Distribute existing documents or reset
    setUploadedProductImg(complaint.documents.find(d => d.name.includes('port') || d.name.includes('img') || d.name.includes('broken')) || null);
    setUploadedInvoice(complaint.documents.find(d => d.name.includes('invoice') || d.name.includes('bill')) || null);
    const otherDocs = complaint.documents.filter(d => !d.name.includes('port') && !d.name.includes('invoice') && !d.name.includes('bill') && !d.name.includes('broken'));
    setUploadedOther(otherDocs.length > 0 ? otherDocs[0] : null);

    setErrors({});
    setIgnoreWarning(false);
    setIsSlideOverOpen(true);
  };

  // Simulated drag-drop/input handlers
  const simulateUpload = (zoneType: 'img' | 'invoice' | 'other', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mockDoc: ComplaintDocument = {
      id: 'doc_' + Date.now(),
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      url: '#'
    };

    if (zoneType === 'img') setUploadedProductImg(mockDoc);
    if (zoneType === 'invoice') setUploadedInvoice(mockDoc);
    if (zoneType === 'other') setUploadedOther(mockDoc);
  };

  // Submit form handler
  const handleSaveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!customerEmail.trim()) {
      newErrors.customerEmail = 'Customer email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      newErrors.customerEmail = 'Please provide a valid email address';
    }
    if (!orderId.trim()) newErrors.orderId = 'Shopify Order ID is required';
    if (!description.trim()) newErrors.description = 'Complaint description is required';

    // Similar complaint check warning blocking
    if (similarComplaintExists && !ignoreWarning) {
      newErrors.similarity = 'Similar complaint found. Review warning banner before saving.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Assemble all non-null uploaded documents
    const docArray: ComplaintDocument[] = [];
    if (uploadedProductImg) docArray.push(uploadedProductImg);
    if (uploadedInvoice) docArray.push(uploadedInvoice);
    if (uploadedOther) docArray.push(uploadedOther);

    // Auto calculate SLA Status on save
    let calculatedSLA: SLAStatus = 'Pending';
    if (status === 'Resolved' || status === 'Closed') {
      calculatedSLA = 'Completed';
    } else {
      const today = new Date();
      const due = new Date(slaDueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        calculatedSLA = 'Overdue';
      } else if (diffDays <= 1) {
        calculatedSLA = 'Due Soon';
      }
    }

    if (editingComplaint) {
      const updated: Complaint = {
        ...editingComplaint,
        customerName,
        customerEmail,
        orderId,
        description,
        category,
        priority,
        complaintDate,
        assignedTo,
        slaDueDate,
        slaStatus: calculatedSLA,
        status,
        documents: docArray
      };
      onUpdateComplaint(updated);
      if (selectedComplaintForDetail?.id === updated.id) {
        setSelectedComplaintForDetail(updated);
      }
    } else {
      const nextId = 'CP-' + (4000 + complaints.length + 85);
      const created: Complaint = {
        id: nextId,
        customerName,
        customerEmail,
        orderId,
        description,
        category,
        priority,
        complaintDate,
        assignedTo,
        slaDueDate,
        slaStatus: calculatedSLA,
        status,
        documents: docArray
      };
      onAddComplaint(created);
    }

    setIsSlideOverOpen(false);
    onCloseForm();
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete complaint ${id}?`)) {
      onDeleteComplaint(id);
      if (selectedComplaintForDetail?.id === id) {
        setSelectedComplaintForDetail(null);
      }
    }
  };

  // Filter complaints based on choices
  const filteredComplaints = useMemo(() => {
    return complaints.filter(comp => {
      if (priorityFilter !== 'All' && comp.priority !== priorityFilter) return false;
      if (statusFilter !== 'All' && comp.status !== statusFilter) return false;
      if (slaFilter !== 'All' && comp.slaStatus !== slaFilter) return false;
      if (assigneeFilter !== 'All' && comp.assignedTo !== assigneeFilter) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          comp.id.toLowerCase().includes(query) ||
          comp.customerName.toLowerCase().includes(query) ||
          comp.orderId.toLowerCase().includes(query) ||
          comp.description.toLowerCase().includes(query) ||
          comp.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [complaints, searchQuery, priorityFilter, statusFilter, slaFilter, assigneeFilter]);

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

  const sortedComplaints = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredComplaints;
    return [...filteredComplaints].sort((a, b) => {
      let valA = a[sortColumn as keyof Complaint];
      let valB = b[sortColumn as keyof Complaint];

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
  }, [filteredComplaints, sortColumn, sortDirection]);

  const paginatedComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedComplaints.slice(startIndex, startIndex + pageSize);
  }, [sortedComplaints, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedComplaints.length / pageSize) || 1;

  const SortArrow = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <span className="text-gray-300 ml-1">↕</span>;
    if (sortDirection === 'asc') return <span className="text-brand-primary font-bold ml-1">↑</span>;
    return <span className="text-brand-primary font-bold ml-1">↓</span>;
  };

  return (
    <div className="space-y-6">
      {selectedComplaintForDetail ? (
        /* SCREEN C — COMPLAINT DETAIL VIEW */
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
            <button 
              onClick={() => {
                setSelectedComplaintForDetail(null);
                setShowCustomerDetailsAtBottom(false);
              }}
              className="p-1.5 hover:bg-bg-neutral rounded text-text-secondary cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-text-secondary bg-bg-neutral border border-border-subtle rounded px-2 py-0.5">
                  {selectedComplaintForDetail.id}
                </span>
                <span className="text-sm font-semibold text-text-primary">Complaint Ticket Detail</span>
              </div>
              <h1 className="text-xl font-bold text-text-primary mt-1">Customer: {selectedComplaintForDetail.customerName}</h1>
            </div>
          </div>

          {/* Status horizontal stepper flow: Open -> In Progress -> Resolved -> Closed */}
          <div className="bg-white border border-border-subtle p-5 rounded-lg">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Ticket Status Progress</h3>
            
            {selectedComplaintForDetail.status === 'Escalated' ? (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                <div>
                  <div className="text-sm font-bold text-red-800">SLA Breach Escalation State Active</div>
                  <div className="text-xs text-red-700 mt-0.5">
                    This ticket has been flagged as Escalated by an agent or system rule. Immediate action required.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
                {/* Connector Line */}
                <div className="absolute top-1/2 left-[5%] right-[5%] h-0.5 bg-border-subtle -translate-y-1/2 hidden md:block z-0"></div>
                
                {/* Stepper bubbles */}
                {(['Open', 'In Progress', 'Resolved', 'Closed'] as ComplaintStatus[]).map((step, idx) => {
                  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
                  const currentIdx = statuses.indexOf(selectedComplaintForDetail.status);
                  const isCompleted = idx <= currentIdx;
                  const isActive = idx === currentIdx;

                  return (
                    <div key={step} className="flex md:flex-col items-center gap-3 md:gap-2 z-10 w-full md:w-auto">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold ${
                        isActive 
                          ? 'bg-brand-primary text-white border-brand-primary ring-4 ring-brand-bg-active' 
                          : isCompleted 
                            ? 'bg-emerald-100 text-brand-primary border-emerald-200' 
                            : 'bg-white text-text-secondary border-border-subtle'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="text-xs font-semibold text-center">
                        <div className={isActive ? 'text-brand-primary font-bold' : isCompleted ? 'text-text-primary' : 'text-text-secondary'}>
                          {step}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grouped sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col - Ticket Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-border-subtle p-5 rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">Complaint Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xxs uppercase text-text-secondary font-medium">Category / Reason</span>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{selectedComplaintForDetail.category}</p>
                  </div>
                  <div>
                    <span className="text-xxs uppercase text-text-secondary font-medium">Shopify Order ID</span>
                    <p className="text-sm font-semibold text-brand-primary mt-0.5 flex items-center gap-1">
                      {selectedComplaintForDetail.orderId}
                      <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                  <div>
                    <span className="text-xxs uppercase text-text-secondary font-medium">Priority Rating</span>
                    <p className="text-sm mt-0.5">
                      <span className={`text-xxs px-2 py-0.5 border rounded-full font-bold ${
                        selectedComplaintForDetail.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                        selectedComplaintForDetail.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {selectedComplaintForDetail.priority}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-xxs uppercase text-text-secondary font-medium">Complaint Submission Date</span>
                    <p className="text-sm font-medium text-text-primary mt-0.5">{selectedComplaintForDetail.complaintDate}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xxs uppercase text-text-secondary font-medium">Customer Email</span>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{selectedComplaintForDetail.customerEmail}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle">
                  <span className="text-xxs uppercase text-text-secondary font-medium">Description of issue</span>
                  <p className="text-sm text-text-primary leading-relaxed mt-1.5 bg-bg-neutral p-4 rounded border border-border-subtle">
                    {selectedComplaintForDetail.description}
                  </p>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="bg-white border border-border-subtle p-5 rounded-lg">
                <h3 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2 mb-4">Uploaded Verification Documents</h3>
                {selectedComplaintForDetail.documents.length === 0 ? (
                  <p className="text-xs text-text-secondary italic">No documents or product images uploaded with this ticket.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedComplaintForDetail.documents.map(doc => (
                      <div key={doc.id} className="border border-border-subtle p-3 rounded-lg flex items-center justify-between hover:bg-bg-neutral/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-brand-bg-active text-brand-primary flex items-center justify-center">
                            {doc.name.includes('png') || doc.name.includes('jpg') ? (
                              <Image className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-text-primary truncate max-w-[150px]">{doc.name}</div>
                            <div className="text-xxs text-text-secondary mt-0.5">{doc.size} • {doc.type}</div>
                          </div>
                        </div>

                        <button 
                          onClick={() => alert(`Downloading document: ${doc.name}`)}
                          className="p-1.5 hover:bg-border-subtle rounded-full text-text-secondary hover:text-text-primary cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col - SLA Details & Actions */}
            <div className="space-y-6">
              {/* SLA & Assignee status */}
              <div className="bg-white border border-border-subtle p-5 rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">SLA & Ownership</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-text-secondary">SLA Resolution Target</span>
                    <span className="text-xs font-semibold text-text-primary">{selectedComplaintForDetail.slaDueDate}</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-text-secondary">SLA Status</span>
                    <span className={`text-xxs px-2 py-0.5 border rounded-full font-bold ${
                      selectedComplaintForDetail.slaStatus === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200' :
                      selectedComplaintForDetail.slaStatus === 'Due Soon' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      selectedComplaintForDetail.slaStatus === 'Completed' ? 'bg-emerald-50 text-brand-primary border-emerald-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {selectedComplaintForDetail.slaStatus}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-text-secondary">Assigned Agent</span>
                    <span className="text-xs font-semibold text-text-primary">{selectedComplaintForDetail.assignedTo}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle flex flex-col gap-2">
                  <button 
                    onClick={() => handleEditClick(selectedComplaintForDetail)}
                    className="w-full bg-bg-neutral hover:bg-border-subtle border border-border-subtle py-2 px-3 rounded text-xs font-semibold text-text-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-4.5 h-4.5" /> Edit Ticket Attributes
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(selectedComplaintForDetail.id)}
                    className="w-full hover:bg-red-50 border border-transparent hover:border-red-100 py-2 px-3 rounded text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" /> Delete Ticket
                  </button>
                </div>
              </div>

              {/* Customer summary fast-access card */}
              <div className="bg-white border border-border-subtle p-5 rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">Customer Profile Access</h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-bg-active text-brand-primary flex items-center justify-center font-bold">
                    {selectedComplaintForDetail.customerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text-primary">{selectedComplaintForDetail.customerName}</div>
                    <div className="text-xxs text-text-secondary mt-0.5">Linked Order ID: {selectedComplaintForDetail.orderId}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={handleOpenCustomerSummaryClick}
                    className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" /> {showCustomerDetailsAtBottom ? 'Hide Customer Summary' : 'Open Customer Summary'}
                  </button>

                  <button 
                    onClick={() => onNavigateToCustomer(selectedComplaintForDetail.customerName)}
                    className="w-full bg-bg-neutral hover:bg-border-subtle border border-border-subtle text-text-primary py-1.5 px-3 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    Go to Customer Profiles Tab <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section for Customer Profile Summary Details */}
          {showCustomerDetailsAtBottom && (
            <div id="customer-summary-bottom-section" className="bg-white border border-border-subtle rounded-lg p-6 mt-6 space-y-6 shadow-sm animate-fade-in scroll-mt-6">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-bg-active text-brand-primary flex items-center justify-center font-bold text-lg">
                    {linkedCustomer ? linkedCustomer.name.split(' ').map(n => n[0]).join('') : '?'}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                      Customer Profile Details: {linkedCustomer ? linkedCustomer.name : selectedComplaintForDetail.customerName}
                    </h2>
                    {linkedCustomer && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        Customer ID: <span className="font-mono text-text-primary font-semibold">{linkedCustomer.id}</span> • Segment: 
                        <span className={`ml-1.5 text-xxs px-2 py-0.5 border rounded-full font-bold ${
                          linkedCustomer.segment === 'VIP' ? 'bg-emerald-50 text-brand-primary border-emerald-200' :
                          linkedCustomer.segment === 'Regular' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          linkedCustomer.segment === 'New' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {linkedCustomer.segment} Segment
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setShowCustomerDetailsAtBottom(false)}
                  className="p-1.5 hover:bg-bg-neutral rounded text-text-secondary cursor-pointer"
                  title="Close Section"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!linkedCustomer ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
                  Could not load full profile data. Customer <strong>{selectedComplaintForDetail.customerName}</strong> may not be synchronized in the CRM yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-bg-neutral p-4 rounded-lg border border-border-subtle">
                      <div className="text-xxs uppercase tracking-wider text-text-secondary font-semibold">Total Orders</div>
                      <div className="text-lg font-bold text-text-primary mt-1">{linkedCustomer.totalOrders}</div>
                    </div>
                    <div className="bg-bg-neutral p-4 rounded-lg border border-border-subtle">
                      <div className="text-xxs uppercase tracking-wider text-text-secondary font-semibold">Total Spend</div>
                      <div className="text-lg font-bold text-brand-primary mt-1">
                        {formatCurrencyAmount(linkedCustomer.totalSpend, linkedCustomer.currencyCode)}
                      </div>
                    </div>
                    <div className="bg-bg-neutral p-4 rounded-lg border border-border-subtle">
                      <div className="text-xxs uppercase tracking-wider text-text-secondary font-semibold">Last Order Date</div>
                      <div className="text-sm font-semibold text-text-primary mt-2">{linkedCustomer.lastOrderDate}</div>
                    </div>
                    <div className="bg-bg-neutral p-4 rounded-lg border border-border-subtle">
                      <div className="text-xxs uppercase tracking-wider text-text-secondary font-semibold">Contact Info</div>
                      <div className="text-xs font-semibold text-text-primary mt-1.5 truncate" title={linkedCustomer.email}>{linkedCustomer.email}</div>
                      <div className="text-xxs text-text-secondary mt-0.5">{linkedCustomer.phone}</div>
                    </div>
                  </div>

                  {/* 2x3 Bento Grid for lists and tables */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* 1. Order History Card */}
                    <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-xxs">
                      <div className="flex items-center gap-2 border-b border-border-subtle pb-2 mb-3">
                        <ShoppingBag className="w-4 h-4 text-brand-primary" />
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Shopify Store Order History</h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-bg-neutral/50 text-text-secondary font-semibold border-b border-border-subtle">
                              <th className="p-2">Order ID</th>
                              <th className="p-2">Transaction Date</th>
                              <th className="p-2">Total Amount</th>
                              <th className="p-2">Fulfillment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {linkedCustomer.orders.map(o => (
                              <tr key={o.orderId} className="hover:bg-bg-neutral/20">
                                <td className="p-2 font-mono font-bold text-brand-primary">{o.orderId}</td>
                                <td className="p-2 text-text-secondary">{o.date}</td>
                                <td className="p-2 font-bold text-text-primary">
                                  {formatCurrencyAmount(o.amount, linkedCustomer.currencyCode)}
                                </td>
                                <td className="p-2">
                                  <span className="bg-emerald-50 text-brand-primary border border-emerald-100 px-1.5 py-0.2 rounded-full font-semibold text-[10px]">
                                    {o.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. Purchased Product Details Card */}
                    <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-xxs">
                      <div className="flex items-center gap-2 border-b border-border-subtle pb-2 mb-3">
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Bought Products & Variants</h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-bg-neutral/50 text-text-secondary font-semibold border-b border-border-subtle">
                              <th className="p-2">Product Line</th>
                              <th className="p-2">Selected Option</th>
                              <th className="p-2">Quantity</th>
                              <th className="p-2">Price Per Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {linkedCustomer.products.map(p => (
                              <tr key={p.name} className="hover:bg-bg-neutral/20">
                                <td className="p-2 font-bold text-text-primary">{p.name}</td>
                                <td className="p-2 text-text-secondary font-mono">{p.variant}</td>
                                <td className="p-2 text-text-primary font-semibold">{p.qty}x</td>
                                <td className="p-2 text-text-secondary">
                                  {formatCurrencyAmount(p.price, linkedCustomer.currencyCode)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 3. Refund & Returns Card */}
                    <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-xxs">
                      <div className="flex items-center gap-2 border-b border-border-subtle pb-2 mb-3">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Refunds & Order Returns</h3>
                      </div>

                      {linkedCustomer.refunds.length === 0 ? (
                        <p className="text-xs text-text-secondary italic p-2">No returns or refund payouts have been issued for this merchant profile.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-bg-neutral/50 text-text-secondary font-semibold border-b border-border-subtle">
                                <th className="p-2">Refund Reference</th>
                                <th className="p-2">Issue Date</th>
                                <th className="p-2">Amount Payout</th>
                                <th className="p-2">Gateway Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle text-xs">
                              {linkedCustomer.refunds.map(r => (
                                <tr key={r.id} className="hover:bg-bg-neutral/20">
                                  <td className="p-2 font-mono font-bold text-text-primary">{r.id}</td>
                                  <td className="p-2 text-text-secondary">{r.date}</td>
                                <td className="p-2 text-red-600 font-bold">
                                  {formatCurrencyAmount(r.amount, linkedCustomer.currencyCode)}
                                </td>
                                  <td className="p-2">
                                    <span className="bg-emerald-50 text-brand-primary border border-emerald-100 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                                      {r.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 4. Discounts & Coupons Card */}
                    <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-xxs">
                      <div className="flex items-center gap-2 border-b border-border-subtle pb-2 mb-3">
                        <Gift className="w-4 h-4 text-pink-600" />
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Discounts & Applied Coupons</h3>
                      </div>

                      {linkedCustomer.discounts.length === 0 ? (
                        <p className="text-xs text-text-secondary italic p-2">No custom discount coupons attached to this user segment.</p>
                      ) : (
                        <ul className="space-y-2">
                          {linkedCustomer.discounts.map(disc => (
                            <li key={disc.code} className="p-2 bg-bg-neutral rounded border border-border-subtle flex justify-between items-center text-xs">
                              <div>
                                <code className="bg-white px-2 py-0.5 rounded border border-border-subtle font-bold text-pink-700 font-mono text-xxs">
                                  {disc.code}
                                </code>
                                <span className="text-text-secondary ml-2 font-medium">{disc.description}</span>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${disc.status === 'Active' ? 'bg-emerald-50 text-brand-primary border border-emerald-100' : 'bg-gray-100 text-gray-500'}`}>
                                {disc.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* 5. Complaints History Card */}
                    <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-xxs">
                      <div className="flex items-center gap-2 border-b border-border-subtle pb-2 mb-3">
                        <HelpCircle className="w-4 h-4 text-red-500" />
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Linked Customer Complaints</h3>
                      </div>

                      {linkedCustomer.complaints.length === 0 ? (
                        <p className="text-xs text-text-secondary italic p-2">This customer has not filed any other service complaints.</p>
                      ) : (
                        <ul className="divide-y divide-border-subtle">
                          {linkedCustomer.complaints.map(comp => (
                            <li key={comp.id} className="py-2.5 flex justify-between items-center text-xs">
                              <div>
                                <strong className="font-mono text-brand-primary">{comp.id}</strong> — <span className="text-text-primary font-medium">{comp.subject}</span>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.2 border rounded-full font-semibold ${
                                comp.status === 'Resolved' ? 'bg-emerald-50 text-brand-primary border-emerald-200' :
                                comp.status === 'Closed' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {comp.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* 6. Store Information Card */}
                    <div className="bg-white border border-border-subtle rounded-lg p-4 shadow-xxs">
                      <div className="flex items-center gap-2 border-b border-border-subtle pb-2 mb-3">
                        <User className="w-4 h-4 text-blue-600" />
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">CRM Store Notes & Onboarding Metrics</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                        <div>
                          <span className="text-xxs uppercase text-text-secondary">Onboarding Join Date</span>
                          <p className="font-bold text-text-primary mt-0.5">{linkedCustomer.storeInfo.joinedDate}</p>
                        </div>
                        <div>
                          <span className="text-xxs uppercase text-text-secondary">Lifecycle State</span>
                          <p className="font-bold text-brand-primary mt-0.5">{linkedCustomer.storeInfo.lifecycleStage}</p>
                        </div>
                      </div>

                      <div className="bg-bg-neutral p-3 rounded text-xs border border-border-subtle">
                        <span className="text-xxs font-bold uppercase text-text-secondary">Relations Log Note</span>
                        <p className="text-text-primary leading-relaxed mt-1 italic">
                          "{linkedCustomer.storeInfo.notes}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* SCREEN A — COMPLAINT DASHBOARD/GRID */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-5">
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">Complaint Management</h1>
              <p className="text-xs text-text-secondary mt-1">
                Manage ticket complaints, check automatic SLA compliance times, and store verification invoices.
              </p>
            </div>
            <button 
              onClick={handleNewClick}
              className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white py-1.5 px-4 rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Complaint
            </button>
          </div>

          {/* Toolbar with Search + Filters */}
          <div className="bg-bg-neutral border border-border-subtle p-3 rounded-lg flex flex-col xl:flex-row gap-3 items-center justify-between">
            <div className="relative w-full xl:w-72">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder="Search by ID, customer or order..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-white border border-border-subtle pl-9 pr-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-text-secondary"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center justify-start xl:justify-end">
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-secondary font-medium">Priority:</span>
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
                <span className="text-xs text-text-secondary font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Escalated">Escalated</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-text-secondary font-medium">SLA:</span>
                <select
                  value={slaFilter}
                  onChange={(e) => setSlaFilter(e.target.value)}
                  className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer"
                >
                  <option value="All">All SLA Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Due Soon">Due Soon</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-text-secondary font-medium">Assigned:</span>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded focus:outline-none cursor-pointer"
                >
                  <option value="All">All Staff</option>
                  {staffList.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* COMPLAINTS GRID TABLE */}
          {filteredComplaints.length === 0 ? (
            <div className="bg-white border border-border-subtle p-12 text-center rounded-lg">
              <div className="w-16 h-16 bg-bg-neutral rounded-full flex items-center justify-center mx-auto mb-4 text-text-secondary">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">No complaints found</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mt-2">
                All tickets resolved! Click 'New Complaint' to register customer queries or order problems.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-[#B9D7FC] text-slate-900 text-[13px] font-bold border-b border-gray-300">
                      <th 
                        className="p-3 w-[11%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                        onClick={() => handleSort('id')}
                      >
                        Complaint ID <SortArrow column="id" />
                      </th>
                      <th 
                        className="p-3 w-[15%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                        onClick={() => handleSort('customerName')}
                      >
                        Customer Name <SortArrow column="customerName" />
                      </th>
                      <th 
                        className="p-3 w-[12%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                        onClick={() => handleSort('orderId')}
                      >
                        Shopify Order <SortArrow column="orderId" />
                      </th>
                      <th 
                        className="p-3 w-[11%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                        onClick={() => handleSort('priority')}
                      >
                        Priority <SortArrow column="priority" />
                      </th>
                      <th 
                        className="p-3 w-[11%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                        onClick={() => handleSort('status')}
                      >
                        Ticket Status <SortArrow column="status" />
                      </th>
                      <th 
                        className="p-3 w-[13%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                        onClick={() => handleSort('slaStatus')}
                      >
                        SLA Target Status <SortArrow column="slaStatus" />
                      </th>
                      <th 
                        className="p-3 w-[14%] text-[13px] font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                        onClick={() => handleSort('assignedTo')}
                      >
                        Assigned To <SortArrow column="assignedTo" />
                      </th>
                      <th className="p-3 w-[13%] text-[13px] font-bold text-slate-900 uppercase text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedComplaints.map(comp => {
                      const priorityColors = {
                        'High': 'bg-red-50 text-red-700 border-red-200',
                        'Medium': 'bg-amber-50 text-amber-800 border-amber-200',
                        'Low': 'bg-gray-50 text-gray-700 border-gray-200'
                      };

                      const statusColors = {
                        'Open': 'bg-blue-50 text-blue-700 border-blue-200',
                        'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
                        'Resolved': 'bg-emerald-50 text-brand-primary border-emerald-200',
                        'Closed': 'bg-gray-50 text-gray-600 border-gray-200',
                        'Escalated': 'bg-red-100 text-red-700 border-red-300 font-bold animate-pulse'
                      };

                      const slaColors = {
                        'Pending': 'bg-gray-50 text-gray-700 border-gray-200',
                        'Due Soon': 'bg-amber-50 text-amber-800 border-amber-200',
                        'Overdue': 'bg-red-50 text-red-700 border-red-200',
                        'Completed': 'bg-emerald-50 text-brand-primary border-emerald-200'
                      };

                      return (
                        <tr key={comp.id} className="hover:bg-slate-50 transition-colors text-[13.5px]">
                          <td 
                            onClick={() => setSelectedComplaintForDetail(comp)}
                            className="p-3 border-r border-b border-gray-200 align-middle text-[14px] font-mono font-bold text-brand-primary cursor-pointer hover:underline truncate"
                            title={comp.id}
                          >
                            {comp.id}
                          </td>
                          <td className="p-3 border-r border-b border-gray-200 align-middle text-[14px] font-bold text-text-primary truncate" title={comp.customerName}>
                            {comp.customerName}
                          </td>
                          <td className="p-3 border-r border-b border-gray-200 align-middle">
                            <span 
                              onClick={() => onNavigateToCustomer(comp.customerName)}
                              className="text-[14px] font-semibold text-brand-primary cursor-pointer hover:underline inline-flex items-center gap-1"
                            >
                              {comp.orderId}
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </td>
                          <td className="p-3 border-r border-b border-gray-200 align-middle text-center">
                            <span className={`text-[11px] px-2 py-0.5 border rounded-full font-bold uppercase inline-block ${priorityColors[comp.priority]}`}>
                              {comp.priority}
                            </span>
                          </td>
                          <td className="p-3 border-r border-b border-gray-200 align-middle text-center">
                            <span className={`text-[11px] px-2 py-0.5 border rounded-full font-bold uppercase inline-block ${statusColors[comp.status]}`}>
                              {comp.status}
                            </span>
                          </td>
                          <td className="p-3 border-r border-b border-gray-200 align-middle text-center">
                            <span className={`text-[11px] px-2 py-0.5 border rounded-full font-bold uppercase inline-block ${slaColors[comp.slaStatus]}`}>
                              {comp.slaStatus}
                            </span>
                          </td>
                          <td className="p-3 border-r border-b border-gray-200 align-middle text-[14px] text-text-primary font-medium truncate" title={comp.assignedTo}>
                            {comp.assignedTo}
                          </td>
                          <td className="p-3 border-b border-gray-200 align-middle text-center">
                            <div className="flex justify-center gap-1.5">
                              <button 
                                onClick={() => handleEditClick(comp)}
                                className="p-1 hover:bg-slate-100 rounded text-brand-primary border border-gray-300 hover:border-gray-400 cursor-pointer shadow-xxs transition-colors"
                                title="Edit attributes"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(comp.id)}
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
                  Showing <span className="font-semibold text-text-primary">{Math.min((currentPage - 1) * pageSize + 1, sortedComplaints.length)}</span> to{' '}
                  <span className="font-semibold text-text-primary">{Math.min(currentPage * pageSize, sortedComplaints.length)}</span> of{' '}
                  <span className="font-semibold text-text-primary">{sortedComplaints.length}</span> records
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
        </div>
      )}

      {/* SCREEN B — NEW/EDIT COMPLAINT (slide-over panel) */}
      {isSlideOverOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-xxs transition-opacity"
            onClick={() => {
              setIsSlideOverOpen(false);
              onCloseForm();
            }}
          ></div>

          {/* Form wrapper */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-xl flex flex-col z-10 transition-transform duration-300">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight">
                  {editingComplaint ? `Complaint #${editingComplaint.id}` : 'Register Complaint'}
                </h2>
              </div>
              <button 
                onClick={() => {
                  setIsSlideOverOpen(false);
                  onCloseForm();
                }}
                className="p-1.5 hover:bg-border-subtle rounded-full text-text-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveComplaint} className="flex-1 overflow-y-auto p-6 bg-white flex flex-col gap-6">
              
              {/* CONDITIONAL AMBER WARNING BANNER */}
              {similarComplaintExists && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex flex-col gap-2 shadow-xxs">
                  <div className="flex gap-2 font-semibold items-start text-amber-900">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5 animate-bounce" />
                    <div>Similar Complaint Detected on Same Order ID!</div>
                  </div>
                  <p className="pl-6.5 text-xxs text-amber-800 leading-relaxed">
                    Customer has already registered a complaint ({similarComplaintExists.id} - "{similarComplaintExists.category}") for order <span className="font-bold underline">{orderId}</span> submitted on {similarComplaintExists.complaintDate}. Please verify before creating duplicates.
                  </p>
                  <div className="pl-6.5 flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox" 
                      id="bypass-similar" 
                      checked={ignoreWarning}
                      onChange={(e) => setIgnoreWarning(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="bypass-similar" className="font-bold text-amber-900 select-none cursor-pointer">
                      I understand, proceed registering this duplicate anyway
                    </label>
                  </div>
                  {errors.similarity && <p className="pl-6.5 text-xxs text-red-600 font-bold">{errors.similarity}</p>}
                </div>
              )}

              {/* Section: Customer Details */}
              <div className="flex flex-col gap-5">
                <div className="border-b border-border-subtle pb-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Customer & Order details
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">Customer Name *</label>
                  <input 
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name associated with complaint"
                    className={`w-full text-sm border px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary ${errors.customerName ? 'border-red-500' : 'border-border-subtle'}`}
                  />
                  {errors.customerName && <p className="text-xxs text-red-600 mt-1">{errors.customerName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">Customer Email *</label>
                  <input 
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter customer email associated with complaint"
                    className={`w-full text-sm border px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary ${errors.customerEmail ? 'border-red-500' : 'border-border-subtle'}`}
                  />
                  {errors.customerEmail && <p className="text-xxs text-red-600 mt-1">{errors.customerEmail}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">Shopify Order ID *</label>
                    <input 
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. #SH-90234"
                      className={`w-full text-sm border px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary ${errors.orderId ? 'border-red-500' : 'border-border-subtle'}`}
                    />
                    {errors.orderId && <p className="text-xxs text-red-600 mt-1">{errors.orderId}</p>}
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      if (customerName) {
                        onNavigateToCustomer(customerName);
                        setIsSlideOverOpen(false);
                        onCloseForm();
                      } else {
                        alert("Please provide a customer name first before opening customer summary");
                      }
                    }}
                    className="h-[42px] bg-bg-neutral hover:bg-border-subtle border border-border-subtle px-3 rounded text-xs font-semibold text-brand-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Customer Summary
                  </button>
                </div>
              </div>

              {/* Section: Complaint Details */}
              <div className="flex flex-col gap-5">
                <div className="border-b border-border-subtle pb-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Complaint ticket properties
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">Complaint Description *</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe specific defect, refund demands or logistics delays..."
                    rows={3}
                    className={`w-full text-sm border px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary ${errors.description ? 'border-red-500' : 'border-border-subtle'}`}
                  />
                  {errors.description && <p className="text-xxs text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">Category Code</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-sm border border-border-subtle px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer bg-white"
                    >
                      {categoryList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">Ticket Priority</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full text-sm border border-border-subtle px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer bg-white"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">Complaint Date</label>
                    <input 
                      type="date"
                      value={complaintDate}
                      onChange={(e) => setComplaintDate(e.target.value)}
                      className="w-full text-sm border border-border-subtle px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">SLA Resolution Target (Auto-calc)</label>
                    <input 
                      type="text"
                      value={slaDueDate}
                      readOnly
                      className="w-full text-sm border border-border-subtle bg-bg-neutral px-3 py-2.5 rounded focus:outline-none font-mono font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">Assigned Support Staff</label>
                    <select 
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full text-sm border border-border-subtle px-3 py-2.5 rounded focus:outline-none cursor-pointer bg-white"
                    >
                      {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">Complaint Ticket Status</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                      className="w-full text-sm border border-border-subtle px-3 py-2.5 rounded focus:outline-none cursor-pointer bg-white"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Escalated">Escalated (Red flag branch)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Upload Documents (3 distinct drag-drop zones) */}
              <div className="flex flex-col gap-5">
                <div className="border-b border-border-subtle pb-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Upload Verification Documents
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Zone 1 - Product image */}
                  <div className="border border-dashed border-border-subtle p-3 rounded text-center hover:border-brand-primary relative bg-bg-neutral/40 transition-colors">
                    <input 
                      type="file" 
                      id="upload-product-img" 
                      accept="image/*"
                      onChange={(e) => simulateUpload('img', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Image className="w-5 h-5 text-text-secondary mb-1.5" />
                      <span className="text-xxs font-semibold text-text-primary block">Product Image</span>
                      <span className="text-3xs text-text-secondary mt-0.5">Drag / Click</span>
                    </div>
                  </div>

                  {/* Zone 2 - Invoice */}
                  <div className="border border-dashed border-border-subtle p-3 rounded text-center hover:border-brand-primary relative bg-bg-neutral/40 transition-colors">
                    <input 
                      type="file" 
                      id="upload-invoice-doc" 
                      accept=".pdf,.png,.jpg"
                      onChange={(e) => simulateUpload('invoice', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-5 h-5 text-text-secondary mb-1.5" />
                      <span className="text-xxs font-semibold text-text-primary block">Store Invoice</span>
                      <span className="text-3xs text-text-secondary mt-0.5">Drag / Click</span>
                    </div>
                  </div>

                  {/* Zone 3 - Other documents */}
                  <div className="border border-dashed border-border-subtle p-3 rounded text-center hover:border-brand-primary relative bg-bg-neutral/40 transition-colors">
                    <input 
                      type="file" 
                      id="upload-other-doc" 
                      onChange={(e) => simulateUpload('other', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-5 h-5 text-text-secondary mb-1.5" />
                      <span className="text-xxs font-semibold text-text-primary block">Other Attach</span>
                      <span className="text-3xs text-text-secondary mt-0.5">Drag / Click</span>
                    </div>
                  </div>
                </div>

                {/* Previews after upload */}
                {(uploadedProductImg || uploadedInvoice || uploadedOther) && (
                  <div className="border border-border-subtle p-3 rounded-lg bg-bg-neutral flex flex-col gap-2">
                    <h4 className="text-xxs font-bold text-text-secondary uppercase">Attachment Previews</h4>
                    <div className="flex flex-col gap-1.5">
                      {uploadedProductImg && (
                        <div className="flex items-center justify-between text-xs bg-white border border-border-subtle p-1.5 rounded">
                          <span className="truncate max-w-[150px] font-mono text-xxs text-text-primary">Img: {uploadedProductImg.name}</span>
                          <button type="button" onClick={() => setUploadedProductImg(null)} className="text-red-500 hover:text-red-700">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {uploadedInvoice && (
                        <div className="flex items-center justify-between text-xs bg-white border border-border-subtle p-1.5 rounded">
                          <span className="truncate max-w-[150px] font-mono text-xxs text-text-primary">Invoice: {uploadedInvoice.name}</span>
                          <button type="button" onClick={() => setUploadedInvoice(null)} className="text-red-500 hover:text-red-700">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {uploadedOther && (
                        <div className="flex items-center justify-between text-xs bg-white border border-border-subtle p-1.5 rounded">
                          <span className="truncate max-w-[150px] font-mono text-xxs text-text-primary">Misc: {uploadedOther.name}</span>
                          <button type="button" onClick={() => setUploadedOther(null)} className="text-red-500 hover:text-red-700">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Sticky footer with cancel/save */}
            <div className="border-t border-border-subtle p-4 bg-bg-neutral flex justify-between gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => {
                  setIsSlideOverOpen(false);
                  onCloseForm();
                }}
                className="px-4 py-2 border border-border-subtle hover:bg-white rounded text-sm text-text-primary font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveComplaint}
                className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {editingComplaint ? 'Save Changes' : 'Register Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
