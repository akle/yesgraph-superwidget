export function logFailedClientTokenRequest(raven, clientTokenResponse) {
    if (!raven) return;
    raven.captureBreadcrumb({
        timestamp: new Date(),
        message: "Client Token Request Failed",
        level: "error",
        data: clientTokenResponse
    });
    raven.captureException(new Error("Client Token Request Failed"));
}
