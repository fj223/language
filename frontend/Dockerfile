FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
      --prefer-offline \
      --no-audit \
      --no-fund \
      --fetch-retries=5 \
      --fetch-retry-mintimeout=20000 \
      --fetch-retry-maxtimeout=120000

COPY . .
RUN npm run build


FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
