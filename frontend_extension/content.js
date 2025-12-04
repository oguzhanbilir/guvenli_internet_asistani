// Content Script - Sayfaya otomatik güvenlik uyarısı ekler
// Not: API_ENDPOINT kullanılmıyor, background service worker üzerinden çalışıyor

// Cache ayarları
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika (milisaniye)

// Cache'den analiz sonucu al
async function getCachedAnalysis(url) {
    try {
        const cacheKey = `analysis_cache_${url}`;
        const result = await chrome.storage.local.get(cacheKey);
        const cached = result[cacheKey];
        
        if (cached && cached.timestamp) {
            const age = Date.now() - cached.timestamp;
            if (age < CACHE_DURATION) {
                console.log(`[Content] Cache'den analiz sonucu alındı (${Math.round(age / 1000)}s önce)`);
                return cached.data;
            } else {
                // Eski cache'i temizle
                await chrome.storage.local.remove(cacheKey);
            }
        }
        return null;
    } catch (error) {
        console.error("Cache okuma hatası:", error);
        return null;
    }
}

// Analiz sonucunu cache'e kaydet
async function saveCachedAnalysis(url, data) {
    try {
        // Extension context kontrolü
        if (!chrome.runtime?.id) {
            console.warn("[Content] Extension context invalidated, cache kaydedilemedi");
            return;
        }
        
        const cacheKey = `analysis_cache_${url}`;
        await chrome.storage.local.set({
            [cacheKey]: {
                data: data,
                timestamp: Date.now()
            }
        });
        console.log("[Content] Analiz sonucu cache'e kaydedildi");
    } catch (error) {
        // Extension context invalidated hatası için sessizce geç
        if (error.message?.includes("Extension context invalidated")) {
            console.warn("[Content] Extension context invalidated");
            return;
        }
        console.error("Cache kaydetme hatası:", error);
    }
}

// Whitelist kontrolü
async function isDomainWhitelisted(domain) {
    try {
        if (!chrome.runtime?.id) return false;
        const result = await chrome.storage.local.get("whitelisted_domains");
        const whitelist = result.whitelisted_domains || [];
        return whitelist.includes(domain);
    } catch (error) {
        console.error("Whitelist kontrolü hatası:", error);
        return false;
    }
}

// Domain'i whitelist'e ekle
async function addToWhitelist(domain) {
    try {
        if (!chrome.runtime?.id) return;
        const result = await chrome.storage.local.get("whitelisted_domains");
        const whitelist = result.whitelisted_domains || [];
        if (!whitelist.includes(domain)) {
            whitelist.push(domain);
            await chrome.storage.local.set({ whitelisted_domains: whitelist });
            console.log(`[Content] Domain whitelist'e eklendi: ${domain}`);
        }
    } catch (error) {
        console.error("Whitelist ekleme hatası:", error);
    }
}

// Domain'i whitelist'ten çıkar
async function removeFromWhitelist(domain) {
    try {
        if (!chrome.runtime?.id) return;
        const result = await chrome.storage.local.get("whitelisted_domains");
        const whitelist = result.whitelisted_domains || [];
        const filtered = whitelist.filter(d => d !== domain);
        await chrome.storage.local.set({ whitelisted_domains: filtered });
        console.log(`[Content] Domain whitelist'ten çıkarıldı: ${domain}`);
    } catch (error) {
        console.error("Whitelist çıkarma hatası:", error);
    }
}

// Domain'i URL'den çıkar
function getDomainFromUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (error) {
        return null;
    }
}

// Skip butonları için event listener'lar
function setupSkipButtons() {
    const skipOnceBtn = document.getElementById("overlay-skip-once-btn");
    const skipAlwaysBtn = document.getElementById("overlay-skip-always-btn");
    
    if (skipOnceBtn) {
        skipOnceBtn.addEventListener("click", async () => {
            console.log("[Content] Kullanıcı testi 1 kere atladı");
            hideSecurityOverlay();
            // Analiz devam edebilir ama overlay gösterilmez
        });
    }
    
    if (skipAlwaysBtn) {
        skipAlwaysBtn.addEventListener("click", async () => {
            const domain = getDomainFromUrl(window.location.href);
            if (domain) {
                await addToWhitelist(domain);
                console.log(`[Content] Domain whitelist'e eklendi: ${domain}`);
            }
            hideSecurityOverlay();
        });
    }
}

// Sayfa yüklendiğinde whitelist kontrolü yap
async function checkWhitelistBeforeAnalysis() {
    const domain = getDomainFromUrl(window.location.href);
    if (domain && await isDomainWhitelisted(domain)) {
        console.log(`[Content] Domain whitelist'te: ${domain}, analiz atlanıyor`);
        return true;
    }
    return false;
}

// Sayfa yüklendiğinde hemen overlay göster ve analiz yap
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
        const isWhitelisted = await checkWhitelistBeforeAnalysis();
        if (!isWhitelisted) {
            showSecurityOverlay();
            checkPageSecurity();
        }
    });
} else {
    (async () => {
        const isWhitelisted = await checkWhitelistBeforeAnalysis();
        if (!isWhitelisted) {
            showSecurityOverlay();
            checkPageSecurity();
        }
    })();
}

function showSecurityOverlay() {
    // Zaten bir overlay varsa tekrar ekleme
    if (document.getElementById("phishing-security-overlay")) {
        return;
    }
    
    // Logo URL'ini al (extension'dan) - hata kontrolü ile
    let logoUrl = "";
    try {
        logoUrl = chrome.runtime.getURL("icon48.png");
    } catch (error) {
        console.error("Logo URL alınamadı:", error);
        // Logo yoksa emoji kullan
        logoUrl = "";
    }
    
    // Sayfayı engelle ve overlay göster
    const overlay = document.createElement("div");
    overlay.id = "phishing-security-overlay";
    overlay.className = "phishing-security-overlay";
    
    const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" class="overlay-logo" />` : `<div class="overlay-logo-emoji">🛡️</div>`;
    overlay.innerHTML = `
        <div class="overlay-content">
            <div class="overlay-header">
                ${logoHtml}
                <div class="overlay-app-name">Güvenli İnternet Asistanı</div>
            </div>
            <div class="overlay-icon-container">
                <div class="overlay-icon">🛡️</div>
            </div>
            <div class="overlay-title">Güvenlik Kontrolü</div>
            <div class="overlay-message">Bu site güvenlik açısından analiz ediliyor...</div>
            <div class="overlay-scanning-animation">
                <div class="scan-line"></div>
                <div class="scan-dots">
                    <span class="dot dot-1"></span>
                    <span class="dot dot-2"></span>
                    <span class="dot dot-3"></span>
                </div>
            </div>
            <div class="overlay-spinner">
                <div class="spinner-ring"></div>
            </div>
            <div class="overlay-subtitle">Lütfen bekleyin, birkaç saniye sürecek</div>
            <div class="overlay-skip-buttons">
                <button id="overlay-skip-once-btn" class="overlay-btn overlay-btn-skip">1 Kere Atla</button>
                <button id="overlay-skip-always-btn" class="overlay-btn overlay-btn-skip-always">Bu Site İçin Her Zaman Atla</button>
            </div>
        </div>
    `;
    
    // Sayfanın en üstüne ekle
    document.body.appendChild(overlay);
    
    // Sayfa scroll'unu engelle
    document.body.style.overflow = "hidden";
    
    // Skip butonları için event listener'lar ekle
    setupSkipButtons();
}

async function checkPageSecurity() {
    // Chrome extension sayfalarını ve özel protokolleri atla
    const url = window.location.href;
    const invalidProtocols = ["chrome:", "edge:", "about:", "moz-extension:", "chrome-extension:", "edge-extension:"];
    
    if (invalidProtocols.some(p => url.toLowerCase().startsWith(p))) {
        hideSecurityOverlay();
        return;
    }
    
    // Sadece HTTP/HTTPS sayfalarını kontrol et
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        hideSecurityOverlay();
        return;
    }
    
    try {
        // Cache kontrolü - eğer cache'de varsa overlay'i göstermeden direkt sonucu göster
        const cachedResult = await getCachedAnalysis(url);
        if (cachedResult) {
            const score = cachedResult.guven_puani || 0;
            const decision = cachedResult.karar || "Bilinmiyor";
            
            // Cache'den geldi, overlay'i kaldır ve direkt uyarı göster (eğer gerekirse)
            hideSecurityOverlay();
            
            if (score < 40) {
                showSecurityWarning(score, decision);
            }
            return;
        }
        
        // Extension context kontrolü
        if (!chrome.runtime?.id) {
            console.warn("[Content] Extension context invalidated");
            hideSecurityOverlay();
            return;
        }
        
        // Backend'in çalışıp çalışmadığını kontrol et (background service worker üzerinden)
        const healthCheck = await chrome.runtime.sendMessage({ action: "health" });
        if (!healthCheck || !healthCheck.success) {
            // Backend çalışmıyorsa overlay'i kaldır
            hideSecurityOverlay();
            return;
        }
        
        // Sayfayı analiz et (background service worker üzerinden)
        const result = await chrome.runtime.sendMessage({
            action: "analyze",
            url: url,
            includeVisual: false
        });
        
        if (!result || !result.success) {
            hideSecurityOverlay();
            return;
        }
        
        const data = result.data;
        
        // Sonucu cache'e kaydet
        await saveCachedAnalysis(url, data);
        
        const score = data.guven_puani || 0;
        const decision = data.karar || "Bilinmiyor";
        
        // Analiz tamamlandı, sonucu overlay'de göster
        const isDangerous = score < 40;
        showSecurityResult(score, decision, isDangerous);
        
        // Tehlikeli değilse 3 saniye sonra overlay'i kaldır
        // Tehlikeli ise kullanıcı onayı beklenir (butonlar gösterilir)
        if (!isDangerous) {
            setTimeout(() => {
                hideSecurityOverlay();
            }, 3000);
        }
    } catch (error) {
        // Hata durumunda overlay'i kaldır (backend çalışmıyor olabilir)
        console.log("Güvenlik kontrolü yapılamadı:", error);
        hideSecurityOverlay();
    }
}

function showSecurityResult(score, decision, isDangerous) {
    const overlay = document.getElementById("phishing-security-overlay");
    if (!overlay) return;
    
    // Skora göre renk ve ikon belirle
    let icon = "✅";
    let bgColor = "rgba(46, 213, 115, 0.95)";
    let bgColor2 = "rgba(39, 174, 96, 0.95)";
    let statusText = "Güvenli";
    
    if (isDangerous) {
        icon = "🚨";
        bgColor = "rgba(235, 51, 73, 0.95)";
        bgColor2 = "rgba(244, 92, 67, 0.95)";
        statusText = "Tehlikeli";
    } else if (score < 70) {
        icon = "⚠️";
        bgColor = "rgba(255, 193, 7, 0.95)";
        bgColor2 = "rgba(255, 152, 0, 0.95)";
        statusText = "Şüpheli";
    }
    
    // Overlay arka plan rengini güncelle
    overlay.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${bgColor2} 100%)`;
    
    // İçeriği güncelle
    const content = overlay.querySelector(".overlay-content");
    if (content) {
        if (isDangerous) {
            // Logo URL'ini al - hata kontrolü ile
            let logoUrl = "";
            try {
                logoUrl = chrome.runtime.getURL("icon48.png");
            } catch (error) {
                console.error("Logo URL alınamadı:", error);
            }
            
            // Tehlikeli site - kullanıcı onayı iste
            const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" class="overlay-logo" />` : `<div class="overlay-logo-emoji">🛡️</div>`;
            content.innerHTML = `
                <div class="overlay-header">
                    ${logoHtml}
                    <div class="overlay-app-name">Güvenli İnternet Asistanı</div>
                </div>
                <div class="overlay-icon-container result-icon">
                    <div class="overlay-icon">${icon}</div>
                </div>
                <div class="overlay-title">⚠️ Güvenlik Uyarısı</div>
                <div class="overlay-result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-max">/100</span>
                </div>
                <div class="overlay-result-status">${statusText}</div>
                <div class="overlay-result-decision">${decision}</div>
                <div class="overlay-warning-message">Bu site güvenlik açısından riskli görünüyor. Devam etmek istediğinizden emin misiniz?</div>
                <div class="overlay-buttons">
                    <button id="overlay-go-back-btn" class="overlay-btn overlay-btn-danger">Geri Dön</button>
                    <button id="overlay-continue-btn" class="overlay-btn overlay-btn-warning">Yine de Devam Et</button>
                </div>
            `;
            
            // Buton event listener'ları ekle
            const goBackBtn = document.getElementById("overlay-go-back-btn");
            const continueBtn = document.getElementById("overlay-continue-btn");
            
            if (goBackBtn) {
                goBackBtn.addEventListener("click", () => {
                    // Önceki sayfaya dön veya ana sayfaya git
                    if (window.history.length > 1) {
                        window.history.back();
                    } else {
                        // Ana sayfaya git
                        window.location.href = "about:blank";
                    }
                    hideSecurityOverlay();
                });
            }
            
            if (continueBtn) {
                continueBtn.addEventListener("click", () => {
                    // Overlay'i kaldır ve uyarı banner'ı göster
                    hideSecurityOverlay();
                    showSecurityWarning(score, decision);
                });
            }
        } else {
            // Logo URL'ini al - hata kontrolü ile
            let logoUrl = "";
            try {
                logoUrl = chrome.runtime.getURL("icon48.png");
            } catch (error) {
                console.error("Logo URL alınamadı:", error);
            }
            
            // Güvenli/Şüpheli site - normal akış
            const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" class="overlay-logo" />` : `<div class="overlay-logo-emoji">🛡️</div>`;
            content.innerHTML = `
                <div class="overlay-header">
                    ${logoHtml}
                    <div class="overlay-app-name">Güvenli İnternet Asistanı</div>
                </div>
                <div class="overlay-icon-container result-icon">
                    <div class="overlay-icon">${icon}</div>
                </div>
                <div class="overlay-title">Analiz Tamamlandı</div>
                <div class="overlay-result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-max">/100</span>
                </div>
                <div class="overlay-result-status">${statusText}</div>
                <div class="overlay-result-decision">${decision}</div>
                <div class="overlay-subtitle">Sayfa açılıyor...</div>
            `;
        }
    }
}

function hideSecurityOverlay() {
    const overlay = document.getElementById("phishing-security-overlay");
    if (overlay) {
        overlay.style.animation = "fadeOut 0.3s ease-out";
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = ""; // Scroll'u geri aç
        }, 300);
    }
}

function showSecurityWarning(score, decision) {
    // Zaten bir uyarı varsa tekrar ekleme
    if (document.getElementById("phishing-warning-banner")) {
        return;
    }
    
    // Uyarı banner'ı oluştur
    const banner = document.createElement("div");
    banner.id = "phishing-warning-banner";
    banner.className = "phishing-warning-banner";
    
    banner.innerHTML = `
        <div class="warning-content">
            <div class="warning-icon-container">
                <div class="warning-icon">🛡️</div>
            </div>
            <div class="warning-text">
                <div class="warning-title">⚠️ Güvenlik Uyarısı</div>
                <div class="warning-message">Bu site güvenli değil! Güven puanı: <strong>${score}/100</strong> - <strong>${decision}</strong></div>
                <div class="warning-subtitle">Güvenli İnternet Asistanı tarafından tespit edildi</div>
            </div>
            <button class="warning-close" id="warning-close-btn" aria-label="Kapat">×</button>
        </div>
    `;
    
    // Sayfanın en üstüne ekle
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Kapat butonuna event listener ekle
    const closeBtn = document.getElementById("warning-close-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            banner.style.animation = "slideOut 0.3s ease-out";
            setTimeout(() => {
                banner.remove();
            }, 300);
        });
    }
    
    // 10 saniye sonra otomatik kapanma (opsiyonel)
    // setTimeout(() => {
    //     if (banner.parentNode) {
    //         banner.style.animation = "slideOut 0.3s ease-out";
    //         setTimeout(() => banner.remove(), 300);
    //     }
    // }, 10000);
}

// Sayfa değiştiğinde tekrar kontrol et (SPA'lar için)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Mevcut uyarıyı kaldır
        const existingBanner = document.getElementById("phishing-warning-banner");
        if (existingBanner) {
            existingBanner.remove();
        }
        // Yeni sayfayı kontrol et
        setTimeout(checkPageSecurity, 1000);
    }
}).observe(document, { subtree: true, childList: true });

