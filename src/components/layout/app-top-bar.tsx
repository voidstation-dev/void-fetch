"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, MessageSquare, Music, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeferredLanguageSwitcher } from "@/components/deferred-language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DeferredMobileNavMenu } from "@/components/deferred-mobile-nav-menu";
import { useTranslations } from "next-intl";
import { i18n } from "@/lib/i18n/config";
import { useTopBarActions } from "./top-bar-actions";
import Image from "next/image";

interface AppTopBarProps {
  showHistoryShortcut?: boolean;
  onHistoryClick?: () => void;
  showAudioTool?: boolean;
  onAudioToolClick?: () => void;
  showHomeButton?: boolean;
  homeHref?: string;
}

export function AppTopBar({
  showHistoryShortcut = false,
  onHistoryClick,
  showAudioTool = false,
  onAudioToolClick,
  showHomeButton = false,
  homeHref = "/",
}: AppTopBarProps) {
  const tCommon = useTranslations("common");
  const tHistory = useTranslations("history");
  const tAudioTool = useTranslations("audioTool");
  const tModal = useTranslations("supportedPlatformsModal");
  const { actions } = useTopBarActions();
  const pathname = usePathname();
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const locale = i18n.locales.includes(
    firstSegment as (typeof i18n.locales)[number],
  )
    ? firstSegment
    : i18n.defaultLocale;
  const feedbackHref = `/${locale}/feedback`;
  const resolvedHomeHref = homeHref === "/" ? `/${locale}` : homeHref;
  const shouldShowHomeButton =
    showHomeButton || (pathname !== `/${locale}` && pathname !== `/${locale}/`);
  const effectiveShowHistoryShortcut =
    showHistoryShortcut || actions.showHistoryShortcut;
  const effectiveHistoryClick = onHistoryClick ?? actions.onHistoryClick;
  const effectiveShowAudioTool = showAudioTool || actions.showAudioTool;
  const effectiveAudioToolClick = onAudioToolClick ?? actions.onAudioToolClick;

  return (
    <div
      className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md shadow-2xs"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Mobile Navigation */}
      <div className="md:hidden px-3 sm:px-4">
        <div className="max-w-7xl mx-auto h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            {/* VoidFetch Logo Badge (Mobile) */}
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="relative flex items-center justify-center p-1 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-md">
                <Image src="/favicon.svg" alt="VoidFetch" width={24} height={24} className="rounded-lg" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="font-extrabold text-xs tracking-wider text-foreground">
                VOIDFETCH
              </span>
            </Link>

            {shouldShowHomeButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2"
                asChild
              >
                <Link href={resolvedHomeHref}>
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Feedback button (hidden/commented out)
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link
                href={feedbackHref}
                aria-label={dict.feedback.triggerButton}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">{dict.feedback.triggerButton}</span>
              </Link>
            </Button>
            */}
            <DeferredLanguageSwitcher iconOnly />
            <ThemeSwitcher />
            <DeferredMobileNavMenu />
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* VoidFetch Brand Logo */}
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <Image src="/favicon.svg" alt="VoidFetch" width={40} height={40} className="rounded-lg" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-wider text-foreground">
                    VOIDFETCH
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                    v1.0.0
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {tModal('universalSub')}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {shouldShowHomeButton && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-xl"
                asChild
              >
                <Link href={resolvedHomeHref}>
                  <Home className="h-4 w-4" />
                  <span>{tCommon("home")}</span>
                </Link>
              </Button>
            )}
            {effectiveShowHistoryShortcut && effectiveHistoryClick && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 rounded-xl"
                onClick={effectiveHistoryClick}
              >
                <History className="h-4 w-4" />
                <span>{tHistory("title")}</span>
              </Button>
            )}
            {effectiveShowAudioTool && effectiveAudioToolClick && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 rounded-xl"
                onClick={effectiveAudioToolClick}
              >
                <Music className="h-4 w-4" />
                <span>{tAudioTool("triggerButton")}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Feedback button (hidden/commented out)
            <Button variant="ghost" size="sm" className="rounded-xl" asChild>
              <Link href={feedbackHref} className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>{dict.feedback.triggerButton}</span>
              </Link>
            </Button>
            */}
            <ThemeSwitcher />
            <DeferredLanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
