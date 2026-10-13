FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
      --ignore-scripts \
      --prefer-offline \
      --no-audit \
      --no-fund \
      --fetch-retries=5 \
      --fetch-retry-mintimeout=20000 \
      --fetch-retry-maxtimeout=120000
RUN npm rebuild @prisma/engines

COPY prisma ./prisma
RUN npm run prisma:generate
COPY . .
RUN npm run build
RUN npm prune --omit=dev --no-audit --no-fund


FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
