import crypto from 'crypto';

/**
 * Computes HMAC-SHA256 hex digest of a UTF-8 string payload with the shared secret.
 */
export function signPayload(secret, payloadString) {
    if (!secret) return '';
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

/**
 * Dispatches the completed or failed analysis result back to MemoryStore's callback endpoint.
 * 
 * @param {object} params
 * @param {string} params.callbackUrl The MemoryStore callback URL (e.g. https://api.memorystore.co.in/api/plugins/results/callback)
 * @param {string} params.secret      The plugin's shared auth secret
 * @param {string} params.resultId    The UUID of the plugin_results row
 * @param {string} [params.resultUrl] The URL where the result viewer is hosted
 * @param {object} [params.resultData] Structured JSON data of the astrology analysis
 * @param {string} [params.status='completed'] 'completed' | 'failed'
 * @param {string} [params.errorMessage] Error message if status is 'failed'
 * @returns {Promise<{success: boolean, status: number, data?: object, error?: string}>}
 */
export async function sendCallbackResult({
    callbackUrl,
    secret,
    resultId,
    resultUrl,
    resultData,
    status = 'completed',
    errorMessage = null
}) {
    if (!callbackUrl || !resultId) {
        throw new Error('callbackUrl and resultId are required to send callback result');
    }

    const payloadObj = {
        result_id: resultId,
        status
    };

    if (resultUrl) payloadObj.result_url = resultUrl;
    if (resultData) payloadObj.result_data = resultData;
    if (errorMessage) payloadObj.error_message = errorMessage;

    const payload = JSON.stringify(payloadObj);
    const signature = signPayload(secret, payload);
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'MemoryStore-Astrology-Plugin/1.0'
    };

    if (signature) {
        headers['X-Plugin-Signature'] = `sha256=${signature}`;
    }

    try {
        const response = await fetch(callbackUrl, {
            method: 'POST',
            headers,
            body: payload
        });

        const resText = await response.text();
        let resJson = null;
        try {
            resJson = JSON.parse(resText);
        } catch {
            resJson = { raw: resText };
        }

        return {
            success: response.ok,
            status: response.status,
            data: resJson
        };
    } catch (err) {
        console.error('[CallbackDispatcher] Callback request failed:', err.message);
        return {
            success: false,
            status: 0,
            error: err.message
        };
    }
}
