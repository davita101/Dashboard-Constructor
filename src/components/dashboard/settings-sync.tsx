"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import * as React from "react"

import { languages, saveLocale, UNSAVED_KEY } from "@/components/dashboard/language"
import { applyTheme, localTheme } from "@/components/dashboard/theme"
import { localLayout, replaceLocalLayout } from "@/components/dashboard/widgets/widget-layout"
import { toast } from "@/components/ui/toast"
import { isLocale, LOCALE_COOKIE } from "@/i18n/config"
import { updateSettingsAction } from "@/lib/settings/actions"
import type { UserSettings } from "@/lib/settings/schemas"

/**
 * Brings the signed-in user's saved settings (user_settings) to this device once per visit: theme, language and
 * widget board. A setting saved on the account wins over this device's copy; one this device has but the account
 * doesn't (chosen before Phase 6) is uploaded. Later changes save themselves (theme.ts, language.tsx, widget-layout.ts).
 * The locale cookie is never created here: with a cookie the account language replaces it; without one the user is
 * asked (toast) and the cookie is written only on "Switch".
 */
function SettingsSync({ settings }: { settings: UserSettings }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("languagePrompt")
  const done = React.useRef(false)

  React.useEffect(() => {
    if (done.current) return
    done.current = true
    const upload: Parameters<typeof updateSettingsAction>[0] = {}

    const theme = localTheme()
    if (settings.theme) {
      if (settings.theme !== theme) applyTheme(settings.theme)
    } else if (theme) upload.theme = theme

    const layout = localLayout()
    if (settings.widgetLayout) {
      if (JSON.stringify(settings.widgetLayout) !== JSON.stringify(layout)) replaceLocalLayout(settings.widgetLayout)
    } else if (layout?.length) upload.widgetLayout = layout

    let refresh = false
    const hasCookie = new RegExp(`(^|; )${LOCALE_COOKIE}=`).test(document.cookie)
    const saved = settings.locale
    // A language picked on this device that the account does not have yet (the save runs after the refresh, or the tab
    // closed first): the device wins and uploads it, instead of being reverted from the stale account value.
    const unsaved = window.localStorage.getItem(UNSAVED_KEY)
    if (isLocale(unsaved)) {
      if (hasCookie && unsaved === locale) upload.locale = unsaved
      else window.localStorage.removeItem(UNSAVED_KEY)
      if (upload.locale) window.localStorage.removeItem(UNSAVED_KEY)
    } else if (saved) {
      if (saved !== locale) {
        if (hasCookie) {
          saveLocale(saved)
          refresh = true
        } else {
          // No cookie: don't touch it. Offer the account's language instead.
          const language = languages.find((l) => l.code === saved)
          if (language)
            toast.add({
              title: t("title", { language: language.native }),
              timeout: 12000,
              actionProps: {
                children: t("switch"),
                onClick: () => {
                  saveLocale(saved)
                  router.refresh()
                },
              },
            })
        }
      }
    } else if (isLocale(locale) && hasCookie) upload.locale = locale

    if (Object.keys(upload).length) void updateSettingsAction(upload)
    if (refresh) router.refresh()
  }, [settings, locale, router, t])

  return null
}

export { SettingsSync }
