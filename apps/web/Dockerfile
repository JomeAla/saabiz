FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json pnpm-lock.yaml* ./

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile=false

COPY libs ./libs
COPY apps/web ./apps/web
COPY apps/api ./apps/api
COPY tsconfig.base.json tsconfig.json ./

RUN npx prisma generate --schema=libs/prisma/schema/schema.prisma

RUN pnpm build:web

FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["pnpm", "run", "start"]
