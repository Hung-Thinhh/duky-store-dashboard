# syntax directive enables BuildKit features like cache mounts
# requires BuildKit: set DOCKER_BUILDKIT=1 when building to use cache
syntax = docker/dockerfile:1.4

FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

# install deps (cached with BuildKit)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# copy sources and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# reuse node_modules from builder to avoid reinstall in runner
COPY --from=builder /app/node_modules ./node_modules

# copy build output and static assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
