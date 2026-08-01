import { FEEDBACK_CONFIG, type FeedbackData } from "./feedback-config";
import { ApiRequestError } from "./api-errors";
import type { UnifiedApiResponse } from "./types";

function resolveBrowser(userAgent: string): { name: string; version?: string } {
  const browserMatchers: Array<[string, RegExp]> = [
    ["Edge", /Edg\/([0-9.]+)/],
    ["Chrome", /Chrome\/([0-9.]+)/],
    ["Firefox", /Firefox\/([0-9.]+)/],
    ["Safari", /Version\/([0-9.]+).*Safari/],
  ];

  for (const [name, pattern] of browserMatchers) {
    const match = userAgent.match(pattern);
    if (match?.[1]) {
      return { name, version: match[1] };
    }
  }

  return { name: "Unknown" };
}

function resolveOS(userAgent: string): { name: string; version?: string } {
  const osMatchers: Array<[string, RegExp]> = [
    ["Windows", /Windows NT ([0-9.]+)/],
    ["macOS", /Mac OS X ([0-9_]+)/],
    ["iOS", /(?:iPhone|iPad|iPod).*OS ([0-9_]+)/],
    ["Android", /Android ([0-9.]+)/],
    ["Linux", /Linux/],
  ];

  for (const [name, pattern] of osMatchers) {
    const match = userAgent.match(pattern);
    if (match) {
      return {
        name,
        version: match[1]?.replace(/_/g, "."),
      };
    }
  }

  return { name: "Unknown" };
}

function resolveDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) {
    return "tablet";
  }

  if (/Mobile|iPhone|iPod|Android/i.test(userAgent)) {
    return "mobile";
  }

  return "desktop";
}

export function collectFeedbackClientMetadata():
  Record<string, unknown> | undefined {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return undefined;
  }

  const userAgent = navigator.userAgent || "";

  return {
    browser: resolveBrowser(userAgent),
    os: resolveOS(userAgent),
    deviceType: resolveDeviceType(userAgent),
    userAgent,
    platform: navigator.platform || undefined,
    language: navigator.language || undefined,
    languages: Array.from(navigator.languages || []),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    path: window.location.pathname,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio,
    },
  };
}

/**
 * Submit feedback to self-hosted API
 */
export async function submitFeedback(data: FeedbackData): Promise<void> {
  try {
    // Build request body
    const requestBody = {
      type: data.type,
      content: data.content.trim(),
      contact: data.contact?.trim() || undefined,
      metadata: data.metadata,
    };

    // Send POST request to feedback API
    const response = await fetch(FEEDBACK_CONFIG.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Parse response
    const result = (await response.json()) as UnifiedApiResponse<{
      feedbackId?: string;
    }>;

    // Check response status
    if (response.ok && result.success) {
      return;
    }

    throw new ApiRequestError({
      code: result.code,
      status: result.status ?? response.status,
      requestId: result.requestId,
      details: result.details,
      fallbackMessage: result.error || result.message,
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw new ApiRequestError({
      fallbackMessage: error instanceof Error ? error.message : undefined,
    });
  }
}

/**
 * Validate feedback content
 * @param content Feedback content
 * @returns Error code, or null if validation passes
 */
export function validateContent(content: string): string | null {
  const trimmed = content.trim();

  if (!trimmed) {
    return "contentRequired";
  }

  if (trimmed.length < FEEDBACK_CONFIG.validation.contentMinLength) {
    return "contentTooShort";
  }

  if (trimmed.length > FEEDBACK_CONFIG.validation.contentMaxLength) {
    return "contentTooLong";
  }

  return null;
}

/**
 * Validate email format
 * @param email Email address
 * @returns Whether it is valid
 */
export function validateEmail(email: string): boolean {
  if (!email.trim()) {
    return true; // Email is optional, empty values are considered valid
  }

  return FEEDBACK_CONFIG.validation.emailRegex.test(email.trim());
}
