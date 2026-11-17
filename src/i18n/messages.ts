// Message loading shared by the server (request.ts) and the client (the instant language switch in
// components/dashboard/language.tsx). Keep free of next/headers and other server-only imports.
import type { Locale } from "@/i18n/config"
import { defaultLocale } from "@/i18n/config"

import type en from "../../messages/en.json"

export type Messages = typeof en

// Missing keys fall back to English, so a half-translated locale never shows a raw key.
export function mergeMessages<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const current = out[key]
    out[key] =
      value && typeof value === "object" && current && typeof current === "object"
        ? mergeMessages(current as Record<string, unknown>, value as Record<string, unknown>)
        : value
  }
  return out as T
}

/** Messages for `locale`: English, with that locale's translations on top. Each file is its own lazy chunk on the client. */
export async function loadMessages(locale: Locale): Promise<Messages> {
  const en = (await import("../../messages/en.json")).default
  if (locale === defaultLocale) return en
  return mergeMessages<Messages>(en, (await import(`../../messages/${locale}.json`)).default)
}
