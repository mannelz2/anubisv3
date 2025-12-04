import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const UTMIFY_API_URL = Deno.env.get("UTMIFY_API_URL") || "https://api.utmify.com.br/api-credentials/orders";
const UTMIFY_API_TOKEN = Deno.env.get("UTMIFY_API_TOKEN");

interface UtmifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: "credit_card" | "boleto" | "pix" | "paypal" | "free_price";
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
  createdAt: string;
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    document?: string | null;
    country?: string;
    ip?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId?: string | null;
    planName?: string | null;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters?: {
    src?: string | null;
    sck?: string | null;
    utm_source?: string | null;
    utm_campaign?: string | null;
    utm_medium?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  commission?: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
    currency?: "BRL" | "USD" | "EUR" | "GBP" | "ARS" | "CAD";
  };
  isTest?: boolean;
}

function mapTransactionStatusToUtmify(status: string): UtmifyOrderPayload["status"] {
  const statusMap: Record<string, UtmifyOrderPayload["status"]> = {
    pending: "waiting_payment",
    waiting_payment: "waiting_payment",
    completed: "paid",
    approved: "paid",
    authorized: "paid",
    paid: "paid",
    refused: "refused",
    failed: "refused",
    cancelled: "refused",
    refunded: "refunded",
    chargedback: "chargedback",
    chargeback: "chargedback",
  };

  return statusMap[status.toLowerCase()] || "waiting_payment";
}

function formatDateToUtmify(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function sendOrderToUtmify(payload: UtmifyOrderPayload): Promise<void> {
  if (!UTMIFY_API_TOKEN) {
    console.warn("Utmify API token not configured. Skipping order tracking.");
    return;
  }

  try {
    console.log("Sending order to Utmify:", payload.orderId);

    const response = await fetch(UTMIFY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": UTMIFY_API_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Utmify API error:", response.status, errorText);
      throw new Error(`Utmify API error: ${response.status} ${errorText}`);
    }

    console.log("Order successfully sent to Utmify:", payload.orderId);
  } catch (error) {
    console.error("Failed to send order to Utmify:", error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { transactionId } = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "Transaction ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (txError || !transaction) {
      console.error("Transaction not found:", txError);
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const utmifyStatus = mapTransactionStatusToUtmify(transaction.status);
    const createdAt = formatDateToUtmify(transaction.created_at);
    const approvedDate =
      transaction.status === "completed" ||
      transaction.status === "approved" ||
      transaction.status === "authorized"
        ? formatDateToUtmify(transaction.updated_at || transaction.created_at)
        : null;

    const refundedAt =
      transaction.status === "refunded"
        ? formatDateToUtmify(transaction.updated_at || transaction.created_at)
        : null;

    const utmifyPayload: UtmifyOrderPayload = {
      orderId: transaction.id,
      platform: transaction.provider || "NuBank",
      paymentMethod: "pix",
      status: utmifyStatus,
      createdAt: createdAt,
      approvedDate: approvedDate,
      refundedAt: refundedAt,
      customer: {
        name: transaction.customer_name || "Cliente",
        email: transaction.customer_email || "",
        phone: transaction.customer_phone || null,
        document: transaction.cpf || null,
        country: "BR",
        ip: transaction.customer_ip || null,
      },
      products: [
        {
          id: transaction.id,
          name: transaction.description || "Desafio 30 dias",
          quantity: 1,
          priceInCents: Math.round((transaction.amount || 0) * 100),
        },
      ],
      trackingParameters: {
        src: transaction.src || null,
        sck: transaction.sck || null,
        utm_source: transaction.utm_source || null,
        utm_campaign: transaction.utm_campaign || null,
        utm_medium: transaction.utm_medium || null,
        utm_content: transaction.utm_content || null,
        utm_term: transaction.utm_term || null,
      },
      commission: {
        totalPriceInCents: Math.round((transaction.amount || 0) * 100),
        gatewayFeeInCents: 0,
        userCommissionInCents: Math.round((transaction.amount || 0) * 100),
        currency: "BRL",
      },
      isTest: false,
    };

    await sendOrderToUtmify(utmifyPayload);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order sent to Utmify successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing Utmify integration:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});