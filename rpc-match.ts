function rpcCreateMatch(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const matchCode = Math.floor(1000 + Math.random() * 9000).toString();
    const matchId = nk.matchCreate('ranked-match', { code: matchCode });
    
    return JSON.stringify({
        matchId: matchId,
        code: matchCode,
        success: true
    });
}

function rpcJoinMatchByCode(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const data = JSON.parse(payload);
    const code = data.code;
    
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