# syntax=docker/dockerfile:1
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm install --production=false
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
