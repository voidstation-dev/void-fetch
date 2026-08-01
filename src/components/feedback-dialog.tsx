"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/lib/deferred-toast";
import { useTranslations } from "next-intl";
import type { FeedbackType } from "@/lib/feedback-config";
import {
  collectFeedbackClientMetadata,
  submitFeedback,
  validateContent,
  validateEmail,
} from "@/lib/feedback";
import { FEEDBACK_CONFIG } from "@/lib/feedback-config";
import { cn } from "@/lib/utils";
import {
  isApiRequestError,
  resolveApiErrorMessageWithFallback,
} from "@/lib/api-errors";

interface FeedbackDialogProps {
  triggerClassName?: string;
  triggerIconOnly?: boolean;
  triggerLabel?: string;
  defaultOpen?: boolean;
  onTriggerClick?: () => void;
}

export function FeedbackDialog({
  triggerClassName,
  triggerIconOnly = false,
  triggerLabel: triggerLabelOverride,
  defaultOpen = false,
  onTriggerClick,
}: FeedbackDialogProps) {
  const tFeedback = useTranslations("feedback");
  const tErrors = useTranslations("errors");
  const triggerLabel = triggerLabelOverride ?? tFeedback("triggerButton");
  const [open, setOpen] = useState(defaultOpen);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Character count
  const contentLength = content.length;
  const maxLength = FEEDBACK_CONFIG.validation.contentMaxLength;

  // Validation state
  const contentError = content ? validateContent(content) : null;
  const emailError = email ? !validateEmail(email) : null;
  const canSubmit =
    !contentError &&
    !emailError &&
    content.trim().length >= FEEDBACK_CONFIG.validation.contentMinLength;
  const contentTooShortMessage = tFeedback("contentTooShort", {
    min: FEEDBACK_CONFIG.validation.contentMinLength,
  });
  const contentCounterText = tFeedback("contentCounter", {
    current: contentLength,
    max: maxLength,
  });

  // Get placeholder based on feedback type
  const getPlaceholder = () => {
    return (
      tFeedback(`contentPlaceholder.${feedbackType}`) ||
      tFeedback("contentPlaceholder.other") ||
      ""
    );
  };

  // Reset form
  const resetForm = () => {
    setFeedbackType("bug");
    setContent("");
    setEmail("");
    setSubmitStatus("idle");
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Delay reset to wait for close animation
      const timer = setTimeout(resetForm, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle submission
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      // Submit feedback
      await submitFeedback({
        type: feedbackType,
        content: content.trim(),
        contact: email.trim(),
        metadata: collectFeedbackClientMetadata(),
      });

      setSubmitStatus("success");
      toast.success(tFeedback("toastSuccess"));

      // Auto close after 3 seconds
      setTimeout(() => {
        setOpen(false);
      }, 3000);
    } catch (error) {
      if (isApiRequestError(error)) {
        console.error("Feedback submit failed", {
          code: error.code,
          status: error.status,
          requestId: error.requestId,
          details: error.details,
        });
      } else {
        console.error("Submit error:", error);
      }

      const errorMessage = resolveApiErrorMessageWithFallback(
        error,
        {
          api: {
            networkError: tErrors("api.networkError"),
            rateLimit: tErrors("api.rateLimit"),
            serverError: tErrors("api.serverError"),
            serviceUnavailable: tErrors("api.serviceUnavailable"),
            unknownError: tErrors("api.unknownError"),
          },
          downloadError: tErrors("downloadError"),
        },
        tFeedback("errorMessage"),
      );
      setSubmitStatus("error");
      toast.error(tFeedback("toastError"), {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render success state
  const renderSuccess = () => (
    <div className="py-8 text-center space-y-4">
      <div className="flex justify-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{tFeedback("successTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {tFeedback("successMessage")}
        </p>
        {email && (
          <p className="text-xs text-muted-foreground">
            {tFeedback("successNote")}
          </p>
        )}
      </div>
      <Button onClick={() => setOpen(false)} className="mt-4">
        {tFeedback("closeButton")}
      </Button>
    </div>
  );

  // Render form
  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="feedback-type">
          {tFeedback("typeLabel")} <span className="text-red-500">*</span>
        </Label>
        <Select
          value={feedbackType}
          onValueChange={(value) => setFeedbackType(value as FeedbackType)}
        >
          <SelectTrigger id="feedback-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">{tFeedback("types.bug")}</SelectItem>
            <SelectItem value="feature">
              {tFeedback("types.feature")}
            </SelectItem>
            <SelectItem value="other">{tFeedback("types.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-content">
          {tFeedback("contentLabel")} <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="feedback-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={getPlaceholder()}
          rows={5}
          className="resize-none"
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center text-xs">
          <span
            className={contentError ? "text-red-500" : "text-muted-foreground"}
          >
            {contentError === "contentRequired" && tFeedback("contentRequired")}
            {contentError === "contentTooShort" && contentTooShortMessage}
          </span>
          <span
            className={
              contentLength > maxLength * 0.9
                ? "text-yellow-500"
                : "text-muted-foreground"
            }
          >
            {contentCounterText}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-email">{tFeedback("emailLabel")}</Label>
        <Input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={tFeedback("emailPlaceholder")}
        />
        {emailError && (
          <p className="text-xs text-red-500">{tFeedback("emailInvalid")}</p>
        )}
        {!email && !emailError && (
          <p className="text-xs text-muted-foreground">
            {tFeedback("emailRequired")}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {tFeedback("diagnosticInfoHint")}
      </p>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={isSubmitting}
        >
          {tFeedback("cancelButton")}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tFeedback("submittingButton")}
            </>
          ) : (
            tFeedback("submitButton")
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={triggerIconOnly ? "icon" : "sm"}
          className={cn("text-sm", triggerClassName)}
          onClick={onTriggerClick}
          aria-label={triggerLabel}
        >
          <MessageSquare
            className={cn("h-4 w-4", !triggerIconOnly && "mr-1")}
          />
          {triggerIconOnly ? (
            <span className="sr-only">{triggerLabel}</span>
          ) : (
            triggerLabel
          )}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{tFeedback("title")}</DialogTitle>
        </DialogHeader>
        {submitStatus === "success" ? renderSuccess() : renderForm()}
      </DialogContent>
    </Dialog>
  );
}
