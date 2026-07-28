import type {ApiErrorCode, ApiErrorDetails} from '@/lib/types'

export class ApiRequestError extends Error {
    readonly code?: ApiErrorCode | string
    readonly status?: number
    readonly requestId?: string
    readonly details?: ApiErrorDetails
    readonly fallbackMessage?: string

    constructor(options: {
        code?: ApiErrorCode | string
        status?: number
        requestId?: string
        details?: ApiErrorDetails
        fallbackMessage?: string
    }) {
        super(options.code || options.fallbackMessage || '')
        this.name = 'ApiRequestError'
        this.code = options.code
        this.status = options.status
        this.requestId = options.requestId
        this.details = options.details
        this.fallbackMessage = options.fallbackMessage
    }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
    return error instanceof ApiRequestError
}

/**
 * Translation surface required by the API error resolver.
 * `api` is a record of error-code -> localized message. `downloadError` is the
 * generic fallback used when no code matches.
 */
export interface ApiErrorMessages {
    api: Record<string, string>
    downloadError: string
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
    fallbackMessage?: string
): string {
    return resolveApiErrorMessageWithFallback(error, messages, fallbackMessage ?? messages.downloadError)
}

export function resolveApiErrorMessageWithFallback(
    error: unknown,
    messages: ApiErrorMessages,
    fallbackMessage: string
): string {
    if (isApiRequestError(error)) {
        const {code, fallbackMessage: errFallback} = error

        if (code && code in messages.api) {
            return messages.api[code]
        }

        if (errFallback?.trim()) {
            return errFallback
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}