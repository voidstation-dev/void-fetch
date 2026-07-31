/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import { sanitizeFilename } from "@/lib/utils";

interface TemplateVariables {
  index: number;
  title: string;
  creator?: string;
  platform: string;
  mediaId: string;
  quality: string;
}

/**
 * Replaces variables in a template string and sanitizes the resulting filename.
 */
export function renderFilename(
  template: string,
  variables: TemplateVariables,
  extension: string,
): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const timestampStr = String(now.getTime());

  const indexPadded = String(variables.index).padStart(3, "0");

  const replacements: Record<string, string> = {
    "{index}": indexPadded,
    "{title}": variables.title,
    "{creator}": variables.creator || "unknown",
    "{platform}": variables.platform,
    "{mediaId}": variables.mediaId,
    "{quality}": variables.quality,
    "{date}": dateStr,
    "{timestamp}": timestampStr,
  };

  let rendered = template;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    rendered = rendered.replaceAll(placeholder, value);
  });

  // Fallback if template resolved to empty
  if (!rendered.trim()) {
    rendered = `${variables.platform}_${variables.mediaId}`;
  }

  // Sanitize the resulting filename (keeping extension separate to avoid stripping dot)
  const sanitizedBase = sanitizeFilename(rendered.trim());
  const cleanExt = extension.startsWith(".") ? extension : `.${extension}`;

  return `${sanitizedBase}${cleanExt}`;
}
