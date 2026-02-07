// Background Service Worker
// Manifest v3 için background script - fetch isteklerini buradan yapıyoruz

const API_ENDPOINT = "http://localhost:8000/analyze";
const HEALTH_ENDPOINT = "http://localhost:8000/health";

/**
 * Timeout ile fetch isteği gönderir
 */
function fetchWithTimeout(url, options = {}, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            reject(new Error(`İstek zaman aşımına uğradı (${timeout}ms). Backend sunucusu yanıt vermiyor.`));
        }, timeout);

        fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => resolve(data))
        .catch(error => {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                reject(new Error(`İstek zaman aşımına uğradı. Backend sunucusu yanıt vermiyor.`));
            } else {
                reject(error);
            }
        });
    });
}

/**
 * Backend'e fetch isteği gönderir
 */
async function fetchFromBackend(url, options = {}) {
    try {
        return await fetchWithTimeout(url, options, 30000); // 30 saniye timeout
    } catch (error) {
        console.error(`[Background] Fetch hatası (${url}):`, error);
        throw error;
    }
}

/**
 * Health check yapar
 */
async function checkBackendHealth() {
    try {
        const response = await fetchWithTimeout(HEALTH_ENDPOINT, {
            method: "GET"
        }, 5000); // 5 saniye timeout
        return true;
    } catch (error) {
        console.error("[Background] Health check hatası:", error);
        return false;
    }
}

/**
 * URL analizi yapar
 */
async function analyzeURL(url, includeVisual = false) {
    try {
        const data = await fetchFromBackend(API_ENDPOINT, {
            method: "POST",
            body: JSON.stringify({
                url: url,
                include_visual: includeVisual
            })
        });
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Message listener - content script ve popup'tan gelen mesajları dinler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Async işlemler için true döndürmeliyiz
    (async () => {
        try {
            let result;
            
            switch (request.action) {
                case "analyze":
                    result = await analyzeURL(request.url, request.includeVisual);
                    sendResponse(result);
                    break;
                    
                case "health":
                    const isHealthy = await checkBackendHealth();
                    sendResponse({ success: isHealthy });
                    break;
                    
                default:
                    sendResponse({ success: false, error: "Unknown action" });
            }
        } catch (error) {
            console.error("[Background] Message handler hatası:", error);
            sendResponse({ success: false, error: error.message });
        }
    })();
    
    // Async işlemler için true döndür
    return true;
});

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
    console.log("[Background] Güvenli İnternet Asistanı yüklendi");
});

