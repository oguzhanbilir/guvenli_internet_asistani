# Güvenli İnternet Asistanı

Bu depo, 2204-A TÜBİTAK Lise Öğrencileri Araştırma Projeleri Yarışması kapsamında geliştirilen **Güvenli İnternet Asistanı** projesine ait örnek veri paketlerini ve referans veri setlerini içermektedir.

## Proje Özeti
Güvenli İnternet Asistanı, oltalama (phishing) saldırılarını tespit etmek amacıyla **teknik, dilsel ve görsel analiz katmanlarını** bir araya getiren hibrit bir güvenlik sistemidir. Sistem; URL yapısı analizi, sosyal mühendislik içerik tespiti ve görsel taklit algılama yöntemlerini birlikte kullanarak hem geleneksel hem de zero-day saldırılara karşı koruma sağlamayı hedeflemektedir.

## Depo İçeriği

Bu GitHub deposu, sistemin çalışma mantığını şeffaf biçimde göstermek amacıyla aşağıdaki örnek veri dosyalarını içermektedir:

- **brand_data.json**  
  Görsel analiz katmanında kullanılan, güvenilir markalara ait logo özetleri (pHash) ve baskın renk paletlerini içeren referans veri seti.

- **request_response_sample.json**  
  Bir URL analiz isteği sonrasında sistem tarafından üretilen örnek istek–yanıt veri paketini göstermektedir. Bu dosya, analiz sürecinin çıktılarının nasıl yapılandırıldığını incelemek amacıyla paylaşılmıştır.

## Kullanım Amacı
Bu depodaki dosyalar;
- Akademik şeffaflığın sağlanması,
- Analiz sürecinin tekrarlanabilirliğinin gösterilmesi,
- Projenin değerlendirme sürecinde incelenebilmesi

amacıyla paylaşılmıştır.

## Not
Bu depo, tam sistemin çalıştırılabilir kaynak kodunu değil; **örnek veri paketlerini ve referans veri yapılarını** içermektedir. Sistem kurulumu ve çalıştırılmasına ilişkin ayrıntılı bilgiler proje raporunda yer almaktadır.


