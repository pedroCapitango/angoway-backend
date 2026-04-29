FROM node:lts-alpine AS builder

WORKDIR /app

# Copia somente arquivos necessários para instalar dependências
COPY package*.json ./

# install pnpm package manager
RUN npm install -g pnpm@10.33.0 

# install dependencies
RUN pnpm install && pnpm install -g prisma

COPY . .

RUN pnpx prisma generate && pnpm run build

FROM node:lts-alpine
    
ENV NODE_ENV=production
ENV DATABASE_URL=postgres://angoway:root@angowaydatabase:5432/angowaydb

WORKDIR /app

# Instala apenas dependências de produção
COPY package*.json ./
RUN pnpm install --production --silent


COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN pnpm ci --only=production

# Expõe a porta da API (o app escuta em process.env.PORT || 3000)
EXPOSE 3000

CMD ["node", "dist/src/main.js"]

