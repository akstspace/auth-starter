"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle } from "lucide-react"
import { Suspense } from "react"

function EmailVerifiedContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")
    const isSuccess = !error

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
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
                            className={`flex items-center justify-center size-12 rounded-full ${isSuccess ? "bg-emerald-500/10" : "bg-destructive/10"
                                }`}
                        >
                            {isSuccess ? (
                                <CheckCircle2 className="size-6 text-emerald-500" />
                            ) : (
                                <XCircle className="size-6 text-destructive" />
                            )}
                        </motion.div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-balance">
                        {isSuccess ? "Email verified" : "Verification failed"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 text-pretty">
                        {isSuccess
                            ? "Your email has been verified successfully. You can now sign in to your account."
                            : "The verification link is invalid or has expired. Please request a new one."}
                    </p>
                </div>

                <div className="space-y-2.5">
                    {isSuccess ? (
                        <Link href="/login" className={cn(buttonVariants(), "w-full")}>
                            Sign in
                        </Link>
                    ) : (
                        <>
                            <Link href="/signup" className={cn(buttonVariants(), "w-full")}>
                                Try again
                            </Link>
                            <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                                Back to sign in
                            </Link>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default function EmailVerifiedPage() {
    return (
        <Suspense>
            <EmailVerifiedContent />
        </Suspense>
    )
}
