"use client"

import { NextIntlClientProvider, useLocale, useTimeZone } from "next-intl"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuIcon,
  DropdownMenuItem,
  DropdownMenuItemAddon,
  DropdownMenuItemLeft,
  DropdownMenuItemRight,
  DropdownMenuItemTitle,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config"
import { loadMessages, type Messages } from "@/i18n/messages"
import { updateSettingsAction } from "@/lib/settings/actions"

const LANGUAGE_KEY = "dashboard-language"
/** Set while a picked language has not reached the account yet; SettingsSync must not override it from a stale account value. */
const UNSAVED_KEY = "dashboard-language-unsaved"

// Flag asset per locale (public/icons/flags). Locale codes and the default live in "@/i18n/config".
const flags: Record<Locale, string> = { en: "united-states", ka: "georgia", de: "germany", fr: "france", es: "spain" }

// Each language is named in itself, so someone who switched by mistake can still find their way back.
const natives: Record<Locale, string> = { en: "English", ka: "ქართული", de: "Deutsch", fr: "Français", es: "Español" }

type Language = { code: Locale; flag: string; native: string }
const languages: Language[] = locales.map((code) => ({ code, flag: flags[code], native: natives[code] }))

type LanguageContextValue = { language: Language; setLanguage: (code: Locale) => void; preload: (code: Locale) => Promise<unknown> }

const LanguageContext = React.createContext<LanguageContextValue | null>(null)

/** Saves the locale on this device (cookie read by src/i18n/request.ts + localStorage copy). */
function saveLocale(code: Locale) {
  window.localStorage.setItem(LANGUAGE_KEY, code)
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`
}

/** Safety net: save the account language after this long even if the server refresh never reports back. */
const PERSIST_FALLBACK_MS = 4000

/**
 * Chosen language for the dashboard. The server reads the cookie (src/i18n/request.ts) to render next-intl messages.
 * Picking a language is instant for the client UI: its messages are loaded as a small lazy chunk and swapped in here,
 * while the server-rendered parts catch up through a background `router.refresh()` (the old order, a server action
 * queued in front of a full refresh, took 4-5 s before anything changed). The account setting is saved once the refresh
 * has landed, so it never sits in front of it. Nothing writes the cookie on its own: only an explicit choice does.
 */
function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const serverLocale = useLocale()
  const timeZone = useTimeZone()
  // The language picked here, until the server has caught up with it.
  const [picked, setPicked] = React.useState<{ locale: Locale; messages: Messages } | null>(null)
  // The language still to be saved on the account once the refresh lands (or after the fallback timer).
  const toPersist = React.useRef<{ locale: Locale; timer: ReturnType<typeof setTimeout> } | null>(null)
  const locale = picked?.locale ?? serverLocale
  const language = languages.find((l) => l.code === locale) ?? languages[0]

  const persist = React.useCallback((code: Locale) => {
    if (toPersist.current?.locale !== code) return
    clearTimeout(toPersist.current.timer)
    toPersist.current = null
    void updateSettingsAction({ locale: code }).then(() => {
      if (window.localStorage.getItem(UNSAVED_KEY) === code) window.localStorage.removeItem(UNSAVED_KEY)
    })
  }, [])

  // The cookie is only ever written by an explicit choice (setLanguage below, or "Switch" in SettingsSync's prompt):
  // a missing cookie is left alone instead of being re-created in the background.
  React.useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // The server caught up: drop the local copy of the messages (state adjusted while rendering, not in an effect)...
  if (picked && picked.locale === serverLocale) setPicked(null)
  // ...and save the choice on the account (a no-op unless that language is the one waiting to be saved).
  React.useEffect(() => {
    persist(serverLocale)
  }, [serverLocale, persist])

  const setLanguage = React.useCallback(
    async (code: Locale) => {
      if (code === locale) return
      saveLocale(code)
      window.localStorage.setItem(UNSAVED_KEY, code)
      // Swap the client UI first; the server parts follow from the refresh.
      const messages = await loadMessages(code)
      setPicked({ locale: code, messages })
      if (toPersist.current) clearTimeout(toPersist.current.timer)
      toPersist.current = { locale: code, timer: setTimeout(() => persist(code), PERSIST_FALLBACK_MS) }
      React.startTransition(() => router.refresh())
      // Safety net: if the server never agrees (failed refresh), fall back to what it renders instead of sticking.
      setTimeout(() => setPicked((p) => (p?.locale === code ? null : p)), 8000)
    },
    [locale, router, persist]
  )

  const value = React.useMemo(() => ({ language, setLanguage, preload: loadMessages }), [language, setLanguage])
  const content = <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  return picked ? (
    <NextIntlClientProvider locale={picked.locale} messages={picked.messages} timeZone={timeZone}>
      {content}
    </NextIntlClientProvider>
  ) : (
    content
  )
}

function useLanguage() {
  const ctx = React.useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider")
  return ctx
}

function LanguageFlag({ language }: { language: Language }) {
  return (
    <Avatar size="24">
      <AvatarImage src={`/icons/flags/${language.flag}.svg`} alt="" />
      <AvatarFallback variant="placeholder">{language.code.toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}

/**
 * Language picker menu. `trigger` is the element that opens it (footer button, sidebar row), so the same menu
 * serves both places. Picking an option saves it (see LanguageProvider).
 */
function LanguageMenu({
  trigger,
  side = "top",
  align = "end",
}: {
  trigger: React.ReactElement<Record<string, unknown>>
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}) {
  const { language, setLanguage, preload } = useLanguage()
  return (
    // Fetch the other languages' messages as the menu opens, so picking one swaps the UI without a network wait.
    <DropdownMenu onOpenChange={(open) => open && languages.forEach((l) => void preload(l.code))}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent side={side} align={align} shape="pilled">
        <DropdownMenuGroup>
          {languages.map((l) => (
            <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)}>
              <DropdownMenuItemLeft>
                <DropdownMenuItemAddon>
                  <LanguageFlag language={l} />
                </DropdownMenuItemAddon>
                <DropdownMenuItemTitle>{l.native}</DropdownMenuItemTitle>
              </DropdownMenuItemLeft>
              {l.code === language.code && (
                <DropdownMenuItemRight>
                  <DropdownMenuIcon name="material-check" />
                </DropdownMenuItemRight>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { LanguageFlag, LanguageMenu, LanguageProvider, languages, saveLocale, UNSAVED_KEY, useLanguage }
