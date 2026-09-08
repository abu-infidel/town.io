FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/web/package.json packages/web/package.json
RUN npm install

COPY packages/shared packages/shared
COPY packages/web packages/web

RUN npm run build --workspace=@mahalle/shared
RUN npm run build --workspace=@mahalle/web

FROM node:20-alpine AS runtime
WORKDIR /app

RUN addgroup -S mahalle && adduser -S mahalle -G mahalle
ENV NODE_ENV=production

COPY --from=build /repo/packages/web/.next/standalone ./
COPY --from=build /repo/packages/web/.next/static ./packages/web/.next/static
COPY --from=build /repo/packages/web/public ./packages/web/public

USER mahalle
WORKDIR /app/packages/web
EXPOSE 3000
CMD ["node", "server.js"]
