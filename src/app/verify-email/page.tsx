"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail } from "lucide-react"

function VerifyEmailContent() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [manualEmail, setManualEmail] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session } = authClient.useSession()

    // Try to get email from: 1) session, 2) query param, 3) manual input
    const emailFromParam = searchParams.get("email")
    const userEmail = session?.user?.email || emailFromParam || ""

    const handleResend = async () => {
        const emailToUse = userEmail || manualEmail
        if (!emailToUse) {
            setError("Please enter your email address.")
            return
        }
        setLoading(true)
        setError("")
        setMessage("")
        try {
            const { error } = await authClient.sendVerificationEmail({
                email: emailToUse,
                callbackURL: "/email-verified",
            })
            if (error) {
                setError(error.message || "Failed to resend verification email.")
            } else {
                setMessage("Verification email has been resent!")
            }
        } catch {
            setError("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    const [checking, setChecking] = useState(false)

    const handleCheckStatus = async () => {
        setChecking(true)
        setError("")
        setMessage("")
        try {
            const { data } = await authClient.getSession()
            if (data?.user?.emailVerified) {
                router.push("/")
            } else {
                setError("Email not verified yet. Please check your inbox and click the verification link.")
            }
        } catch {
            setError("Could not check verification status.")
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-sm"
            >
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
                            <Mail className="size-6 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-balance">Check your email</h1>
                    <p className="text-sm text-muted-foreground mt-2 text-pretty">
                        We need to verify your email address to secure your account. Please check your inbox.
                    </p>
                </div>

                {error && (
                    <div role="alert" className="text-sm text-destructive text-center py-1 mb-4">
                        {error}
                    </div>
                )}
                {message && (
                    <div role="alert" className="text-sm text-emerald-500 text-center py-1 mb-4">
                        {message}
                    </div>
                )}

                <div className="space-y-4">
                    <Button onClick={handleCheckStatus} className="w-full" disabled={checking}>
                        {checking ? "Checking..." : "I've verified my email"}
                    </Button>

                    {/* Show email input if we don't have the email from session or params */}
                    {!userEmail && (
                        <Input
                            type="email"
                            placeholder="Enter your email address"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                        />
                    )}

                    <Button
                        variant="outline"
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? "Sending..." : "Resend verification email"}
                    </Button>

                    <button
                        type="button"
                        onClick={async () => {
                            await authClient.signOut()
                            router.push("/login")
                        }}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                    >
                        Sign out and use a different account
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailContent />
        </Suspense>
    )
}
