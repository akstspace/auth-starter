import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { member, team, teamMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { APIError } from "better-auth/api";
import {
  jwt,
  lastLoginMethod,
  organization,
  twoFactor,
} from "better-auth/plugins";
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
    jwt({
      jwt: {
        definePayload: async ({ user, session }) => {
          const activeOrganizationId = session.activeOrganizationId ?? null;
          let activeOrganizationRole: string | null = null;

          if (activeOrganizationId) {
            try {
              const [membership] = await db
                .select({ role: member.role })
                .from(member)
                .where(
                  and(
                    eq(member.userId, user.id),
                    eq(member.organizationId, activeOrganizationId),
                  ),
                )
                .limit(1);
              activeOrganizationRole = membership?.role ?? null;
            } catch (error) {
              console.error("Failed to resolve active organization role for JWT:", error);
            }
          }

          return {
            ...user,
            org_id: activeOrganizationId,
            team_id: session.activeTeamId ?? null,
            role: activeOrganizationRole,
          };
        },
      },
    }),

    organization({
      allowUserToCreateOrganization: true,
      sendInvitationEmail,
      teams: {
        enabled: true,
        maximumTeams: 25,
        maximumMembersPerTeam: 100,
        defaultTeam: {
          enabled: false,
        },
      },
      organizationHooks: {
        beforeAddTeamMember: async ({ teamMember: newMember, organization: activeOrg }) => {
          const existingTeams = await db
            .select({ id: teamMember.id })
            .from(teamMember)
            .innerJoin(team, eq(teamMember.teamId, team.id))
            .where(
              and(
                eq(teamMember.userId, newMember.userId),
                eq(team.organizationId, activeOrg.id)
              )
            );

          if (existingTeams.length > 0) {
            throw new APIError("BAD_REQUEST", {
              message: "User is already part of a team in this organization. Users can only be in one team at a time."
            });
          }
        },
      },
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
