FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json pnpm-lock.yaml* ./

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile=false

COPY libs ./libs
COPY apps/web ./apps/web
COPY apps/api ./apps/api
COPY tsconfig.base.json tsconfig.json ./

RUN npx prisma generate --schema=libs/prisma/schema/schema.prisma

EXPOSE 3000

ENV NODE_ENV=development
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

CMD ["pnpm", "run", "dev:web"]
