import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { authOptions } from "./auth-options";

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  ...authOptions,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: googleEnabled ? {
    google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
  } : {},
});
