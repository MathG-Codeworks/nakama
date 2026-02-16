interface MatchState {
  players: Record<string, number>;
}

const rankedMatch: nkruntime.MatchHandler<MatchState> = {

  matchInit(ctx, logger, nk, params) {
    return {
      state: { players: {} },
      tickRate: 1,
      label: "ranked_match"
    };
  },

  matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    return { state, accept: true };
  },

  matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
    presences.forEach(p => {
      state.players[p.userId] = 0;
    });
    return { state };
  },

  matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
    presences.forEach(p => {
      delete state.players[p.userId];
    });
    return { state };
  },

  matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
    return { state };
  },

  matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    return { state };
  },

  matchSignal(ctx, logger, nk, dispatcher, tick, state, data) {
    return { state, data: "" };
  }
};

const InitModule: nkruntime.InitModule = function(ctx, logger, nk, initializer) {
  initializer.registerMatch("ranked_match", rankedMatch);
  logger.info("Authoritative Match cargado correctamente.");
};