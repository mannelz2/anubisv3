const UTMIFY_API_URL = import.meta.env.VITE_UTMIFY_API_URL || 'https://api.utmify.com.br/api-credentials/orders';
const UTMIFY_API_TOKEN = import.meta.env.VITE_UTMIFY_API_TOKEN;

interface UtmifyCustomer {
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  country?: string;
  ip?: string;
}

interface UtmifyProduct {
  id: string;
  name: string;
  planId?: string | null;
  planName?: string | null;
  quantity: number;
  priceInCents: number;
}

interface UtmifyTrackingParameters {
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

interface UtmifyCommission {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP' | 'ARS' | 'CAD';
}

export interface UtmifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: 'credit_card' | 'boleto' | 'pix' | 'paypal' | 'free_price';
  status: 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback';
  createdAt: string;
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: UtmifyCustomer;
  products: UtmifyProduct[];
  trackingParameters?: UtmifyTrackingParameters;
  commission?: UtmifyCommission;
  isTest?: boolean;
}

export async function sendOrderToUtmify(payload: UtmifyOrderPayload): Promise<void> {
  if (!UTMIFY_API_TOKEN) {
    console.warn('Utmify API token not configured. Skipping order tracking.');
    return;
  }

  try {
    const response = await fetch(UTMIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_API_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Utmify API error:', response.status, errorText);
      throw new Error(`Utmify API error: ${response.status} ${errorText}`);
    }

    console.log('Order successfully sent to Utmify:', payload.orderId);
  } catch (error) {
    console.error('Failed to send order to Utmify:', error);
    throw error;
  }
}

export function mapTransactionStatusToUtmify(status: string): UtmifyOrderPayload['status'] {
  const statusMap: Record<string, UtmifyOrderPayload['status']> = {
    'pending': 'waiting_payment',
    'waiting_payment': 'waiting_payment',
    'completed': 'paid',
    'approved': 'paid',
    'authorized': 'paid',
    'paid': 'paid',
    'refused': 'refused',
    'failed': 'refused',
    'cancelled': 'refused',
    'refunded': 'refunded',
    'chargedback': 'chargedback',
    'chargeback': 'chargedback',
  };

  return statusMap[status.toLowerCase()] || 'waiting_payment';
}

export function formatDateToUtmify(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
