'use client';

import { User, Bot } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchResponse } from '@/api';

interface SearchResultProps {
  query: string;
  response: SearchResponse;
  isHistory?: boolean;
}

export function SearchResult({ query, response, isHistory = false }: SearchResultProps) {
  const [displayedAnswer, setDisplayedAnswer] = useState(isHistory ? response.answer || '' : '');
  const [isTyping, setIsTyping] = useState(!isHistory);
  const [selectedSource, setSelectedSource] = useState<{
    content: string;
    filename: string;
  } | null>(null);

  const topSources = [...response.sources]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const truncateText = (text: string) => {
    if (text.length <= 150) return text;
    return text.slice(0, 150) + '...';
  };

  useEffect(() => {
    // If it's a history message or no answer, display immediately
    if (isHistory || !response.answer) {
      setDisplayedAnswer(response.answer || '');
      setIsTyping(false);
      return;
    }

    // Reset for new messages
    setDisplayedAnswer('');
    setIsTyping(true);

    const answer = response.answer;
    let currentIndex = 0;
    let mounted = true;

    const timer = setInterval(() => {
      if (!mounted) return;

      if (currentIndex < answer.length) {
        setDisplayedAnswer(answer.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 20);

    return () => {
      mounted = false;
      clearInterval(timer);
      // Ensure full answer is displayed when unmounting
      setDisplayedAnswer(answer);
      setIsTyping(false);
    };
  }, [response.answer, isHistory]);

  return (
    <div className="space-y-6">
      {/* Question - User message on the right */}
      <div className="flex justify-end">
        <div className="flex flex-row-reverse gap-4 p-4 bg-blue-500 text-white rounded-lg items-start max-w-[80%]">
          <User className="h-6 w-6 text-white flex-shrink-0" />
          <p className="text-white whitespace-pre-wrap">{query}</p>
        </div>
      </div>

      {/* Answer - Bot message on the left */}
      <div className="flex justify-start">
        <div className="flex gap-4 p-4 bg-gray-100 rounded-lg items-start max-w-[80%]">
          <Bot className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div className="space-y-4 flex-1">
            <p className="text-gray-800 whitespace-pre-wrap min-h-[1.5rem]">
              {displayedAnswer}
              {isTyping && <span className="animate-pulse">▊</span>}
            </p>

            {/* Sources Section - Top 2 only */}
            {!isTyping && topSources.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Sources (showing top 2):
                </h3>
                <div className="space-y-2">
                  {topSources.map((source, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg text-sm text-gray-700">
                      <div className="flex justify-between items-start mb-1">
                        <button 
                          onClick={() => setSelectedSource(source)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {source.filename}
                        </button>
                        <span className="text-xs text-gray-500">
                          Score: {source.score.toFixed(2)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{truncateText(source.content)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source Preview Dialog */}
      <Dialog open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedSource?.filename}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-lg">
              {selectedSource?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 