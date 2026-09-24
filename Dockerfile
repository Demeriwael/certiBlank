# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY next.config.ts tsconfig.json postcss.config.mjs prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
# Syntax-only build values; never supply production credentials to docker build.
RUN DEPLOY_TARGET=ec2 \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/certi_build \
    DIRECT_URL=postgresql://build:build@127.0.0.1:5432/certi_build \
    BETTER_AUTH_URL=http://localhost:3000 \
    BETTER_AUTH_SECRET=build-only-placeholder-never-use-in-production-123456789 \
    npm run build

FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DEPLOY_TARGET=ec2 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Explicitly retain Prisma's generated Linux client and OpenSSL 3 engine.
COPY --from=build /app/node_modules/.prisma/client ./node_modules/.prisma/client
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/questions',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.status===400?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
