import type { BetterAuthOptions } from "better-auth";

export const authOptions = {
  appName: "CertiBlank",
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
  // Do not merge an unverified password account with a Google identity.
  account: { accountLinking: { enabled: false } },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 60,
    customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 60, max: 5 } } },
} satisfies BetterAuthOptions;
