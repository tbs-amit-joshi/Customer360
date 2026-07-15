import React, { useState } from 'react';
import { 
  TrendingUp, Calendar, UserCheck, AlertTriangle, 
  DollarSign, CheckCircle2, PlayCircle, PlusCircle, ArrowUpRight, ChevronRight, User, Ticket
} from 'lucide-react';
import { Lead, Complaint, Customer } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  complaints: Complaint[];
  customers: Customer[];
  onNavigate: (tab: string, action?: string) => void;
  staffNameFilter: string;
  setStaffNameFilter: (name: string) => void;
}

export default function DashboardView({
  leads,
  complaints,
  customers,
  onNavigate,
  staffNameFilter,
  setStaffNameFilter
}: DashboardViewProps) {
  // Filter states and computed values
  const activeLeads = leads.filter(l => staffNameFilter === 'All' || l.assignedStaff === staffNameFilter);
  const activeComplaints = complaints.filter(c => staffNameFilter === 'All' || c.assignedTo === staffNameFilter);

  // Computed counts based on real state + simulated additions
  const newLeadsCount = leads.filter(l => l.status === 'New').length;
  const vipCustomersCount = customers.filter(c => c.segment === 'VIP').length;

  // Complaint counts by status
  const openCount = activeComplaints.filter(c => c.status === 'Open').length;
  const inProgressCount = activeComplaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = activeComplaints.filter(c => c.status === 'Resolved').length;
  const closedCount = activeComplaints.filter(c => c.status === 'Closed').length;
  const escalatedCount = activeComplaints.filter(c => c.status === 'Escalated').length;

  return (
    <div id="dashboard-module" className="space-y-6">
      {/* Top section with Merchant Greeting & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 id="merchant-greeting" className="text-xl font-bold text-text-primary tracking-tight">
            Good Morning, Amit Grover
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here's what's happening in your business today
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-medium text-text-secondary">Assigned Staff:</span>
          <select 
            id="staff-filter-dropdown"
            value={staffNameFilter}
            onChange={(e) => setStaffNameFilter(e.target.value)}
            className="text-sm border border-border-subtle bg-white text-text-primary px-3 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
          >
            <option value="All">All Staff Members</option>
            <option value="Emma Watson">Emma Watson</option>
            <option value="David Miller">David Miller</option>
            <option value="Rahul Dev">Rahul Dev</option>
            <option value="System Agent">System Agent</option>
          </select>
        </div>
      </div>

      {/* KEY METRICS ROW (4 compact, content-fit stat cards, tight spacing, no empty space) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Follow-ups */}
        <div 
          id="stat-followups" 
          onClick={() => onNavigate('Lead Management')}
          className="bg-white border border-border-subtle p-3.5 rounded-lg hover:shadow-sm transition-shadow cursor-pointer group flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-brand-primary shrink-0">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary tracking-tight">18</div>
            <div className="text-xs text-text-secondary font-normal mt-0.5 group-hover:text-brand-primary transition-colors">
              Today's Follow-ups
            </div>
          </div>
        </div>

        {/* New Leads */}
        <div 
          id="stat-leads" 
          onClick={() => onNavigate('Lead Management')}
          className="bg-white border border-border-subtle p-3.5 rounded-lg hover:shadow-sm transition-shadow cursor-pointer group flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <PlayCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary tracking-tight">{newLeadsCount + 21}</div>
            <div className="text-xs text-text-secondary font-normal mt-0.5 group-hover:text-purple-600 transition-colors">
              New Leads
            </div>
          </div>
        </div>

        {/* VIP Customers */}
        <div 
          id="stat-vip" 
          onClick={() => onNavigate('Customer Summary')}
          className="bg-white border border-border-subtle p-3.5 rounded-lg hover:shadow-sm transition-shadow cursor-pointer group flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary tracking-tight">{vipCustomersCount + 80}</div>
            <div className="text-xs text-text-secondary font-normal mt-0.5 group-hover:text-amber-600 transition-colors">
              VIP Customers
            </div>
          </div>
        </div>

        {/* Open Complaints */}
        <div 
          id="stat-open-complaints" 
          onClick={() => onNavigate('Complaint Management')}
          className="bg-white border border-border-subtle p-3.5 rounded-lg hover:shadow-sm transition-shadow cursor-pointer group flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <Ticket className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary tracking-tight">{openCount + escalatedCount + inProgressCount}</div>
            <div className="text-xs text-text-secondary font-normal mt-0.5 group-hover:text-red-600 transition-colors">
              Open Complaints
            </div>
          </div>
        </div>
      </div>

      {/* REVENUE HIGHLIGHT CARD (separate card below metrics row) */}
      <div id="revenue-highlight-card" className="bg-white border border-border-subtle p-5 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">Revenue This Month</div>
            <div className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight mt-1 flex items-baseline gap-2">
              ₹8,40,000
              <span className="text-sm font-semibold text-brand-primary flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded">
                <TrendingUp className="w-3.5 h-3.5" />
                +14.2% vs last month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN OVERVIEW (side by side cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Overview */}
        <div className="bg-white border border-border-subtle p-5 rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sales Overview</h3>
            <div className="divide-y divide-border-subtle">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-xs text-text-secondary">Monthly Revenue</span>
                <span className="text-sm font-bold text-text-primary">₹8,40,000</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-xs text-text-secondary">Weekly Revenue</span>
                <span className="text-sm font-bold text-text-primary">₹2,15,000</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-xs text-text-secondary">Average Order Value</span>
                <span className="text-sm font-bold text-text-primary">₹12,450</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-xs text-text-secondary">Lifetime Customer Value</span>
                <span className="text-sm font-bold text-text-primary">₹1,85,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Counts and Complaints Overview by Status */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Customer Counts */}
          <div className="bg-white border border-border-subtle p-4 rounded-lg flex-1">
            <h3 className="text-xs font-semibold uppercase text-text-secondary tracking-wider mb-2.5">Customer Counts</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-border-subtle p-2 rounded text-center">
                <div className="text-lg font-bold text-text-primary">342</div>
                <div className="text-[10px] text-text-secondary uppercase mt-0.5">Total Customers</div>
              </div>
              <div className="border border-border-subtle p-2 rounded text-center">
                <div className="text-lg font-bold text-text-primary">280</div>
                <div className="text-[10px] text-text-secondary uppercase mt-0.5">Active</div>
              </div>
              <div className="border border-border-subtle p-2 rounded text-center">
                <div className="text-lg font-bold text-text-primary">42</div>
                <div className="text-[10px] text-text-secondary uppercase mt-0.5">New Signup</div>
              </div>
            </div>
          </div>

          {/* Complaints Overview */}
          <div className="bg-white border border-border-subtle p-4 rounded-lg flex-1">
            <h3 className="text-xs font-semibold uppercase text-text-secondary tracking-wider mb-2.5">Complaints Overview (By Status)</h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="border border-border-subtle p-1.5 rounded text-center bg-blue-50/20">
                <div className="text-lg font-bold text-blue-600">{openCount}</div>
                <div className="text-[10px] text-blue-700 uppercase font-semibold mt-0.5 leading-none">Open</div>
              </div>
              <div className="border border-border-subtle p-1.5 rounded text-center bg-amber-50/20">
                <div className="text-lg font-bold text-amber-600">{inProgressCount}</div>
                <div className="text-[10px] text-amber-700 uppercase font-semibold mt-0.5 leading-none">In Progress</div>
              </div>
              <div className="border border-border-subtle p-1.5 rounded text-center bg-emerald-50/20">
                <div className="text-lg font-bold text-emerald-600">{resolvedCount}</div>
                <div className="text-[10px] text-emerald-700 uppercase font-semibold mt-0.5 leading-none">Resolved</div>
              </div>
              <div className="border border-border-subtle p-1.5 rounded text-center bg-gray-50">
                <div className="text-lg font-bold text-text-secondary">{closedCount}</div>
                <div className="text-[10px] text-text-secondary uppercase font-semibold mt-0.5 leading-none">Closed</div>
              </div>
              <div className="border border-border-subtle p-1.5 rounded text-center bg-red-50/20">
                <div className="text-lg font-bold text-red-600">{escalatedCount}</div>
                <div className="text-[10px] text-red-700 uppercase font-semibold mt-0.5 leading-none">Escalated</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES CARD */}
      <div id="recent-activities-card" className="bg-white border border-border-subtle p-5 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Recent System Activities</h3>
          <button 
            onClick={() => onNavigate('Activity Log')}
            className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary font-medium">
                <span className="font-semibold text-purple-700">David Miller</span> converted lead <span className="font-mono bg-bg-neutral px-1.5 py-0.5 rounded border border-border-subtle">LD-1026</span> for Customer <span className="font-semibold">Rohan Verma</span> to Completed (₹2,20,000 Expected Value)
              </p>
              <span className="text-xxs text-text-secondary mt-1 block">4 hours ago</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary font-medium">
                System classified Customer <span className="font-semibold">Emma Watson</span> as <span className="text-brand-primary font-semibold">VIP Segment</span> due to spend threshold (Total spend: ₹3,45,000)
              </p>
              <span className="text-xxs text-text-secondary mt-1 block">Yesterday at 11:45 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
