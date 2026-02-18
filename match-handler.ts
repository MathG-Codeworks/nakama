const RANKING_OP_CODE = 2;

interface PlayerScore {
    userId: string;
    username: string;
    score: number;
    timestamp: number;
}

function matchInit(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: {[key: string]: string}) {
    const matchCode: string = params.code || Math.floor(1000 + Math.random() * 9000).toString();
    
    logger.info('Match initialized with code: %s', matchCode);

	return {
	  state: {
		code: matchCode,
		presences: {},
		ranking: [] as PlayerScore[],
		Debug: 'Match initialized with code ' + matchCode
	  },
	  tickRate: 5,
	  label: matchCode
	};
};

function matchJoinAttempt(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {[key: string]: any }) : {state: nkruntime.MatchState, accept: boolean, rejectMessage?: string | undefined } | null {
	logger.debug('%q attempted to join Lobby match', ctx.userId);
  
	return {
	  state,
	  accept: true
	};
}

function matchJoin(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) : { state: nkruntime.MatchState } | null {
	presences.forEach(function (presence) {
	  state.presences[presence.userId] = presence;
	  logger.debug('%q joined Lobby match', presence.userId);

	  const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.userId === presence.userId);
      if (existingIndex < 0) {
          state.ranking.push({
              userId: presence.userId,
              username: presence.username,
              score: 0,
              timestamp: Date.now()
          });
      }
	});

	const rankingData = JSON.stringify(state.ranking);
	dispatcher.broadcastMessage(
		RANKING_OP_CODE,
		nk.stringToBinary(rankingData),
		null,
		null,
		true
	);
  
	return {
	  state
	};
}

function matchLeave(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) : { state: nkruntime.MatchState } | null {
	presences.forEach(function (presence) {
	  state.presences[presence.userId] = presence;
	  logger.debug('%q left Lobby match', presence.userId);
	});
  
	return {
	  state
	};
}

function matchLoop(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]) : { state: nkruntime.MatchState} | null {
	let rankingUpdated = false;

	for (const message of messages) {
		if (message.opCode === RANKING_OP_CODE) {
			try {
				const payload = JSON.parse(nk.binaryToString(message.data));
				const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.userId === message.sender.userId);

				if (existingIndex >= 0) {
					state.ranking[existingIndex].score = payload.score;
					state.ranking[existingIndex].timestamp = Date.now();
				} else {
					state.ranking.push({
						userId: message.sender.userId,
						username: message.sender.username,
						score: payload.score,
						timestamp: Date.now()
					});
				}

				state.ranking.sort((a: PlayerScore, b: PlayerScore) => 
					b.score - a.score || a.timestamp - b.timestamp
				);

				rankingUpdated = true;

			} catch (error) {
				logger.error('Error processing score update: %v', error)
			}
		} else {
			dispatcher.broadcastMessage(
				message.opCode,
				message.data,
				null,
				message.sender,
				true
			)	
		}
	}

	if (rankingUpdated) {
		const rankingData = JSON.stringify(state.ranking);
		dispatcher.broadcastMessage(
			RANKING_OP_CODE,
			nk.stringToBinary(rankingData),
			null,
			null,
			true
		);
	}
	
	return {
	  state
	};
}

function matchTerminate(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number) : { state: nkruntime.MatchState} | null {
	logger.debug('Lobby match terminated');
  
	return {
	  state
	};
}

function matchSignal(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string) : { state: nkruntime.MatchState, data?: string } | null {
	logger.debug('Lobby match signal received: ' + data);
  
	return {
	  state,
	  data: "Lobby match signal received: " + data
	};
}