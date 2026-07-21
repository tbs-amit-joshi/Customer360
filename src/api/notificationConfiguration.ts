export interface EmailRelayConfiguration {
  smtpServerHostname: string | null;
  smtpPort: string | number | null;
  username: string | null;
  smtpPasswordOrApiToken: string | null;
  senderName: string | null;
  senderEmail: string | null;
  hasSecret?: boolean | null;
  isActive?: boolean | null;
}

export interface WhatsAppCloudConfiguration {
  PhoneNumberId?: string | null;
  WhatsAppBusinessAccountId?: string | null;
  MetaDeveloperAppId?: string | number | null;
  MetaApiAccessToken?: string | null;
  AppSecret?: string | null;
  WebhookVerifyToken?: string | null;
  phoneNumberId?: string | null;
  whatsAppBusinessAccountId?: string | null;
  metaDeveloperAppId?: string | number | null;
  metaApiAccessToken?: string | null;
  appSecret?: string | null;
  webhookVerifyToken?: string | null;
  hasSecret?: boolean | null;
  isActive?: boolean | null;
}

export interface NotificationConfigurationPayload {
  emailRelayConfiguration: EmailRelayConfiguration;
  whatsAppCloudConfiguration: WhatsAppCloudConfiguration;
}

export interface NotificationConfigurationSavePayload {
  emailRelayConfiguration: {
    smtpServerHostname: string | null;
    smtpPort: string | number | null;
    username: string | null;
    senderName: string | null;
    senderEmail: string | null;
    isActive?: boolean | null;
    smtpPasswordOrApiToken?: string | null;
  };
  whatsAppCloudConfiguration: {
    PhoneNumberId: string | null;
    WhatsAppBusinessAccountId: string | null;
    MetaDeveloperAppId?: string | null;
    MetaApiAccessToken?: string | null;
    AppSecret?: string | null;
    WebhookVerifyToken?: string | null;
    isActive?: boolean | null;
  };
}

export interface NotificationConfigurationResponse {
  success?: boolean;
  message?: string;
  error?: string;
  data?: NotificationConfigurationPayload | null;
  emailRelayConfiguration?: EmailRelayConfiguration | null;
  whatsAppCloudConfiguration?: WhatsAppCloudConfiguration | null;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

const NOTIFICATION_CONFIGURATION_ENDPOINT = '/api/shopify/notification-configuration';
const NOTIFICATION_CONFIGURATION_TEST_EMAIL_ENDPOINT = '/api/shopify/notification-configuration/test-email';
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
  return `${NOTIFICATION_CONFIGURATION_ENDPOINT}?${query.toString()}`;
};

const buildTestEmailRequestUrl = (): string => {
  const query = new URLSearchParams();
  query.set('shopDomain', DEFAULT_SHOP_DOMAIN);
  return `${NOTIFICATION_CONFIGURATION_TEST_EMAIL_ENDPOINT}?${query.toString()}`;
};

const normalizeWhatsAppConfiguration = (
  config?: WhatsAppCloudConfiguration | null
): WhatsAppCloudConfiguration => {
  return {
    PhoneNumberId: config?.PhoneNumberId ?? config?.phoneNumberId ?? null,
    WhatsAppBusinessAccountId: config?.WhatsAppBusinessAccountId ?? config?.whatsAppBusinessAccountId ?? null,
    MetaDeveloperAppId: config?.MetaDeveloperAppId ?? config?.metaDeveloperAppId ?? null,
    MetaApiAccessToken: config?.MetaApiAccessToken ?? config?.metaApiAccessToken ?? null,
    AppSecret: config?.AppSecret ?? config?.appSecret ?? null,
    WebhookVerifyToken: config?.WebhookVerifyToken ?? config?.webhookVerifyToken ?? null,
    hasSecret: config?.hasSecret,
    isActive: config?.isActive,
  };
};

const extractConfigurationPayload = (
  responsePayload: NotificationConfigurationResponse | string | null
): NotificationConfigurationPayload | null => {
  if (!responsePayload || typeof responsePayload === 'string') {
    return null;
  }

  if (responsePayload.data) {
    return {
      ...responsePayload.data,
      whatsAppCloudConfiguration: normalizeWhatsAppConfiguration(responsePayload.data.whatsAppCloudConfiguration),
    };
  }

  if (responsePayload.emailRelayConfiguration || responsePayload.whatsAppCloudConfiguration) {
    return {
      emailRelayConfiguration: responsePayload.emailRelayConfiguration || {
        smtpServerHostname: null,
        smtpPort: null,
        username: null,
        smtpPasswordOrApiToken: null,
        senderName: null,
        senderEmail: null,
      },
      whatsAppCloudConfiguration: normalizeWhatsAppConfiguration(responsePayload.whatsAppCloudConfiguration),
    };
  }

  return null;
};

export async function fetchNotificationConfiguration(): Promise<NotificationConfigurationPayload | null> {
  const response = await fetch(buildRequestUrl(), {
    method: 'GET',
    headers: {
      Accept: '*/*',
    },
    credentials: 'same-origin',
  });

  const responsePayload = (await safeParseJson(response)) as NotificationConfigurationResponse | string | null;

  if (!response.ok) {
    if (typeof responsePayload === 'string' && responsePayload.trim()) {
      throw new Error(responsePayload.trim());
    }

    if (responsePayload && typeof responsePayload === 'object') {
      throw new Error(responsePayload.error || responsePayload.message || `Request failed with status ${response.status}.`);
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  return extractConfigurationPayload(responsePayload);
}

const normalizeMaybeNumber = (value: string | number | null): string | number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const asNumber = Number(trimmed);
    return Number.isFinite(asNumber) ? asNumber : trimmed;
  }

  return trimmed;
};

export async function saveNotificationConfiguration(
  payload: NotificationConfigurationSavePayload
): Promise<string> {
  const emailRelayConfiguration = {
    smtpServerHostname: payload.emailRelayConfiguration.smtpServerHostname,
    smtpPort: normalizeMaybeNumber(payload.emailRelayConfiguration.smtpPort),
    username: payload.emailRelayConfiguration.username,
    senderName: payload.emailRelayConfiguration.senderName,
    senderEmail: payload.emailRelayConfiguration.senderEmail,
    isActive: payload.emailRelayConfiguration.isActive ?? null,
    ...(Object.prototype.hasOwnProperty.call(payload.emailRelayConfiguration, 'smtpPasswordOrApiToken')
      ? { smtpPasswordOrApiToken: payload.emailRelayConfiguration.smtpPasswordOrApiToken ?? null }
      : {}),
  };

  const whatsAppCloudConfiguration = {
    PhoneNumberId: payload.whatsAppCloudConfiguration.PhoneNumberId,
    WhatsAppBusinessAccountId: payload.whatsAppCloudConfiguration.WhatsAppBusinessAccountId,
    MetaDeveloperAppId: payload.whatsAppCloudConfiguration.MetaDeveloperAppId,
    AppSecret: payload.whatsAppCloudConfiguration.AppSecret,
    WebhookVerifyToken: payload.whatsAppCloudConfiguration.WebhookVerifyToken,
    isActive: payload.whatsAppCloudConfiguration.isActive ?? null,
    ...(Object.prototype.hasOwnProperty.call(payload.whatsAppCloudConfiguration, 'MetaApiAccessToken')
      ? { MetaApiAccessToken: payload.whatsAppCloudConfiguration.MetaApiAccessToken ?? null }
      : {}),
  };

  const response = await fetch(buildRequestUrl(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      emailRelayConfiguration,
      whatsAppCloudConfiguration,
    }),
  });

  const responsePayload = await safeParseJson(response);

  if (!response.ok) {
    if (typeof responsePayload === 'string' && responsePayload.trim()) {
      throw new Error(responsePayload.trim());
    }

    if (responsePayload && typeof responsePayload === 'object') {
      const errorResponse = responsePayload as ApiErrorResponse;
      throw new Error(errorResponse.error || errorResponse.message || `Request failed with status ${response.status}.`);
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (typeof responsePayload === 'string' && responsePayload.trim()) {
    return responsePayload.trim();
  }

  if (responsePayload && typeof responsePayload === 'object') {
    const successResponse = responsePayload as ApiErrorResponse;
    return successResponse.message || 'Notification configuration saved successfully.';
  }

  return 'Notification configuration saved successfully.';
}

export async function testEmailNotificationConfiguration(): Promise<string> {
  const response = await fetch(buildTestEmailRequestUrl(), {
    method: 'POST',
    credentials: 'same-origin',
  });

  const responsePayload = await safeParseJson(response);

  if (!response.ok) {
    if (typeof responsePayload === 'string' && responsePayload.trim()) {
      throw new Error(responsePayload.trim());
    }

    if (responsePayload && typeof responsePayload === 'object') {
      const errorResponse = responsePayload as ApiErrorResponse;
      throw new Error(errorResponse.error || errorResponse.message || `Request failed with status ${response.status}.`);
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (typeof responsePayload === 'string' && responsePayload.trim()) {
    return responsePayload.trim();
  }

  if (responsePayload && typeof responsePayload === 'object') {
    const successResponse = responsePayload as ApiErrorResponse;
    return successResponse.message || 'Email relay test request sent successfully.';
  }

  return 'Email relay test request sent successfully.';
}
