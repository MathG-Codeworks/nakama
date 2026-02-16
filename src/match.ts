interface PlayerData {
  userId: string;
  username: string;
  score: number;
}

export interface MatchState {
  players: Record<string, PlayerData>;
}

export const rankedMatch: nkruntime.MatchHandler<MatchState> = {

  matchInit(ctx, logger, nk, params) {

    const state: MatchState = {
      players: {}
    };

    logger.info("Match creado: " + ctx.matchId);

    return {
      state,
      tickRate: 1,
      label: "ranked_match"
    };
  },

  matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {

    return {
      state,
      accept: true
    };
  },

  matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {

    presences.forEach(p => {
      state.players[p.userId] = {
        userId: p.userId,
        username: p.username,
        score: 0
      };
    });

    broadcastRanking(state, nk, dispatcher);

    return { state };
  },

  matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {

    presences.forEach(p => {
      delete state.players[p.userId];
    });

    broadcastRanking(state, nk, dispatcher);

    return { state };
  },

  matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {

    messages.forEach(message => {

      if (message.opCode === 1) {

        const data = JSON.parse(nk.binaryToString(message.data));
        const points = data.points;

        const player = state.players[message.sender.userId];

        if (player) {
          player.score += points;
        }

        broadcastRanking(state, nk, dispatcher);
      }

    });

    return { state };
  },

  matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    logger.info("Match terminado.");
    return { state };
  },

  matchSignal(ctx, logger, nk, dispatcher, tick, state, data) {
    return { state, data: "" };
  }
};

function broadcastRanking(
  state: MatchState,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher
) {
  const ranking = Object.values(state.players)
    .sort((a, b) => b.score - a.score);

  dispatcher.broadcastMessage(
    10,
    nk.stringToBinary(JSON.stringify(ranking))
  );
}
