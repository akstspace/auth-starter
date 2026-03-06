"use client"

import Link from "next/link"
import { Lock, Settings, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { OrgSwitcher } from "@/components/org-switcher"
import { LoginRequired } from "@/components/login-required"
import { authClient } from "@/lib/auth-client"
import { getAuthErrorMessage } from "@/lib/auth-error"

export default function OrgLayout({ children }: { children: React.ReactNode }) {
    const handleSignOut = async () => {
        const { error } = await authClient.signOut()
        if (error) {
            console.log("Sign out failed:", getAuthErrorMessage(error, "Sign out failed."))
            return
        }
        window.location.href = "/login"
    }

    return (
        <LoginRequired>
            <div className="min-h-dvh bg-background text-foreground transition-colors duration-200">
                <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <Link href="/org" className="flex items-center gap-2.5">
                                <Lock className="size-5 text-foreground" />
                                <span className="hidden text-sm font-semibold tracking-tight text-foreground sm:inline">Auth UI</span>
                            </Link>
                            <span className="hidden text-border/60 sm:inline">/</span>
                            <OrgSwitcher />
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/settings/profile"
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Settings"
                            >
                                <Settings className="size-4" />
                                <span className="hidden sm:inline">Settings</span>
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                title="Sign out"
                                aria-label="Sign out"
                            >
                                <LogOut className="size-4" />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                            <ThemeToggle />
                        </div>
                    </div>
                </nav>
                {children}
            </div>
        </LoginRequired>
    )
}
