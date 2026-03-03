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
  initializer.registerRpc("set_player_ready", rpcSetPlayerReady);
  initializer.registerRpc("set_player_unready", rpcSetPlayerUnready);
  initializer.registerRpc("scene_loaded", rpcSceneLoaded);

  return null;
};

!InitModule && InitModule.bind(null);