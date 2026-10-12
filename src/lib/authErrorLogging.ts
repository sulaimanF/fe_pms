import axios from "axios";

const allowedCodes = new Set([
  "ERR_BAD_OPTION_VALUE", "ERR_BAD_OPTION", "ECONNABORTED", "ETIMEDOUT",
  "ERR_NETWORK", "ERR_FR_TOO_MANY_REDIRECTS", "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE", "ERR_BAD_REQUEST", "ERR_CANCELED",
  "ERR_NOT_SUPPORT", "ERR_INVALID_URL",
]);

interface SafeRequestError {
  status?: number;
  code?: string;
  requestId?: string;
}

export function getSafeRequestError(error: unknown): SafeRequestError {
  const details: SafeRequestError = {};
  if (!axios.isAxiosError(error)) return details;

  const status = error.response?.status;
  if (typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599) {
    details.status = status;
  }
  if (typeof error.code === "string" && allowedCodes.has(error.code)) details.code = error.code;

  // ApiResponse.request_id is the correlation field; omit unfamiliar formats.
  const body: unknown = error.response?.data;
  if (body && typeof body === "object" && "request_id" in body) {
    const requestId = body.request_id;
    if (typeof requestId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
      details.requestId = requestId;
    }
  }
  return details;
}

export function logAuthRequestError(operation: "login" | "logout-revocation", error: unknown) {
  try {
    console.error("Authentication request failed.", { operation, ...getSafeRequestError(error) });
  } catch {
    // Diagnostics must not interrupt login feedback or local session cleanup.
  }
}
