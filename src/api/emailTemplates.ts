export interface EmailTemplateApiRecord {
  id?: number | null;
  shopDomain?: string;
  eventType?: string;
  customerActionTrigger?: string;
  templateName?: string;
  channelType?: string;
  status?: string;
  emailSubjectLine?: string;
  templateContentBody?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EmailTemplateSaveRequest {
  id: number | null;
  shopDomain?: string;
  eventType: string;
  customerActionTrigger: string | null;
  templateName: string;
  channelType: string;
  status: string;
  emailSubjectLine: string | null;
  templateContentBody: string;
}

export interface EmailTemplateRequestOptions {
  apiBaseUrl?: string;
  signal?: AbortSignal;
}

export interface EmailTemplateDeleteResult {
  success?: boolean;
  message?: string;
  data?: boolean | null;
  error?: string;
}

interface EmailTemplateApiEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
  data?: EmailTemplateApiRecord[] | EmailTemplateApiRecord | null;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

const EMAIL_TEMPLATE_ENDPOINT = '/api/EmailTemplate';
const CAMPAIGN_AUTOMATION_ENDPOINT = '/api/CampaignAutomation/email-template-by-channel-type';
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

const buildTemplateQuery = (shopDomain: string): string => {
  const query = new URLSearchParams();
  query.set('shop', shopDomain || DEFAULT_SHOP_DOMAIN);
  return query.toString();
};

const buildChannelTypeQuery = (shopDomain: string, channelType: string): string => {
  const query = new URLSearchParams();
  query.set('shop', shopDomain || DEFAULT_SHOP_DOMAIN);
  query.set('channelType', channelType);
  return query.toString();
};

const parseApiEnvelope = (payload: unknown): EmailTemplateApiEnvelope | null => {
  if (payload && typeof payload === 'object') {
    return payload as EmailTemplateApiEnvelope;
  }

  return null;
};

const parseDeleteEnvelope = (payload: unknown): EmailTemplateDeleteResult | null => {
  if (payload && typeof payload === 'object') {
    return payload as EmailTemplateDeleteResult;
  }

  return null;
};

export async function fetchEmailTemplates(
  options: EmailTemplateRequestOptions = {}
): Promise<EmailTemplateApiRecord[]> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || DEFAULT_API_BASE_URL);
  const shopDomain = readStoredShopDomain();
  const requestPath = `${EMAIL_TEMPLATE_ENDPOINT}?${buildTemplateQuery(shopDomain)}`;
  const endpoint = buildEndpoint(requestPath, apiBaseUrl);

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    signal: options.signal
  });

  const payload = await safeParseJson(response);
  const envelope = parseApiEnvelope(payload);

  if (!response.ok) {
    if (typeof payload === 'string' && payload.trim()) {
      throw new Error(payload.trim());
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
      return [envelope.data as EmailTemplateApiRecord];
    }
  }

  if (Array.isArray(payload)) {
    return payload as EmailTemplateApiRecord[];
  }

  return [];
}

export async function fetchEmailTemplatesByChannelType(
  channelType: string,
  options: EmailTemplateRequestOptions = {}
): Promise<EmailTemplateApiRecord[]> {
  const normalizedChannelType = channelType.trim();

  if (!normalizedChannelType) {
    return [];
  }

  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || DEFAULT_API_BASE_URL);
  const shopDomain = readStoredShopDomain();
  const requestPath = `${CAMPAIGN_AUTOMATION_ENDPOINT}?${buildChannelTypeQuery(shopDomain, normalizedChannelType)}`;
  const endpoint = buildEndpoint(requestPath, apiBaseUrl);

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    signal: options.signal
  });

  const payload = await safeParseJson(response);
  const envelope = parseApiEnvelope(payload);

  if (!response.ok) {
    if (typeof payload === 'string' && payload.trim()) {
      throw new Error(payload.trim());
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
      return [envelope.data as EmailTemplateApiRecord];
    }
  }

  if (Array.isArray(payload)) {
    return payload as EmailTemplateApiRecord[];
  }

  return [];
}

export async function saveEmailTemplate(
  request: EmailTemplateSaveRequest,
  options: EmailTemplateRequestOptions = {}
): Promise<EmailTemplateApiRecord> {
  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || DEFAULT_API_BASE_URL);
  const shopDomain = readStoredShopDomain();
  const requestPath = `${EMAIL_TEMPLATE_ENDPOINT}?${buildTemplateQuery(shopDomain)}`;
  const endpoint = buildEndpoint(requestPath, apiBaseUrl);
  const requestBody: EmailTemplateSaveRequest = {
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
    return envelope.data as EmailTemplateApiRecord;
  }

  if (Array.isArray(envelope?.data)) {
    return envelope.data[0] || {};
  }

  if (responsePayload && typeof responsePayload === 'object' && !Array.isArray(responsePayload)) {
    return responsePayload as EmailTemplateApiRecord;
  }

  return {};
}

export async function deleteEmailTemplate(
  emailTemplateId: number,
  options: EmailTemplateRequestOptions = {}
): Promise<boolean> {
  if (!Number.isFinite(emailTemplateId) || emailTemplateId <= 0) {
    throw new Error('A valid email template id is required.');
  }

  const apiBaseUrl = normalizeApiUrl(options.apiBaseUrl || DEFAULT_API_BASE_URL);
  const shopDomain = readStoredShopDomain();
  const requestPath = `${EMAIL_TEMPLATE_ENDPOINT}/${emailTemplateId}?${buildTemplateQuery(shopDomain)}`;
  const endpoint = buildEndpoint(requestPath, apiBaseUrl);

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    signal: options.signal
  });

  const responsePayload = await safeParseJson(response);
  const envelope = parseDeleteEnvelope(responsePayload);

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
    if (typeof envelope.data === 'boolean') {
      return envelope.data;
    }

    return envelope.success ?? true;
  }

  if (typeof responsePayload === 'boolean') {
    return responsePayload;
  }

  return true;
}
