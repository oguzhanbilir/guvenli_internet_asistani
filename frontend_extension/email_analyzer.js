// E-posta Analiz Modülü
// Gmail, Outlook, Yahoo Mail ve Yandex Mail için oltalama tespiti
// Not: API_ENDPOINT kullanılmıyor, background service worker üzerinden çalışıyor

// Cache ayarları
const EMAIL_CACHE_DURATION = 10 * 60 * 1000; // 10 dakika
const analyzedEmails = new Set(); // Çift analiz önleme

/**
 * E-posta gönderen adresinden domain'i çıkarır
 */
function extractEmailDomain(email) {
    if (!email) return null;
    // E-posta formatını temizle
    const cleanEmail = email.replace(/[<>]/g, '').trim();
    const parts = cleanEmail.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : null;
}

/**
 * E-posta içindeki tüm linkleri bulur
 */
function extractLinksFromEmail(emailElement) {
    const links = [];
    const anchorTags = emailElement.querySelectorAll('a[href]');
    
    anchorTags.forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href) {
            // mailto: linklerini atla
            if (href.startsWith('http://') || href.startsWith('https://')) {
                links.push({
                    url: href,
                    text: anchor.textContent.trim() || href
                });
            }
        }
    });
    
    return links;
}

/**
 * E-posta içeriğini metin olarak çıkarır
 */
function extractEmailText(emailElement) {
    // HTML içeriğini temizle ve metin çıkar
    const clone = emailElement.cloneNode(true);
    // Script ve style taglerini kaldır
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    const textContent = clone.textContent || clone.innerText || '';
    return textContent.trim();
}

/**
 * Gönderen adresindeki typosquatting'i tespit eder
 */
async function analyzeSenderDomain(senderEmail) {
    const domain = extractEmailDomain(senderEmail);
    if (!domain) return null;
    
    // Extension context kontrolü
    if (!chrome.runtime?.id) {
        return null;
    }
    
    // Cache kontrolü
    const cacheKey = `email_domain_${domain}`;
    const cached = await getCachedAnalysis(cacheKey);
    if (cached) {
        return cached;
    }
    
    try {
        // Background service worker üzerinden analiz yap
        const result = await chrome.runtime.sendMessage({
            action: "analyze",
            url: `https://${domain}`,
            includeVisual: false
        });
        
        if (!result || !result.success) {
            return null;
        }
        
        const data = result.data;
        const analysisResult = {
            domain: domain,
            guven_puani: data.guven_puani,
            karar: data.karar,
            typosquatting_detected: data.guven_puani < 70
        };
        
        // Cache'e kaydet
        await saveCachedAnalysis(cacheKey, analysisResult);
        return analysisResult;
    } catch (error) {
        // Extension context invalidated hatası için sessizce geç
        if (error.message?.includes("Extension context invalidated")) {
            return null;
        }
        console.error("Gönderen domain analizi hatası:", error);
        return null;
    }
}

/**
 * E-posta içindeki linkleri analiz eder
 */
async function analyzeEmailLinks(links) {
    const results = [];
    
    // Extension context kontrolü
    if (!chrome.runtime?.id) {
        return results;
    }
    
    for (const link of links) {
        // Cache kontrolü
        const cacheKey = `email_link_${link.url}`;
        const cached = await getCachedAnalysis(cacheKey);
        if (cached) {
            results.push(cached);
            continue;
        }
        
        try {
            // Background service worker üzerinden analiz yap
            const result = await chrome.runtime.sendMessage({
                action: "analyze",
                url: link.url,
                includeVisual: false
            });
            
            if (result && result.success) {
                const data = result.data;
                const analysisResult = {
                    url: link.url,
                    text: link.text,
                    guven_puani: data.guven_puani,
                    karar: data.karar,
                    is_dangerous: data.guven_puani < 40
                };
                
                // Cache'e kaydet
                await saveCachedAnalysis(cacheKey, analysisResult);
                results.push(analysisResult);
            }
        } catch (error) {
            // Extension context invalidated hatası için sessizce geç
            if (error.message?.includes("Extension context invalidated")) {
                continue;
            }
            console.error(`Link analizi hatası (${link.url}):`, error);
        }
    }
    
    return results;
}

/**
 * E-posta içeriğindeki sosyal mühendislik göstergelerini tespit eder
 */
function detectSocialEngineeringKeywords(emailText) {
    const keywords = [
        'hemen', 'acil', 'derhal', 'son gün', 'süre doluyor',
        'hesabınız kapatılacak', 'hesabınız askıya alındı',
        'doğrulama gerekli', 'güvenlik uyarısı', 'şüpheli aktivite',
        'tıklayın', 'şimdi tıklayın', 'hemen tıklayın',
        'ücretsiz', 'kazandınız', 'ödül', 'hediye',
        'verify', 'urgent', 'immediately', 'click here',
        'account suspended', 'security alert', 'verify now'
    ];
    
    const detected = [];
    const lowerText = emailText.toLowerCase();
    
    keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            detected.push(keyword);
        }
    });
    
    return detected;
}

/**
 * Cache'den analiz sonucu al
 */
async function getCachedAnalysis(key) {
    try {
        // Extension context kontrolü
        if (!chrome.runtime?.id) {
            return null;
        }
        
        const result = await chrome.storage.local.get(key);
        const cached = result[key];
        
        if (cached && cached.timestamp) {
            const age = Date.now() - cached.timestamp;
            if (age < EMAIL_CACHE_DURATION) {
                return cached.data;
            } else {
                await chrome.storage.local.remove(key);
            }
        }
        return null;
    } catch (error) {
        // Extension context invalidated hatası için sessizce geç
        if (error.message?.includes("Extension context invalidated")) {
            return null;
        }
        console.error("Cache okuma hatası:", error);
        return null;
    }
}

/**
 * Analiz sonucunu cache'e kaydet
 */
async function saveCachedAnalysis(key, data) {
    try {
        // Extension context kontrolü
        if (!chrome.runtime?.id) {
            console.warn("[Email Analyzer] Extension context invalidated, cache kaydedilemedi");
            return;
        }
        
        await chrome.storage.local.set({
            [key]: {
                data: data,
                timestamp: Date.now()
            }
        });
    } catch (error) {
        // Extension context invalidated hatası için sessizce geç
        if (error.message?.includes("Extension context invalidated")) {
            return;
        }
        console.error("Cache kaydetme hatası:", error);
    }
}

/**
 * E-posta için uyarı banner'ı gösterir
 */
function showEmailWarning(emailElement, analysisResult) {
    // Zaten bir uyarı varsa tekrar ekleme
    if (emailElement.querySelector('.phishing-email-warning')) {
        return;
    }
    
    const warningDiv = document.createElement('div');
    warningDiv.className = 'phishing-email-warning';
    
    const riskColor = analysisResult.riskLevel === 'high' ? '#e74c3c' : '#f39c12';
    const riskIcon = analysisResult.riskLevel === 'high' ? '🚨' : '⚠️';
    
    warningDiv.style.cssText = `
        background: linear-gradient(135deg, ${riskColor} 0%, #c0392b 100%);
        color: white;
        padding: 12px 16px;
        margin: 8px 0;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        z-index: 10000;
        position: relative;
    `;
    
    warningDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">${riskIcon}</div>
            <div style="flex: 1;">
                <div style="font-weight: bold; margin-bottom: 4px;">
                    Güvenlik Uyarısı - Oltalama Şüphesi
                </div>
                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
                    Güven Puanı: ${analysisResult.riskScore}/100 | Gönderen: ${analysisResult.sender}
                </div>
                <div style="margin-top: 8px; font-size: 13px;">
                    ${analysisResult.warnings.join('<br>')}
                </div>
            </div>
            <button class="phishing-email-warning-close" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
        </div>
    `;
    
    // Kapat butonu
    const closeBtn = warningDiv.querySelector('.phishing-email-warning-close');
    closeBtn.addEventListener('click', () => {
        warningDiv.style.transition = 'opacity 0.3s';
        warningDiv.style.opacity = '0';
        setTimeout(() => warningDiv.remove(), 300);
    });
    
    // E-postanın başına ekle
    if (emailElement.parentNode) {
        emailElement.parentNode.insertBefore(warningDiv, emailElement);
    } else {
        emailElement.insertBefore(warningDiv, emailElement.firstChild);
    }
}

/**
 * E-posta analiz fonksiyonu (tüm sağlayıcılar için ortak)
 */
async function analyzeEmail(emailElement, emailProvider) {
    // Çift analiz önleme
    const emailId = emailElement.getAttribute('data-email-id') || 
                   emailElement.id || 
                   emailElement.textContent.substring(0, 50);
    
    if (analyzedEmails.has(emailId)) {
        return;
    }
    analyzedEmails.add(emailId);
    
    let senderEmail = null;
    let emailBody = null;
    
    // Sağlayıcıya göre gönderen ve içerik çıkarımı
    switch(emailProvider) {
        case 'test':
            senderEmail = extractTestPageSender(emailElement);
            emailBody = emailElement.querySelector('.email-body') || emailElement;
            break;
            
        case 'gmail':
            senderEmail = extractGmailSender(emailElement);
            emailBody = emailElement.querySelector('.ii.gt') || 
                       emailElement.querySelector('.a3s') ||
                       emailElement.querySelector('[role="main"]') ||
                       emailElement;
            break;
            
        case 'outlook':
            senderEmail = extractOutlookSender(emailElement);
            emailBody = emailElement.querySelector('.allowTextSelection') ||
                       emailElement.querySelector('[role="article"]') ||
                       emailElement;
            break;
            
        case 'yahoo':
            senderEmail = extractYahooSender(emailElement);
            emailBody = emailElement.querySelector('.msg-body') ||
                       emailElement.querySelector('.email-content') ||
                       emailElement;
            break;
            
        case 'yandex':
            senderEmail = extractYandexSender(emailElement);
            emailBody = emailElement.querySelector('.b-message-body') ||
                       emailElement.querySelector('.message-body') ||
                       emailElement;
            break;
    }
    
    if (!senderEmail || !emailBody) {
        return;
    }
    
    const emailText = extractEmailText(emailBody);
    const links = extractLinksFromEmail(emailBody);
    
    // Analizleri yap
    const [senderAnalysis, linkAnalyses, socialKeywords] = await Promise.all([
        analyzeSenderDomain(senderEmail),
        links.length > 0 ? analyzeEmailLinks(links) : Promise.resolve([]),
        Promise.resolve(detectSocialEngineeringKeywords(emailText))
    ]);
    
    // Risk değerlendirmesi
    let riskLevel = 'low';
    let riskScore = 100;
    const warnings = [];
    
    // Gönderen domain analizi
    if (senderAnalysis) {
        if (senderAnalysis.typosquatting_detected) {
            riskLevel = 'high';
            riskScore = Math.min(riskScore, senderAnalysis.guven_puani);
            warnings.push(`⚠️ Gönderen domain şüpheli: ${senderAnalysis.domain} (Güven puanı: ${senderAnalysis.guven_puani}/100)`);
        } else if (senderAnalysis.guven_puani < 50) {
            if (riskLevel === 'low') riskLevel = 'medium';
            riskScore = Math.min(riskScore, senderAnalysis.guven_puani);
            warnings.push(`⚠️ Gönderen domain düşük güven puanı: ${senderAnalysis.guven_puani}/100`);
        }
    }
    
    // Link analizi
    const dangerousLinks = linkAnalyses.filter(link => link.is_dangerous);
    if (dangerousLinks.length > 0) {
        riskLevel = 'high';
        riskScore = Math.min(riskScore, ...dangerousLinks.map(l => l.guven_puani));
        warnings.push(`🚨 ${dangerousLinks.length} tehlikeli link tespit edildi!`);
        dangerousLinks.forEach(link => {
            warnings.push(`  • ${link.url.substring(0, 60)}${link.url.length > 60 ? '...' : ''} (Güven: ${link.guven_puani}/100)`);
        });
    }
    
    // Sosyal mühendislik göstergeleri
    if (socialKeywords.length > 0) {
        if (riskLevel === 'low') riskLevel = 'medium';
        riskScore = Math.max(0, riskScore - (socialKeywords.length * 10));
        warnings.push(`⚠️ ${socialKeywords.length} sosyal mühendislik göstergesi: ${socialKeywords.slice(0, 3).join(', ')}${socialKeywords.length > 3 ? '...' : ''}`);
    }
    
    // Uyarı göster
    if (riskLevel !== 'low' && warnings.length > 0) {
        showEmailWarning(emailElement, {
            sender: senderEmail,
            riskLevel: riskLevel,
            riskScore: riskScore,
            warnings: warnings
        });
    }
}

// ========== E-posta Sağlayıcılarına Özel Fonksiyonlar ==========

/**
 * Gmail gönderen bilgisini çıkarır
 */
function extractGmailSender(emailElement) {
    // Farklı Gmail selector'ları dene
    const selectors = [
        '[email]',
        '.gD',
        '[data-hovercard-id]',
        '.yW span[email]',
        '.zF .yW span'
    ];
    
    for (const selector of selectors) {
        const element = emailElement.querySelector(selector);
        if (element) {
            const email = element.getAttribute('email') || 
                        element.textContent || 
                        element.getAttribute('data-hovercard-id');
            if (email && email.includes('@')) {
                return email;
            }
        }
    }
    
    return null;
}

/**
 * Outlook gönderen bilgisini çıkarır
 */
function extractOutlookSender(emailElement) {
    const selectors = [
        '[aria-label*="From"]',
        '.ms-fontColor-neutralPrimary',
        '[title*="@"]',
        '.ms-Persona-primaryText'
    ];
    
    for (const selector of selectors) {
        const element = emailElement.querySelector(selector);
        if (element) {
            const text = element.textContent || element.getAttribute('title') || '';
            const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch) {
                return emailMatch[0];
            }
        }
    }
    
    return null;
}

/**
 * Yahoo Mail gönderen bilgisini çıkarır
 */
function extractYahooSender(emailElement) {
    const selectors = [
        '.sender-name',
        '[data-test-id="message-header-from"]',
        '.msg-from',
        '.email-header .sender'
    ];
    
    for (const selector of selectors) {
        const element = emailElement.querySelector(selector);
        if (element) {
            const text = element.textContent || '';
            const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch) {
                return emailMatch[0];
            }
        }
    }
    
    return null;
}

/**
 * Test sayfası gönderen bilgisini çıkarır
 */
function extractTestPageSender(emailElement) {
    const senderAddressElement = emailElement.querySelector('.email-sender-address');
    if (senderAddressElement) {
        const text = senderAddressElement.textContent || '';
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
            return emailMatch[0];
        }
    }
    return null;
}

/**
 * Yandex Mail gönderen bilgisini çıkarır
 */
function extractYandexSender(emailElement) {
    const selectors = [
        '.b-message-head__from',
        '.message-head__from',
        '[data-key="from"]'
    ];
    
    for (const selector of selectors) {
        const element = emailElement.querySelector(selector);
        if (element) {
            const text = element.textContent || '';
            const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch) {
                return emailMatch[0];
            }
        }
    }
    
    return null;
}

// ========== E-posta Sağlayıcı Analizörleri ==========

/**
 * Gmail analizörü
 */
function initGmailAnalyzer() {
    if (!window.location.href.includes('mail.google.com')) {
        return;
    }
    
    console.log('[Email Analyzer] Gmail analizörü başlatıldı');
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const emailElement = node.classList?.contains('zA') ? node : 
                                       node.querySelector?.('.zA');
                    
                    if (emailElement && !emailElement.hasAttribute('data-phishing-analyzed')) {
                        emailElement.setAttribute('data-phishing-analyzed', 'true');
                        setTimeout(() => {
                            analyzeEmail(emailElement, 'gmail');
                        }, 500);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Mevcut e-postaları analiz et
    setTimeout(() => {
        document.querySelectorAll('.zA').forEach(emailElement => {
            if (!emailElement.hasAttribute('data-phishing-analyzed')) {
                emailElement.setAttribute('data-phishing-analyzed', 'true');
                analyzeEmail(emailElement, 'gmail');
            }
        });
    }, 2000);
}

/**
 * Outlook analizörü
 */
function initOutlookAnalyzer() {
    if (!window.location.href.includes('outlook.live.com') && 
        !window.location.href.includes('outlook.office.com')) {
        return;
    }
    
    console.log('[Email Analyzer] Outlook analizörü başlatıldı');
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const emailElement = node.querySelector?.('[role="listitem"]') ||
                                       node.querySelector?.('[role="article"]');
                    
                    if (emailElement && !emailElement.hasAttribute('data-phishing-analyzed')) {
                        emailElement.setAttribute('data-phishing-analyzed', 'true');
                        setTimeout(() => {
                            analyzeEmail(emailElement, 'outlook');
                        }, 500);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    setTimeout(() => {
        document.querySelectorAll('[role="listitem"], [role="article"]').forEach(emailElement => {
            if (!emailElement.hasAttribute('data-phishing-analyzed')) {
                emailElement.setAttribute('data-phishing-analyzed', 'true');
                analyzeEmail(emailElement, 'outlook');
            }
        });
    }, 2000);
}

/**
 * Yahoo Mail analizörü
 */
function initYahooAnalyzer() {
    if (!window.location.href.includes('mail.yahoo.com')) {
        return;
    }
    
    console.log('[Email Analyzer] Yahoo Mail analizörü başlatıldı');
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const emailElement = node.querySelector?.('.list-view-item') ||
                                       node.querySelector?.('.message-item');
                    
                    if (emailElement && !emailElement.hasAttribute('data-phishing-analyzed')) {
                        emailElement.setAttribute('data-phishing-analyzed', 'true');
                        setTimeout(() => {
                            analyzeEmail(emailElement, 'yahoo');
                        }, 500);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    setTimeout(() => {
        document.querySelectorAll('.list-view-item, .message-item').forEach(emailElement => {
            if (!emailElement.hasAttribute('data-phishing-analyzed')) {
                emailElement.setAttribute('data-phishing-analyzed', 'true');
                analyzeEmail(emailElement, 'yahoo');
            }
        });
    }, 2000);
}

/**
 * Yandex Mail analizörü
 */
function initYandexAnalyzer() {
    if (!window.location.href.includes('mail.yandex.com') &&
        !window.location.href.includes('mail.yandex.ru')) {
        return;
    }
    
    console.log('[Email Analyzer] Yandex Mail analizörü başlatıldı');
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const emailElement = node.querySelector?.('.b-message') ||
                                       node.querySelector?.('.message');
                    
                    if (emailElement && !emailElement.hasAttribute('data-phishing-analyzed')) {
                        emailElement.setAttribute('data-phishing-analyzed', 'true');
                        setTimeout(() => {
                            analyzeEmail(emailElement, 'yandex');
                        }, 500);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    setTimeout(() => {
        document.querySelectorAll('.b-message, .message').forEach(emailElement => {
            if (!emailElement.hasAttribute('data-phishing-analyzed')) {
                emailElement.setAttribute('data-phishing-analyzed', 'true');
                analyzeEmail(emailElement, 'yandex');
            }
        });
    }, 2000);
}

// ========== Ana Başlatma Fonksiyonu ==========

function initEmailAnalyzers() {
    const url = window.location.href;
    
    // Test sayfası desteği
    if (url.includes('test_email_phishing.html') || document.querySelector('.email-container[data-email-id]')) {
        initTestPageAnalyzer();
    } else if (url.includes('mail.google.com')) {
        initGmailAnalyzer();
    } else if (url.includes('outlook.live.com') || url.includes('outlook.office.com')) {
        initOutlookAnalyzer();
    } else if (url.includes('mail.yahoo.com')) {
        initYahooAnalyzer();
    } else if (url.includes('mail.yandex.com') || url.includes('mail.yandex.ru')) {
        initYandexAnalyzer();
    }
}

/**
 * Test sayfası analizörü
 */
function initTestPageAnalyzer() {
    console.log('[Email Analyzer] Test sayfası analizörü başlatıldı');
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    const emailElement = node.classList?.contains('email-container') ? node : node.querySelector?.('.email-container');
                    if (emailElement && !emailElement.hasAttribute('data-phishing-analyzed')) {
                        emailElement.setAttribute('data-phishing-analyzed', 'true');
                        setTimeout(() => {
                            analyzeEmail(emailElement, 'test');
                        }, 500);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Mevcut e-postaları analiz et
    setTimeout(() => {
        document.querySelectorAll('.email-container[data-email-id]').forEach(emailElement => {
            if (!emailElement.hasAttribute('data-phishing-analyzed')) {
                emailElement.setAttribute('data-phishing-analyzed', 'true');
                analyzeEmail(emailElement, 'test');
            }
        });
    }, 1000);
}

// Sayfa yüklendiğinde başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmailAnalyzers);
} else {
    initEmailAnalyzers();
}

// Sayfa değiştiğinde tekrar başlat (SPA'lar için)
// lastUrl değişkenini window objesi üzerinde saklayarak çift tanımlamayı önle
if (typeof window.emailAnalyzerLastUrl === 'undefined') {
    window.emailAnalyzerLastUrl = location.href;
}
new MutationObserver(() => {
    const url = location.href;
    if (url !== window.emailAnalyzerLastUrl) {
        window.emailAnalyzerLastUrl = url;
        setTimeout(initEmailAnalyzers, 1000);
    }
}).observe(document, { subtree: true, childList: true });
