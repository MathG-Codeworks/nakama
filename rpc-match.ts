/// <reference types="nakama-runtime" />

function rpcCreateMatch(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const matchCode = Math.floor(1000 + Math.random() * 9000).toString();
    const matchId = nk.matchCreate('ranked-match', { code: matchCode });
    const accessToken = JSON.parse(payload).accessToken;
    let createdMatch = null;

    try {
        const response = nk.httpRequest(
            CREATE_MATCH_URL,
            "post",
            {
                "Content-Type": "application/json"
            },
            JSON.stringify({
                id: matchId,
                code: matchCode
            })
        );

        logger.info('Match created: %s', response.body);
        createdMatch = response.body ? JSON.parse(response.body) as Match : null;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error creating match: %s', errorMessage);
    }

    registryJoinMatch(matchId, accessToken, logger, nk);
    
    return JSON.stringify({
        matchId: matchId,
        code: matchCode,
        success: true,
        match: createdMatch
    });
}

function rpcJoinMatchByCode(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const data = JSON.parse(payload);
    const code = data.code;
    const accessToken = data.accessToken;
    
    if (!code || code.length !== 4) {
        return JSON.stringify({
            success: false,
            error: 'Código inválido'
        });
    }
    
    const matches = nk.matchList(10, true, code);
    
    if (matches.length === 0) {
        return JSON.stringify({
            success: false,
            error: 'No se encontró ninguna sala con ese código'
        });
    }

    registryJoinMatch(matches[0].matchId, accessToken, logger, nk);
    
    return JSON.stringify({
        matchId: matches[0].matchId,
        code: code,
        success: true
    });
}

function rpcSetPlayerReady(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const data = JSON.parse(payload);
    const matchId = data.matchId;
    
    if (!matchId) {
        return JSON.stringify({
            success: false,
            error: 'Match ID requerido'
        });
    }
    
    try {
        const signalData = JSON.stringify({
            action: 'player_ready',
            userId: ctx.userId,
            username: ctx.username
        });
        
        nk.matchSignal(matchId, signalData);
        
        return JSON.stringify({
            success: true,
            message: 'Marcado como listo'
        });
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: 'Error al marcar como listo'
        });
    }
}

function rpcSetPlayerUnready(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const data = JSON.parse(payload);
    const matchId = data.matchId;
    
    if (!matchId) {
        return JSON.stringify({
            success: false,
            error: 'Match ID requerido'
        });
    }
    
    try {
        const signalData = JSON.stringify({
            action: 'player_unready',
            userId: ctx.userId,
            username: ctx.username
        });
        
        nk.matchSignal(matchId, signalData);
        
        return JSON.stringify({
            success: true,
        });
    } catch (error) {
        return JSON.stringify({
            success: false,
        });
    }
}

function rpcSetPlayerReplay(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const data = JSON.parse(payload);
    const matchId = data.matchId;
    
    if (!matchId) {
        return JSON.stringify({
            success: false,
            error: 'Match ID requerido'
        });
    }
    
    try {
        const signalData = JSON.stringify({
            action: 'player_replay',
            userId: ctx.userId,
            username: ctx.username
        });
        
        nk.matchSignal(matchId, signalData);
        
        return JSON.stringify({
            success: true,
            message: 'Marcado para volver a jugar'
        });
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: 'Error al marcar para volver a jugar'
        });
    }
}

function rpcSetPlayerNoReplay(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const data = JSON.parse(payload);
    const matchId = data.matchId;
    
    if (!matchId) {
        return JSON.stringify({
            success: false,
            error: 'Match ID requerido'
        });
    }
    
    try {
        const signalData = JSON.stringify({
            action: 'player_no_replay',
            userId: ctx.userId,
            username: ctx.username
        });
        
        nk.matchSignal(matchId, signalData);
        
        return JSON.stringify({
            success: true,
            message: 'Desmarcado para volver a jugar'
        });
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: 'Error al desmarcar para volver a jugar'
        });
    }
}

function registryJoinMatch(matchId: string, accessToken: string, logger: nkruntime.Logger, nk: nkruntime.Nakama) {
    try {
        const response = nk.httpRequest(
            JOIN_MATCH_URL.replace(':id', matchId),
            "post",
            {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        );

        logger.info('Match joined: %s', response.body);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error joining match: %s', errorMessage);
    }
}

function rpcReplayMatch(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const data = JSON.parse(payload);
    const matchId = data.matchId;
    
    if (!matchId) {
        return JSON.stringify({
            success: false,
            error: 'Match ID requerido'
        });
    }

    try {
        const signalData = JSON.stringify({
            action: 'match_replay',
            userId: ctx.userId,
            username: ctx.username
        });

        nk.matchSignal(matchId, signalData);

        return JSON.stringify({
            success: true,
            message: 'Marcado para volver a jugar'
        });
    } catch (error) {
        return JSON.stringify({
            success: false,
            error: 'Error al intentar jugar de nuevo'
        });
    }


}