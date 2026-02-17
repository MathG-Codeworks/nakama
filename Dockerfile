FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json tsconfig.json ./
RUN apk add --no-cache git
RUN npm install

COPY src ./src
RUN npm run build

FROM registry.heroiclabs.com/heroiclabs/nakama:3.37.0

COPY --from=builder /app/build /nakama/data/modules
COPY local.yml /nakama/data/local.yml

EXPOSE 7349 7350 7351

ENTRYPOINT ["/bin/sh", "-ecx", "\
  /nakama/nakama migrate up --database.address $DATABASE_ADDRESS && \
  exec /nakama/nakama \
  --name nakama1 \
  --database.address $DATABASE_ADDRESS \
  --logger.level DEBUG \
  --socket.address 0.0.0.0 \
  --socket.port ${PORT} \
  --session.token_expiry_sec 7200"
]
