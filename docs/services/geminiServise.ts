import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisStatus } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY ortam değişkeni ayarlanmadı");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    risk_score: {
      type: Type.INTEGER,
      description: "0 ile 100 arasında sayısal bir risk puanı. 0 tamamen güvenli, 100 aşırı tehlikeli anlamına gelir.",
    },
    status: {
      type: Type.STRING,
      enum: [AnalysisStatus.Güvenli, AnalysisStatus.Şüpheli, AnalysisStatus.Tehlikeli],
      description: "Risk puanına dayalı genel durum.",
    },
    rules_triggered: {
      type: Type.ARRAY,
      description: "URL analizi tarafından tetiklenen sezgisel kuralların bir listesi.",
      items: {
        type: Type.OBJECT,
        properties: {
          rule: {
            type: Type.STRING,
            description: "Tetiklenen parametrenin/özelliğin Türkçe adı.",
          },
          description: {
            type: Type.STRING,
            description: "Karşılanan spesifik durumun Türkçe açıklaması.",
          },
          points: {
            type: Type.INTEGER,
            description: "Bu kuralın puana katkıda bulunduğu puan sayısı.",
          },
          rationale: {
            type: Type.STRING,
            description: "Bu kuralın neden bir risk belirttiğinin arkasındaki mantığın Türkçe açıklaması."
          }
        },
        required: ["rule", "description", "points", "rationale"],
      },
    },
  },
  required: ["risk_score", "status", "rules_triggered"],
};

export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const prompt = `
    Sen 'Guardian', proaktif bir URL tehdit analiz motorusun. Görevin, verilen URL'yi bir dizi sezgisel kurala göre analiz etmek ve bir risk puanı döndürmektir.
    Web'de gezinme veya URL'ye canlı olarak erişme. Analizini URL'nin yapısına ve alan adları, TLD'ler, SSL sertifikaları ve yaygın oltalama kalıpları hakkındaki mevcut bilgilerine dayanarak yap.

    **Sezgisel Kurallar ve Puan Sistemi:**
    - **Domain Yaşı:** Bilgin alan adının çok yeni olduğunu (örneğin, son 15 gün içinde kaydedildiğini) gösteriyorsa +30 puan.
    - **TLD (Alan Adı Uzantısı):** .xyz, .top, .work, .zip, .tk gibi genellikle spam/oltalama ile ilişkilendirilen TLD'ler için +15 puan.
    - **SSL Sertifikası:** Site, özellikle diğer risk faktörleriyle birleştiğinde, daha güvenilir bir Kurumsal Doğrulanmış (OV) veya Genişletilmiş Doğrulama (EV) sertifikası yerine muhtemelen ücretsiz, alan adı doğrulamalı (DV) bir sertifika (Let's Encrypt gibi) kullanıyorsa +10 puan.
    - **Marka Taklidi (Typo-squatting):** Popüler markaların ince yazım hataları için +40 puan (örneğin, 'miicrosoft.com', büyük I harfi ile 'paypaI.com'). Kavramsal olarak Levenshtein mesafesi mantığını kullan.
    - **URL Anahtar Kelimeleri:** Yol veya alt alan adları 'login', 'verify', 'secure', 'bank', 'hesap', 'update', 'password' gibi hassas anahtar kelimeler içeriyorsa +20 puan.
    - **Punycode (Homograph Saldırısı):** URL, tanınmış alan adlarındaki karakterleri taklit eden ASCII olmayan karakterleri temsil etmek için Punycode kullanıyorsa +100 puan (örneğin, Kiril 'o' harfi ile 'gоogle.com' için 'xn--oogle-wmc.com'). Bu acil bir yüksek risk göstergesidir.
    - **URL Uzunluğu:** URL aşırı uzunsa (> 75 karakter), bu gerçek alan adını gizlemek için bir taktik olabileceğinden +5 puan.
    - **Domain'de Tire:** Ana alan adı bir tire içeriyorsa (örneğin, 'your-bank-online.com'), bu oltalama sitelerinde yaygın bir kalıp olduğundan +10 puan.

    **Analiz Edilecek URL:** "${url}"

    **Talimatlar:**
    1.  URL'yi yukarıdaki kurallara göre analiz et.
    2.  Tetiklenen tüm kurallardan gelen puanları toplayarak toplam bir 'risk_score' hesapla. Puanı 100 ile sınırla.
    3.  Bu eşiklere göre 'status' belirle:
        - 0-20 puan: '${AnalysisStatus.Güvenli}'
        - 21-69 puan: '${AnalysisStatus.Şüpheli}'
        - 70+ puan: '${AnalysisStatus.Tehlikeli}'
    4.  'rules_triggered' dizisini SADECE bu spesifik URL tarafından gerçekten tetiklenen kurallarla doldur. Bir kural tetiklenmezse, onu dahil etme.
    5.  ÖNEMLİ: Yanıtındaki 'rule', 'description' ve 'rationale' gibi tüm metin alanları MUTLAKA Türkçe olmalıdır.
    6.  Yanıtını kesinlikle şema tarafından tanımlanan JSON formatında sağla.
    `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as AnalysisResult;
    return result;
  } catch (error) {
    console.error("URL analiz edilirken Gemini ile hata oluştu:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("Yapay zeka geçerli bir analiz döndüremedi. Lütfen farklı bir URL deneyin.");
    }
    throw new Error("Analiz alınamadı. Yapay zeka servisi geçici olarak kullanılamıyor olabilir.");
  }
};