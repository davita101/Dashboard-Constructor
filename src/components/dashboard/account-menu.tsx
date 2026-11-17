"use client"

import { UserButton } from "@clerk/nextjs"
import * as React from "react"

// Clerk's account menu (Manage account, Sign out). The shared demo account gets Sign out only: no profile,
// password or security settings, so a visitor can't change the credentials the next visitor relies on.
const DemoAccountContext = React.createContext(false)

function DemoAccountProvider({ demo, children }: { demo: boolean; children: React.ReactNode }) {
  return <DemoAccountContext.Provider value={demo}>{children}</DemoAccountContext.Provider>
}

const demoElements = { userButtonPopoverActionButton__manageAccount: "hidden!" }

function AccountMenu({ elements }: { elements: Record<string, string> }) {
  const demo = React.useContext(DemoAccountContext)
  return <UserButton appearance={{ elements: demo ? { ...elements, ...demoElements } : elements }} />
}

export { AccountMenu, DemoAccountProvider }
