import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

export function Footer({ locale, dict }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/80 bg-card/90 backdrop-blur-xl py-8 mt-auto overflow-hidden">
      {/* Glow Ambient Top Border */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs tracking-wider text-foreground uppercase">
            VOIDFETCH
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
            v1.0.0
          </span>
          <span className="text-xs text-muted-foreground">
            © {currentYear} VoidStation
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link
            className="hover:text-primary transition-colors font-medium"
            href={`/${locale}/privacy`}
            prefetch={false}
          >
            {dict.common.privacy}
          </Link>
          <span>·</span>
          <Link
            className="hover:text-primary transition-colors font-medium"
            href={`/${locale}/terms`}
            prefetch={false}
          >
            {dict.common.terms}
          </Link>
          <span>·</span>
          <Link
            className="hover:text-primary transition-colors font-medium"
            href={`/${locale}/contact`}
            prefetch={false}
          >
            {dict.common.contact}
          </Link>
          <span>·</span>
          <Link
            className="hover:text-primary transition-colors font-medium"
            href={`/${locale}/about`}
            prefetch={false}
          >
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
