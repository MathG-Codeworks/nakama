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
  initializer.registerRpc("join_match_by_code", rpcJoinMatchByCode);

  return null;
};

!InitModule && InitModule.bind(null);