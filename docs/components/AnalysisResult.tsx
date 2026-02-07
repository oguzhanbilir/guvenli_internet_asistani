import React from 'react';
import type { AnalysisResult } from '../types';
import { AnalysisStatus } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, NoSymbolIcon, GlobeAltIcon, ChartBarIcon, WrenchScrewdriverIcon } from './icons';

interface AnalysisResultProps {
  result: AnalysisResult;
  analyzedUrl: string;
}

const statusConfig = {
  [AnalysisStatus.Güvenli]: {
    badgeClasses: 'bg-status-safe/10 text-status-safe',
    progressBg: 'bg-status-safe',
    icon: <CheckCircleIcon className="w-5 h-5" />,
    text: 'Güvenli',
    riskLevelText: 'DÜŞÜK RİSK'
  },
  [AnalysisStatus.Şüpheli]: {
    badgeClasses: 'bg-status-suspicious/10 text-status-suspicious',
    progressBg: 'bg-status-suspicious',
    icon: <ExclamationTriangleIcon className="w-5 h-5" />,
    text: 'Şüpheli',
    riskLevelText: 'ORTA RİSK'
  },
  [AnalysisStatus.Tehlikeli]: {
    badgeClasses: 'bg-status-danger/10 text-status-danger',
    progressBg: 'bg-status-danger',
    icon: <NoSymbolIcon className="w-5 h-5" />,
    text: 'Tehlikeli',
    riskLevelText: 'YÜKSEK RİSK'
  },
};

const AnalysisResultComponent: React.FC<AnalysisResultProps> = ({ result, analyzedUrl }) => {
  const config = statusConfig[result.status];
  const score = 100 - result.risk_score;

  return (
    <div className="animate-fadeInUp space-y-6 max-w-4xl mx-auto">
      {/* Score Card */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-text-secondary tracking-wide">GÜVEN PUANI</p>
            <div className="flex items-baseline mt-2">
              <span className="text-5xl font-bold text-brand-primary">{score}</span>
              <span className="text-xl font-medium text-text-secondary">/100</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${config.badgeClasses}`}>
            {config.icon}
            <span>{config.text}</span>
          </div>
        </div>
        <div className="mt-4 bg-gray-200 rounded-full h-2.5">
          <div 
             className={`${config.progressBg} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
             style={{ width: `${score}%` }}
           ></div>
        </div>
      </div>

      {/* Analyzed URL Card */}
      <div className="bg-white shadow-lg rounded-2xl p-4 flex items-center gap-4">
        <div className="flex-shrink-0 bg-gray-100 p-3 rounded-full">
            <GlobeAltIcon className="w-6 h-6 text-text-secondary" />
        </div>
        <div>
            <p className="text-sm font-semibold text-text-secondary tracking-wide">ANALİZ EDİLEN URL</p>
            <p className="text-lg font-medium text-text-primary break-all">{analyzedUrl}</p>
        </div>
      </div>

      {/* Katman Analizi Section */}
       {result.rules_triggered.length > 0 && (
        <div className="pt-4">
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-3 text-text-primary">
                    <ChartBarIcon className="w-6 h-6 text-text-secondary" />
                    Katman Analizi
                </h2>
            </div>
            <div className={`bg-white shadow-lg rounded-2xl p-6 border-l-4 ${config.progressBg.replace('bg-','border-')}`}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-3 text-lg text-text-primary">
                  <WrenchScrewdriverIcon className="w-5 h-5 text-text-secondary" />
                  Teknik Analiz
                </h3>
                <div className={`px-3 py-1 text-xs font-bold rounded-full ${config.badgeClasses}`}>
                  {config.riskLevelText}
                </div>
              </div>

              <p className="text-text-secondary mt-1 mb-4">URL'de tespit edilen risk faktörleri ve puanları aşağıdadır:</p>
              <div className="space-y-4 border-t border-gray-200 pt-4">
                {result.rules_triggered.map((rule, index) => (
                  <div key={index} className="flex justify-between items-start gap-4">
                      <div className="flex-grow">
                        <p className="font-semibold text-text-primary">{rule.rule}: <span className="text-text-secondary font-normal">{rule.description}</span></p>
                        <p className="text-sm text-gray-500 mt-1 italic">"{rule.rationale}"</p>
                      </div>
                      <span className={`text-lg font-bold ${config.badgeClasses.split(' ')[1]} whitespace-nowrap`}>+{rule.points}</span>
                  </div>
                ))}
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResultComponent;