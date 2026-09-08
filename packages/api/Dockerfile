# Builds the API image. The same image is used for both the `api` and
# `worker` docker-compose services - only the startup command differs.
FROM node:20-alpine AS build
WORKDIR /repo

# ffmpeg is needed at build time too, since nothing here actually runs
# transcodes during build, but keeping the stages symmetric avoids surprises.
RUN apk add --no-cache python3 make g++

COPY package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/api/package.json packages/api/package.json
RUN npm install

COPY packages/shared packages/shared
COPY packages/api packages/api
COPY tsconfig.base.json ./

RUN npm run build --workspace=@mahalle/shared
RUN npm run prisma:generate --workspace=@mahalle/api
RUN npm run build --workspace=@mahalle/api

FROM node:20-alpine AS runtime
WORKDIR /repo

# ffmpeg is required at RUNTIME for the worker's video transcoding step.
RUN apk add --no-cache ffmpeg && addgroup -S mahalle && adduser -S mahalle -G mahalle

ENV NODE_ENV=production
COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/packages/shared packages/shared
COPY --from=build /repo/packages/api packages/api

RUN mkdir -p /data/media/uploads /data/media/processed && chown -R mahalle:mahalle /data
USER mahalle

WORKDIR /repo/packages/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
