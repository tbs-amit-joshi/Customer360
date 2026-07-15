import React, { useState, useEffect } from 'react';
import { Check, Settings, X } from 'lucide-react';

// Types
import { Lead, Complaint, Customer, Campaign, EmailTemplate, ActivityLog, SettingsState } from './types';

// Seed Data
import { 
  INITIAL_LEADS, INITIAL_COMPLAINTS, 
  INITIAL_EMAIL_TEMPLATES, INITIAL_CAMPAIGNS, INITIAL_ACTIVITY_LOGS, INITIAL_SETTINGS 
} from './data';

// View Components
import CustomerSummaryView from './components/CustomerSummaryView';
import SettingsView from './components/SettingsView';
import { fetchCustomer360Customers } from './api/customerSync';

export default function App() {
  // Inter-tab parameter passing (e.g. looking up a specific customer by name)
  const [passedCustomerName, setPassedCustomerName] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [customerRefreshToken, setCustomerRefreshToken] = useState(0);

  // Run data migration to guarantee updated data (Emma Watson SH-90412 and slate gray theme) on first boot
  const migration_version = 'v7';
  if (typeof window !== 'undefined' && localStorage.getItem('tech_crm_migration_v7') !== migration_version) {
    localStorage.removeItem('tech_crm_leads');
    localStorage.removeItem('tech_crm_complaints');
    localStorage.removeItem('tech_crm_campaigns');
    localStorage.removeItem('tech_crm_templates');
    localStorage.removeItem('tech_crm_logs');
    localStorage.removeItem('tech_crm_settings');
    localStorage.setItem('tech_crm_migration_v7', migration_version);
  }

  // Core App states, loaded from localStorage or fallback to Seed Data
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('tech_crm_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('tech_crm_complaints');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState<boolean>(true);
  const [customerLoadError, setCustomerLoadError] = useState<string | null>(null);

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('tech_crm_logs');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('tech_crm_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Success Toast state
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setGlobalToast(message);
    setTimeout(() => setGlobalToast(null), 4000);
  };

  // Sync to localStorage on alterations
  useEffect(() => {
    localStorage.setItem('tech_crm_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('tech_crm_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('tech_crm_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('tech_crm_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadCustomers = async () => {
      setIsCustomersLoading(true);
      setCustomerLoadError(null);

      try {
        const liveCustomers = await fetchCustomer360Customers({
          signal: controller.signal
        });

        if (!isActive) {
          return;
        }

        setCustomers(liveCustomers);
      } catch (error) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load live customer data.';
        setCustomerLoadError(message);
        setCustomers([]);
      } finally {
        if (isActive) {
          setIsCustomersLoading(false);
        }
      }
    };

    void loadCustomers();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [customerRefreshToken]);

  // Dynamic Theme Custom Properties Sync
  useEffect(() => {
    const theme = settings.theme || {
      accentColor: '#0F6D5E',
      backgroundMode: 'off-white',
      fontFamily: 'Inter',
      fontSize: 'Default'
    };

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      const toHex = (c: number) => {
        const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
        return hex.length === 1 ? '0' : hex;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const getLighterTint = (hex: string, factor: number = 0.8) => {
      try {
        const cleaned = hex.startsWith('#') ? hex : '#' + hex;
        const { r, g, b } = hexToRgb(cleaned);
        const nr = r + (255 - r) * factor;
        const ng = g + (255 - g) * factor;
        const nb = b + (255 - b) * factor;
        return rgbToHex(nr, ng, nb);
      } catch (e) {
        return '#E3F1EC';
      }
    };

    const getDarkerShade = (hex: string, factor: number = 0.2) => {
      try {
        const cleaned = hex.startsWith('#') ? hex : '#' + hex;
        const { r, g, b } = hexToRgb(cleaned);
        const nr = r * (1 - factor);
        const ng = g * (1 - factor);
        const nb = b * (1 - factor);
        return rgbToHex(nr, ng, nb);
      } catch (e) {
        return '#0062a3';
      }
    };

    const root = document.documentElement;
    const accent = theme.accentColor || '#0F6D5E';
    root.style.setProperty('--brand-primary', accent);
    root.style.setProperty('--brand-primary-hover', getDarkerShade(accent, 0.15));
    root.style.setProperty('--brand-bg-active', getLighterTint(accent, 0.88));

    // Typography
    let fontValue = '"Inter", ui-sans-serif, system-ui, sans-serif';
    if (theme.fontFamily === 'System UI') {
      fontValue = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    } else if (theme.fontFamily === 'Roboto') {
      fontValue = '"Roboto", sans-serif';
    } else if (theme.fontFamily === 'Poppins') {
      fontValue = '"Poppins", sans-serif';
    }
    root.style.setProperty('--font-family-sans', fontValue);

    // Font size scale
    let fontSizeValue = '14px';
    if (theme.fontSize === 'Compact') {
      fontSizeValue = '13px';
    } else if (theme.fontSize === 'Comfortable') {
      fontSizeValue = '15px';
    }
    root.style.setProperty('--app-font-size', fontSizeValue);

    // Background Mode mapping
    if (theme.backgroundMode === 'dark-mode') {
      root.style.setProperty('--bg-viewport', '#0F172A'); // Slate 900
      root.style.setProperty('--bg-neutral', '#1E293B'); // Slate 800
      root.style.setProperty('--bg-card', '#1E293B'); // Slate 800
      root.style.setProperty('--text-primary', '#F8FAFC'); // Slate 50
      root.style.setProperty('--text-secondary', '#94A3B8'); // Slate 400
      root.style.setProperty('--border-subtle', '#334155'); // Slate 700
      root.style.setProperty('--brand-bg-active', 'rgba(255, 255, 255, 0.1)'); // Dark overlay
    } else if (theme.backgroundMode === 'pure-white') {
      root.style.setProperty('--bg-viewport', '#FFFFFF');
      root.style.setProperty('--bg-neutral', '#FFFFFF');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--text-primary', '#202223');
      root.style.setProperty('--text-secondary', '#6D7175');
      root.style.setProperty('--border-subtle', '#E1E3E5');
    } else {
      // Default / off-white
      root.style.setProperty('--bg-viewport', '#F6F6F7');
      root.style.setProperty('--bg-neutral', '#F6F6F7');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--text-primary', '#202223');
      root.style.setProperty('--text-secondary', '#6D7175');
      root.style.setProperty('--border-subtle', '#E1E3E5');
    }
  }, [settings.theme]);

  // Logging system helper (dispatches a new log entry)
  const addAuditLog = (moduleName: ActivityLog['module'], action: string, recId: string, recName: string, changeInfo?: ActivityLog['changeInfo']) => {
    const nextLogId = 'LOG-' + (100 + logs.length + 5);
    const newEntry: ActivityLog = {
      id: nextLogId,
      timestamp: new Date().toISOString(),
      user: { name: 'Amit Grover', avatar: 'AG' },
      module: moduleName,
      action: action,
      recordId: recId,
      recordName: recName,
      userType: 'Staff',
      ipAddress: '192.168.1.45',
      changeInfo: changeInfo
    };
    setLogs(prev => [newEntry, ...prev]);
  };

  // Customer Handlers
  const handleUpdateCustomer = (cust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === cust.id ? cust : c));
    addAuditLog('Customers', 'Profile Metrics Saved', cust.id, cust.name);
    showToast(`Success: Customer summary updated.`);
  };

  // Get dynamic greeting based on hour of the day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-bg-viewport flex flex-col font-sans select-none antialiased text-text-primary">
      
      {/* GLOBAL TOAST ALERTS */}
      {globalToast && (
        <div id="global-toast-notifier" className="fixed top-5 right-5 z-50 bg-brand-primary text-white text-xs font-semibold px-4.5 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-brand-primary/25 animate-bounce">
          <Check className="w-4 h-4 bg-white text-brand-primary rounded-full p-0.5" />
          <span>{globalToast}</span>
        </div>
      )}

      {/* HEADER NAVIGATION (Shopify Polaris style matching StaffSignal) */}
      <header className="bg-bg-card border-b border-border-subtle sticky top-0 z-40 w-full flex flex-col">
        {/* Top Header Row */}
        <div className="px-6 py-3.5 flex items-center justify-between border-b border-border-subtle/50 bg-bg-neutral/20">
          {/* Brand/Store Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-8 rounded-lg bg-brand-primary text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-brand-primary/10">
              360
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-text-primary tracking-tight">Customer 360</span>
              <span className="text-[10px] bg-brand-bg-active text-brand-primary font-bold px-2 py-0.5 rounded-full border border-brand-primary/10">
                Shopify Plus
              </span>
            </div>
          </div>

          {/* Right Profile & Context replaced with Settings button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 text-text-secondary hover:text-brand-primary hover:bg-brand-bg-active border border-border-subtle/40 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs bg-bg-card hover:border-brand-primary/20"
              title="Open Settings"
              id="settings-trigger-button"
            >
              <Settings className="w-4.5 h-4.5" />
              <span className="text-xs font-bold tracking-tight pr-1">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT SPACE */}
      <main id="app-viewport-content" className="flex-1 overflow-x-auto bg-bg-viewport">
        <div className="pt-3 pb-6 px-6 md:pt-4 md:pb-8 md:px-8 w-full max-w-full mx-auto min-h-full flex flex-col gap-5">
          
          {/* Customer Summary Module */}
          <CustomerSummaryView 
            customers={customers}
            leads={leads}
            complaints={complaints}
            onUpdateCustomer={handleUpdateCustomer}
            onNavigateToLead={(leadNo) => showToast(`Navigation to Lead "${leadNo}" is disabled in grid-only view.`)}
            onNavigateToTemplate={(templateName) => showToast(`Navigation to Template "${templateName}" is disabled in grid-only view.`)}
            initialSelectedCustomerName={passedCustomerName}
            onClearSelectedCustomerName={() => setPassedCustomerName(undefined)}
            isLoadingCustomers={isCustomersLoading}
            customerLoadError={customerLoadError}
            onRefreshCustomers={() => setCustomerRefreshToken((token) => token + 1)}
          />

        </div>
      </main>

      {/* SYSTEM SETTINGS MODAL */}
      {isSettingsOpen && (
        <div id="settings-modal-overlay" className="fixed inset-0 z-50 flex flex-col bg-bg-card animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-neutral/10">
            <div className="flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-brand-primary animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-sm font-bold text-text-primary tracking-tight">Apex System Control Center</span>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-neutral transition-all cursor-pointer border border-border-subtle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-bg-viewport">
            <div className="w-full max-w-full mx-auto px-1 md:px-4">
              <SettingsView 
                settings={settings}
                onUpdateSettings={(newSettings) => {
                  setSettings(newSettings);
                  showToast('Theme and system settings synced successfully!');
                }}
                onNavigate={(tab, actionModifier) => {
                  setIsSettingsOpen(false);
                  showToast(`Navigation to ${tab} (${actionModifier || 'default'}) triggered.`);
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
