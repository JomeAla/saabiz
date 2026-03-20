FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json pnpm-lock.yaml* ./

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile=false

COPY libs ./libs
COPY apps/api ./apps/api
COPY apps/web ./apps/web
COPY tsconfig.base.json tsconfig.json ./

RUN npx prisma generate --schema=libs/prisma/schema/schema.prisma

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=development
ENV DATABASE_URL="postgresql://postgres:Mylordhelpme12@saabiz-postgres:5432/saabiz?schema=public"
ENV JWT_SECRET="SAABIZ_JWT_SECRET_2026_KEY"
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

CMD ["npx", "ts-node", "-r", "tsconfig-paths/register", "apps/api/src/main.ts"]
