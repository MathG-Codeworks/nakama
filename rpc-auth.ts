/// <reference types="nakama-runtime" />
/// <reference types="node" />

const PLATFORM = "Movil";

function rpcCreateSession(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const request = JSON.parse(payload);
    const accessToken: string = request.access_token;
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

        if (response.code === 401) {
            logger.error("Token expired");
            return JSON.stringify({
                ok: false,
                error: "Token expired",
                code: 401
            });
        }

        if (response.code < 200 || response.code >= 300) {
            logger.error("Session creation failed:", response.code);
            return JSON.stringify({
                ok: false,
                error: `HTTP ${response.code}`,
                code: response.code
            });
        }

        return JSON.stringify({
            ok: true,
            body: JSON.parse(response.body),
            code: 200
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Session creation error:", errorMessage);
        return JSON.stringify({
            ok: false,
            error: errorMessage,
            code: 500
        });
    }
}