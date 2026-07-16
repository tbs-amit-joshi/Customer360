export interface CustomerSegmentationSettingsPayload {
  isDynamicSegmentationEnabled: boolean;
  minTotalSpendThreshold: number;
  maxTotalSpendThreshold: number | null;
  minOrderCountThreshold: number;
  maxOrderCountThreshold: number | null;
}

export interface CustomerSegmentationSettingsData {
  id?: number;
  storeId?: string;
  shopDomain?: string;
  isDynamicSegmentationEnabled?: boolean;
  minTotalSpendThreshold?: number | null;
  maxTotalSpendThreshold?: number | null;
  minOrderCountThreshold?: number | null;
  maxOrderCountThreshold?: number | null;
  minSpend?: number | null;
  maxSpend?: number | null;
  minOrderCount?: number | null;
  maxOrderCount?: number | null;
  totalSpendThreshold?: number;
  orderCountThreshold?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomerSegmentationSettingsResponse {
  success?: boolean;
  message?: string;
  error?: string;
  data?: CustomerSegmentationSettingsData | null;
}

export interface CustomerSegmentationRequestOptions {
  signal?: AbortSignal;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

const CUSTOMER_SEGMENTATION_SETTINGS_ENDPOINT = '/api/shopify/customer-segmentation/settings';
const DEFAULT_SHOP_DOMAIN = 'tech-crm.myshopify.com';

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

const buildRequestUrl = (): string => {
  const query = new URLSearchParams();
  query.set('shop', DEFAULT_SHOP_DOMAIN);
  return `${CUSTOMER_SEGMENTATION_SETTINGS_ENDPOINT}?${query.toString()}`;
};

export async function fetchCustomerSegmentationSettings(
  options: CustomerSegmentationRequestOptions = {}
): Promise<CustomerSegmentationSettingsData | null> {
  const response = await fetch(buildRequestUrl(), {
    method: 'GET',
    headers: {
      Accept: '*/*',
    },
    credentials: 'same-origin',
    signal: options.signal,
  });

  const responsePayload = (await safeParseJson(response)) as CustomerSegmentationSettingsResponse | string | null;

  if (!response.ok) {
    if (typeof responsePayload === 'string' && responsePayload.trim()) {
      throw new Error(responsePayload.trim());
    }

    if (responsePayload && typeof responsePayload === 'object') {
      throw new Error(responsePayload.error || responsePayload.message || `Request failed with status ${response.status}.`);
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (responsePayload && typeof responsePayload === 'object') {
    return responsePayload.data || null;
  }

  return null;
}

export async function saveCustomerSegmentationSettings(
  payload: CustomerSegmentationSettingsPayload
): Promise<string> {
  const responseWithShop = await fetch(buildRequestUrl(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });

  const responsePayload = await safeParseJson(responseWithShop);

  if (!responseWithShop.ok) {
    if (typeof responsePayload === 'string' && responsePayload.trim()) {
      throw new Error(responsePayload.trim());
    }

    if (responsePayload && typeof responsePayload === 'object') {
      const errorResponse = responsePayload as ApiErrorResponse;
      throw new Error(errorResponse.error || errorResponse.message || `Request failed with status ${responseWithShop.status}.`);
    }

    throw new Error(`Request failed with status ${responseWithShop.status}.`);
  }

  if (typeof responsePayload === 'string' && responsePayload.trim()) {
    return responsePayload.trim();
  }

  if (responsePayload && typeof responsePayload === 'object') {
    const successResponse = responsePayload as ApiErrorResponse;
    return successResponse.message || 'Customer segmentation settings saved successfully.';
  }

  return 'Customer segmentation settings saved successfully.';
}
