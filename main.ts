/// <reference types="nakama-runtime" />

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
  initializer.registerRpc("set_player_replay", rpcSetPlayerReplay);
  initializer.registerRpc("set_player_no_replay", rpcSetPlayerNoReplay);
  initializer.registerRpc("create_session", rpcCreateSession);
  initializer.registerRpc("replay_match", rpcReplayMatch);

  return null;
};

!InitModule && InitModule.bind(null);