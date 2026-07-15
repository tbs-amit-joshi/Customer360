import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, FileText, Trash2, Edit, X, Bold, Italic, 
  Link, List, AlertCircle, AlertTriangle 
} from 'lucide-react';
import { EmailTemplate } from '../types';

interface EmailTemplatesViewProps {
  templates: EmailTemplate[];
  onAddTemplate: (template: EmailTemplate) => void;
  onUpdateTemplate: (template: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  initialOpenForm: boolean;
  onCloseForm: () => void;
}

export default function EmailTemplatesView({
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  initialOpenForm,
  onCloseForm
}: EmailTemplatesViewProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(initialOpenForm);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channelType, setChannelType] = useState<'Email' | 'WhatsApp' | 'Notification'>('Email');

  // Validations
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Check if name already exists (excluding editing template)
  const isDuplicateName = useMemo(() => {
    if (editingTemplate) {
      return templates.some(t => t.id !== editingTemplate.id && t.name.toLowerCase().trim() === name.toLowerCase().trim());
    }
    return templates.some(t => t.name.toLowerCase().trim() === name.toLowerCase().trim());
  }, [name, templates, editingTemplate]);

  const handleNewClick = () => {
    setEditingTemplate(null);
    setName('');
    setTitle('');
    setBody('');
    setChannelType('Email');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEditClick = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setTitle(template.title);
    setBody(template.body);
    setChannelType(template.channelType || 'Email');
    setErrors({});
    setIsModalOpen(true);
  };

  // Mock basic rich text formatting buttons
  const applyFormat = (formatType: 'bold' | 'italic' | 'list') => {
    if (formatType === 'bold') {
      setBody(prev => prev + ' **bold text**');
    } else if (formatType === 'italic') {
      setBody(prev => prev + ' *italic text*');
    } else if (formatType === 'list') {
      setBody(prev => prev + '\n- Item 1\n- Item 2');
    }
  };

  // Save submit handler
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Template name is required';
    if (!title.trim()) newErrors.title = 'Subject title is required';
    if (!body.trim()) newErrors.body = 'Template body is required';
    if (isDuplicateName) newErrors.name = 'A template with this name already exists';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingTemplate) {
      const updated: EmailTemplate = {
        ...editingTemplate,
        name,
        title,
        body,
        channelType
      };
      onUpdateTemplate(updated);
    } else {
      const nextId = 'TMP-' + (100 + templates.length + 5);
      const created: EmailTemplate = {
        id: nextId,
        name,
        title,
        body,
        channelType
      };
      onAddTemplate(created);
    }

    setIsModalOpen(false);
    onCloseForm();
  };

  const handleDeleteConfirmClick = (template: EmailTemplate) => {
    setDeletingTemplate(template);
  };

  const handleConfirmDelete = () => {
    if (deletingTemplate) {
      onDeleteTemplate(deletingTemplate.id);
      setDeletingTemplate(null);
    }
  };

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.body.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [templates, searchQuery]);

  // Sorting & Pagination States
  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');
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

  const sortedTemplates = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredTemplates;
    return [...filteredTemplates].sort((a, b) => {
      let valA = a[sortColumn as keyof EmailTemplate];
      let valB = b[sortColumn as keyof EmailTemplate];

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
  }, [filteredTemplates, sortColumn, sortDirection]);

  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedTemplates.slice(startIndex, startIndex + pageSize);
  }, [sortedTemplates, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedTemplates.length / pageSize) || 1;

  const SortArrow = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <span className="text-gray-300 ml-1">↕</span>;
    if (sortDirection === 'asc') return <span className="text-brand-primary font-bold ml-1">↑</span>;
    return <span className="text-brand-primary font-bold ml-1">↓</span>;
  };

  const getRenderedPreview = (text: string) => {
    return text
      .replace(/\{\{\s*customer_name\s*\}\}/g, 'Emma Watson')
      .replace(/\{\{\s*customer_id\s*\}\}/g, 'CUST-8821')
      .replace(/\{\{\s*discount_code\s*\}\}/g, 'VIPPRO20')
      .replace(/\{\{\s*order_id\s*\}\}/g, '#SH-90412');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Templates</h1>
          <p className="text-xs text-text-secondary mt-1">
            Build styled merchant communication layouts. Link templates instantly to customer segment activities.
          </p>
        </div>
        <button 
          onClick={handleNewClick}
          className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white py-1.5 px-4 rounded text-sm font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-bg-neutral border border-border-subtle p-3 rounded-lg flex items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Search templates..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-white border border-border-subtle pl-9 pr-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-text-secondary"
          />
        </div>
      </div>

      {/* TEMPLATE GRID */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white border border-border-subtle p-12 text-center rounded-lg">
          <div className="w-16 h-16 bg-bg-neutral rounded-full flex items-center justify-center mx-auto mb-4 text-text-secondary">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">No templates found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-2">
            Add templates to automate customer thank you newsletters, coupon triggers, and reminders.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-300 rounded-xl bg-white shadow-xxs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#B9D7FC] text-slate-900 text-[12.5px] font-bold border-b border-gray-300">
                  <th 
                    className="p-3 w-[12%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('id')}
                  >
                    Template ID <SortArrow column="id" />
                  </th>
                  <th 
                    className="p-3 w-[20%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('name')}
                  >
                    Template Name <SortArrow column="name" />
                  </th>
                  <th 
                    className="p-3 w-[13%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('channelType')}
                  >
                    Channel <SortArrow column="channelType" />
                  </th>
                  <th 
                    className="p-3 w-[22%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('title')}
                  >
                    Subject Title <SortArrow column="title" />
                  </th>
                  <th 
                    className="p-3 w-[23%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300"
                    onClick={() => handleSort('body')}
                  >
                    Body Content Preview <SortArrow column="body" />
                  </th>
                  <th className="p-3 w-[10%] text-xs font-bold text-slate-900 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white text-[13.5px]">
                {paginatedTemplates.map(temp => (
                  <tr key={temp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-3 font-mono font-bold text-text-primary border-r border-b border-gray-200 truncate" title={temp.id}>{temp.id}</td>
                    <td className="p-3 font-bold text-text-primary border-r border-b border-gray-200 truncate" title={temp.name}>{temp.name}</td>
                    <td className="p-3 border-r border-b border-gray-200 align-middle">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        temp.channelType === 'WhatsApp' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        temp.channelType === 'Notification' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {temp.channelType || 'Email'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-text-primary border-r border-b border-gray-200 truncate" title={temp.title}>{temp.title}</td>
                    <td className="p-3 text-text-secondary border-r border-b border-gray-200 truncate font-medium" title={temp.body}>{temp.body}</td>
                    <td className="p-3 text-center border-b border-gray-200">
                      <div className="flex justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(temp)}
                          className="p-1 hover:bg-bg-neutral rounded text-text-primary border border-transparent hover:border-border-subtle cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteConfirmClick(temp)}
                          className="p-1 hover:bg-red-50 rounded text-red-600 border border-transparent hover:border-red-100 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="border-t border-border-subtle px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card text-xs text-text-secondary">
            <div>
              Showing <span className="font-semibold text-text-primary">{Math.min((currentPage - 1) * pageSize + 1, sortedTemplates.length)}</span> to{' '}
              <span className="font-semibold text-text-primary">{Math.min(currentPage * pageSize, sortedTemplates.length)}</span> of{' '}
              <span className="font-semibold text-text-primary">{sortedTemplates.length}</span> records
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

      {/* SCREEN B — ADD/EDIT TEMPLATE (centered modal, expanded layout) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xxs flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white border border-border-subtle rounded-xl shadow-2xl max-w-[1100px] w-full max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            
            {/* Header */}
            <div className="bg-[#B9D7FC] text-slate-900 px-5 py-4 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                {editingTemplate ? `Edit Template (Ref: ${editingTemplate.id})` : 'Create Custom Template'}
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  onCloseForm();
                }} 
                className="text-slate-800 hover:text-slate-950 p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTemplate} className="p-6 flex-1 overflow-y-auto space-y-6 flex flex-col min-h-0">
              
              {/* DUPLICATE NAME CHECK ALERT */}
              {isDuplicateName && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-800 flex gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Naming Collision:</span> A template with the name "{name}" is already saved in the database. Please provide a unique identifier name.
                  </div>
                </div>
              )}

              {/* 2-Column Side-By-Side Layout to Expand the Description Box */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0">
                
                {/* Left Column: Meta Settings */}
                <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
                  <div className="bg-slate-50 border border-border-subtle/60 rounded-xl p-4.5 space-y-5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b border-border-subtle/50 pb-2">
                      Template Information
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">Template Name *</label>
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. VIP Thank You Coupon"
                        className={`w-full text-xs border px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-bg-neutral disabled:text-text-secondary ${
                          errors.name || isDuplicateName ? 'border-red-500' : 'border-border-subtle'
                        }`}
                      />
                      {errors.name && <p className="text-xxs text-red-600 mt-1">{errors.name}</p>}
                      <p className="text-[10px] text-text-secondary mt-1">This identifier name must be completely unique.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">Channel Type *</label>
                      <select
                        value={channelType}
                        onChange={(e) => setChannelType(e.target.value as 'Email' | 'WhatsApp' | 'Notification')}
                        className="w-full text-xs border border-border-subtle px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary bg-white text-text-primary outline-none cursor-pointer font-medium"
                      >
                        <option value="Email">✉️ Email</option>
                        <option value="WhatsApp">💬 WhatsApp</option>
                        <option value="Notification">🔔 Notification</option>
                      </select>
                      <p className="text-[10px] text-text-secondary mt-1">Select the delivery channel for dispatching this template layout.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">Subject Title *</label>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Exclusive 20% discount just for you!"
                        className={`w-full text-xs border px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary ${
                          errors.title ? 'border-red-500' : 'border-border-subtle'
                        }`}
                      />
                      {errors.title && <p className="text-xxs text-red-600 mt-1">{errors.title}</p>}
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[11px] text-blue-800 space-y-1.5 mt-auto">
                    <span className="font-bold uppercase tracking-wider text-[10px] block text-blue-900">Editor Tip</span>
                    <p className="leading-relaxed">
                      You can format text inside the body content using Markdown. Use bold syntax like <strong className="font-bold">**text**</strong> or italics like <em className="italic">*text*</em> to emphasize template layouts.
                    </p>
                  </div>
                </div>

                {/* Right Column: Expanded Editor Canvas */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-text-primary">HTML / Markdown Body *</label>
                    
                    {/* Basic editor styling formatting tools */}
                    <div className="flex bg-bg-neutral border border-border-subtle rounded p-0.5 gap-0.5 shadow-sm">
                      <button 
                        type="button" 
                        onClick={() => applyFormat('bold')} 
                        className="p-1.5 hover:bg-white rounded text-text-primary cursor-pointer transition-colors"
                        title="Insert Bold Text"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyFormat('italic')} 
                        className="p-1.5 hover:bg-white rounded text-text-primary cursor-pointer transition-colors"
                        title="Insert Italic Text"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyFormat('list')} 
                        className="p-1.5 hover:bg-white rounded text-text-primary cursor-pointer transition-colors"
                        title="Insert List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Dear {{customer_name}},\n\nThank you for choosing..."
                    className={`w-full h-[320px] lg:h-[380px] text-xs md:text-sm border px-3 py-3 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-brand-primary leading-relaxed shadow-inner ${
                      errors.body ? 'border-red-500' : 'border-border-subtle'
                    }`}
                  />
                  {errors.body && <p className="text-xxs text-red-600 mt-1">{errors.body}</p>}
                  
                  <p className="text-[10px] text-text-secondary mt-1.5 leading-normal">
                    You can use dynamic merge tags like <code className="bg-bg-neutral px-1.5 py-0.5 rounded text-pink-700 font-mono text-[10.5px]">{"{{customer_name}}"}</code> to insert values dynamically.
                  </p>
                </div>

              </div>

              {/* Modal actions */}
              <div className="pt-4 border-t border-border-subtle flex justify-between items-center gap-4 mt-auto">
                <button 
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-4.5 py-2 border border-brand-primary text-brand-primary hover:bg-brand-primary/5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                  title="Preview layout presentation"
                >
                  <FileText className="w-4 h-4 text-brand-primary" /> Live Preview
                </button>
                <div className="flex gap-2.5">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      onCloseForm();
                    }}
                    className="px-4.5 py-2 border border-border-subtle text-xs font-bold text-text-primary bg-white rounded-lg cursor-pointer hover:bg-bg-neutral transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isDuplicateName}
                    className={`px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer ${
                      isDuplicateName ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-primary-hover text-white'
                    }`}
                  >
                    {editingTemplate ? 'Save Layout' : 'Publish Layout'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SCREEN C — DELETE CONFIRMATION DIALOG */}
      {deletingTemplate && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xxs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-border-subtle rounded-lg shadow-xl max-w-sm w-full overflow-hidden animate-fade-in">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2.5 text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
              <h3 className="text-sm font-bold">Confirm Deletion</h3>
            </div>

            <div className="p-5">
              <p className="text-xs text-text-primary leading-relaxed">
                Are you sure you want to delete the template <strong className="text-red-700">"{deletingTemplate.name}"</strong>? This action cannot be undone and will break auto-campaign queues.
              </p>
            </div>

            <div className="bg-bg-neutral p-4 border-t border-border-subtle flex justify-end gap-2">
              <button 
                onClick={() => setDeletingTemplate(null)}
                className="px-4 py-1.5 border border-border-subtle text-xs font-semibold text-text-primary bg-white rounded cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm cursor-pointer"
              >
                Delete template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN D — LIVE TEMPLATE PREVIEW DIALOG */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-55 p-4 overflow-y-auto">
          <div className="bg-white border border-border-subtle rounded-xl shadow-2xl max-w-[700px] w-full overflow-hidden animate-fade-in my-8 flex flex-col">
            
            {/* Header */}
            <div className="bg-brand-primary text-white p-4.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-white/10 rounded">
                  <FileText className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Template Live Preview</h3>
                  <p className="text-[10px] text-white/80 mt-0.5">Showing mock delivery representation for Emma Watson (CUST-8821)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)} 
                className="text-white hover:text-white/80 p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body Container */}
            <div className="p-6 bg-slate-50 border-b border-border-subtle flex-1 overflow-y-auto max-h-[60vh]">
              
              {channelType === 'Email' && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden text-left">
                  {/* Email Browser Header */}
                  <div className="bg-gray-100/80 px-4 py-3.5 border-b border-gray-200 text-xs text-text-secondary space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-text-primary min-w-[55px]">Subject:</span>
                      <span className="font-bold text-text-primary text-[13px]">{title || '(No Subject Title Provided)'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-text-primary min-w-[55px]">From:</span>
                      <span>Apex Merchant Sales <code className="bg-gray-200 px-1 py-0.2 rounded text-[10.5px] font-mono">sales@merchant-store.com</code></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-text-primary min-w-[55px]">To:</span>
                      <span>Emma Watson <code className="bg-gray-200 px-1 py-0.2 rounded text-[10.5px] font-mono">emma.watson@example.com</code></span>
                    </div>
                  </div>
                  
                  {/* Email Content Frame */}
                  <div className="p-6 text-text-primary text-sm leading-relaxed whitespace-pre-wrap min-h-[200px] bg-white">
                    {body ? getRenderedPreview(body) : (
                      <span className="text-text-secondary italic">This template body content is currently empty. Please write some template text.</span>
                    )}
                  </div>
                  
                  {/* Email Footer */}
                  <div className="bg-gray-50 border-t border-gray-200 p-4 text-[10.5px] text-text-secondary text-center">
                    This automated message was sent using Apex Outfitters CRM templates. To manage email alerts, go to Settings.
                  </div>
                </div>
              )}

              {channelType === 'WhatsApp' && (
                <div className="max-w-[360px] mx-auto bg-[#E5DDD5] border border-gray-300 rounded-2xl shadow-md overflow-hidden relative font-sans text-left">
                  {/* WhatsApp Header */}
                  <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-xs border border-white/20">
                        EW
                      </div>
                      <div>
                        <div className="font-bold text-[13px] leading-tight">Apex Outfitters Store</div>
                        <div className="text-[10px] text-teal-100 font-medium">Online Support</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                      <span className="text-[11px] font-bold">💬 WA</span>
                    </div>
                  </div>

                  {/* WhatsApp Chat Area */}
                  <div className="p-4 space-y-3 min-h-[250px] overflow-y-auto" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "cover" }}>
                    
                    {/* Timestamp Bubble */}
                    <div className="flex justify-center">
                      <span className="bg-white/85 text-[10px] text-gray-500 px-2 py-0.5 rounded shadow-xxs uppercase tracking-wider font-semibold">Today</span>
                    </div>

                    {/* WhatsApp Message Bubble */}
                    <div className="bg-[#DCF8C6] text-slate-800 text-xs p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%] relative border border-[#cbebb0] ml-1">
                      {/* WhatsApp Title/Header Info */}
                      {title && (
                        <div className="font-bold text-[#075E54] mb-1.5 border-b border-green-200/50 pb-1 text-[11px] tracking-tight">
                          📣 {title}
                        </div>
                      )}
                      {/* Body Content */}
                      <div className="whitespace-pre-wrap font-sans text-[12px] leading-normal text-slate-900">
                        {body ? getRenderedPreview(body) : (
                          <span className="text-gray-400 italic">This WhatsApp template message is currently empty.</span>
                        )}
                      </div>
                      {/* Bubble Time and ticks */}
                      <div className="text-right text-[9px] text-gray-500 mt-1 flex items-center justify-end gap-1 font-medium">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-blue-500 text-[10px]">✓✓</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {channelType === 'Notification' && (
                <div className="max-w-[480px] mx-auto space-y-4 text-left">
                  <div className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-2 text-center">Simulated Push Notification</div>
                  
                  {/* Push Notification Box */}
                  <div className="bg-black/85 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-white/10 flex gap-3 items-start">
                    <div className="w-9 h-9 bg-brand-primary text-white font-extrabold flex items-center justify-center rounded-lg shadow-sm shrink-0 text-xs">
                      TC
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#3b82f6]">Tech CRM Notification</span>
                        <span className="text-[9px] text-white/50">now</span>
                      </div>
                      <div className="font-bold text-xs mt-0.5 text-white truncate">{title || 'Apex Merchant Update'}</div>
                      <div className="text-xs text-white/80 mt-1 whitespace-pre-wrap leading-normal font-medium">
                        {body ? getRenderedPreview(body) : 'This template layout notification content is empty.'}
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-text-secondary mt-1">
                    Push notifications are dispatched directly to the merchant dashboard or customer's device.
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-bg-neutral p-4 flex justify-end gap-3 border-t border-border-subtle">
              <button 
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold px-5 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
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
