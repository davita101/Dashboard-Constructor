import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config"
import { loadMessages } from "@/i18n/messages"

// No locale in the URL: the choice lives in a cookie (set by the language switcher), so existing routes stay as they are.
export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(stored) ? stored : defaultLocale
  return { locale, messages: await loadMessages(locale) }
})
