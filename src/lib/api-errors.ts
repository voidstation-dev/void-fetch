import type { ApiErrorCode, ApiErrorDetails } from "@/lib/types";
import { toast } from "@/lib/deferred-toast";

export class ApiRequestError extends Error {
  readonly code?: ApiErrorCode | string;
  readonly status?: number;
  readonly requestId?: string;
  readonly details?: ApiErrorDetails;
  readonly fallbackMessage?: string;

  constructor(options: {
    code?: ApiErrorCode | string;
    status?: number;
    requestId?: string;
    details?: ApiErrorDetails;
    fallbackMessage?: string;
  }) {
    super(options.code || options.fallbackMessage || "");
    this.name = "ApiRequestError";
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.details = options.details;
    this.fallbackMessage = options.fallbackMessage;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

/**
 * Translation surface required by the API error resolver.
 * `api` is a record of error-code -> localized message. `downloadError` is the
 * generic fallback used when no code matches.
 */
export interface ApiErrorMessages {
  api: Record<string, string>;
  downloadError: string;
}

/**
 * Resolve a localized message for an API error.
 *
 * @param error the thrown error (usually an `ApiRequestError`)
 * @param messages the `errors` translation surface (from `useTranslations('errors')`
 *   via `t.raw(...)` or a sliced dictionary)
 * @param fallbackMessage explicit fallback string; defaults to
 *   `messages.downloadError`
 */
export function resolveApiErrorMessage(
  error: unknown,
  messages: ApiErrorMessages,
  fallbackMessage?: string,
): string {
  return resolveApiErrorMessageWithFallback(
    error,
    messages,
    fallbackMessage ?? messages.downloadError,
  );
}

export function resolveApiErrorMessageWithFallback(
  error: unknown,
  messages: ApiErrorMessages,
  fallbackMessage: string,
): string {
  if (isApiRequestError(error)) {
    const { code, fallbackMessage: errFallback } = error;

    if (code && code in messages.api) {
      return messages.api[code];
    }

    if (errFallback?.trim()) {
      return errFallback;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * UI/UX Skill: Xử lý thông báo toast thân thiện khi gặp HTTP Status 429 (RATE_LIMITED) hoặc 503/5xx (Server die).
 * Sử dụng id định danh để tránh lặp (deduplicate) toast khi có nhiều job thất bại đồng thời.
 */
export function notifyApiErrorToast(error: unknown): boolean {
  let status: number | undefined;
  let code: string | undefined;

  if (isApiRequestError(error)) {
    status = error.status;
    code = error.code;
  } else if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.status === "number") {
      status = errObj.status;
    } else if (typeof errObj.httpStatus === "number") {
      status = errObj.httpStatus;
    }
    if (typeof errObj.code === "string") {
      code = errObj.code;
    }
  }

  if (status === 429 || code === "RATE_LIMITED" || code === "RATE_LIMIT") {
    toast.error("429: RATE_LIMITED", {
      id: "api-error-429",
      description:
        "Too many requests. Please wait a moment before trying again.",
    });
    return true;
  }

  if (status === 503 || code === "SERVICE_UNAVAILABLE") {
    toast.error("503: Server die", {
      id: "api-error-503",
      description:
        "Server is currently offline or unavailable. Please try again later.",
    });
    return true;
  }

  if (status && status >= 500) {
    toast.error(`${status}: Server die`, {
      id: `api-error-${status}`,
      description:
        "Server is currently offline or unavailable. Please try again later.",
    });
    return true;
  }

  const message = resolveApiErrorMessage(error, {
    api: {},
    downloadError: "An unexpected error occurred.",
  });
  toast.error(message, {
    id: `api-error-${code || status || Date.now()}`,
  });
  return true;
}
