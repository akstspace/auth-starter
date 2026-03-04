import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { jwt, organization, lastLoginMethod, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { sendInvitationEmail, sendVerificationEmail, sendPasswordResetEmail, send2FAEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // ── Account Linking ───────────────────────────────────────────
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  // ── Email & Password Authentication ───────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: sendPasswordResetEmail,
  },

  emailVerification: {
    sendVerificationEmail,
  },

  // ── Social Providers ──────────────────────────────────────────
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // ── Plugins ───────────────────────────────────────────────────
  plugins: [
    jwt(),

    organization({
      allowUserToCreateOrganization: true,
      sendInvitationEmail,
    }),

    passkey(),

    lastLoginMethod(),

    twoFactor({
      issuer: "Auth UI",
      otpOptions: {
        sendOTP: send2FAEmail,
      },
    }),
  ],

  // ── Rate Limiting ─────────────────────────────────────────────
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/social": { window: 10, max: 5 },
      "/sign-in/passkey": { window: 10, max: 5 },
      "/sign-in/email": { window: 10, max: 5 },
      "/sign-up/email": { window: 10, max: 5 },
      "/two-factor/send-otp": { window: 60, max: 3 },
      "/two-factor/verify-totp": { window: 10, max: 5 },
      "/two-factor/verify-otp": { window: 10, max: 5 },
      "/forget-password": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 3 },
    },
  },

  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
