/// <reference types="nakama-runtime" />

const RANKING_OP_CODE = 2;
const READY_OP_CODE = 3;
const UNREADY_OP_CODE = 4;
const COUNTDOWN_OP_CODE = 5;
const COUNTDOWN_CANCELLED_OP_CODE = 6;
const GAME_START_OP_CODE = 7;
const EXERCISES_LOADED_OP_CODE = 8;
const EVALUATE_ANSWER_OP_CODE = 9;

function generatePlayerColor(): string {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(70 + Math.random() * 30); // 70-100% - colores vibrantes
    const lightness = Math.floor(25 + Math.random() * 20); // 25-45% - colores oscuros para resaltar texto blanco
    
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
		lastCountdownTick: 0,
		currentMinigame: null,
		exercises: [] as any[]
	  },
	  tickRate: 5,
	  label: matchCode
	};
};

function matchJoinAttempt(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {[key: string]: any }) : {state: nkruntime.MatchState, accept: boolean, rejectMessage?: string | undefined } | null {
	return {
	  state,
	  accept: true
	};
}

function matchJoin(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) : { state: nkruntime.MatchState } | null {
	presences.forEach(function (presence) {
	  state.presences[presence.userId] = presence;

	  const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.user_id === presence.userId);
      if (existingIndex < 0) {
          state.ranking.push({
              user_id: presence.userId,
              username: presence.username,
              score: 0,
              timestamp: Date.now(),
              ready: false,
              color: generatePlayerColor()
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

				state.exercises = getBrincaBrincaExercises();
				state.currentMinigame = Minigames.BRINCA_BRINCA;
				state.minigameRoundDuration = Brinca.ROUND_DURATION;
				state.minigameIntermission = Brinca.ROUND_INTERMISSION;

				dispatcher.broadcastMessage(
					EXERCISES_LOADED_OP_CODE,
					nk.stringToBinary(JSON.stringify({ 
						minigame: state.currentMinigame,
						exercises: state.exercises,
						round_duration: state.minigameRoundDuration,
						round_intermission: state.minigameIntermission,
					})),
					null,
					null,
					true
				);
			}
		}
	}

	for (const message of messages) {
		if (message.opCode === READY_OP_CODE) {
			const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.user_id === message.sender.userId);
			
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
			const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.user_id === message.sender.userId);
			
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
				const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.user_id === message.sender.userId);

				if (existingIndex >= 0) {
					state.ranking[existingIndex].timestamp = Date.now();
				} else {
					state.ranking.push({
						user_id: message.sender.userId,
						username: message.sender.username,
						score: 0,
						timestamp: Date.now(),
						ready: false,
						color: generatePlayerColor()
					});
				}

				state.ranking.sort((a: PlayerScore, b: PlayerScore) => 
					b.score - a.score || a.timestamp - b.timestamp
				);

				rankingUpdated = true;

			} catch (error) {
				logger.error('Error processing score update: %v', error)
			}
		} else if (message.opCode === EVALUATE_ANSWER_OP_CODE) {
			try {
				const payload = JSON.parse(nk.binaryToString(message.data));
				const points = evaluateAnswer(state.exercises, payload.operation, payload.answer, state.currentMinigame);

				if (points > 0) {
					const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.user_id === message.sender.userId);
					if (existingIndex >= 0) {
						state.ranking[existingIndex].score += points;
						state.ranking[existingIndex].timestamp = Date.now();
						
						state.ranking.sort((a: PlayerScore, b: PlayerScore) => 
							b.score - a.score || a.timestamp - b.timestamp
						);
						rankingUpdated = true;
					}
				}

			} catch (error) {
				logger.error('Error evaluating answer: %v', error);
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
	return {
	  state
	};
}

function matchSignal(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string) : { state: nkruntime.MatchState, data?: string } | null {
	try {
		const signalData = JSON.parse(data);
		
		if (signalData.action === 'player_ready') {
			const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.user_id === signalData.userId);
			
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
					state.countdownActive = true;
					state.countdownValue = 5;
					state.lastCountdownTick = tick;
				}
			}
		} else if (signalData.action === 'player_unready') {
			const existingIndex = state.ranking.findIndex((p: PlayerScore) => p.user_id === signalData.userId);
			
			if (existingIndex >= 0) {
				state.ranking[existingIndex].ready = false;
	
				const rankingData = JSON.stringify(state.ranking);
				dispatcher.broadcastMessage(
					RANKING_OP_CODE,
					nk.stringToBinary(rankingData),
					null,
					null,
					true
				);

				if (state.countdownActive && !state.gameStarted) {
					state.countdownActive = false;
					state.countdownValue = 5;
					state.lastCountdownTick = 0;
					
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