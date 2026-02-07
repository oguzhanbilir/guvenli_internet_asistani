import React from 'react';
import { ClockIcon, TrashIcon } from './icons';

interface HistoryProps {
    history: string[];
    onHistoryClick: (url: string) => void;
    onClearHistory: () => void;
}

const History: React.FC<HistoryProps> = ({ history, onHistoryClick, onClearHistory }) => {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 animate-fadeInUp">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <ClockIcon className="w-6 h-6 text-text-secondary"/>
                Geçmiş Aramalar
            </h2>
            <button
                onClick={onClearHistory}
                className="text-sm font-semibold text-gray-500 hover:text-status-danger flex items-center gap-1 transition-colors"
                aria-label="Geçmişi Temizle"
            >
                <TrashIcon className="w-4 h-4" />
                Temizle
            </button>
        </div>
        <div className="space-y-2">
            {history.map((item, index) => (
                <button
                    key={index}
                    onClick={() => onHistoryClick(item)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors text-text-secondary truncate"
                >
                    {item}
                </button>
            ))}
        </div>
    </div>
  );
};

export default History;