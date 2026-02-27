const RANKING_OP_CODE = 2;
const READY_OP_CODE = 3;
const UNREADY_OP_CODE = 4;
const COUNTDOWN_OP_CODE = 5;
const COUNTDOWN_CANCELLED_OP_CODE = 6;
const GAME_START_OP_CODE = 7;

interface PlayerScore {
    userId: string;
    username: string;
    score: number;
    timestamp: number;
    ready: boolean;
}

function matchInit(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: {[key: string]: string}) {
    const matchCode: string = params.code || Math.floor(1000 + Math.random() * 9000).toString();

	return {
	  state: {
		code: matchCode,
		presences: {},
		ranking: [] as PlayerScore[],
		Debug: 'Match initialized with code ' + matchCode,
		countdownActive: false,
		countdownValue: 5,
		gameStarted: false,
		tickRate: 5,
		lastCountdownTick: 0
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

	  const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.userId === presence.userId);
      if (existingIndex < 0) {
          state.ranking.push({
              userId: presence.userId,
              username: presence.username,
              score: 0,
              timestamp: Date.now(),
              ready: false
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
	});
  
	return {
	  state
	};
}

function matchLoop(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]) : { state: nkruntime.MatchState} | null {
	let rankingUpdated = false;

	if (state.countdownActive && !state.gameStarted) {
		if (tick - state.lastCountdownTick >= state.tickRate) {
			state.lastCountdownTick = tick;
			
			if (state.countdownValue > 0) {
				dispatcher.broadcastMessage(
					COUNTDOWN_OP_CODE,
					nk.stringToBinary(JSON.stringify({ countdown: state.countdownValue })),
					null,
					null,
					true
				);
				state.countdownValue--;
			} else {
				state.gameStarted = true;
				state.countdownActive = false;
				dispatcher.broadcastMessage(
					GAME_START_OP_CODE,
					nk.stringToBinary(JSON.stringify({ message: 'Game Start!' })),
					null,
					null,
					true
				);
			}
		}
	}

	for (const message of messages) {
		if (message.opCode === READY_OP_CODE) {
			const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.userId === message.sender.userId);
			
			if (existingIndex >= 0) {
				state.ranking[existingIndex].ready = true;
				rankingUpdated = true;
			
				const allReady = state.ranking.every((p: PlayerScore) => p.ready);
				const minPlayers = state.ranking.length >= 1;

				if (allReady && minPlayers && !state.countdownActive && !state.gameStarted) {
					state.countdownActive = true;
					state.countdownValue = 5;
					state.lastCountdownTick = tick;
				}
			}
		} else if (message.opCode === UNREADY_OP_CODE) {
			const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.userId === message.sender.userId);
			
			if (existingIndex >= 0) {
				state.ranking[existingIndex].ready = false;
				rankingUpdated = true;

				if (state.countdownActive && !state.gameStarted) {
					state.countdownActive = false;
					state.countdownValue = 5;
					state.lastCountdownTick = 0;
					
					dispatcher.broadcastMessage(
						COUNTDOWN_CANCELLED_OP_CODE,
						nk.stringToBinary(JSON.stringify({ 
							message: 'Countdown cancelled', 
							playerUsername: message.sender.username 
						})),
						null,
						null,
						true
					);
				}
			}
		} else if (message.opCode === RANKING_OP_CODE) {
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
						timestamp: Date.now(),
						ready: false
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
	try {
		const signalData = JSON.parse(data);
		
		if (signalData.action === 'player_ready') {
			const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.userId === signalData.userId);
			
			if (existingIndex >= 0) {
				state.ranking[existingIndex].ready = true;
				logger.info('Player %s is ready (via signal)', signalData.username);

				const rankingData = JSON.stringify(state.ranking);
				dispatcher.broadcastMessage(
					RANKING_OP_CODE,
					nk.stringToBinary(rankingData),
					null,
					null,
					true
				);

				const allReady = state.ranking.every((p: PlayerScore) => p.ready);
				const minPlayers = state.ranking.length >= 1;

				if (allReady && minPlayers && !state.countdownActive && !state.gameStarted) {
					logger.info('[READY] All players ready (via signal)! Starting countdown from tick: %d', tick);
					state.countdownActive = true;
					state.countdownValue = 5;
					state.lastCountdownTick = tick;
				}
			}
		} else if (signalData.action === 'player_unready') {
			const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.userId === signalData.userId);
			
			if (existingIndex >= 0) {
				state.ranking[existingIndex].ready = false;
				logger.info('Player %s is NOT ready (via signal)', signalData.username);

				const rankingData = JSON.stringify(state.ranking);
				dispatcher.broadcastMessage(
					RANKING_OP_CODE,
					nk.stringToBinary(rankingData),
					null,
					null,
					true
				);

				// Cancelar countdown si estaba activo
				if (state.countdownActive && !state.gameStarted) {
					logger.info('[UNREADY] Countdown cancelled (via signal)! Player unready.');
					state.countdownActive = false;
					state.countdownValue = 5;
					state.lastCountdownTick = 0;
					
					// Notificar a todos que se canceló el countdown
					dispatcher.broadcastMessage(
						COUNTDOWN_CANCELLED_OP_CODE,
						nk.stringToBinary(JSON.stringify({ 
							message: 'Countdown cancelled', 
							playerUsername: signalData.username 
						})),
						null,
						null,
						true
					);
				}
			}
		}
	} catch (error) {
		logger.error('Error processing match signal: %v', error);
	}
  
	return {
	  state,
	  data: "Lobby match signal received: " + data
	};
}