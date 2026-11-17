import "server-only"

import { currentUser } from "@clerk/nextjs/server"
import { cache } from "react"

/**
 * True when the signed-in user is the shared demo account (DEMO_EMAIL). The demo account is public, so the UI hides
 * everything that could lock visitors out of it: Clerk's "Manage account" (profile, password, security).
 * Runtime data: call it inside a Suspense boundary.
 */
export const isDemoUser = cache(async (): Promise<boolean> => {
  const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase()
  if (!demoEmail) return false
  const user = await currentUser()
  return user?.emailAddresses.some((e) => e.emailAddress.toLowerCase() === demoEmail) ?? false
})
