import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Terminal, ArrowRight, Eye, 
  X, User, Calendar, ShieldAlert, CheckSquare, ExternalLink 
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onNavigateToModule: (moduleName: string) => void;
}

export default function ActivityLogView({
  logs,
  onNavigateToModule
}: ActivityLogViewProps) {
  // Navigation & Detail states
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Sorting & Pagination States
  const [sortColumn, setSortColumn] = useState<string | null>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Handle Log Export
  const handleExport = () => {
    alert('Assembling activity logging sheets...\nDownload completed: tech_crm_audit_activities.csv');
  };

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
    setCurrentPage(1); // reset to first page on sort change
  };

  // Filter logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (moduleFilter !== 'All' && log.module !== moduleFilter) return false;
      if (userFilter !== 'All' && log.user.name !== userFilter) return false;

      // Date ranges
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        const logDate = new Date(log.timestamp);
        if (logDate < fromDate) return false;
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        // Set to end of day
        toDate.setHours(23, 59, 59, 999);
        const logDate = new Date(log.timestamp);
        if (logDate > toDate) return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          log.recordId.toLowerCase().includes(query) ||
          log.recordName.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.user.name.toLowerCase().includes(query) ||
          log.ipAddress.includes(query)
        );
      }

      return true;
    });
  }, [logs, searchQuery, moduleFilter, userFilter, dateFrom, dateTo]);

  // Sorting Logic
  const sortedLogs = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredLogs;
    return [...filteredLogs].sort((a, b) => {
      let valA: any = a[sortColumn as keyof ActivityLog];
      let valB: any = b[sortColumn as keyof ActivityLog];

      // Custom path mapping for nested user object
      if (sortColumn === 'user') {
        valA = a.user.name;
        valB = b.user.name;
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? (valA > valB ? 1 : -1) 
          : (valB > valA ? 1 : -1);
      }
    });
  }, [filteredLogs, sortColumn, sortDirection]);

  // Pagination bounds
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedLogs.slice(startIndex, startIndex + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedLogs.length / pageSize) || 1;

  // Sorting indicators helper
  const SortArrow = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <span className="text-gray-300 ml-1">↕</span>;
    if (sortDirection === 'asc') return <span className="text-brand-primary font-bold ml-1">↑</span>;
    return <span className="text-brand-primary font-bold ml-1">↓</span>;
  };

  // Extract distinct users for filters
  const distinctUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => set.add(l.user.name));
    return Array.from(set);
  }, [logs]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">System Activity Log</h1>
          <p className="text-xs text-text-secondary mt-1">
            Browse real-time security, lead allocation, and complaint resolution audit trails.
          </p>
        </div>

        <button 
          onClick={handleExport}
          className="bg-bg-neutral hover:bg-border-subtle border border-border-subtle px-3 py-1.5 rounded text-xs font-semibold text-text-primary flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV Log
        </button>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-bg-neutral border border-border-subtle p-3 rounded-lg flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Search by ID, action, user or IP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-white border border-border-subtle pl-9 pr-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-text-secondary"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center justify-start lg:justify-end">
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-secondary font-medium">Module:</span>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded cursor-pointer"
              >
                <option value="All">All Modules</option>
                <option value="Leads">Leads</option>
                <option value="Complaints">Complaints</option>
                <option value="Customers">Customers</option>
                <option value="Campaigns">Campaigns</option>
                <option value="Templates">Templates</option>
                <option value="Settings">Settings</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-text-secondary font-medium">User:</span>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="text-xs bg-white border border-border-subtle px-2 py-1.5 rounded cursor-pointer"
              >
                <option value="All">All Users</option>
                {distinctUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-wrap gap-3 items-center border-t border-border-subtle/60 pt-2 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span>Date From:</span>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-border-subtle rounded p-1 text-xs bg-white text-text-primary"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span>Date To:</span>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-border-subtle rounded p-1 text-xs bg-white text-text-primary"
            />
          </div>

          {(dateFrom || dateTo) && (
            <button 
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="text-xxs text-brand-primary hover:underline font-semibold"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* AUDIT TRAILS GRID TABLE */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-border-subtle p-12 text-center rounded-lg">
          <div className="w-16 h-16 bg-bg-neutral rounded-full flex items-center justify-center mx-auto mb-4 text-text-secondary">
            <Terminal className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">No audit trails registered</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-2">
            No activity log entries found matching selected filters. Clear your criteria to browse.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-300 rounded-xl bg-white shadow-xxs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#B9D7FC] text-slate-900 text-[12.5px] font-bold border-b border-gray-300">
                  <th 
                    className="p-3 w-[16%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300 transition-colors"
                    onClick={() => handleSort('timestamp')}
                  >
                    Date & Time <SortArrow column="timestamp" />
                  </th>
                  <th 
                    className="p-3 w-[18%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300 transition-colors"
                    onClick={() => handleSort('user')}
                  >
                    User / Agent <SortArrow column="user" />
                  </th>
                  <th 
                    className="p-3 w-[11%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300 transition-colors"
                    onClick={() => handleSort('module')}
                  >
                    Module <SortArrow column="module" />
                  </th>
                  <th 
                    className="p-3 w-[27%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300 transition-colors"
                    onClick={() => handleSort('action')}
                  >
                    Action Executed <SortArrow column="action" />
                  </th>
                  <th 
                    className="p-3 w-[18%] text-xs font-bold text-slate-900 uppercase cursor-pointer select-none hover:bg-[#A3CAFC] border-r border-gray-300 transition-colors"
                    onClick={() => handleSort('recordId')}
                  >
                    Record Identifier <SortArrow column="recordId" />
                  </th>
                  <th className="p-3 w-[10%] text-xs font-bold text-slate-900 uppercase text-center">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white text-[13.5px]">
                {paginatedLogs.map(log => {
                  const modColors = {
                    'Leads': 'bg-purple-50 text-purple-700 border-purple-100',
                    'Complaints': 'bg-red-50 text-red-700 border-red-100',
                    'Customers': 'bg-emerald-50 text-brand-primary border-emerald-100',
                    'Campaigns': 'bg-blue-50 text-blue-700 border-blue-100',
                    'Templates': 'bg-pink-50 text-pink-700 border-pink-100',
                    'Settings': 'bg-gray-100 text-gray-700 border-gray-200'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-3 font-medium text-text-primary border-r border-b border-gray-200 truncate" title={new Date(log.timestamp).toLocaleString()}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 border-r border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-bg-active text-brand-primary text-[10px] font-bold flex items-center justify-center border border-brand-primary/10 flex-shrink-0">
                            {log.user.avatar}
                          </div>
                          <span className="font-semibold text-text-primary truncate" title={log.user.name}>{log.user.name}</span>
                        </div>
                      </td>
                      <td className="p-3 border-r border-b border-gray-200 text-center">
                        <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold inline-block ${modColors[log.module]}`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-text-primary border-r border-b border-gray-200 truncate" title={log.action}>{log.action}</td>
                      <td className="p-3 border-r border-b border-gray-200 truncate">
                        <span 
                          onClick={() => {
                            if (log.module === 'Leads') onNavigateToModule('Lead Management');
                            if (log.module === 'Complaints') onNavigateToModule('Complaint Management');
                            if (log.module === 'Customers') onNavigateToModule('Customer Summary');
                          }}
                          className="font-mono text-xs font-bold text-brand-primary cursor-pointer hover:underline"
                        >
                          {log.recordId}
                        </span>
                        <span className="text-xxs text-text-secondary font-medium ml-1.5">({log.recordName})</span>
                      </td>
                      <td className="p-3 text-center border-b border-gray-200">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="p-1 hover:bg-bg-neutral rounded text-text-primary border border-transparent hover:border-border-subtle cursor-pointer"
                          title="View Details"
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

          {/* PAGINATION CONTROLS */}
          <div className="border-t border-border-subtle px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-card text-xs text-text-secondary">
            <div>
              Showing <span className="font-semibold text-text-primary">{Math.min((currentPage - 1) * pageSize + 1, sortedLogs.length)}</span> to{' '}
              <span className="font-semibold text-text-primary">{Math.min(currentPage * pageSize, sortedLogs.length)}</span> of{' '}
              <span className="font-semibold text-text-primary">{sortedLogs.length}</span> records
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
                  // Show pages around the current page
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

      {/* SCREEN B — ACTIVITY LOG DETAIL (slide-over panel) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-xxs"
            onClick={() => setSelectedLog(null)}
          ></div>

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 transition-transform duration-300">
            {/* Header */}
            <div className="border-b border-border-subtle/60 p-6 flex items-center justify-between bg-white">
              <div>
                <span className="text-[10px] font-bold text-text-secondary bg-bg-neutral border border-border-subtle rounded px-2.5 py-1 font-mono tracking-wider">
                  Log Ref: {selectedLog.id}
                </span>
                <h2 className="text-lg font-bold text-text-primary mt-3 tracking-tight">Audit Activity Detail Log</h2>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-bg-neutral rounded-full text-text-secondary hover:text-text-primary transition-colors cursor-pointer border border-transparent hover:border-border-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Section 1: General Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-border-subtle/40">
                  <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    General System Attributes
                  </h3>
                </div>

                <div className="divide-y divide-border-subtle/40 text-xs">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-text-secondary font-medium">Timestamp Date/Time</span>
                    <span className="font-semibold text-text-primary">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-text-secondary font-medium">IP Address</span>
                    <span className="font-mono font-bold text-text-primary bg-bg-neutral px-2.5 py-1 border border-border-subtle/50 rounded text-xxs">{selectedLog.ipAddress}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-text-secondary font-medium">Operator Agent</span>
                    <span className="font-semibold text-text-primary">{selectedLog.user.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-text-secondary font-medium">Agent Account Type</span>
                    <span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${selectedLog.userType === 'Staff' ? 'bg-blue-50/60 text-blue-700 border-blue-100' : 'bg-bg-neutral text-text-secondary border-border-subtle'}`}>
                        {selectedLog.userType} Operator
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Record Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-border-subtle/40">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Target Record Properties
                  </h3>
                </div>

                <div className="divide-y divide-border-subtle/40 text-xs">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-text-secondary font-medium">Module Section</span>
                    <span className="font-bold text-text-primary">{selectedLog.module}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-text-secondary font-medium">Record Reference Code</span>
                    <span className="font-mono font-bold text-brand-primary bg-brand-bg-active px-2.5 py-1 border border-brand-primary/10 rounded text-xxs">{selectedLog.recordId}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-text-secondary font-medium">Related Record Name</span>
                    <span className="font-semibold text-text-primary">{selectedLog.recordName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedLog(null);
                    if (selectedLog.module === 'Leads') onNavigateToModule('Lead Management');
                    if (selectedLog.module === 'Complaints') onNavigateToModule('Complaint Management');
                    if (selectedLog.module === 'Customers') onNavigateToModule('Customer Summary');
                    if (selectedLog.module === 'Campaigns') onNavigateToModule('Campaign Management');
                    if (selectedLog.module === 'Templates') onNavigateToModule('Email Templates');
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-brand-primary border border-border-subtle rounded-xl py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-3xs cursor-pointer hover:border-brand-primary/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Related Record Profile
                </button>
              </div>

              {/* Section 3: Change Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-border-subtle/40">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Change Diff & Execution Description
                  </h3>
                </div>

                <div className="divide-y divide-border-subtle/40 text-xs pb-4">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-text-secondary font-medium">Triggered Action Event</span>
                    <span className="font-bold text-brand-primary bg-brand-bg-active border border-brand-primary/15 px-3 py-1.5 rounded-lg text-xs shadow-3xs">
                      {selectedLog.action}
                    </span>
                  </div>
                </div>

                {selectedLog.changeInfo ? (
                  <div className="bg-bg-neutral/50 rounded-xl p-4 border border-border-subtle/70 flex flex-col gap-3">
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      Field Modified: <span className="font-mono text-text-primary bg-white px-2 py-0.5 border border-border-subtle rounded text-xxs font-bold">{selectedLog.changeInfo.fieldName}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-lg border border-border-subtle/60 shadow-3xs">
                        <span className="text-[9px] text-text-secondary font-bold block uppercase tracking-wider mb-1">Old Value</span>
                        <span className="line-through text-red-600 font-semibold bg-red-50/60 px-2 py-0.5 rounded text-xs break-all inline-block">
                          {selectedLog.changeInfo.oldValue || '—'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-border-subtle/60 shadow-3xs">
                        <span className="text-[9px] text-text-secondary font-bold block uppercase tracking-wider mb-1">New Value</span>
                        <span className="text-emerald-600 font-semibold bg-emerald-50/60 px-2 py-0.5 rounded text-xs break-all inline-block">
                          {selectedLog.changeInfo.newValue || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary italic leading-relaxed bg-bg-neutral/50 p-4 rounded-xl border border-border-subtle/50">
                    This audit entry represents a trigger event (creation, delete or export) with no internal parameter updates.
                  </p>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle/60 p-5 bg-white flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
