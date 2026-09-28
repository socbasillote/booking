const configuredApiUrl = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? "https://bookingserver-psi.vercel.app/api" : "/api")
).replace(/\/+$/, "");
const API_URL = configuredApiUrl.endsWith("/api")
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;
const API_CACHE_PREFIX = "sidebooking_api_cache_";
const API_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

type CachedResponse<T> = {
  expiresAt: number;
  data: T;
};

async function cacheKey(path: string, token: string | null) {
  const identity = token ?? "anonymous";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(identity),
  );
  const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${API_CACHE_PREFIX}${fingerprint}_${path}`;
}

function clearApiCache() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(API_CACHE_PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("sidebooking_token");
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const method = (options.method ?? "GET").toUpperCase();
  const response = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok || !body.success) {
    throw new Error(
      body.message ?? body.errors?.join(", ") ?? "Request failed",
    );
  }
  const data = body.data as T;
  if (method === "GET" && !normalizedPath.startsWith("/auth/")) {
    try {
      const key = await cacheKey(normalizedPath, token);
      const cached: CachedResponse<T> = {
        expiresAt: Date.now() + API_CACHE_MAX_AGE,
        data,
      };
      localStorage.setItem(key, JSON.stringify(cached));
    } catch {
      // Caching is best-effort; the network response remains authoritative.
    }
  } else if (method !== "GET") {
    clearApiCache();
  }
  return data;
}

export async function apiRequestWithCache<T>(
  path: string,
  onCachedData: (data: T) => void,
): Promise<T> {
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
  try {
    const key = await cacheKey(
      normalizedPath,
      localStorage.getItem("sidebooking_token"),
    );
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedResponse<T>;
      if (parsed.expiresAt > Date.now()) onCachedData(parsed.data);
      else localStorage.removeItem(key);
    }
  } catch {
    // Continue with the network request when cached data cannot be read.
  }
  return apiRequest<T>(normalizedPath);
}

export type ServicePayload = {
  services: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes?: number;
    duration?: number;
    category?: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
    onlineBookingEnabled?: boolean;
  }>;
};
export type PaymentMethod =
  | "Cash"
  | "Card"
  | "GCash"
  | "Bank transfer"
  | "PayPal"
  | "PayMongo";
export type BookingPayload = {
  bookings: Array<{
    id: string;
    customer: string;
    email: string;
    service: string;
    staff: string;
    date: string;
    time: string;
    status: "Confirmed" | "Pending" | "Completed" | "Rejected";
    payment: "Unpaid" | "Deposit" | "Paid";
    paymentMethod: PaymentMethod;
  }>;
};

export async function fetchServices() {
  return apiRequest<ServicePayload>("/services");
}

export async function fetchBookings() {
  return apiRequest<BookingPayload>("/bookings");
}

export async function saveSession(data: { token: string; user: unknown }) {
  clearApiCache();
  localStorage.setItem("sidebooking_token", data.token);
  localStorage.setItem("sidebooking_user", JSON.stringify(data.user));
}

export function clearSession() {
  clearApiCache();
  localStorage.removeItem("sidebooking_token");
  localStorage.removeItem("sidebooking_user");
}

export function getStoredUser<T>() {
  try {
    return JSON.parse(
      localStorage.getItem("sidebooking_user") ?? "null",
    ) as T | null;
  } catch {
    return null;
  }
}
