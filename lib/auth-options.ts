import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { clientIpOptions } from "./client-ip";

export const authOptions = {
  appName: "CertiBlank",
  logger: { level: "warn" },
  hooks: { before: createAuthMiddleware(async (ctx) => {
    if (ctx.path !== "/sign-up/email" && ctx.path !== "/update-user") return;
    const name = ctx.body?.name;
    if ((ctx.path === "/sign-up/email" || name !== undefined) &&
      (typeof name !== "string" || !name.trim() || name.length > 100)) {
      throw new APIError("BAD_REQUEST", { message: "Name must contain 1–100 characters" });
    }
  }) },
  advanced: { ipAddress: clientIpOptions(process.env.DEPLOY_TARGET) },
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
  // Do not merge an unverified password account with a social identity.
  account: { accountLinking: { enabled: false } },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 60,
    customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 60, max: 5 } } },
} satisfies BetterAuthOptions;
