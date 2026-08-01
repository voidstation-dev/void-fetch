"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe, ChevronDown, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { useLocale, useTranslations } from "next-intl";
import { getLocaleLabel, SUPPORTED_LOCALES } from "@/lib/i18n/locale-meta";
import { LOCALE_COOKIE_NAME, LOCALE_COOKIE_MAX_AGE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  compact?: boolean;
  defaultOpen?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

function setLocaleCookie(locale: Locale) {
  const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secureAttr}`;
}

export function LanguageSwitcher({
  compact = false,
  defaultOpen = false,
  fullWidth = false,
  iconOnly = false,
}: LanguageSwitcherProps) {
  const t = useTranslations("page");
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Safely extract pathname and clean locale prefix to avoid zh/zh-tw conflicts
  const segments = (pathname || "/").split("/").filter(Boolean);
  const firstSegment = segments[0];
  const hasLocalePrefix = SUPPORTED_LOCALES.includes(firstSegment as Locale);
  const pathWithoutLocale =
    "/" + (hasLocalePrefix ? segments.slice(1) : segments).join("/");

  // Handle language change
  const handleLanguageChange = (locale: Locale) => {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    const newPath = `/${locale}${pathWithoutLocale}`;

    // Set locale cookie
    setLocaleCookie(locale);

    // Navigate to new path
    router.push(newPath);
    setIsOpen(false);
  };

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 text-sm select-none",
          compact && "h-9 max-w-[8rem] gap-1.5 px-2.5",
          iconOnly && "h-8 w-8 p-0",
          fullWidth && "w-full justify-between",
        )}
        aria-label={
          iconOnly ? t("switchLanguageLabel") : getLocaleLabel(currentLocale)
        }
      >
        <Globe className="h-4 w-4" />
        {iconOnly ? (
          <span className="sr-only">{t("switchLanguageLabel")}</span>
        ) : compact ? (
          <span className="max-w-[5.5rem] truncate">
            {getLocaleLabel(currentLocale)}
          </span>
        ) : (
          <>
            <span>{getLocaleLabel(currentLocale)}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-background border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center justify-between transition-colors select-none"
              >
                <span>{getLocaleLabel(locale)}</span>
                {locale === currentLocale && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
