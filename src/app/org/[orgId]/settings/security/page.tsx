"use client"

import { useState } from "react"
import { use } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, KeySquare, ShieldCheck, Download } from "lucide-react"
import QRCode from "react-qr-code"

export default function SecuritySettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = use(params)
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState("")
    const [totpURI, setTotpURI] = useState("")
    const [totpCode, setTotpCode] = useState("")
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [verified, setVerified] = useState(false)
    const [error, setError] = useState("")

    const { data: session } = authClient.useSession()
    const is2FAEnabled = session?.user?.twoFactorEnabled

    const enable2FA = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const { data, error } = await authClient.twoFactor.enable({
                password,
            })

            if (error) {
                setError(error.message || "Failed to enable 2FA.")
            } else if (data) {
                if (data.totpURI) setTotpURI(data.totpURI)
                if (data.backupCodes) setBackupCodes(data.backupCodes)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to enable 2FA.")
        } finally {
            setPassword("")
            setLoading(false)
        }
    }

    const verifyTotp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const { data, error } = await authClient.twoFactor.verifyTotp({
                code: totpCode,
            })

            if (error) {
                setError(error.message || "Invalid code. Please try again.")
            } else {
                setVerified(true)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed.")
        } finally {
            setLoading(false)
        }
    }

    const disable2FA = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const { error } = await authClient.twoFactor.disable({
                password,
            })

            if (error) {
                setError(error.message || "Failed to disable 2FA.")
            } else {
                window.location.reload()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to disable 2FA.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Shield className="size-5" />
                    Security Settings
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your account security and two-factor authentication.
                </p>
            </div>

            <div className="border border-border/50 rounded-lg p-6 bg-card text-card-foreground">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className={`size-6 ${is2FAEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
                    <div>
                        <h3 className="text-lg font-semibold">Two-Factor Authentication (2FA)</h3>
                        <p className="text-sm text-muted-foreground">
                            {is2FAEnabled ? "2FA is currently enabled on your account." : "Add an extra layer of security to your account."}
                        </p>
                    </div>
                </div>

                {error && <div className="text-sm text-destructive mb-4">{error}</div>}

                {/* Step 1: Enter password to start enabling 2FA */}
                {!is2FAEnabled && !totpURI && (
                    <form onSubmit={enable2FA} className="space-y-4 max-w-sm mt-6">
                        <p className="text-sm font-medium">Verify your password to enable 2FA:</p>
                        <Input
                            type="password"
                            placeholder="Current password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button type="submit" disabled={loading || !password}>
                            {loading ? "Enabling..." : "Enable 2FA"}
                        </Button>
                    </form>
                )}

                {/* Step 2: Show QR code and verify TOTP code */}
                {totpURI && !verified && (
                    <div className="mt-6 space-y-6">
                        <div className="p-4 bg-white rounded-lg inline-block">
                            <QRCode value={totpURI} size={150} />
                        </div>
                        <p className="text-sm max-w-sm text-muted-foreground">
                            Scan this QR code with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit code below to verify.
                        </p>
                        <form onSubmit={verifyTotp} className="space-y-4 max-w-sm">
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                                required
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                autoComplete="one-time-code"
                            />
                            <Button type="submit" disabled={loading || totpCode.length < 6}>
                                {loading ? "Verifying..." : "Verify and enable"}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Step 3: Show backup codes after successful verification */}
                {verified && backupCodes.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <div className="text-sm text-emerald-500 font-medium">
                            ✓ 2FA has been enabled successfully.
                        </div>
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                                <KeySquare className="size-4" />
                                Backup Codes
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Save these codes in a secure place. You can use them to sign in if you lose access to your authenticator app.
                            </p>
                            <div className="grid grid-cols-2 gap-2 max-w-sm font-mono text-sm">
                                {backupCodes.map((code, i) => (
                                    <div key={i} className="p-2 bg-secondary/50 rounded border border-border/50 text-center tracking-widest">
                                        {code}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const content = `Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nEach code can only be used once.`
                                        const blob = new Blob([content], { type: "text/plain" })
                                        const url = URL.createObjectURL(blob)
                                        const a = document.createElement("a")
                                        a.href = url
                                        a.download = "backup-codes.txt"
                                        a.click()
                                        URL.revokeObjectURL(url)
                                    }}
                                >
                                    <Download className="size-4 mr-2" />
                                    Download .txt
                                </Button>
                                <Button onClick={() => window.location.reload()}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disable 2FA section */}
                {is2FAEnabled && (
                    <form onSubmit={disable2FA} className="space-y-4 max-w-sm mt-6 border-t border-border/50 pt-6">
                        <p className="text-sm font-medium">Verify your password to disable 2FA:</p>
                        <Input
                            type="password"
                            placeholder="Current password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button type="submit" variant="destructive" disabled={loading || !password}>
                            {loading ? "Disabling..." : "Disable 2FA"}
                        </Button>
                    </form>
                )}

            </div>
        </div>
    )
}
