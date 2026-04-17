FROM node:alpine AS node-builder

WORKDIR /backend

COPY package*.json .
# RUN apk add --no-cache git
RUN npm install
COPY tsconfig.json .
COPY *.ts .
COPY src/ ./src/
RUN npx tsc

FROM heroiclabs/nakama:3.37.0

COPY --from=node-builder /backend/build/*.js /nakama/data/modules/build/
COPY local.yml /nakama/data/

EXPOSE 7349 7350 7351

ENTRYPOINT ["/bin/sh", "-ecx", "/nakama/nakama migrate up --database.address $DATABASE_ADDRESS && exec /nakama/nakama --config /nakama/data/local.yml --name nakama1 --database.address $DATABASE_ADDRESS --session.token_expiry_sec 7200"]