'use client'

import React, { useState } from 'react'
import { Mail, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/deferred-toast'

interface FeedbackEmailCardProps {
  email: string
  title: string
  description: string
  emailAction: string
  mailtoUrl: string
}

export function FeedbackEmailCard({
  email,
  title,
  description,
  emailAction,
  mailtoUrl,
}: FeedbackEmailCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    toast.success('Email copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-primary/40 group">
      {/* Top Ambient Glow Line */}
      <div className="absolute -top-px inset-x-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Column: Title & Description */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Direct Support
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          {/* Email Address Pill with Copy */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono text-foreground">
              <span>{email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-9 px-3 text-xs gap-1.5 rounded-xl border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Send Email Action */}
        <div className="shrink-0 pt-2 lg:pt-0">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto h-11 px-6 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
          >
            <a href={mailtoUrl}>
              <Mail className="h-4 w-4" />
              <span>{emailAction}</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
