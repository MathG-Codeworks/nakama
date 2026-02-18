function rpcCreateMatch(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const matchCode = Math.floor(1000 + Math.random() * 9000).toString();
    const matchId = nk.matchCreate('ranked-match', { code: matchCode });
    
    logger.info('Match created with code: %s and ID: %s', matchCode, matchId);
    
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