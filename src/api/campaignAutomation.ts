export interface CampaignAutomationTemplateSlot {
  id?: number | null;
  date?: string | null;
}

export interface CampaignAutomationApiRecord {
  id?: number | null;
  shopDomain?: string;
  campaignName?: string;
  campaignStartDate?: string | null;
  dispatchTime?: string | null;
  customerSegmentTrigger?: string;
  initialStatus?: string;
  operation?: string;
  campaignType?: string;
  channelType?: string;
  templateSlot1?: number | null;
  templateSlot1Date?: string | null;
  templateSlot2?: number | null;
  templateSlot2Date?: string | null;
  templateSlot3?: number | null;
  templateSlot3Date?: string | null;
  templateSlot4?: number | null;
  templateSlot4Date?: string | null;
  templateSlot5?: number | null;
  templateSlot5Date?: string | null;
  templateSlot6?: number | null;
  templateSlot6Date?: string | null;
  templateSlot7?: number | null;
  templateSlot7Date?: string | null;
  templateSlot8?: number | null;
  templateSlot8Date?: string | null;
  isDelete?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CampaignAutomationSaveRequest {
  id: number | null;
  shopDomain?: string;
  campaignName: string;
  dispatchTime: string;
  customerSegmentTrigger: string;
  initialStatus: string;
  operation: string;
  campaignType: string;
  channelType: string;
  templateSlot1: number | null;
  templateSlot2: number | null;
  templateSlot3: number | null;
  templateSlot4: number | null;
  templateSlot5: number | null;
  templateSlot6: number | null;
  templateSlot7: number | null;
  templateSlot8: number | null;
}

export interface CampaignAutomationRequestOptions {
  apiBaseUrl?: string;
  signal?: AbortSignal;
}

interface CampaignAutomationApiEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
  data?: CampaignAutomationApiRecord | CampaignAutomationApiRecord[] | null;
}

const CAMPAIGN_AUTOMATION_ENDPOINT = '/api/CampaignAutomation';
const DEFAULT_SHOP_DOMAIN = import.meta.env.VITE_CUSTOMER_SYNC_SHOP_DOMAIN?.trim() || 'tech-crm.myshopify.com';
const DEFAULT_API_BASE_URL = import.meta.env.VITE_CUSTOMER_SYNC_API_BASE_URL?.trim() || '';

const normalizeApiUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const buildEndpoint = (requestPath: string, apiBaseUrl: string): string => {
  return apiBaseUrl ? new URL(requestPath, apiBaseUrl).toString() : requestPath;
};

const safeParseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const readStoredShopDomain = (): string => {
  if (typeof window === 'undefined') {
    return DEFAULT_SHOP_DOMAIN;
  }

  const candidateKeys = [
    'shopDomain',
    'shopdomain',
    'shop_domain',
    'selectedShopDomain',
    'selected_shop_domain',
    'currentShopDomain',
    'tech_crm_shop_domain',
    'tech_crm_shopDomain',
    'shop'
  ];

  for (const key of candidateKeys) {
    const value = window.localStorage.getItem(key)?.trim();
    if (value) {
      return value;
    }
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) {
      continue;
    }

    const rawValue = window.localStorage.getItem(key)?.trim();
    if (!rawValue) {
      continue;
    }

    if (/\.myshopify\.com$/i.test(rawValue)) {
      return rawValue;
    }

    try {
      const parsed = JSON.parse(rawValue) as unknown;
      if (typeof parsed === 'string' && /\.myshopify\.com$/i.test(parsed.trim())) {
        return parsed.trim();
      }

      if (parsed && typeof parsed === 'object') {
        const record = parsed as Record<string, unknown>;
        const nestedValue = [
          record.shopDomain,
          record.shopdomain,
          record.shop,
          record.domain
        ].find((value) => typeof value === 'string' && value.trim());

        if (typeof nestedValue === 'string' && nestedValue.trim()) {
          return nestedValue.trim();
        }
      }
    } catch {
      // Ignore non-JSON values.
    }
  }

  return DEFAULT_SHOP_DOMAIN;
};

const buildRequestQuery = (shopDomain: string): string => {
  const query = new URLSearchParams();
  query.set('shop', shopDomain || DEFAULT_SHOP_DOMAIN);
  return query.toString();
};

const parseApiEnvelope = (payload: unknown): CampaignAutomationApiEnvelope | null => {
  if (payload && typeof payload === 'object') {
    return payload as CampaignAutomationApiEnvelope;
  }

  return null;
};

export async function fetchCampaignAutomationsByShopDomain(
  options: CampaignAutomationRequestOptions = {}
): Promise<CampaignAutomationApiRecord[]> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || DEFAULT_API_BASE_URL);
  const shopDomain = readStoredShopDomain();
  const endpoint = buildEndpoint(`${CAMPAIGN_AUTOMATION_ENDPOINT}/by-shop-domain?${buildRequestQuery(shopDomain)}`, apiBaseUrl);

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    signal: options.signal
  });

  const responsePayload = await safeParseJson(response);
  const envelope = parseApiEnvelope(responsePayload);

  if (!response.ok) {
    if (typeof responsePayload === 'string' && responsePayload.trim()) {
      throw new Error(responsePayload.trim());
    }

    if (envelope) {
      throw new Error(envelope.error || envelope.message || `Request failed with status ${response.status}.`);
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (envelope) {
    if (Array.isArray(envelope.data)) {
      return envelope.data;
    }

    if (envelope.data && typeof envelope.data === 'object') {
      return [envelope.data as CampaignAutomationApiRecord];
    }
  }

  if (Array.isArray(responsePayload)) {
    return responsePayload as CampaignAutomationApiRecord[];
  }

  return [];
}

export async function saveCampaignAutomation(
  request: CampaignAutomationSaveRequest,
  options: CampaignAutomationRequestOptions = {}
): Promise<CampaignAutomationApiRecord> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || DEFAULT_API_BASE_URL);
  const shopDomain = readStoredShopDomain();
  const endpoint = buildEndpoint(`${CAMPAIGN_AUTOMATION_ENDPOINT}?${buildRequestQuery(shopDomain)}`, apiBaseUrl);
  const requestBody: CampaignAutomationSaveRequest = {
    ...request,
    shopDomain
  };

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    signal: options.signal,
    body: JSON.stringify(requestBody)
  });

  const responsePayload = await safeParseJson(response);
  const envelope = parseApiEnvelope(responsePayload);

  if (!response.ok) {
    if (typeof responsePayload === 'string' && responsePayload.trim()) {
      throw new Error(responsePayload.trim());
    }

    if (envelope) {
      throw new Error(envelope.error || envelope.message || `Request failed with status ${response.status}.`);
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (envelope?.data && !Array.isArray(envelope.data)) {
    return envelope.data as CampaignAutomationApiRecord;
  }

  if (Array.isArray(envelope?.data)) {
    return envelope.data[0] || {};
  }

  if (responsePayload && typeof responsePayload === 'object' && !Array.isArray(responsePayload)) {
    return responsePayload as CampaignAutomationApiRecord;
  }

  return {};
}
