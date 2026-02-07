import React, { useState, useCallback, useEffect } from 'react';
import { ShieldIcon, LoadingSpinnerIcon } from './components/icons';
import { analyzeUrl } from './services/geminiService';
import type { AnalysisResult } from './types';
import AnalysisResultComponent from './components/AnalysisResult';
import History from './components/History';
import HowItWorks from './components/HowItWorks';

const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('analysisHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      setHistory([]);
    }
  }, []);

  const updateHistory = (newUrl: string) => {
    const updatedHistory = [newUrl, ...history.filter(h => h !== newUrl)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('analysisHistory');
  };

  const startAnalysis = useCallback(async (urlToAnalyze: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setAnalyzedUrl(urlToAnalyze);
    updateHistory(urlToAnalyze);

    try {
      const analysisResult = await analyzeUrl(urlToAnalyze);
      setResult(analysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [history]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Lütfen analiz etmek için bir URL girin.");
      return;
    }
    
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
    }
    startAnalysis(formattedUrl);
  };

  const handleHistoryClick = (urlFromHistory: string) => {
    setUrl(urlFromHistory);
    startAnalysis(urlFromHistory);
  };

  const SkeletonLoader = () => (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="bg-gray-200 h-40 rounded-2xl"></div>
        <div className="bg-gray-200 h-20 rounded-2xl"></div>
        <div className="pt-4 space-y-4">
            <div className="h-8 w-1/3 mx-auto bg-gray-200 rounded-lg"></div>
            <div className="bg-gray-200 h-64 rounded-2xl"></div>
        </div>
    </div>
);


  return (
    <div className="min-h-screen font-sans text-text-primary">
      <header className="py-10 bg-gradient-to-r from-header-from to-header-to">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShieldIcon className="mx-auto" />
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-white animate-pulseGentle">
            Güvenli İnternet Asistanı
          </h1>
          <p className="mt-2 max-w-2xl mx-auto text-lg text-indigo-100">
            Oltalama Saldırılarına Karşı Proaktif Koruma
          </p>
        </div>
      </header>

      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-xl rounded-2xl p-4 sm:p-6 sticky top-4 z-10 backdrop-blur-sm bg-opacity-80">
                <form onSubmit={handleFormSubmit}>
                    <div className="relative flex flex-col sm:flex-row items-center gap-3">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => { setUrl(e.target.value); setError(null); }}
                            placeholder="Analiz edilecek URL'i yapıştırın (örn: example.com)"
                            className="w-full bg-gray-100 p-4 text-base text-text-primary placeholder-gray-400 rounded-xl border-2 border-transparent focus:border-brand-primary focus:ring-0 transition pr-12"
                            disabled={isLoading}
                        />
                        {isLoading && <LoadingSpinnerIcon className="absolute right-40 sm:right-36 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-primary"/>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full sm:w-auto flex-shrink-0 bg-brand-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Analiz Et
                        </button>
                    </div>
                </form>
            </div>
             {error && <div className="mt-4 text-center bg-status-danger/20 text-status-danger font-semibold px-4 py-3 rounded-xl" role="alert">{error}</div>}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            {history.length > 0 && (
                <History 
                    history={history} 
                    onHistoryClick={handleHistoryClick}
                    onClearHistory={clearHistory}
                />
            )}
        </div>

        <div className="mt-12">
            {isLoading ? <SkeletonLoader /> : null}
            {!isLoading && result && analyzedUrl ? <AnalysisResultComponent result={result} analyzedUrl={analyzedUrl} /> : null}
            {!isLoading && !result && <HowItWorks />}
        </div>
      </main>
    </div>
  );
};

export default App;