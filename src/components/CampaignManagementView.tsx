import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, Mail, MessageSquare, Trash2, Edit, 
  X, Check, AlertCircle, Eye, Calendar, Clock, Globe, HelpCircle,
  Sparkles, ChevronDown, Play
} from 'lucide-react';
import { Campaign, CampaignType, CampaignStatus, EmailTemplate } from '../types';

interface CampaignManagementViewProps {
  campaigns: Campaign[];
  templates: EmailTemplate[];
  onAddCampaign: (campaign: Campaign) => void;
  onUpdateCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaignId: string) => void;
  initialOpenForm: boolean;
  onCloseForm: () => void;
  initialCreationType?: 'one-time' | 'automated';
}

export default function CampaignManagementView({
  campaigns,
  templates,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  initialOpenForm,
  onCloseForm,
  initialCreationType
}: CampaignManagementViewProps) {
  // Bulk Actions Selection State
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // General Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form Panel Slide-over States
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(initialOpenForm);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignCreationType, setCampaignCreationType] = useState<'one-time' | 'automated'>(initialCreationType || 'one-time');

  React.useEffect(() => {
    if (initialOpenForm && initialCreationType) {
      setCampaignCreationType(initialCreationType);
    }
  }, [initialOpenForm, initialCreationType]);

  // Form Field States
  const [name, setName] = useState('');
  const [type, setType] = useState<CampaignType>('Email');
  const [status, setStatus] = useState<CampaignStatus>('Draft');
  const [audience, setAudience] = useState('All Customers');
  const [sendType, setSendType] = useState<'Now' | 'Schedule'>('Now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [templateId, setTemplateId] = useState('');

  // Validation States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Message preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewText, setPreviewText] = useState('');

  // Toast notifier
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Reminder Schedule State
  const [selectedLeadType, setSelectedLeadType] = useState('Abandoned Checkout');
  const [reminderSchedule, setReminderSchedule] = useState<any[]>(() => {
    const saved = localStorage.getItem('tech_crm_reminder_schedule');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore fallback
      }
    }
    return [
      { day: 'Monday', enabled: true, time: '10:00', templateId: 'TMP-ACB-01' },
      { day: 'Tuesday', enabled: false, time: '10:00', templateId: 'TMP-ACB-02' },
      { day: 'Wednesday', enabled: false, time: '10:00', templateId: 'TMP-ACB-03' },
      { day: 'Thursday', enabled: false, time: '10:00', templateId: 'TMP-ACB-04' },
      { day: 'Friday', enabled: false, time: '10:00', templateId: 'TMP-ACB-05' },
      { day: 'Saturday', enabled: false, time: '10:00', templateId: 'TMP-ACB-06' },
      { day: 'Sunday', enabled: false, time: '10:00', templateId: 'TMP-ACB-07' },
    ];
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [openDropdownDay, setOpenDropdownDay] = useState<string | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  
  // State for Row-specific email preview modal
  const [previewModalTemplate, setPreviewModalTemplate] = useState<EmailTemplate | null>(null);

  const handleToggleDay = (dayName: string) => {
    setReminderSchedule(prev => {
      const updated = prev.map(d => {
        if (d.day === dayName) {
          return { ...d, enabled: !d.enabled };
        }
        return d;
      });
      setHasUnsavedChanges(true);
      return updated;
    });
  };

  const handleTimeChange = (dayName: string, timeVal: string) => {
    setReminderSchedule(prev => {
      const updated = prev.map(d => {
        if (d.day === dayName) {
          return { ...d, time: timeVal };
        }
        return d;
      });
      setHasUnsavedChanges(true);
      return updated;
    });
  };

  const handleTemplateChange = (dayName: string, tId: string) => {
    setReminderSchedule(prev => {
      const updated = prev.map(d => {
        if (d.day === dayName) {
          return { ...d, templateId: tId };
        }
        return d;
      });
      setHasUnsavedChanges(true);
      return updated;
    });
    setOpenDropdownDay(null);
  };

  const handleSaveSchedule = () => {
    localStorage.setItem('tech_crm_reminder_schedule', JSON.stringify(reminderSchedule));
    setHasUnsavedChanges(false);
    triggerToast('Reminder Schedule automation settings saved successfully!');
  };

  // Checkbox select handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaignIds(filteredCampaigns.map(c => c.id));
    } else {
      setSelectedCampaignIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaignIds([...selectedCampaignIds, id]);
    } else {
      setSelectedCampaignIds(selectedCampaignIds.filter(cid => cid !== id));
    }
  };

  // Bulk actions submit confirmation
  const handleBulkGoClick = () => {
    if (selectedCampaignIds.length === 0 || !bulkAction) return;
    setShowBulkModal(true);
  };

  const handleConfirmBulkAction = () => {
    setShowBulkModal(false);
    triggerToast(`Success: Campaign ${bulkAction === 'email' ? 'Emails queued' : 'WhatsApp alerts initialized'} for ${selectedCampaignIds.length} campaigns!`);
    setSelectedCampaignIds([]);
    setBulkAction('');
  };

  const handleNewClick = () => {
    setEditingCampaign(null);
    setName('');
    setType('Email');
    setStatus('Draft');
    setAudience('All Customers');
    setSendType('Now');
    setScheduleDate('');
    setScheduleTime('');
    setTemplateId(templates[0]?.id || '');
    setErrors({});
    setCampaignCreationType('one-time');
    setIsSlideOverOpen(true);
  };

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setName(campaign.name);
    setType(campaign.type);
    setStatus(campaign.status);
    setAudience(campaign.audience);
    setSendType(campaign.deliverySettings.sendType);
    setScheduleDate(campaign.deliverySettings.scheduleDate || '');
    setScheduleTime(campaign.deliverySettings.scheduleTime || '');
    setTemplateId(campaign.templateId || templates[0]?.id || '');
    setErrors({});
    setCampaignCreationType('one-time');
    setIsSlideOverOpen(true);
  };

  const handleDeleteClick = (id: string, campName: string) => {
    if (window.confirm(`Are you sure you want to delete campaign "${campName}"?`)) {
      onDeleteCampaign(id);
      triggerToast(`Campaign "${campName}" successfully deleted.`);
    }
  };

  // Render Template Preview Modal
  const handlePreviewMessageClick = () => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (!selectedTemplate) {
      setPreviewText('Please choose a valid template from the selection dropdown first.');
    } else {
      // Replace mock template tags
      const rendered = selectedTemplate.body.replace('{{customer_name}}', 'Aarav Sharma');
      setPreviewText(`Subject: ${selectedTemplate.title}\n\n${rendered}`);
    }
    setShowPreviewModal(true);
  };

  // Save / Send Campaign Form Trigger
  const handleSaveCampaign = (actionType: 'draft' | 'publish') => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Campaign name is required';
    if (sendType === 'Schedule' && (!scheduleDate || !scheduleTime)) {
      newErrors.schedule = 'Please choose both Date and Time to schedule delivery';
    }
    if (type === 'Email' && !templateId) {
      newErrors.templateId = 'An email template must be selected';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const nextStatus: CampaignStatus = actionType === 'draft' ? 'Draft' : (sendType === 'Schedule' ? 'Scheduled' : 'Sent');
    const simulatedCount = nextStatus === 'Sent' ? (audience === 'VIP Customers' ? 82 : audience === 'All Customers' ? 342 : 12) : 0;

    if (editingCampaign) {
      const updated: Campaign = {
        ...editingCampaign,
        name,
        type,
        status: nextStatus,
        audience,
        sentCount: simulatedCount,
        deliverySettings: {
          sendType,
          scheduleDate: sendType === 'Schedule' ? scheduleDate : undefined,
          scheduleTime: sendType === 'Schedule' ? scheduleTime : undefined
        },
        templateId: type === 'Email' ? templateId : undefined
      };
      onUpdateCampaign(updated);
      triggerToast(`Campaign "${name}" updated successfully.`);
    } else {
      const nextId = 'CMP-' + (500 + campaigns.length + 15);
      const created: Campaign = {
        id: nextId,
        name,
        type,
        status: nextStatus,
        audience,
        sentCount: simulatedCount,
        deliverySettings: {
          sendType,
          scheduleDate: sendType === 'Schedule' ? scheduleDate : undefined,
          scheduleTime: sendType === 'Schedule' ? scheduleTime : undefined
        },
        templateId: type === 'Email' ? templateId : undefined
      };
      onAddCampaign(created);
      triggerToast(`Campaign "${name}" has been published and initialized.`);
    }

    setIsSlideOverOpen(false);
    onCloseForm();
  };

  // Search and Filter logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(camp => {
      if (typeFilter !== 'All' && camp.type !== typeFilter) return false;
      if (statusFilter !== 'All' && camp.status !== statusFilter) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          camp.name.toLowerCase().includes(query) ||
          camp.audience.toLowerCase().includes(query) ||
          camp.id.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [campaigns, searchQuery, typeFilter, statusFilter]);

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

  const sortedCampaigns = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredCampaigns;
    return [...filteredCampaigns].sort((a, b) => {
      let valA = a[sortColumn as keyof Campaign];
      let valB = b[sortColumn as keyof Campaign];

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
  }, [filteredCampaigns, sortColumn, sortDirection]);

  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedCampaigns.slice(startIndex, startIndex + pageSize);
  }, [sortedCampaigns, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedCampaigns.length / pageSize) || 1;

  const SortArrow = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <span className="text-gray-300 ml-1">↕</span>;
    if (sortDirection === 'asc') return <span className="text-brand-primary font-bold ml-1">↑</span>;
    return <span className="text-brand-primary font-bold ml-1">↓</span>;
  };

  // Check if "Go" button can be clicked
  const isGoButtonEnabled = selectedCampaignIds.length > 0 && bulkAction !== '';

  return (
    <div className="space-y-6">
      
      {/* Dynamic Toast Notifications */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-brand-primary text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 bg-white text-brand-primary rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Campaign Management</h1>
          <p className="text-xs text-text-secondary mt-1">
            Dispatch bulk email newsletters, schedule promo coupons, and send targeted WhatsApp broadcasts.
          </p>
        </div>
        <button 
          onClick={handleNewClick}
          className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white py-1.5 px-4 rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Sleek Automated Reminder Schedule Banner Card */}
      <div className="border border-brand-primary/10 bg-gradient-to-r from-brand-bg-active/40 via-brand-bg-active/20 to-white rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-3xs animate-fade-in">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-brand-bg-active text-brand-primary text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
              Automated Follow-up
            </span>
            <div className="flex items-center gap-1 text-text-primary">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
              <h3 className="text-xs font-bold">Daily Abandoned Cart Recovery Schedule</h3>
            </div>
          </div>
          <p className="text-xxs text-text-secondary leading-relaxed">
            Configure automated sequential templates to be sent on specified days to re-engage cold lead opportunities and recover abandoned shopping checkouts.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <span className="text-[10px] text-text-secondary flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5 text-brand-primary" /> 
              {reminderSchedule.filter(d => d.enabled).length} of 7 Days Configured
            </span>
            <span className="text-[10px] text-text-secondary flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-brand-primary" /> 
              Trigger: Abandoned Checkout detected
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setCampaignCreationType('automated');
            setIsSlideOverOpen(true);
          }}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white px-4.5 py-2 rounded text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 self-start md:self-center hover:-translate-y-px"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Configure Automated Schedule <span className="text-xs font-semibold">→</span>
        </button>
      </div>

      {/* REMOVING OLD STATIC VIEW */}
      <div className="hidden">

        {/* Section Body Split */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PART: Day Configuration Table (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="overflow-x-auto border border-border-subtle rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-neutral/80 border-b border-border-subtle">
                    <th className="p-3 font-semibold text-text-secondary uppercase w-12 text-center">Status</th>
                    <th className="p-3 font-semibold text-text-secondary uppercase w-28">Day</th>
                    <th className="p-3 font-semibold text-text-secondary uppercase w-28">Send Time</th>
                    <th className="p-3 font-semibold text-text-secondary uppercase">Email Template</th>
                    <th className="p-3 font-semibold text-text-secondary uppercase w-16 text-center">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {reminderSchedule.map((dayConfig) => {
                    const isEnabled = dayConfig.enabled;
                    const selectedTemplate = templates.find(t => t.id === dayConfig.templateId);
                    
                    // Filter templates based on search query
                    const filteredTemplates = templates.filter(t => 
                      t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                      t.id.toLowerCase().includes(templateSearchQuery.toLowerCase())
                    );

                    return (
                      <tr 
                        key={dayConfig.day} 
                        className={`transition-colors duration-150 ${
                          isEnabled 
                            ? 'bg-white hover:bg-bg-neutral/20' 
                            : 'bg-gray-50/50 text-text-secondary opacity-70'
                        }`}
                      >
                        {/* Status Toggle Column */}
                        <td className="p-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleToggleDay(dayConfig.day)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Day Name Column */}
                        <td className="p-3 font-bold align-middle">
                          <span className={`${isEnabled ? 'text-text-primary' : 'text-gray-400'}`}>
                            {dayConfig.day}
                          </span>
                        </td>

                        {/* Send Time Input Column */}
                        <td className="p-3 align-middle">
                          <input
                            type="time"
                            value={dayConfig.time}
                            disabled={!isEnabled}
                            onChange={(e) => handleTimeChange(dayConfig.day, e.target.value)}
                            className={`w-24 text-xs border rounded-md px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer transition-all ${
                              isEnabled 
                                ? 'bg-white border-border-subtle text-text-primary hover:border-text-secondary' 
                                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          />
                        </td>

                        {/* Email Template Searchable Dropdown Column */}
                        <td className="p-3 align-middle relative">
                          {isEnabled ? (
                            <div>
                              {/* Dropdown Toggle Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (openDropdownDay === dayConfig.day) {
                                    setOpenDropdownDay(null);
                                  } else {
                                    setOpenDropdownDay(dayConfig.day);
                                    setTemplateSearchQuery('');
                                  }
                                }}
                                className="w-full text-left text-xs bg-white border border-border-subtle rounded-md px-3 py-1.5 font-semibold text-text-primary flex items-center justify-between hover:border-text-secondary focus:outline-none focus:border-brand-primary cursor-pointer transition-colors"
                              >
                                <span className="truncate">
                                  {selectedTemplate ? selectedTemplate.name : 'Select a Template'}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-text-secondary ml-1.5 flex-shrink-0" />
                              </button>

                              {/* Searchable Dropdown Menu Overlay */}
                              {openDropdownDay === dayConfig.day && (
                                <>
                                  {/* Close backdrop */}
                                  <div 
                                    className="fixed inset-0 z-20" 
                                    onClick={() => setOpenDropdownDay(null)}
                                  ></div>
                                  
                                  <div className="absolute left-3 right-3 top-11 bg-white border border-border-subtle rounded-md shadow-lg z-30 p-2 space-y-2 max-h-56 overflow-y-auto animate-fade-in">
                                    <div className="sticky top-0 bg-white pb-1.5 border-b border-border-subtle">
                                      <input
                                        type="text"
                                        placeholder="Search templates..."
                                        value={templateSearchQuery}
                                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                        className="w-full text-xs border border-border-subtle rounded-md px-2.5 py-1.5 focus:outline-none focus:border-brand-primary"
                                        autoFocus
                                      />
                                    </div>
                                    <div className="space-y-0.5">
                                      {filteredTemplates.length === 0 ? (
                                        <p className="text-3xs text-text-secondary p-2 text-center">No templates match search</p>
                                      ) : (
                                        filteredTemplates.map(t => (
                                          <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => handleTemplateChange(dayConfig.day, t.id)}
                                            className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md flex flex-col hover:bg-brand-bg-active hover:text-brand-primary transition-colors cursor-pointer ${
                                              t.id === dayConfig.templateId ? 'bg-brand-bg-active text-brand-primary font-bold' : 'text-text-primary'
                                            }`}
                                          >
                                            <span className="truncate">{t.name}</span>
                                            <span className="text-[10px] text-text-secondary truncate">{t.title}</span>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="w-full text-xs bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-gray-400 font-semibold select-none cursor-not-allowed">
                              {selectedTemplate ? selectedTemplate.name : 'Select a Template'}
                            </div>
                          )}
                        </td>

                        {/* Preview Action Column */}
                        <td className="p-3 text-center align-middle">
                          <button
                            type="button"
                            disabled={!selectedTemplate}
                            onClick={() => setPreviewModalTemplate(selectedTemplate || null)}
                            className={`p-1.5 rounded-full border transition-all ${
                              selectedTemplate
                                ? 'text-brand-primary border-brand-primary/20 bg-brand-bg-active hover:bg-brand-primary hover:text-white cursor-pointer'
                                : 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed'
                            }`}
                            title={selectedTemplate ? `Preview "${selectedTemplate.name}"` : "No template selected"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT PART: Workflow Visualization + Live Path (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Workflow Preview Card */}
            <div className="border border-border-subtle rounded-xl p-5 bg-bg-neutral/30 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-brand-primary" />
                  Active Automation Path
                </h3>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Live workflow updates dynamically as toggled
                </p>
              </div>

              {/* Automation Path Display */}
              <div className="space-y-4 font-sans text-xs">
                
                {/* Trigger */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xxs shadow-sm shrink-0">
                    ⚡
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-text-primary block">Lead Registered</span>
                    <span className="text-3xs text-text-secondary block">Trigger: Abandoned Checkout detected</span>
                  </div>
                </div>

                {/* Vertical Lines & Path steps */}
                {(() => {
                  const activeDays = reminderSchedule.filter(d => d.enabled);

                  if (activeDays.length === 0) {
                    return (
                      <div className="pl-3 border-l-2 border-dashed border-gray-200 py-3 space-y-1.5">
                        <p className="text-3xs text-amber-600 font-semibold flex items-center gap-1 leading-normal">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Automation Paused. No active days enabled.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-0">
                      {activeDays.map((dayConfig, idx) => {
                        const template = templates.find(t => t.id === dayConfig.templateId);
                        
                        return (
                          <div key={dayConfig.day} className="relative">
                            {/* Line connecting steps */}
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-brand-primary/40 -z-10 animate-fade-in"></div>
                            
                            <div className="pl-9 py-2.5 flex items-start gap-3">
                              {/* Step indicator circle */}
                              <div className="absolute left-[7px] top-4 w-2.5 h-2.5 rounded-full bg-brand-primary border-2 border-white ring-2 ring-brand-primary/20"></div>
                              
                              <div className="bg-white border border-border-subtle rounded-lg p-2.5 shadow-3xs w-full space-y-1 hover:border-brand-primary/50 transition-colors">
                                <div className="flex justify-between items-center gap-1.5">
                                  <span className="font-bold text-text-primary">{dayConfig.day}</span>
                                  <span className="text-3xs bg-brand-bg-active text-brand-primary font-bold px-1.5 py-0.5 rounded">
                                    {dayConfig.time}
                                  </span>
                                </div>
                                <div className="text-3xs text-text-secondary leading-normal">
                                  Sends: <strong className="text-text-primary font-semibold">{template ? template.name : 'Unknown template'}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Terminal node */}
                      <div className="flex items-start gap-3 pt-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xxs shrink-0">
                          ✓
                        </div>
                        <div className="space-y-0.5 pt-0.5">
                          <span className="font-semibold text-text-primary block">Automation Sequence Complete</span>
                          <span className="text-3xs text-text-secondary block">End of customized abandoned cart recovery path</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Visual Timeline Flow card (representing enabled/disabled steps) */}
            <div className="border border-border-subtle rounded-xl p-5 bg-white space-y-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                  Visual Full Timeline Flow
                </h3>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Full 7-day flow showing active vs. skipped days
                </p>
              </div>

              {/* Vertical timeline of all days */}
              <div className="relative pl-6 space-y-3.5">
                {/* Global timeline line */}
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200"></div>

                {/* Day 0: Lead Created */}
                <div className="relative flex items-center gap-3">
                  <div className="absolute -left-[19.5px] w-4.5 h-4.5 rounded-full bg-brand-primary border border-white text-[9px] text-white flex items-center justify-center font-bold">
                    ★
                  </div>
                  <span className="text-3xs font-bold text-text-primary">Lead Created (Trigger)</span>
                </div>

                {/* Days of week */}
                {reminderSchedule.map((dayConfig) => {
                  const isEnabled = dayConfig.enabled;
                  const template = templates.find(t => t.id === dayConfig.templateId);
                  
                  return (
                    <div key={dayConfig.day} className="relative flex flex-col gap-0.5">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[19.5px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${
                        isEnabled 
                          ? 'bg-brand-primary text-white shadow-3xs' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isEnabled ? '●' : '○'}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-3xs font-semibold ${isEnabled ? 'text-text-primary font-bold' : 'text-gray-400'}`}>
                          {dayConfig.day} {isEnabled && `(${dayConfig.time})`}
                        </span>
                        {!isEnabled && (
                          <span className="text-[9px] text-gray-400 italic bg-gray-100 px-1 py-0.5 rounded">
                            Skipped
                          </span>
                        )}
                      </div>
                      {isEnabled && (
                        <span className="text-[10px] text-brand-primary font-medium truncate max-w-[200px]">
                          "{template ? template.name : 'Unknown template'}"
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Sticky save bar inside card */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-border-subtle p-4 px-6 flex flex-col sm:flex-row gap-3 items-center justify-between z-10 shadow-md">
          <div className="text-xs text-text-secondary text-center sm:text-left">
            {hasUnsavedChanges ? (
              <span className="text-amber-600 font-semibold flex items-center justify-center sm:justify-start gap-1.5 animate-pulse">
                <AlertCircle className="w-4 h-4" /> Unsaved changes in automation schedule
              </span>
            ) : (
              <span className="text-brand-primary font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                <Check className="w-4 h-4" /> All automation changes saved and live
              </span>
            )}
          </div>
          <button
            onClick={handleSaveSchedule}
            disabled={!hasUnsavedChanges}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-brand-primary hover:bg-brand-primary-hover text-white transform hover:-translate-y-px active:translate-y-0'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" /> Save Automation Settings
          </button>
        </div>
      </div>

      {/* BULK ACTION BAR */}
      <div className="bg-bg-neutral border border-border-subtle p-3 rounded-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search tool */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-white border border-border-subtle pl-9 pr-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-text-secondary"
          />
        </div>

        {/* BULK CONTROL ZONE */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          <div className="flex items-center gap-2 bg-white border border-border-subtle rounded-md px-3 py-1.5 shadow-xxs">
            <span className="text-xs text-text-secondary font-semibold">
              {selectedCampaignIds.length} Selected
            </span>
            <div className="h-4 w-px bg-border-subtle"></div>
            
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="text-xs bg-transparent focus:outline-none font-semibold text-text-primary cursor-pointer"
            >
              <option value="">Choose Bulk Action</option>
              <option value="email">Bulk Queue Email Send</option>
              <option value="whatsapp">Bulk WhatsApp Broadcast</option>
            </select>

            <button
              onClick={handleBulkGoClick}
              disabled={!isGoButtonEnabled}
              className={`text-xs font-bold px-3 py-1 rounded transition-colors cursor-pointer ${
                isGoButtonEnabled 
                  ? 'bg-brand-primary text-white hover:bg-brand-primary-hover' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Go
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 items-center">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Email">Email Only</option>
              <option value="WhatsApp">WhatsApp Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* CAMPAIGN LIST GRID */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-white border border-border-subtle p-12 text-center rounded-lg">
          <div className="w-16 h-16 bg-bg-neutral rounded-full flex items-center justify-center mx-auto mb-4 text-text-secondary">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">No campaigns found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-2">
            Click 'New Campaign' to draft target email campaigns or launch instant broadcast notifications.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-300 rounded-xl bg-white shadow-xxs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#B9D7FC] text-slate-900 text-[12.5px] font-bold border-b border-gray-300">
                  <th className="p-3 w-12 text-center border-r border-gray-300 font-bold text-slate-900">
                    <input 
                      type="checkbox"
                      checked={selectedCampaignIds.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="cursor-pointer"
                    />
                  </th>
                  <th 
                    className="p-3 w-[14%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300 animate-fade-in"
                    onClick={() => handleSort('id')}
                  >
                    Campaign ID <SortArrow column="id" />
                  </th>
                  <th 
                    className="p-3 w-[26%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('name')}
                  >
                    Campaign Name <SortArrow column="name" />
                  </th>
                  <th 
                    className="p-3 w-[12%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('type')}
                  >
                    Channel Type <SortArrow column="type" />
                  </th>
                  <th 
                    className="p-3 w-[10%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('status')}
                  >
                    Status <SortArrow column="status" />
                  </th>
                  <th 
                    className="p-3 w-[15%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('audience')}
                  >
                    Target Audience <SortArrow column="audience" />
                  </th>
                  <th 
                    className="p-3 w-[11%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('sentCount')}
                  >
                    Sent Count <SortArrow column="sentCount" />
                  </th>
                  <th className="p-3 w-[12%] text-xs font-bold text-slate-900 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.map(camp => {
                  const isSelected = selectedCampaignIds.includes(camp.id);
                  
                  const typeBadges = {
                    'Email': 'bg-blue-50 text-blue-700 border-blue-100',
                    'WhatsApp': 'bg-emerald-50 text-brand-primary border-emerald-100'
                  };

                  const statusBadges = {
                    'Draft': 'bg-gray-100 text-gray-600 border-gray-200',
                    'Scheduled': 'bg-blue-50 text-blue-600 border-blue-200',
                    'Sent': 'bg-emerald-50 text-brand-primary border-emerald-200',
                    'Failed': 'bg-red-50 text-red-600 border-red-200'
                  };

                  return (
                    <tr 
                      key={camp.id} 
                      className="transition-colors group text-[13.5px] bg-white hover:bg-slate-50"
                    >
                      <td className="p-3 text-center border-r border-b border-gray-200">
                        <input 
                           type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(camp.id, e.target.checked)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-sm font-mono font-bold text-text-primary border-r border-b border-gray-200 truncate" title={camp.id}>{camp.id}</td>
                      <td className="p-3 text-sm font-bold text-text-primary border-r border-b border-gray-200 truncate" title={camp.name}>{camp.name}</td>
                      <td className="p-3 border-r border-b border-gray-200">
                        <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold inline-flex items-center gap-1 ${typeBadges[camp.type]}`}>
                          {camp.type === 'Email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                          {camp.type}
                        </span>
                      </td>
                      <td className="p-3 border-r border-b border-gray-200">
                        <span className={`text-xxs px-2 py-0.5 border rounded-full font-bold ${statusBadges[camp.status]}`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-text-primary font-medium border-r border-b border-gray-200 truncate" title={camp.audience}>{camp.audience}</td>
                      <td className="p-3 text-sm font-mono font-bold text-text-primary border-r border-b border-gray-200">
                        {camp.sentCount > 0 ? camp.sentCount.toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-center border-b border-gray-200">
                        <div className="flex justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(camp)}
                            className="p-1 hover:bg-bg-neutral rounded text-text-primary border border-transparent hover:border-border-subtle cursor-pointer"
                            title="Edit Campaign"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(camp.id, camp.name)}
                            className="p-1 hover:bg-red-50 rounded text-red-600 border border-transparent hover:border-red-100 cursor-pointer"
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
              Showing <span className="font-semibold text-text-primary">{Math.min((currentPage - 1) * pageSize + 1, sortedCampaigns.length)}</span> to{' '}
              <span className="font-semibold text-text-primary">{Math.min(currentPage * pageSize, sortedCampaigns.length)}</span> of{' '}
              <span className="font-semibold text-text-primary">{sortedCampaigns.length}</span> records
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

      {/* SCREEN B — CAMPAIGN FORM (slide-over stacked sections) */}
      {isSlideOverOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-xxs"
            onClick={() => {
              setIsSlideOverOpen(false);
              onCloseForm();
            }}
          ></div>

          {/* Form wrapper */}
          <div className={`relative w-full ${campaignCreationType === 'automated' ? 'max-w-5xl' : 'max-w-xl'} bg-white h-full shadow-xl flex flex-col z-10 transition-all duration-300`}>
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight">
                  {editingCampaign ? `Campaign #${editingCampaign.id}` : (campaignCreationType === 'automated' ? 'Automated Follow-up Campaign' : 'Create Target Campaign')}
                </h2>
              </div>
              <button 
                onClick={() => {
                  setIsSlideOverOpen(false);
                  onCloseForm();
                }}
                className="p-1.5 hover:bg-border-subtle rounded-full text-text-secondary cursor-pointer animate-pulse"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campaign Creation Type Selector (only for new campaigns) */}
            {!editingCampaign && (
              <div className="border-b border-border-subtle bg-bg-neutral/40 p-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCampaignCreationType('one-time')}
                  className={`flex-1 text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    campaignCreationType === 'one-time'
                      ? 'bg-white text-brand-primary shadow-xs border-border-subtle font-bold'
                      : 'text-text-secondary hover:text-text-primary bg-transparent border-transparent'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  One-Time Broadcast
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignCreationType('automated')}
                  className={`flex-1 text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    campaignCreationType === 'automated'
                      ? 'bg-white text-brand-primary shadow-xs border-border-subtle font-bold'
                      : 'text-text-secondary hover:text-text-primary bg-transparent border-transparent'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                  Automated Reminder Schedule
                </button>
              </div>
            )}

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {campaignCreationType === 'automated' ? (
                <div className="space-y-6">
                  {/* Explanatory introduction */}
                  <div className="bg-brand-bg-active/20 border border-brand-primary/10 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-brand-primary">
                      <Sparkles className="w-4 h-4 text-brand-primary" />
                      <h4 className="text-xs font-bold">Automated Sequence Settings</h4>
                    </div>
                    <p className="text-xxs text-text-secondary leading-relaxed">
                      Choose which email should be sent on each reminder day. Customers will automatically receive the selected email template at the configured time after becoming an Abandoned Checkout lead. Only enabled days will trigger an email.
                    </p>
                  </div>

                  {/* Target Lead Type selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-neutral/40 p-4 rounded-lg border border-border-subtle">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-text-primary block">Target Lead Trigger</span>
                      <span className="text-xxs text-text-secondary block">Events that activate this automated schedule</span>
                    </div>
                    <div className="relative">
                      <select
                        value={selectedLeadType}
                        onChange={(e) => setSelectedLeadType(e.target.value)}
                        className="bg-white border border-border-subtle text-xs font-semibold text-text-primary px-3 py-2 rounded-md focus:outline-none focus:border-brand-primary pr-8 appearance-none cursor-pointer"
                      >
                        <option value="Abandoned Checkout">Abandoned Checkout</option>
                        <option value="New Customer Onboarding" disabled>New Customer Onboarding (Coming Soon)</option>
                        <option value="Post-Purchase Feedback" disabled>Post-Purchase Feedback (Coming Soon)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-text-secondary absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Split Layout: day-table and visualization */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT PART: Day Configuration Table (7 cols on lg) */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="overflow-x-auto border border-border-subtle rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-bg-neutral/80 border-b border-border-subtle">
                              <th className="p-2.5 font-semibold text-text-secondary uppercase w-12 text-center">Status</th>
                              <th className="p-2.5 font-semibold text-text-secondary uppercase w-24">Day</th>
                              <th className="p-2.5 font-semibold text-text-secondary uppercase w-24">Send Time</th>
                              <th className="p-2.5 font-semibold text-text-secondary uppercase">Email Template</th>
                              <th className="p-2.5 font-semibold text-text-secondary uppercase w-12 text-center">Preview</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {reminderSchedule.map((dayConfig) => {
                              const isEnabled = dayConfig.enabled;
                              const selectedTemplate = templates.find(t => t.id === dayConfig.templateId);
                              
                              const filteredTemplates = templates.filter(t => 
                                t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                                t.id.toLowerCase().includes(templateSearchQuery.toLowerCase())
                              );

                              return (
                                <tr 
                                  key={dayConfig.day} 
                                  className={`transition-colors duration-150 ${
                                    isEnabled 
                                      ? 'bg-white hover:bg-bg-neutral/20' 
                                      : 'bg-gray-50/50 text-text-secondary opacity-70'
                                  }`}
                                >
                                  {/* Status Toggle Column */}
                                  <td className="p-2 text-center align-middle">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDay(dayConfig.day)}
                                      className={`relative inline-flex h-4 w-7.5 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                          isEnabled ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                  </td>

                                  {/* Day Name Column */}
                                  <td className="p-2 font-bold align-middle">
                                    <span className={`${isEnabled ? 'text-text-primary' : 'text-gray-400'}`}>
                                      {dayConfig.day}
                                    </span>
                                  </td>

                                  {/* Send Time Input Column */}
                                  <td className="p-2 align-middle">
                                    <input
                                      type="time"
                                      value={dayConfig.time}
                                      disabled={!isEnabled}
                                      onChange={(e) => handleTimeChange(dayConfig.day, e.target.value)}
                                      className={`w-22 text-xs border rounded-md px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer transition-all ${
                                        isEnabled 
                                          ? 'bg-white border-border-subtle text-text-primary hover:border-text-secondary' 
                                          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                      }`}
                                    />
                                  </td>

                                  {/* Email Template Searchable Dropdown Column */}
                                  <td className="p-2 align-middle relative">
                                    {isEnabled ? (
                                      <div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (openDropdownDay === dayConfig.day) {
                                              setOpenDropdownDay(null);
                                            } else {
                                              setOpenDropdownDay(dayConfig.day);
                                              setTemplateSearchQuery('');
                                            }
                                          }}
                                          className="w-full text-left text-xs bg-white border border-border-subtle rounded-md px-2.5 py-1 flex items-center justify-between hover:border-text-secondary focus:outline-none focus:border-brand-primary cursor-pointer transition-colors"
                                        >
                                          <span className="truncate">
                                            {selectedTemplate ? selectedTemplate.name : 'Select a Template'}
                                          </span>
                                          <ChevronDown className="w-3 h-3 text-text-secondary ml-1.5 flex-shrink-0" />
                                        </button>

                                        {openDropdownDay === dayConfig.day && (
                                          <>
                                            <div 
                                              className="fixed inset-0 z-20" 
                                              onClick={() => setOpenDropdownDay(null)}
                                            ></div>
                                            
                                            <div className="absolute left-1 right-1 top-9 bg-white border border-border-subtle rounded-md shadow-lg z-30 p-2 space-y-2 max-h-48 overflow-y-auto animate-fade-in">
                                              <div className="sticky top-0 bg-white pb-1 border-b border-border-subtle">
                                                <input
                                                  type="text"
                                                  placeholder="Search templates..."
                                                  value={templateSearchQuery}
                                                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                                  className="w-full text-[11px] border border-border-subtle rounded px-2 py-1 focus:outline-none focus:border-brand-primary"
                                                  autoFocus
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                {filteredTemplates.length === 0 ? (
                                                  <p className="text-[10px] text-text-secondary p-1.5 text-center">No match</p>
                                                ) : (
                                                  filteredTemplates.map(t => (
                                                    <button
                                                      key={t.id}
                                                      type="button"
                                                      onClick={() => handleTemplateChange(dayConfig.day, t.id)}
                                                      className={`w-full text-left text-[11px] px-2 py-1 rounded flex flex-col hover:bg-brand-bg-active hover:text-brand-primary transition-colors cursor-pointer ${
                                                        t.id === dayConfig.templateId ? 'bg-brand-bg-active text-brand-primary font-bold' : 'text-text-primary'
                                                      }`}
                                                    >
                                                      <span className="truncate font-medium">{t.name}</span>
                                                      <span className="text-[9px] text-text-secondary truncate">{t.title}</span>
                                                    </button>
                                                  ))
                                                )}
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-full text-xs bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1 text-gray-400 font-semibold select-none cursor-not-allowed">
                                        {selectedTemplate ? selectedTemplate.name : 'Select a Template'}
                                      </div>
                                    )}
                                  </td>

                                  {/* Preview Action Column */}
                                  <td className="p-2 text-center align-middle">
                                    <button
                                      type="button"
                                      disabled={!selectedTemplate}
                                      onClick={() => setPreviewModalTemplate(selectedTemplate || null)}
                                      className={`p-1 rounded-full border transition-all ${
                                        selectedTemplate
                                          ? 'text-brand-primary border-brand-primary/20 bg-brand-bg-active hover:bg-brand-primary hover:text-white cursor-pointer'
                                          : 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed'
                                      }`}
                                      title={selectedTemplate ? `Preview "${selectedTemplate.name}"` : "No template"}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT PART: Workflow Visualization (5 cols on lg) */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Live Workflow Preview Card */}
                      <div className="border border-border-subtle rounded-xl p-4 bg-white space-y-4">
                        <div>
                          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Play className="w-3 h-3 text-brand-primary" />
                            Active Automation Path
                          </h3>
                          <p className="text-[10px] text-text-secondary mt-0.5">
                            Live workflow updates dynamically as toggled
                          </p>
                        </div>

                        <div className="relative pl-6 space-y-3.5">
                          {/* Circle for start node */}
                          <div className="absolute left-[3px] top-1.5 w-2 h-2 rounded-full bg-brand-primary ring-4 ring-brand-primary/10"></div>
                          
                          <div className="space-y-0.5">
                            <span className="font-bold text-text-primary text-xs block">Lead Registered</span>
                            <span className="text-[10px] text-text-secondary block">Trigger: Abandoned Checkout detected</span>
                          </div>

                          {/* Render dynamic list */}
                          {(() => {
                            const activeDays = reminderSchedule.filter(d => d.enabled);

                            if (activeDays.length === 0) {
                              return (
                                <div className="pl-3 border-l-2 border-dashed border-gray-200 py-3 space-y-1.5">
                                  <p className="text-3xs text-amber-600 font-semibold flex items-center gap-1 leading-normal">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    Automation Paused. No active days enabled.
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-0 border-l border-brand-primary/20 pl-2">
                                {activeDays.map((dayConfig) => {
                                  const template = templates.find(t => t.id === dayConfig.templateId);
                                  return (
                                    <div key={dayConfig.day} className="relative py-1.5 pl-4">
                                      <div className="absolute -left-[12.5px] top-3 w-2 h-2 rounded-full bg-brand-primary border border-white"></div>
                                      <div className="bg-bg-neutral/40 border border-border-subtle rounded p-2 text-xxs flex justify-between items-center gap-2">
                                        <div>
                                          <span className="font-bold text-text-primary block">{dayConfig.day}</span>
                                          <span className="text-[10px] text-text-secondary block truncate max-w-[140px]">
                                            Sends: {template ? template.name : 'Unknown template'}
                                          </span>
                                        </div>
                                        <span className="bg-brand-bg-active text-brand-primary font-bold px-1 rounded text-[10px] flex-shrink-0">
                                          {dayConfig.time}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {/* Terminal Node */}
                          <div className="flex items-start gap-2 pt-1">
                            <div className="w-5 h-5 rounded-full bg-emerald-50 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xxs shrink-0">
                              ✓
                            </div>
                            <div className="space-y-0.5 pt-0.5">
                              <span className="font-semibold text-text-primary text-xs block">Sequence Complete</span>
                              <span className="text-[10px] text-text-secondary block">End of customized cart recovery path</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visual Timeline Flow */}
                      <div className="border border-border-subtle rounded-xl p-4 bg-white space-y-3">
                        <div>
                          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                            Timeline Preview
                          </h3>
                        </div>

                        <div className="relative pl-6 space-y-2.5">
                          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                          {reminderSchedule.map((dayConfig) => {
                            const isEnabled = dayConfig.enabled;
                            const template = templates.find(t => t.id === dayConfig.templateId);
                            
                            return (
                              <div key={dayConfig.day} className="relative flex items-center justify-between gap-2 text-3xs">
                                <div className={`absolute -left-[19.5px] top-0.5 w-3 h-3 rounded-full border border-white flex items-center justify-center text-[7px] ${
                                  isEnabled ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-400'
                                }`}>
                                  {isEnabled ? '✓' : '•'}
                                </div>
                                <span className={`font-semibold ${isEnabled ? 'text-text-primary font-bold' : 'text-gray-400'}`}>
                                  {dayConfig.day} {isEnabled && `(${dayConfig.time})`}
                                </span>
                                {isEnabled ? (
                                  <span className="text-brand-primary font-semibold truncate max-w-[110px]">
                                    {template ? template.name : 'No template'}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 italic">Skipped</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 pt-1">
                  {/* Section 1: Campaign Information */}
                  <div className="flex flex-col gap-5">
                    <div className="border-b border-border-subtle pb-3">
                      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        1. Campaign Information
                      </h3>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-primary mb-1.5">Campaign Name *</label>
                        <input 
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Monsoon VIP Discount Broadcast"
                          className={`w-full text-xs bg-white border px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary font-semibold transition-colors ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-border-subtle'}`}
                        />
                        {errors.name && <p className="text-xxs text-red-600 mt-1">{errors.name}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1.5">Campaign Channel Type</label>
                          <div className="grid grid-cols-2 bg-bg-neutral p-1.5 border border-border-subtle rounded-xl gap-2">
                            <button 
                              type="button"
                              onClick={() => setType('Email')}
                              className={`text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${type === 'Email' ? 'bg-white text-brand-primary shadow-xs border border-border-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                              <Mail className="w-4 h-4" /> Email
                            </button>

                            <button 
                              type="button"
                              onClick={() => setType('WhatsApp')}
                              className={`text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${type === 'WhatsApp' ? 'bg-white text-brand-primary shadow-xs border border-border-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                              <MessageSquare className="w-4 h-4" /> WhatsApp
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1.5">Status Override</label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                            className="w-full text-xs bg-white border border-border-subtle px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary font-semibold transition-colors cursor-pointer"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Sent">Sent (Live)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Audience Selection */}
                  <div className="flex flex-col gap-5">
                    <div className="border-b border-border-subtle pb-3">
                      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        2. Audience Selection
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      {[
                        { label: 'All Customers', desc: 'Sends to all 342 active profiles' },
                        { label: 'VIP Customers', desc: 'Target only VIP segment members (82)' },
                        { label: 'At Risk Customers', desc: 'Re-engage cold segment (12)' },
                        { label: 'New Customers', desc: 'Target onboarding profiles (42)' }
                      ].map(aud => (
                        <div 
                          key={aud.label}
                          onClick={() => setAudience(aud.label)}
                          className={`border p-4 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 shadow-3xs ${
                            audience === aud.label 
                              ? 'border-brand-primary bg-brand-bg-active ring-1 ring-brand-primary/20' 
                              : 'border-border-subtle hover:border-text-secondary hover:bg-bg-neutral/10 bg-white'
                          }`}
                        >
                          <span className={`text-xs font-bold block ${audience === aud.label ? 'text-brand-primary' : 'text-text-primary'}`}>{aud.label}</span>
                          <span className="text-3xs text-text-secondary block leading-normal">{aud.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Delivery Settings */}
                  <div className="flex flex-col gap-5">
                    <div className="border-b border-border-subtle pb-3">
                      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        3. Delivery Settings
                      </h3>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-x-6 gap-y-3">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input 
                            type="radio" 
                            id="del-now" 
                            name="del-time" 
                            checked={sendType === 'Now'} 
                            onChange={() => setSendType('Now')}
                            className="w-4 h-4 text-brand-primary border-border-subtle focus:ring-brand-primary focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-text-primary group-hover:text-brand-primary transition-colors select-none">Send immediately (Live)</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input 
                            type="radio" 
                            id="del-sch" 
                            name="del-time" 
                            checked={sendType === 'Schedule'} 
                            onChange={() => setSendType('Schedule')}
                            className="w-4 h-4 text-brand-primary border-border-subtle focus:ring-brand-primary focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-text-primary group-hover:text-brand-primary transition-colors select-none">Schedule for future date</span>
                        </label>
                      </div>

                      {sendType === 'Schedule' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-bg-neutral/60 rounded-xl border border-border-subtle shadow-xxs animate-fade-in">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-text-secondary mb-1.5">Target Date</label>
                            <input 
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="w-full text-xs bg-white border border-border-subtle px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary font-semibold transition-colors cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-text-secondary mb-1.5">Target Time</label>
                            <input 
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              className="w-full text-xs bg-white border border-border-subtle px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary font-semibold transition-colors cursor-pointer"
                            />
                          </div>
                          {errors.schedule && <p className="col-span-2 text-xxs text-red-600 font-bold mt-1">{errors.schedule}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 4: Message Selection */}
                  <div className="flex flex-col gap-5">
                    <div className="border-b border-border-subtle pb-3">
                      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        4. Message & Template Selection
                      </h3>
                    </div>

                    {type === 'Email' ? (
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1.5">Email Template Resource *</label>
                          <select 
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            className="w-full text-xs bg-white border border-border-subtle px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary font-semibold transition-colors cursor-pointer"
                          >
                            {templates.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} (Ref: {t.id})
                              </option>
                            ))}
                          </select>
                          {errors.templateId && <p className="text-xxs text-red-600 mt-1 font-semibold">{errors.templateId}</p>}
                        </div>

                        <button 
                          type="button"
                          onClick={handlePreviewMessageClick}
                          className="text-xs font-bold text-brand-primary bg-brand-bg-active hover:bg-brand-primary hover:text-white px-4 py-2.5 rounded-lg border border-brand-primary/20 flex items-center gap-1.5 cursor-pointer transition-all self-start shadow-3xs"
                        >
                          <Eye className="w-4 h-4" /> Preview Rendered Message
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-brand-primary leading-relaxed flex items-start gap-2.5 shadow-3xs">
                        <MessageSquare className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                          <strong className="font-bold text-emerald-900 block mb-0.5">WhatsApp Broadcast Connection Active</strong> 
                          WhatsApp template layouts are loaded directly from your meta business connection. The default greeting message handles customer parameters dynamically.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer with sticky actions */}
            <div className="border-t border-border-subtle p-4 bg-bg-neutral flex justify-between items-center gap-3 shrink-0">
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

              {campaignCreationType === 'automated' ? (
                <div className="flex items-center gap-4">
                  <div className="text-xs text-text-secondary">
                    {hasUnsavedChanges ? (
                      <span className="text-amber-600 font-semibold flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" /> Unsaved changes
                      </span>
                    ) : (
                      <span className="text-brand-primary font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> All changes saved
                      </span>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      handleSaveSchedule();
                      triggerToast('Success: Automated Reminder Settings have been saved and are live!');
                    }}
                    disabled={!hasUnsavedChanges}
                    className={`px-5 py-2 rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                      hasUnsavedChanges
                        ? 'bg-brand-primary hover:bg-brand-primary-hover text-white'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 h-4" /> Save Automation Settings
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => handleSaveCampaign('draft')}
                    className="px-4 py-2 border border-border-subtle hover:bg-white rounded text-sm text-text-primary font-medium transition-colors cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSaveCampaign('publish')}
                    className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Send Campaign
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CONFIRMATION BULK ACTION DIALOG */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xxs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-border-subtle rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-[#B9D7FC] text-slate-900 p-4 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wide">Confirm Bulk Campaign Dispatch</h3>
              <button 
                onClick={() => setShowBulkModal(false)} 
                className="text-slate-800 hover:text-slate-950 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-text-primary leading-relaxed">
                You are about to run the action <strong className="text-brand-primary">{bulkAction === 'email' ? 'Queue Email' : 'WhatsApp Broadcast'}</strong> on the following selected campaign(s):
              </p>

              <div className="bg-bg-neutral border border-border-subtle rounded p-3 text-xs max-h-40 overflow-y-auto space-y-1.5">
                {selectedCampaignIds.map(cid => {
                  const camp = campaigns.find(c => c.id === cid);
                  return (
                    <div key={cid} className="font-semibold text-text-primary flex justify-between">
                      <span>• {camp?.name}</span>
                      <span className="font-mono text-text-secondary text-xxs">{cid}</span>
                    </div>
                  );
                })}
              </div>

              <div className="text-xxs text-text-secondary leading-normal flex gap-1.5 bg-amber-50 p-3.5 border border-amber-200 rounded-lg text-amber-800">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Live broadcast warning:</strong> Once confirmed, emails and alerts will be queued in the background queue immediately. This action cannot be reverted.
                </div>
              </div>
            </div>

            <div className="bg-bg-neutral p-4 border-t border-border-subtle flex justify-end gap-2">
              <button 
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border border-border-subtle text-xs font-semibold text-text-primary bg-white rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmBulkAction}
                className="px-5 py-2 bg-brand-primary text-white text-xs font-semibold rounded shadow-sm hover:bg-brand-primary-hover"
              >
                Confirm Bulk Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER PREVIEW TEMPLATE DIALOG */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xxs flex items-center justify-center z-55 p-4">
          <div className="bg-white border border-border-subtle rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <div className="bg-[#B9D7FC] text-slate-900 p-4 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wide">Rendered Email Template Sample</h3>
              <button 
                onClick={() => setShowPreviewModal(false)} 
                className="text-slate-800 hover:text-slate-950 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="border border-border-subtle rounded p-4 bg-bg-neutral font-sans text-xs whitespace-pre-wrap leading-relaxed text-text-primary">
                {previewText}
              </div>
              <p className="text-xxs text-text-secondary mt-3">
                * Note: customer parameters such as <code className="bg-bg-neutral font-mono text-[10px] p-0.5 rounded">{"{{customer_name}}"}</code> are automatically compiled from customer profiles during final rendering.
              </p>
            </div>

            <div className="bg-bg-neutral p-4 border-t border-border-subtle flex justify-end">
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded shadow-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER ROW TEMPLATE PREVIEW DIALOG */}
      {previewModalTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xxs flex items-center justify-center z-55 p-4">
          <div className="bg-white border border-border-subtle rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-[#B9D7FC] text-slate-900 p-4 border-b border-gray-300 flex justify-between items-center">
              <div>
                <span className="text-xxs font-bold text-slate-700 bg-white/40 border border-slate-400/30 rounded px-2 py-0.5">
                  Email Preview
                </span>
                <h3 className="text-sm font-extrabold uppercase tracking-wide mt-1.5">
                  {previewModalTemplate.name}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewModalTemplate(null)} 
                className="text-slate-800 hover:text-slate-950 p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Client Visual Sandbox */}
            <div className="p-5 space-y-4">
              <div className="border border-border-subtle rounded-lg overflow-hidden shadow-xxs">
                {/* Header/Metadata lines of email client */}
                <div className="bg-gray-50 border-b border-border-subtle p-3 space-y-2 text-xxs font-sans">
                  <div className="flex">
                    <span className="w-12 font-semibold text-text-secondary">From:</span>
                    <span className="text-text-primary font-medium">Apex Merchant Sales &lt;sales@merchant-store.com&gt;</span>
                  </div>
                  <div className="flex">
                    <span className="w-12 font-semibold text-text-secondary">To:</span>
                    <span className="text-text-primary font-medium">Aarav Sharma &lt;aarav.sharma@example.com&gt;</span>
                  </div>
                  <div className="flex">
                    <span className="w-12 font-semibold text-text-secondary">Subject:</span>
                    <span className="text-brand-primary font-bold">{previewModalTemplate.title}</span>
                  </div>
                </div>

                {/* Body section of email client */}
                <div className="p-4 bg-white min-h-[160px] font-sans text-xs whitespace-pre-wrap leading-relaxed text-text-primary">
                  {previewModalTemplate.body.replace('{{customer_name}}', 'Aarav Sharma')}
                </div>
              </div>

              <div className="text-3xs text-text-secondary flex gap-1.5 bg-bg-neutral p-3 border border-border-subtle rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 text-text-secondary mt-0.5" />
                <div>
                  <strong>Compilation Note:</strong> Template variables like <code className="bg-white px-1 py-0.5 border border-border-subtle font-mono text-[9px] rounded">{"{{customer_name}}"}</code> are dynamically resolved for each individual checkout lead prior to delivery dispatch.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-bg-neutral p-4 border-t border-border-subtle flex justify-end">
              <button 
                type="button"
                onClick={() => setPreviewModalTemplate(null)}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded shadow-sm cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
