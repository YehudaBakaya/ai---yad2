import React, { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { aiAPI } from '../services/api';

export default function PriceAnalysis({ title, category, price, condition }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const analyzePrice = async () => {
      try {
        const response = await aiAPI.analyzePrice({
          title,
          category,
          price,
          condition
        });
        setAnalysis(response.data);
      } catch (err) {
        console.error('Price analysis error:', err);
        setError('לא הצלחנו לנתח את המחיר');
      } finally {
        setLoading(false);
      }
    };

    analyzePrice();
  }, [title, category, price, condition]);

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const verdictColor = {
    'עסקה טובה': 'border-green-500 bg-green-900/20',
    'מחיר הוגן': 'border-blue-500 bg-blue-900/20',
    'קצת יקר': 'border-yellow-500 bg-yellow-900/20',
    'יקר מדי': 'border-red-500 bg-red-900/20'
  };

  const verdictIcon = {
    'עסקה טובה': <TrendingDown className="text-green-400" size={24} />,
    'מחיר הוגן': <Minus className="text-blue-400" size={24} />,
    'קצת יקר': <TrendingUp className="text-yellow-400" size={24} />,
    'יקר מדי': <TrendingUp className="text-red-400" size={24} />
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">📊 ניתוח מחיר בשוק</h3>

      {/* Verdict */}
      <div className={`border-l-4 rounded-lg p-4 mb-6 ${verdictColor[analysis.verdict] || verdictColor['מחיר הוגן']}`}>
        <div className="flex items-center gap-3 mb-2">
          {verdictIcon[analysis.verdict]}
          <span className="text-2xl font-bold text-white">{analysis.verdict}</span>
        </div>
        <p className="text-gray-300">{analysis.explanation}</p>
      </div>

      {/* Market Data */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-400 mb-4">טווח המחירים בשוק</h4>
        
        <div className="space-y-3">
          {/* Min */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">מחיר מינימלי</span>
            <span className="font-bold text-white">₪{analysis.market.min.toLocaleString()}</span>
          </div>
          
          {/* Average */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">מחיר ממוצע</span>
            <span className="font-bold text-blue-400">₪{analysis.market.avg.toLocaleString()}</span>
          </div>
          
          {/* Max */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">מחיר מקסימלי</span>
            <span className="font-bold text-white">₪{analysis.market.max.toLocaleString()}</span>
          </div>
        </div>

        {/* Price Bar */}
        <div className="mt-4 bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-red-500"
            style={{
              width: '100%'
            }}
          ></div>
        </div>
      </div>

      {/* Your Price Indicator */}
      <div className="bg-slate-700 rounded-lg p-3">
        <div className="text-sm text-gray-400 mb-1">המחיר שלך</div>
        <div className="text-2xl font-bold text-white">₪{price.toLocaleString()}</div>
        <div className="text-xs text-gray-500 mt-1">
          {analysis.recommendation === 'raise' && '👆 שקול הגדלה'}
          {analysis.recommendation === 'lower' && '👇 שקול הנמכה'}
          {analysis.recommendation === 'keep' && '✅ המחיר טוב'}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        ניתוח AI עם דיוק של {Math.round(analysis.confidence * 100)}%
      </div>
    </div>
  );
}
