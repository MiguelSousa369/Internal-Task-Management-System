# Backend - imagem de produção (usada por deploy/docker-compose.yml), construída a partir da raiz
# do repositório. Ao arrancar aplica as migrações pendentes e depois inicia a API.

FROM node:24-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN npx prisma generate
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:24-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false DOTENV_CONFIG_QUIET=true
# node_modules do build: inclui o CLI do Prisma (migrate deploy) e o tsx (npm run create-admin).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY backend/package.json backend/prisma.config.ts ./
# Os YAML do Swagger são lidos em runtime a partir de src/docs (ver src/lib/swagger.ts).
COPY backend/src/docs ./src/docs
# O Winston escreve em ./logs; o utilizador sem privilégios tem de ser o dono (o volume herda isto).
RUN mkdir -p /app/logs && chown node:node /app/logs
USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
