function rpcCreateMatch(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const matchCode = Math.floor(1000 + Math.random() * 9000).toString();
    const matchId = nk.matchCreate('ranked-match');
    
    return JSON.stringify({
        matchId: matchId,
        code: matchCode,
        success: true
    });
}

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
  initializer.registerMatch("ranked-match", {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal
  });

  initializer.registerRpc("create_match", rpcCreateMatch);

  return null;
};

!InitModule && InitModule.bind(null);