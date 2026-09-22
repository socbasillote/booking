import crypto from "node:crypto";
import { env } from "../config/env.js";

const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

type CheckoutSessionResponse = {
  data?: {
    id: string;
    attributes?: {
      checkout_url?: string;
      status?: string;
      payments?: Array<{ attributes?: { status?: string } }>;
    };
  };
  included?: Array<{ attributes?: { status?: string } }>;
};

async function paymongoRequest<T>(path: string, secretKey: string) {
  const response = await fetch(`${PAYMONGO_API_URL}${path}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & {
    errors?: Array<{ detail?: string }>;
  };
  if (!response.ok) {
    throw new Error(
      body.errors
        ?.map((error) => error.detail)
        .filter(Boolean)
        .join(", ") || "Unable to query PayMongo checkout session.",
    );
  }
  return body;
}

export async function createPayMongoCheckoutSession(input: {
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  successUrl: string;
  cancelUrl: string;
  bookingIds: string[];
  secretKey?: string;
}) {
  const secretKey = input.secretKey ?? env.paymongoSecretKey;
  if (!secretKey) {
    throw new Error("PayMongo is not configured.");
  }

  const response = await fetch(`${PAYMONGO_API_URL}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              currency: "PHP",
              amount: input.amount,
              name: input.description,
              quantity: 1,
            },
          ],
          payment_method_types: ["card", "gcash", "paymaya"],
          description: input.description,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: { booking_ids: input.bookingIds.join(",") },
          billing: {
            name: input.customerName,
            email: input.customerEmail,
            phone: input.customerPhone,
          },
        },
      },
    }),
  });

  const body = (await response
    .json()
    .catch(() => ({}))) as CheckoutSessionResponse & {
    errors?: Array<{ detail?: string }>;
  };
  if (!response.ok || !body.data?.id || !body.data.attributes?.checkout_url) {
    throw new Error(
      body.errors
        ?.map((error) => error.detail)
        .filter(Boolean)
        .join(", ") || "Unable to create PayMongo checkout session.",
    );
  }

  return {
    id: body.data.id,
    checkoutUrl: body.data.attributes.checkout_url,
  };
}

export async function getPayMongoCheckoutSessionStatus(input: {
  checkoutSessionId: string;
  secretKey?: string;
}) {
  const secretKey = input.secretKey ?? env.paymongoSecretKey;
  if (!secretKey) return null;

  const body = await paymongoRequest<CheckoutSessionResponse>(
    `/checkout_sessions/${input.checkoutSessionId}?include[]=payments`,
    secretKey,
  );
  const attributes = body.data?.attributes;
  const sessionStatus = attributes?.status?.toLowerCase();
  const paymentStatuses = (attributes?.payments ?? []).map((payment) =>
    payment.attributes?.status?.toLowerCase(),
  );
  const includedPaymentStatuses = (body.included ?? []).map((payment) =>
    payment.attributes?.status?.toLowerCase(),
  );

  if (
    sessionStatus === "paid" ||
    paymentStatuses.includes("paid") ||
    includedPaymentStatuses.includes("paid")
  ) {
    return "paid";
  }

  return sessionStatus ?? null;
}

export function isValidPayMongoSignature(payload: Buffer, signature: string) {
  if (!env.paymongoWebhookSecret || !signature) return false;

  const values = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.trim().split("=", 2);
      return [key?.trim(), value?.trim()];
    }),
  );
  const timestamp = values.t;
  const testSignature = values.te;
  const liveSignature = values.li;
  if (!timestamp || (!testSignature && !liveSignature)) return false;

  const expected = crypto
    .createHmac("sha256", env.paymongoWebhookSecret)
    .update(`${timestamp}.${payload.toString("utf8")}`)
    .digest("hex");
  const provided = testSignature || liveSignature;
  if (!provided || provided.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
