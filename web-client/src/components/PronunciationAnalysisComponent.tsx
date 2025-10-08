import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PronunciationAnalysisProps {
  analysis: {
    overall_score: number;
    cefr_score: { level?: string };
    word_analysis: Array<{
      word: string;
      quality_score: number;
      phones: Record<string, {
        quality_score: number;
        sound_most_like?: string;
      }>;
      ai_feedback?: {
        cheering_message: string;
        feedback: string;
      };
    }>;
    metadata?: {
      raw_api_response?: unknown;
    };
  };
}

const PronunciationAnalysisComponent: React.FC<PronunciationAnalysisProps> = ({ analysis }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    return '💪';
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Overall Score */}
      <div className="grid grid-cols-2 gap-4">
        <Card variant="neobrutalism" className="text-center">
          <CardContent className="py-4">
            <div className="text-2xl font-black mb-2">
              {getScoreEmoji(analysis.overall_score)} {analysis.overall_score}%
            </div>
            <div className="text-sm font-bold">Overall Score</div>
          </CardContent>
        </Card>
        
        <Card variant="neobrutalism" className="text-center">
          <CardContent className="py-4">
            <div className="text-2xl font-black mb-2">
              🎯 {analysis.cefr_score.level || 'N/A'}
            </div>
            <div className="text-sm font-bold">CEFR Level</div>
          </CardContent>
        </Card>
      </div>

      {/* Word Analysis */}
      <Card variant="neobrutalism">
        <CardHeader>
          <CardTitle className="text-lg">💬 Word-by-Word Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.word_analysis.map((word, index) => (
              <div key={index} className="border-l-4 border-black pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold">{word.word}</span>
                  <span className={`neobrutalism-badge ${getScoreColor(word.quality_score)}`}>
                    {word.quality_score}/100
                  </span>
                </div>
                
                {/* AI Feedback */}
                {word.ai_feedback && (
                  <div className="bg-blue-100 border-2 border-black p-3 mb-2">
                    <div className="font-bold text-green-700 mb-1">
                      {word.ai_feedback.cheering_message}
                    </div>
                    <div className="text-sm text-gray-700">
                      {word.ai_feedback.feedback}
                    </div>
                  </div>
                )}
                
                {/* Phone Analysis */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(word.phones).map(([phone, phoneData]) => (
                    <div 
                      key={phone}
                      className={`text-center p-2 border-2 border-black ${getScoreColor(phoneData.quality_score)}`}
                    >
                      <div className="font-bold text-sm">{phone}</div>
                      <div className="text-xs">{phoneData.quality_score}/100</div>
                      {phoneData.sound_most_like && (
                        <div className="text-xs text-gray-600">
                          → {phoneData.sound_most_like}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information (collapsible) */}
      {analysis.metadata?.raw_api_response && (
        <details className="mt-4">
          <summary className="cursor-pointer font-bold text-sm">
            🔍 Technical Details (Advanced)
          </summary>
          <Card variant="neobrutalism" className="mt-2">
            <CardContent>
              <pre className="text-xs overflow-x-auto bg-gray-100 p-2 border-2 border-black">
                {JSON.stringify(analysis.metadata.raw_api_response, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </details>
      )}
    </div>
  );
};

export default PronunciationAnalysisComponent;
