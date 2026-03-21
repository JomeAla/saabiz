FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json pnpm-lock.yaml* ./

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile=false

COPY libs ./libs
COPY apps/api ./apps/api
COPY apps/web ./apps/web
COPY tsconfig.base.json tsconfig.json ./

RUN npx prisma generate --schema=libs/prisma/schema/schema.prisma

RUN pnpm build:api

FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/libs/prisma ./libs/prisma

RUN npx prisma generate --schema=libs/prisma/schema/schema.prisma

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "dist/apps/api/main.js"]
