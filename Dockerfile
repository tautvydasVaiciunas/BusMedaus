# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY .eslintrc.json ./
COPY jest.config.ts ./
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/web ./dist/web
COPY --from=builder /app/static ./static

EXPOSE 3000
CMD ["node", "dist/main.js"]
