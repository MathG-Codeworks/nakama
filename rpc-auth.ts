/// <reference types="nakama-runtime" />
/// <reference types="node" />

const PLATFORM = "Movil";

function rpcCreateSession(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const request = JSON.parse(payload);
    const accessToken: string = request.access_token;
    const refreshToken: string = request.refresh_token;
    const device_id: string = request.device_id;

    try {
        const response = nk.httpRequest(
            CREATE_SESSION_URL, 
            "post",
            {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            JSON.stringify({
                platform: PLATFORM,
                device: device_id
            })
        );

        if (response.code < 200 || response.code >= 300) {
            logger.error("Session creation failed:", response.code);
            return JSON.stringify({
                ok: false,
                error: `HTTP ${response.code}`
            });
        }

        logger.info(response.body,)

        return JSON.stringify({
            ok: true,
            user: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Session creation error:", errorMessage);
        return JSON.stringify({
            ok: false,
            error: errorMessage
        });
    }
}