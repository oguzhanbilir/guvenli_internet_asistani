import React from 'react';
import { CpuChipIcon } from './icons';

const rules = [
    { name: 'Domain Yaşı', points: '+30 Puan', description: 'Yeni kaydedilen alan adları genellikle daha risklidir.' },
    { name: 'TLD (Alan Adı Uzantısı)', points: '+15 Puan', description: '`.xyz`, `.zip` gibi uzantılar sıklıkla kötüye kullanılır.' },
    { name: 'SSL Sertifikası', points: '+10 Puan', description: 'Kurumsal doğrulama olmayan sertifikalar daha az güvenilirdir.' },
    { name: 'Marka Benzerliği', points: '+40 Puan', description: '`paypaI.com` gibi yazım hataları aldatmaca olabilir.' },
    { name: 'URL Anahtar Kelimeleri', points: '+20 Puan', description: '`login`, `secure` gibi kelimeler kimlik avı belirtisi olabilir.' },
    { name: 'Punycode (Homograph)', points: '+100 Puan', description: 'Görsel olarak benzer karakterler kullanmak en tehlikeli yöntemdir.' },
    { name: 'URL Uzunluğu', points: '+5 Puan', description: 'Çok uzun URL\'ler genellikle adresi gizlemek için kullanılır.' },
    { name: 'Domain\'de Tire (-)', points: '+10 Puan', description: '`banka-giris.com` gibi desenler oltalama sitelerinde yaygındır.' },
];

const HowItWorks: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
                <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-2 text-3xl font-extrabold text-text-primary sm:text-4xl">
                    Sezgisel Analiz Motoru
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">
                    Guardian, bir sitenin geçmişine değil, anlık yapısına ve davranış kalıplarına bakarak proaktif bir tehdit analizi yapar. İşte analiz motorumuzun dikkate aldığı bazı kritik parametreler:
                </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {rules.map((rule) => (
                    <div key={rule.name} className="bg-white shadow-md rounded-lg p-6 transform hover:scale-105 transition-transform duration-300">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-text-primary">{rule.name}</h3>
                            <span className="text-sm font-bold text-status-danger">{rule.points}</span>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary">{rule.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HowItWorks;