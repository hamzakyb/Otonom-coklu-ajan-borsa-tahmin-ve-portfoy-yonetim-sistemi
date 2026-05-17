# STAGE 1: Install dependencies
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Ensure no host contamination
COPY package.json ./
RUN rm -rf node_modules package-lock.json && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retries 10 && \
    npm install --legacy-peer-deps

# STAGE 2: Build the app
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build settings
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Force build
RUN npm run build

# STAGE 3: Production runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
