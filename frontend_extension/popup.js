const API_ENDPOINT = "https://guvenli-internet-asistani.onrender.com/analyze";

const LAYER_INFO = {
    teknik: { label: "Teknik Analiz", icon: "🔧", color: "#4299e1" },
    dilsel: { label: "Dilsel Analiz", icon: "📝", color: "#48bb78" },
    gorsel: { label: "Görsel Analiz", icon: "👁️", color: "#ed8936" }
};

let currentUrl = "";
let resultsShown = false;

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
                console.log(`Cache'den analiz sonucu alındı (${Math.round(age / 1000)}s önce)`);
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
        const cacheKey = `analysis_cache_${url}`;
        await chrome.storage.local.set({
            [cacheKey]: {
                data: data,
                timestamp: Date.now()
            }
        });
        console.log("Analiz sonucu cache'e kaydedildi");
    } catch (error) {
        console.error("Cache kaydetme hatası:", error);
    }
}

function setStatus(message) {
    const statusSection = document.getElementById("status");
    const errorSection = document.getElementById("error");
    const resultSection = document.getElementById("result");
    
    // Analiz başladığında error ve result section'ları kesinlikle gizle
    if (errorSection) {
        errorSection.hidden = true;
        errorSection.style.display = 'none';
        errorSection.style.visibility = 'hidden';
        errorSection.style.opacity = '0';
        errorSection.style.height = '0';
    }
    
    if (resultSection) {
        resultSection.hidden = true;
    }
    
    // Status section'ı göster
    if (statusSection) {
        statusSection.hidden = false;
        statusSection.style.display = '';
        statusSection.style.visibility = '';
        statusSection.style.opacity = '';
        const p = statusSection.querySelector("p");
        if (p) {
            p.textContent = message;
        }
    }
}

function getRiskLevel(score) {
    if (typeof score !== "number" || Number.isNaN(score)) {
        return { label: "Bilinmiyor", className: "medium" };
    }
    if (score >= 0.7) {
        return { label: "Yüksek", className: "high" };
    }
    if (score >= 0.4) {
        return { label: "Orta", className: "medium" };
    }
    return { label: "Düşük", className: "low" };
}

function updateScoreDisplay(score, decision) {
    const scoreValue = document.getElementById("score-value");
    const progressBar = document.getElementById("progress-bar");
    const decisionText = document.getElementById("decision-text");
    const decisionIcon = document.getElementById("decision-icon");
    const decisionBadge = document.getElementById("decision-badge");

    if (scoreValue) {
        scoreValue.textContent = score ?? "--";
        scoreValue.setAttribute("data-value", score ?? "--");
    }

    if (progressBar) {
        const percentage = Math.max(0, Math.min(100, score ?? 0));
        progressBar.style.width = `${percentage}%`;
        
        progressBar.className = "progress-fill";
        if (percentage < 40) {
            progressBar.classList.add("low");
        } else if (percentage < 70) {
            progressBar.classList.add("medium");
        } else {
            progressBar.classList.remove("low", "medium");
        }
    }

    // Decision badge
    if (decisionBadge) {
        decisionBadge.className = "decision-badge";
        const scoreNum = score ?? 0;
        if (scoreNum >= 80) {
            decisionBadge.classList.add("safe");
            if (decisionIcon) decisionIcon.textContent = "✅";
        } else if (scoreNum >= 40) {
            decisionBadge.classList.add("suspicious");
            if (decisionIcon) decisionIcon.textContent = "⚠️";
        } else {
            decisionBadge.classList.add("dangerous");
            if (decisionIcon) decisionIcon.textContent = "🚨";
        }
    }

    if (decisionText) {
        decisionText.textContent = decision || "Bilinmiyor";
    }
}

function updateUrlDisplay(url) {
    const urlElement = document.getElementById("current-url");
    if (urlElement) {
        urlElement.textContent = url || "--";
    }
}

function formatMetricValue(value) {
    if (value === null || value === undefined) {
        return "Bilinmiyor";
    }
    if (typeof value === "boolean") {
        return value ? "Evet" : "Hayır";
    }
    if (typeof value === "number") {
        if (value % 1 === 0) {
            return value.toString();
        }
        return value.toFixed(2);
    }
    // Array kontrolü (redirect zinciri için)
    if (Array.isArray(value)) {
        return `${value.length} adet`;
    }
    return String(value);
}

// Teknik hata mesajlarını tespit et
function isTechnicalError(text) {
    if (!text || typeof text !== 'string') return false;
    const errorPatterns = [
        /HTTPSConnectionPool/,
        /Read timed out/,
        /read timeout/,
        /ConnectionError/,
        /TimeoutError/,
        /Exception/,
        /Error:/,
        /Traceback/,
        /\.py:/,
        /host='.*', port=/,
        /verisi alınamadı/i,
        /içerik indirilemedi/i
    ];
    return errorPatterns.some(pattern => pattern.test(text));
}

// Kullanıcı dostu hata mesajları
function formatErrorMessage(text, layerKey) {
    if (!text) return "Analiz tamamlanamadı";
    
    // Teknik hataları kullanıcı dostu mesajlara çevir
    if (text.includes('Read timed out') || text.includes('timeout')) {
        return "İçerik indirme işlemi zaman aşımına uğradı. Site yanıt vermiyor olabilir.";
    }
    if (text.includes('HTTPSConnectionPool') || text.includes('ConnectionError')) {
        return "Siteye bağlanılamadı. İnternet bağlantınızı kontrol edin.";
    }
    if (text.includes('verisi alınamadı') || text.includes('içerik indirilemedi')) {
        return "Sayfa içeriği analiz edilemedi. Site erişime kapalı olabilir.";
    }
    
    return text;
}

// Detay öğesi oluştur
function createDetailItem(layerKey, detailText, riskScore, signalName = null, signalValue = null) {
    const li = document.createElement("li");
    li.className = "detail-item";
    
    const layerInfo = LAYER_INFO[layerKey] || { label: layerKey, icon: "📋" };
    const riskClass = riskScore >= 0.7 ? "high" : riskScore >= 0.4 ? "medium" : "low";
    
    // Teknik hataları filtrele ve formatla
    if (isTechnicalError(detailText)) {
        detailText = formatErrorMessage(detailText, layerKey);
    }
    
    // Redirect zinciri için özel formatlama
    if (signalName === "redirect_zinciri") {
        console.log("Redirect zinciri formatlanıyor, signalValue:", signalValue);
        console.log("signalValue type:", typeof signalValue);
        console.log("Is array?", Array.isArray(signalValue));
        
        // Eğer signalValue bir string ise (JSON string olabilir), parse et
        let chainArray = signalValue;
        if (typeof signalValue === 'string') {
            try {
                chainArray = JSON.parse(signalValue);
            } catch (e) {
                console.warn("Redirect zinciri parse edilemedi:", e);
            }
        }
        
        if (Array.isArray(chainArray) && chainArray.length > 0) {
            const chainHtml = chainArray.map((url, index) => 
                `<div class="redirect-chain-item"><span class="redirect-chain-number">${index + 1}.</span> <a href="${url}" target="_blank" class="redirect-chain-link">${url}</a></div>`
            ).join("");
            detailText = `<div class="redirect-chain-container"><div class="redirect-chain-header"><strong>Yönlendirme Zinciri (${chainArray.length} adet):</strong></div>${chainHtml}</div>`;
        } else {
            // Eğer array değilse, details'ten parse etmeyi dene
            console.warn("Yönlendirme zinciri array değil, details kullanılıyor");
        }
    } else if (signalName === "redirect_sayisi") {
        // Yönlendirme sayısı için - details'ten "Toplam X URL:" kısmını parse et
        let chainArray = null;
        
        // Önce signalValue'dan chain'i kontrol et (genellikle sadece sayı olur)
        if (Array.isArray(signalValue)) {
            chainArray = signalValue;
        } else if (typeof signalValue === 'string') {
            try {
                chainArray = JSON.parse(signalValue);
            } catch (e) {
                // Parse edilemezse details'ten çıkarmayı dene
            }
        }
        
        // Eğer hala chain bulunamadıysa, details'ten parse et
        if (!chainArray && detailText && detailText.includes("Toplam")) {
            const chainMatch = detailText.match(/Toplam \d+ URL: (.+)/);
            if (chainMatch) {
                const chainStr = chainMatch[1];
                // " → " (boşluklar ile) ile split et
                chainArray = chainStr.split(" → ").map(u => u.trim()).filter(u => u && u.length > 0);
            }
        }
        
        if (chainArray && Array.isArray(chainArray) && chainArray.length > 0) {
            // Direkt numaralandırılmış linkler - ara başlık yok
            const chainHtml = chainArray.map((url, index) => 
                `<div class="redirect-chain-item"><span class="redirect-chain-number">${index + 1}.</span> <a href="${url}" target="_blank" class="redirect-chain-link">${url}</a></div>`
            ).join("");
            detailText = `<div class="redirect-chain-container">${chainHtml}</div>`;
        }
    } else {
        // Detay metnini daha anlaşılır hale getir (signalName ve riskScore ile açıklama ekle)
        detailText = formatDetailText(detailText, signalName, riskScore);
    }
    
    // Risk skorunu formatla
    let riskBadge = '';
    if (riskScore !== null && riskScore !== undefined) {
        const riskPercent = (riskScore * 100).toFixed(0);
        const riskLabel = riskScore >= 0.7 ? 'Yüksek' : riskScore >= 0.4 ? 'Orta' : 'Düşük';
        riskBadge = `<span class="detail-risk ${riskClass}">${riskLabel} (${riskPercent}%)</span>`;
    }
    
    li.innerHTML = `
        <div class="detail-header">
            <span class="detail-icon">${layerInfo.icon}</span>
            <span class="detail-layer">${layerInfo.label}</span>
            ${riskBadge}
        </div>
        <div class="detail-content">${detailText}</div>
    `;
    
    return li;
}

// Metrik açıklamaları
const METRIC_EXPLANATIONS = {
    "domain_uzunlugu": {
        low: "Domain uzunluğu normal seviyede (25 karakterden az).",
        medium: "Domain uzunluğu biraz uzun (25-40 karakter). Uzun domain adları hatırlanması zor olabilir ve şüpheli görünebilir.",
        high: "Domain uzunluğu çok uzun (40+ karakter). Bu, oltalama saldırılarında sık kullanılan bir tekniktir çünkü kullanıcıların dikkatini dağıtır."
    },
    "path_uzunlugu": {
        low: "URL path uzunluğu normal seviyede (50 karakterden az).",
        medium: "URL path uzunluğu biraz uzun (50-100 karakter). Uzun URL'ler kullanıcıları yanıltmak için kullanılabilir.",
        high: "URL path uzunluğu çok uzun (100+ karakter). Oltalama saldırılarında uzun URL'ler kullanıcıların gerçek domain'i görmesini engellemek için kullanılır."
    },
    "url_uzunlugu": {
        low: "URL uzunluğu normal seviyede (75 karakterden az).",
        medium: "URL uzunluğu biraz uzun (75-150 karakter). Uzun URL'ler şüpheli olabilir.",
        high: "URL uzunluğu çok uzun (150+ karakter). Bu, oltalama saldırılarında sık kullanılan bir tekniktir."
    },
    "subdomain_sayisi": {
        low: "Subdomain sayısı normal seviyede.",
        medium: "Subdomain sayısı fazla. Çok fazla subdomain şüpheli olabilir.",
        high: "Subdomain sayısı çok fazla. Bu, oltalama saldırılarında kullanılan bir tekniktir."
    },
    "query_parametre_sayisi": {
        low: "Query parametre sayısı normal seviyede.",
        medium: "Query parametre sayısı fazla. Çok fazla parametre şüpheli olabilir.",
        high: "Query parametre sayısı çok fazla. Bu, oltalama saldırılarında kullanıcıları yanıltmak için kullanılabilir."
    },
    "domain_yasi": {
        low: "Domain yaşı yeterli. Eski domain'ler genellikle daha güvenilirdir.",
        medium: "Domain yaşı orta seviyede. Yeni domain'ler daha riskli olabilir.",
        high: "Domain yaşı çok kısa. Yeni oluşturulmuş domain'ler oltalama saldırılarında sık kullanılır."
    },
    "domain_vadesi": {
        low: "Domain vadesi normal seviyede. Domain genellikle 1 yıllık alınır, bu normal bir süredir.",
        medium: "Domain vadesi yakında dolacak (30-90 gün içinde). Bu şüpheli olabilir.",
        high: "Domain vadesi çok yakında dolacak (30 günden az). Kısa vadeli domain'ler oltalama saldırılarında kullanılabilir."
    },
    "https_kullanimi": {
        low: "HTTPS kullanılıyor. Güvenli bağlantı sağlanıyor.",
        medium: "HTTPS kullanımı belirsiz.",
        high: "HTTPS kullanılmıyor. Güvenli olmayan bağlantı risk oluşturur."
    },
    "typosquatting": {
        low: "Typosquatting tespit edilmedi.",
        medium: "Olası typosquatting tespit edildi. Domain adı popüler bir markaya benziyor olabilir.",
        high: "Typosquatting tespit edildi. Domain adı popüler bir markayı taklit ediyor olabilir."
    },
    "url_kisaltma_servisi": {
        low: "URL kısaltma servisi kullanılmıyor.",
        medium: "URL kısaltma servisi kullanılıyor. Bu şüpheli olabilir.",
        high: "URL kısaltma servisi kullanılıyor. Oltalama saldırılarında sık kullanılır çünkü gerçek URL'yi gizler."
    },
    "homograph_karakter": {
        low: "Benzer görünen karakterler tespit edilmedi. Domain adı normal karakterler kullanıyor.",
        medium: "Olası taklit karakterler tespit edildi. Domain adında gerçek harflere benzeyen farklı karakterler olabilir (örneğin: Latin 'a' yerine Kiril 'а').",
        high: "Taklit karakterler tespit edildi. Domain adında gerçek harflere benzeyen farklı karakterler kullanılıyor. Bu, gerçek siteyi taklit etmek için kullanılan bir oltalama tekniğidir."
    },
    "ssl_sertifika_analizi": {
        low: "SSL sertifikası geçerli ve güvenli.",
        medium: "SSL sertifikası ile ilgili sorunlar var.",
        high: "SSL sertifikası geçersiz veya şüpheli. Güvenli bağlantı sağlanamıyor."
    },
    "redirect_sayisi": {
        low: "Yönlendirme sayısı normal seviyede.",
        medium: "Yönlendirme sayısı fazla. Bu şüpheli olabilir.",
        high: "Yönlendirme sayısı çok fazla. Oltalama saldırılarında çoklu yönlendirmeler kullanılır."
    }
};

// Detay metnini daha anlaşılır hale getir
function formatDetailText(text, signalName = null, riskScore = null) {
    if (!text || typeof text !== 'string') return text;
    
    // Eğer sadece metrik değeri varsa ve açıklama yoksa, açıklama ekle
    if (signalName && METRIC_EXPLANATIONS[signalName] && riskScore !== null) {
        const riskLevel = riskScore >= 0.7 ? 'high' : riskScore >= 0.4 ? 'medium' : 'low';
        const explanation = METRIC_EXPLANATIONS[signalName][riskLevel];
        
        // Eğer açıklama zaten metinde varsa hiçbir şey ekleme
        const explanationStart = explanation.substring(0, 30);
        if (text.includes(explanationStart)) {
            // Açıklama zaten var, sadece eski teknik terimleri temizle ve döndür
            if (signalName === 'homograph_karakter') {
                text = text.replace(/homograph karakter/gi, 'benzer görünen karakterler');
                text = text.replace(/Homograph karakter/gi, 'Benzer görünen karakterler');
            }
            return text;
        }
        
        // Önce eski teknik terimleri temizle (homograph karakter -> benzer görünen karakterler)
        if (signalName === 'homograph_karakter') {
            text = text.replace(/homograph karakter/gi, 'benzer görünen karakterler');
            text = text.replace(/Homograph karakter/gi, 'Benzer görünen karakterler');
            // Eğer "(normal)" gibi bir ek varsa, sadece açıklamayı göster
            if (text.includes('(normal)') || text.includes('tespit edilmedi')) {
                return explanation;
            }
        }
        
        // Eğer metin sadece değer içeriyorsa veya kısa bir mesajsa açıklama ekle
        const shouldAddExplanation = 
            text.match(/^\d+/) || 
            (text.includes('karakter') && !text.includes('normal seviyede') && !text.includes('biraz uzun') && !text.includes('çok uzun') && !text.includes('normal karakterler')) ||
            (text.includes('gün') && text.includes('sonra yenilenecek') && !text.includes('normal seviyede') && !text.includes('yakında dolacak')) ||
            (text.includes('kullanılıyor') && !text.includes('Oltalama') && !text.includes('Güvenli')) ||
            (text.includes('kullanılmıyor') && !text.includes('Güvenli')) ||
            (text.includes('tespit edilmedi') && !text.includes('normal karakterler'));
        
        if (shouldAddExplanation) {
            return `${text} ${explanation}`;
        }
    }
    
    // Noktalardan sonra boşluk ekle (okunabilirlik için)
    text = text.replace(/\.([A-Za-z])/g, '. $1');
    
    // Çok uzun cümleleri kısalt
    const sentences = text.split('. ');
    const formattedSentences = sentences.map(sentence => {
        // Çok uzun cümleleri böl
        if (sentence.length > 150) {
            return sentence.substring(0, 147) + '...';
        }
        return sentence;
    });
    
    return formattedSentences.join('. ').trim();
}

function getMetricLabel(name) {
    const labels = {
        "domain_yasi": "Alan Adı Yaşı",
        "domain_vadesi": "Alan Adı Vadesi",
        "supheli_tld": "TLD Analizi",
        "https_kullanimi": "HTTPS Kullanımı",
        "typosquatting": "Typosquatting Analizi",
        "url_uzunlugu": "URL Uzunluğu",
        "subdomain_sayisi": "Subdomain Sayısı",
        "domain_uzunlugu": "Domain Uzunluğu",
        "port_numarasi": "Port Numarası",
        "path_uzunlugu": "Path Uzunluğu",
        "query_parametre_sayisi": "Query Parametre Sayısı",
        "url_kisaltma_servisi": "URL Kısaltma Servisi",
        "homograph_karakter": "Benzer Görünen Karakterler",
        "ssl_sertifika_analizi": "SSL Sertifika Analizi",
        "redirect_sayisi": "Yönlendirme Sayısı",
        "redirect_zinciri": "Yönlendirme Zinciri",
        "icerik_indirme": "İçerik İndirme",
        "sosyal_muhendislik": "Sosyal Mühendislik",
        "logo_benzerligi": "Logo Benzerliği",
        "renk_paleti": "Renk Paleti Analizi"
    };
    return labels[name] || name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function createLayerCard(layerKey, data, signals) {
    const card = document.createElement("div");
    card.className = "layer-card";
    
    const info = LAYER_INFO[layerKey] || { label: layerKey, icon: "", color: "#666" };
    const risk = getRiskLevel(data.score);
    
    card.innerHTML = `
        <h4>${info.icon} ${info.label}</h4>
        <span class="risk-badge ${risk.className}">${risk.label} risk</span>
        <div class="metrics-container"></div>
    `;
    
    const metricsContainer = card.querySelector(".metrics-container");
    
    if (signals && signals.length > 0) {
        // Metrikleri göster
        signals.forEach(signal => {
            const metricDiv = document.createElement("div");
            metricDiv.className = "metric-item";
            
            const metricName = document.createElement("div");
            metricName.className = "metric-name";
            metricName.textContent = getMetricLabel(signal.name);
            
            const metricValue = document.createElement("div");
            metricValue.className = "metric-value";
            metricValue.textContent = formatMetricValue(signal.value);
            
            const metricDetail = document.createElement("div");
            metricDetail.className = "metric-detail";
            metricDetail.textContent = signal.details || signal.detay || "";
            
            const metricRisk = document.createElement("div");
            metricRisk.className = `metric-risk ${signal.risk_score >= 0.7 ? "high" : signal.risk_score >= 0.4 ? "medium" : "low"}`;
            metricRisk.textContent = `Risk: ${(signal.risk_score * 100).toFixed(0)}%`;
            
            metricDiv.appendChild(metricName);
            metricDiv.appendChild(metricValue);
            metricDiv.appendChild(metricDetail);
            metricDiv.appendChild(metricRisk);
            
            metricsContainer.appendChild(metricDiv);
        });
    } else {
        const p = document.createElement("p");
        p.style.fontSize = "12px";
        p.style.margin = "5px 0";
        p.textContent = "✅ Önemli risk sinyali bulunmadı.";
        metricsContainer.appendChild(p);
    }
    
    return card;
}

function renderLayerBreakdown(data) {
    const layerContainer = document.getElementById("layer-container");
    if (!layerContainer) {
        return;
    }

    layerContainer.innerHTML = "";

    const katmanSkorlari = data.katman_skorlari || {};
    const detayliSinyaller = data.detaylı_sinyaller || data.detayli_sinyaller || {};

    Object.keys(LAYER_INFO).forEach(layerKey => {
        const score = katmanSkorlari[layerKey] ?? 0;
        const signals = Array.isArray(detayliSinyaller[layerKey]) 
            ? detayliSinyaller[layerKey] 
            : [];
        
        // Sinyalleri risk skoruna göre sırala (yüksek risk önce)
        signals.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
        
        const card = createLayerCard(layerKey, { score }, signals);
        layerContainer.appendChild(card);
    });
}

function showResult(data) {
    // ÖNCE: Tüm section'ları kontrol et ve ayarla
    const errorSection = document.getElementById("error");
    const resultSection = document.getElementById("result");
    const statusSection = document.getElementById("status");
    
    // Flag'i HEMEN set et
    resultsShown = true;
    
    // Error section'ı KESINLIKLE gizle (hem attribute hem style)
    if (errorSection) {
        errorSection.hidden = true;
        errorSection.style.display = 'none';
        errorSection.style.visibility = 'hidden';
        errorSection.style.opacity = '0';
        errorSection.style.height = '0';
        errorSection.style.overflow = 'hidden';
    }
    
    // Status section'ı KESINLIKLE gizle (hem attribute hem style)
    if (statusSection) {
        statusSection.hidden = true;
        statusSection.style.display = 'none';
        statusSection.style.visibility = 'hidden';
        statusSection.style.opacity = '0';
        statusSection.style.height = '0';
        statusSection.style.overflow = 'hidden';
    }
    
    // Result section'ı göster
    if (resultSection) {
        resultSection.hidden = false;
        resultSection.style.display = '';
        resultSection.style.visibility = '';
        resultSection.style.opacity = '';
    }
    
    // App wrapper'a class ekle (CSS için)
    const appWrapper = document.querySelector('.app-wrapper');
    if (appWrapper) {
        appWrapper.classList.add('show-results');
        appWrapper.classList.remove('show-error');
    }
    
    try {
        const score = data.guven_puani ?? 0;
        const decision = data.karar ?? "Bilinmiyor";
        updateScoreDisplay(score, decision);
        updateUrlDisplay(currentUrl);

        try {
            renderLayerBreakdown(data);
        } catch (renderError) {
            console.error("renderLayerBreakdown hatası:", renderError);
        }

        const detailsList = document.getElementById("details-list");
        if (detailsList) {
            detailsList.innerHTML = "";
            
            // Detaylı sinyalleri kullanarak daha kapsamlı rapor oluştur
            const detayliSinyaller = data.detaylı_sinyaller || data.detayli_sinyaller || {};
            const layerOrder = ["teknik", "dilsel", "gorsel"];
            
            layerOrder.forEach(layerKey => {
                const signals = Array.isArray(detayliSinyaller[layerKey]) 
                    ? detayliSinyaller[layerKey] 
                    : [];
                
                if (signals.length === 0) {
                    // Sinyal yoksa analiz_dokumu'dan bilgi al
                    const dokumKey = `${layerKey}_risk`;
                    if (data.analiz_dokumu && data.analiz_dokumu[dokumKey]) {
                        const value = data.analiz_dokumu[dokumKey];
                        // Teknik hata mesajlarını filtrele
                        if (!isTechnicalError(value)) {
                            const li = createDetailItem(layerKey, value, null);
                            detailsList.appendChild(li);
                        }
                    }
                } else {
                    // Sinyalleri göster
                    signals.forEach(signal => {
                        // Debug: redirect_zinciri sinyalini kontrol et
                        if (signal.name === "redirect_zinciri") {
                            console.log("Redirect zinciri sinyali bulundu:", signal);
                            console.log("Signal value:", signal.value);
                            console.log("Signal value type:", typeof signal.value);
                            console.log("Is array?", Array.isArray(signal.value));
                        }
                        
                        const detailText = signal.details || signal.detay || signal.value || '';
                        const li = createDetailItem(layerKey, detailText, signal.risk_score, signal.name, signal.value);
                        detailsList.appendChild(li);
                    });
                }
            });
        }
        
        // Error section'ı tekrar gizle (güvenlik için)
        if (errorSection) {
            errorSection.hidden = true;
            errorSection.style.display = 'none';
        }
    } catch (error) {
        console.error("showResult hatası:", error);
        // Sonuçlar zaten gösterildi, error gösterme
        if (errorSection) {
            errorSection.hidden = true;
            errorSection.style.display = 'none';
        }
    }
    
    // Son kontrol: Error ve Status section'ları kesinlikle gizle (setTimeout ile)
    setTimeout(() => {
        const finalErrorSection = document.getElementById("error");
        const finalStatusSection = document.getElementById("status");
        const finalResultSection = document.getElementById("result");
        if (finalResultSection && !finalResultSection.hidden && resultsShown) {
            // Error section'ı gizle
            if (finalErrorSection) {
                finalErrorSection.hidden = true;
                finalErrorSection.style.display = 'none';
                finalErrorSection.style.visibility = 'hidden';
                finalErrorSection.style.opacity = '0';
            }
            // Status section'ı gizle
            if (finalStatusSection) {
                finalStatusSection.hidden = true;
                finalStatusSection.style.display = 'none';
                finalStatusSection.style.visibility = 'hidden';
                finalStatusSection.style.opacity = '0';
            }
        }
    }, 50);
    
    // Sürekli kontrol (her 100ms'de bir) - hem error hem status section için
    if (window.errorWatcher) {
        clearInterval(window.errorWatcher);
    }
    window.errorWatcher = setInterval(() => {
        const errSec = document.getElementById("error");
        const statusSec = document.getElementById("status");
        const resSec = document.getElementById("result");
        if (resSec && !resSec.hidden && resultsShown) {
            // Error section'ı gizle
            if (errSec) {
                errSec.hidden = true;
                errSec.style.display = 'none';
                errSec.style.visibility = 'hidden';
            }
            // Status section'ı gizle
            if (statusSec) {
                statusSec.hidden = true;
                statusSec.style.display = 'none';
                statusSec.style.visibility = 'hidden';
            }
        }
    }, 100);
}

function showError(error) {
    // ÖNCE: Sonuçlar gösterilmiş mi kontrol et - EĞER GÖSTERİLMİŞSE HİÇBİR ŞEY YAPMA
    const resultSection = document.getElementById("result");
    const statusSection = document.getElementById("status");
    
    // Analiz yapılıyorsa (status section görünüyorsa) hata gösterme
    if (statusSection && !statusSection.hidden) {
        // Analiz devam ediyor, hata mesajı gösterme
        const errorSection = document.getElementById("error");
        if (errorSection) {
            errorSection.hidden = true;
            errorSection.style.display = 'none';
            errorSection.style.visibility = 'hidden';
            errorSection.style.opacity = '0';
            errorSection.style.height = '0';
        }
        return; // Analiz devam ederken hata gösterme
    }
    
    if (resultsShown || (resultSection && !resultSection.hidden)) {
        // Sessizce çık - konsola bile yazma
        const errorSection = document.getElementById("error");
        if (errorSection) {
            errorSection.hidden = true;
            errorSection.style.display = 'none';
            errorSection.style.visibility = 'hidden';
            errorSection.style.opacity = '0';
            errorSection.style.height = '0';
        }
        return; // Hemen çık, hiçbir şey yapma
    }
    
    // Sadece gerçekten hata durumunda devam et
    const errorSection = document.getElementById("error");
    
    // Status section'ı kesinlikle gizle (hata gösterilirken analiz mesajı görünmesin)
    if (statusSection) {
        statusSection.hidden = true;
        statusSection.style.display = 'none';
        statusSection.style.visibility = 'hidden';
        statusSection.style.opacity = '0';
    }
    if (resultSection) {
        resultSection.hidden = true;
    }
    if (errorSection) {
        errorSection.hidden = false;
        errorSection.style.display = '';
        errorSection.style.visibility = '';
        errorSection.style.opacity = '';
        errorSection.style.height = '';
    }
    
    // App wrapper'a class ekle (CSS için)
    const appWrapper = document.querySelector('.app-wrapper');
    if (appWrapper) {
        appWrapper.classList.add('show-error');
        appWrapper.classList.remove('show-results');
    }

    const errorMessage = document.getElementById("error-message");
    if (errorMessage) {
        const message = error?.message || String(error) || "Bilinmeyen bir hata oluştu.";
        errorMessage.textContent = message;
    }
}

// URL'leri normalize et (trailing slash, query params vs. için)
function normalizeUrl(url) {
    try {
        const urlObj = new URL(url);
        // Trailing slash'i kaldır, query ve fragment'i koru
        urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
        return urlObj.href;
    } catch (e) {
        return url;
    }
}

// Storage değişikliklerini dinle (content script'ten gelen analiz sonuçları için)
function setupStorageListener() {
    if (chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            console.log("Storage listener tetiklendi:", changes, areaName);
            
            if (areaName === 'local') {
                // Tüm cache değişikliklerini kontrol et
                for (const key in changes) {
                    if (key.startsWith('analysis_cache_')) {
                        const changedUrl = key.replace('analysis_cache_', '');
                        const newValue = changes[key].newValue;
                        
                        console.log("Cache değişikliği tespit edildi:", changedUrl, "currentUrl:", currentUrl);
                        
                        if (newValue && newValue.data) {
                            // Eğer currentUrl yoksa veya boşsa, mevcut sekmenin URL'ini al
                            let urlToCheck = currentUrl;
                            if (!urlToCheck) {
                                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                                    if (tabs[0] && tabs[0].url) {
                                        urlToCheck = normalizeUrl(tabs[0].url);
                                        checkAndShowResult(urlToCheck, changedUrl, newValue.data);
                                    }
                                });
                            } else {
                                checkAndShowResult(urlToCheck, changedUrl, newValue.data);
                            }
                        }
                    }
                }
            }
        });
    }
}

// URL'leri karşılaştır ve sonucu göster
function checkAndShowResult(currentUrlToCheck, changedUrl, data) {
    if (resultsShown) {
        console.log("Sonuçlar zaten gösterilmiş, atlanıyor");
        return;
    }
    
    try {
        // URL'leri normalize et
        const normalizedCurrent = normalizeUrl(currentUrlToCheck);
        const normalizedChanged = normalizeUrl(changedUrl);
        
        // Domain bazlı karşılaştırma
        const currentDomain = new URL(normalizedCurrent).hostname;
        const changedDomain = new URL(normalizedChanged).hostname;
        
        console.log("URL karşılaştırması:", {
            normalizedCurrent,
            normalizedChanged,
            currentDomain,
            changedDomain,
            exactMatch: normalizedCurrent === normalizedChanged,
            domainMatch: currentDomain === changedDomain
        });
        
        // URL'ler eşleşiyorsa veya aynı domain'e aitse sonucu göster
        if (normalizedCurrent === normalizedChanged || 
            currentUrlToCheck === changedUrl ||
            currentDomain === changedDomain) {
            console.log("Storage listener: Content script'ten gelen analiz sonucu gösteriliyor:", changedUrl);
            // currentUrl'i güncelle ve URL'i göster
            currentUrl = normalizedCurrent;
            updateUrlDisplay(normalizedCurrent);
            showResult(data);
            return;
        }
    } catch (e) {
        console.error("URL karşılaştırma hatası:", e);
    }
}

// Periyodik olarak cache'i kontrol et (fallback mekanizma)
function startCacheWatcher(url) {
    // Önceki watcher'ı temizle
    if (window.cacheWatcher) {
        clearInterval(window.cacheWatcher);
        window.cacheWatcher = null;
    }
    
    let checkCount = 0;
    const maxChecks = 120; // 120 kez kontrol et (yaklaşık 60 saniye)
    
    // Normalize edilmiş URL'leri de kontrol et
    const normalizedUrl = normalizeUrl(url);
    const urlVariations = [
        url,
        normalizedUrl,
        url.replace(/\/$/, ''),
        url + '/',
        normalizedUrl.replace(/\/$/, ''),
        normalizedUrl + '/'
    ];
    
    // Domain bazlı kontrol için domain'i al
    let currentDomain = '';
    try {
        currentDomain = new URL(url).hostname;
    } catch (e) {
        // URL geçersizse domain'i boş bırak
    }
    
    window.cacheWatcher = setInterval(async () => {
        checkCount++;
        
        // Eğer sonuçlar zaten gösterildiyse durdur
        if (resultsShown) {
            clearInterval(window.cacheWatcher);
            window.cacheWatcher = null;
            return;
        }
        
        // Önce tüm URL varyasyonlarını kontrol et
        for (const urlVar of urlVariations) {
            const cachedResult = await getCachedAnalysis(urlVar);
            if (cachedResult) {
                console.log("Cache watcher: Analiz sonucu bulundu (URL varyasyonu):", urlVar);
                clearInterval(window.cacheWatcher);
                window.cacheWatcher = null;
                // currentUrl'i güncelle ve URL'i göster
                currentUrl = urlVar;
                updateUrlDisplay(urlVar);
                showResult(cachedResult);
                return;
            }
        }
        
        // Eğer URL varyasyonlarında bulunamadıysa, tüm storage'ı kontrol et (domain bazlı)
        if (currentDomain) {
            try {
                const allStorage = await chrome.storage.local.get(null);
                for (const key in allStorage) {
                    if (key.startsWith('analysis_cache_')) {
                        const cachedUrl = key.replace('analysis_cache_', '');
                        try {
                            const cachedDomain = new URL(cachedUrl).hostname;
                            if (cachedDomain === currentDomain) {
                                const cachedData = allStorage[key];
                                if (cachedData && cachedData.data && cachedData.timestamp) {
                                    const age = Date.now() - cachedData.timestamp;
                                    if (age < CACHE_DURATION) {
                                        console.log("Cache watcher: Analiz sonucu bulundu (domain bazlı):", cachedUrl);
                                        clearInterval(window.cacheWatcher);
                                        window.cacheWatcher = null;
                                        // currentUrl'i güncelle ve URL'i göster
                                        currentUrl = cachedUrl;
                                        updateUrlDisplay(cachedUrl);
                                        showResult(cachedData.data);
                                        return;
                                    }
                                }
                            }
                        } catch (e) {
                            // URL geçersizse devam et
                        }
                    }
                }
            } catch (e) {
                console.error("Cache watcher: Storage okuma hatası:", e);
            }
        }
        
        // Maksimum kontrol sayısına ulaşıldıysa durdur
        if (checkCount >= maxChecks) {
            clearInterval(window.cacheWatcher);
            window.cacheWatcher = null;
            console.log("Cache watcher: Maksimum kontrol sayısına ulaşıldı");
        }
    }, 300); // Her 300ms'de bir kontrol et (daha sık kontrol)
}

async function analyzeUrl(url) {
    currentUrl = url;
    resultsShown = false;
    
    // Önceki watcher'ı temizle
    if (window.errorWatcher) {
        clearInterval(window.errorWatcher);
        window.errorWatcher = null;
    }
    
    // App wrapper class'ını temizle
    const appWrapper = document.querySelector('.app-wrapper');
    if (appWrapper) {
        appWrapper.classList.remove('show-results', 'show-error');
    }
    
    // HEMEN error section'ı gizle (analiz başlamadan önce)
    const errorSection = document.getElementById("error");
    if (errorSection) {
        errorSection.hidden = true;
        errorSection.style.display = 'none';
        errorSection.style.visibility = 'hidden';
        errorSection.style.opacity = '0';
        errorSection.style.height = '0';
    }
    
    // URL varyasyonlarını kontrol et (cache için)
    const normalizedUrl = normalizeUrl(url);
    const urlVariations = [
        url,
        normalizedUrl,
        url.replace(/\/$/, ''),
        url + '/',
        normalizedUrl.replace(/\/$/, ''),
        normalizedUrl + '/'
    ];
    
    // Tüm URL varyasyonlarını kontrol et
    let cachedResult = null;
    for (const urlVar of urlVariations) {
        cachedResult = await getCachedAnalysis(urlVar);
        if (cachedResult) {
            console.log("Cache'den sonuç gösteriliyor:", urlVar);
            showResult(cachedResult);
            return;
        }
    }

    setStatus("Site analiz ediliyor...");
    
    // Cache watcher'ı başlat (content script'ten gelen sonuçları dinle)
    startCacheWatcher(url);

    // Önce backend'in çalışıp çalışmadığını kontrol et (background service worker üzerinden)
    chrome.runtime.sendMessage({ action: "health" })
    .then(healthCheck => {
        if (!healthCheck || !healthCheck.success) {
            throw new Error("Backend sunucusu yanıt vermiyor. Lütfen backend'i çalıştırdığınızdan emin olun.");
        }
        // Backend çalışıyor, analiz isteğini gönder (background service worker üzerinden)
        return chrome.runtime.sendMessage({
            action: "analyze",
            url: url,
            includeVisual: true
        });
    })
    .then(result => {
        if (!result || !result.success) {
            const errorMsg = result?.error || "Analiz hatası oluştu";
            throw new Error(errorMsg);
        }
        const data = result.data;
        // Sonucu cache'e kaydet
        saveCachedAnalysis(url, data);
        showResult(data);
    })
    .catch(error => {
        // Status section kontrolü - analiz devam ediyorsa hata gösterme
        const statusSec = document.getElementById("status");
        if (statusSec && !statusSec.hidden) {
            // Analiz devam ediyor, hata gösterme
            return;
        }
        
        // Sadece gerçekten hata varsa ve sonuçlar gösterilmemişse error göster
        const resultSec = document.getElementById("result");
        if (!resultsShown && (!resultSec || resultSec.hidden)) {
            console.error("Analiz hatası:", error);
            
            // Daha açıklayıcı hata mesajları
            let errorMessage = error.message || String(error);
            
            // Network hataları için özel mesajlar
            if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("ERR_CONNECTION_REFUSED")) {
                errorMessage = "Backend sunucusuna bağlanılamıyor. Lütfen:\n1. İnternet bağlantınızı kontrol edin\n2. Backend servisinin çalıştığını kontrol edin\n3. Daha sonra tekrar deneyin";
            } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
                errorMessage = "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
            } else if (errorMessage.includes("CORS")) {
                errorMessage = "CORS hatası. Backend sunucusunun CORS ayarlarını kontrol edin.";
            }
            
            showError(new Error(errorMessage));
        } else {
            // Sonuçlar gösterilmiş, sessizce atla
            console.log("Analiz tamamlandı, catch bloğundaki hata göz ardı edildi");
        }
    });
}

// Popup açıldığında hemen cache'i kontrol et (content script'ten gelen sonuçlar için)
async function checkCacheImmediately(url) {
    // currentUrl'i set et (URL gösterimi için)
    currentUrl = url;
    updateUrlDisplay(url);
    console.log("Hemen cache kontrolü yapılıyor:", url);
    
    // URL varyasyonlarını kontrol et
    const normalizedUrl = normalizeUrl(url);
    const urlVariations = [
        url,
        normalizedUrl,
        url.replace(/\/$/, ''),
        url + '/',
        normalizedUrl.replace(/\/$/, ''),
        normalizedUrl + '/'
    ];
    
    // Domain bazlı kontrol için domain'i al
    let currentDomain = '';
    try {
        currentDomain = new URL(url).hostname;
    } catch (e) {
        // URL geçersizse domain'i boş bırak
    }
    
    // Önce tüm URL varyasyonlarını kontrol et
    for (const urlVar of urlVariations) {
        const cachedResult = await getCachedAnalysis(urlVar);
        if (cachedResult) {
            console.log("Hemen cache kontrolü: Analiz sonucu bulundu (URL varyasyonu):", urlVar);
            // currentUrl'i güncelle ve URL'i göster
            currentUrl = urlVar;
            updateUrlDisplay(urlVar);
            showResult(cachedResult);
            return true;
        }
    }
    
    // Eğer URL varyasyonlarında bulunamadıysa, tüm storage'ı kontrol et (domain bazlı)
    if (currentDomain) {
        try {
            const allStorage = await chrome.storage.local.get(null);
            for (const key in allStorage) {
                if (key.startsWith('analysis_cache_')) {
                    const cachedUrl = key.replace('analysis_cache_', '');
                    try {
                        const cachedDomain = new URL(cachedUrl).hostname;
                        if (cachedDomain === currentDomain) {
                            const cachedData = allStorage[key];
                            if (cachedData && cachedData.data && cachedData.timestamp) {
                                const age = Date.now() - cachedData.timestamp;
                                if (age < CACHE_DURATION) {
                                    console.log("Hemen cache kontrolü: Analiz sonucu bulundu (domain bazlı):", cachedUrl);
                                    // currentUrl'i güncelle ve URL'i göster
                                    currentUrl = cachedUrl;
                                    updateUrlDisplay(cachedUrl);
                                    showResult(cachedData.data);
                                    return true;
                                }
                            }
                        }
                    } catch (e) {
                        // URL geçersizse devam et
                    }
                }
            }
        } catch (e) {
            console.error("Hemen cache kontrolü: Storage okuma hatası:", e);
        }
    }
    
    return false;
}

function init() {
    // Storage listener'ı kur (content script'ten gelen analiz sonuçları için)
    setupStorageListener();
    
    const retryButton = document.getElementById("retry-button");
    if (retryButton) {
        retryButton.addEventListener("click", () => {
            if (currentUrl) {
                analyzeUrl(currentUrl);
            } else {
                location.reload();
            }
        });
    }

    if (!chrome?.tabs) {
        showError(new Error("Tarayıcı sekme bilgisine erişilemiyor. Lütfen eklentiyi yeniden yükleyin."));
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
        if (chrome.runtime.lastError) {
            showError(chrome.runtime.lastError);
            return;
        }

        const activeTab = tabs[0];
        if (!activeTab || !activeTab.url) {
            showError(new Error("Geçerli bir sekme bulunamadı. Lütfen bir web sayfası açın."));
            return;
        }

        try {
            const url = new URL(activeTab.url);
            const protocol = url.protocol.toLowerCase();
            
            const invalidProtocols = ["chrome:", "edge:", "about:", "moz-extension:", "chrome-extension:", "edge-extension:"];
            
            if (invalidProtocols.some(p => protocol.startsWith(p))) {
                showError(new Error("Bu sayfa analiz edilemez. Lütfen bir web sitesine gidin (örn: google.com, youtube.com)."));
                return;
            }
            
            if (protocol !== "http:" && protocol !== "https:") {
                showError(new Error(`Bu protokol desteklenmiyor: ${protocol}. Lütfen HTTP veya HTTPS kullanan bir web sitesine gidin.`));
                return;
            }
        } catch (e) {
            showError(new Error("Geçersiz URL formatı."));
            return;
        }
        
        // URL'i normalize et
        const normalizedUrl = normalizeUrl(activeTab.url);
        
        // currentUrl'i hemen set et (URL gösterimi için)
        currentUrl = normalizedUrl;
        updateUrlDisplay(normalizedUrl);
        
        // ÖNCE hemen cache'i kontrol et (content script'ten gelen sonuçlar için)
        const cacheFound = await checkCacheImmediately(normalizedUrl);
        
        // Eğer cache'de bulunamadıysa analiz başlat
        if (!cacheFound) {
            analyzeUrl(normalizedUrl);
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
