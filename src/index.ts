import { rankedMatch } from "./match";

function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {

  initializer.registerMatch("ranked_match", rankedMatch)

  logger.info("Authoritative Match cargado correctamente.");
}