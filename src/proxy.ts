import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "./lib/i18n/config";
import {
  LOCALE_REDIRECT_VARY_HEADERS,
  isBotUserAgent,
  normalizeCookieLocale,
  resolveLocaleForRequest,
} from "./lib/seo-routing";
import { appendVaryHeader } from "./lib/seo";
import { LOCALE_COOKIE_NAME, LOCALE_COOKIE_MAX_AGE } from "./lib/constants";

const ACCEPT_LANGUAGE_CACHE_LIMIT = 64;
const acceptLanguageCache = new Map<string, string[]>();

function getLocaleFromCookie(request: NextRequest): string | null {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  return normalizeCookieLocale(cookieLocale ?? null, i18n.locales);
}

function getAcceptedLanguages(request: NextRequest): string[] {
  const header = request.headers.get("accept-language");
  if (!header) {
    return [];
  }

  const cached = acceptLanguageCache.get(header);
  if (cached) {
    return cached;
  }

  const parsed = header
    .split(",")
    .map((part) => {
      const [tagPart, qualityPart] = part.trim().split(";q=");
      const tag = tagPart.trim();
      const quality = qualityPart ? Number.parseFloat(qualityPart) : 1;
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((item) => item.tag.length > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.tag);

  if (acceptLanguageCache.size >= ACCEPT_LANGUAGE_CACHE_LIMIT) {
    const oldestKey = acceptLanguageCache.keys().next().value;
    if (oldestKey) {
      acceptLanguageCache.delete(oldestKey);
    }
  }
  acceptLanguageCache.set(header, parsed);

  return parsed;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  const cookieLocale = getLocaleFromCookie(request);

  // Skip API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if the pathname has any supported locale
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect if there is no locale prefix
  const locale = resolveLocaleForRequest({
    pathname,
    userAgent,
    cookieLocale,
    acceptLanguages: getAcceptedLanguages(request),
    locales: i18n.locales,
    defaultLocale: i18n.defaultLocale,
  });
  request.nextUrl.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(request.nextUrl, 308);
  appendVaryHeader(response.headers, [...LOCALE_REDIRECT_VARY_HEADERS]);

  // Set cookie to remember user language preference (only for real user requests and if cookie doesn't exist)
  if (!isBotUserAgent(userAgent) && !cookieLocale) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    // Only match page requests without a locale prefix to reduce middleware overhead for already localized routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.|(?:zh|zh-tw|en|ja|es|ru|vi)(?:/|$)).*)",
  ],
};
