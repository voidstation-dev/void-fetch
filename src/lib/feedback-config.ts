import { API_ENDPOINTS } from "./config";

// Feedback API configuration
export const FEEDBACK_CONFIG = {
  // API endpoint
  apiUrl: API_ENDPOINTS.feedback,

  // Validation rules
  validation: {
    contentMinLength: 5,
    contentMaxLength: 1000,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// Feedback type
export type FeedbackType = "bug" | "feature" | "other";

// Feedback data interface
export interface FeedbackData {
  type: FeedbackType;
  content: string;
  contact?: string;
  metadata?: Record<string, unknown>;
}
