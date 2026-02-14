FROM registry.heroiclabs.com/heroiclabs/nakama:3.37.0
EXPOSE 7349 7350 7351
ENTRYPOINT ["/bin/sh", "-ecx", "/nakama/nakama migrate up --database.address $DATABASE_URL && exec /nakama/nakama --name nakama1 --database.address $DATABASE_URL --logger.level DEBUG --session.token_expiry_sec 7200"]
