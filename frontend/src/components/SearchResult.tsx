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
import { TypingAnimation } from './TypingAnimation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SearchResultProps {
  query: string;
  response: SearchResponse;
  isHistory?: boolean;
}

export function SearchResult({ query, response, isHistory = false }: SearchResultProps) {
  const [displayedAnswer, setDisplayedAnswer] = useState(isHistory ? response.answer : '');
  const [isTyping, setIsTyping] = useState(!isHistory);
  const [showSources, setShowSources] = useState(false);
  const [selectedSource, setSelectedSource] = useState<{
    content: string;
    filename: string;
  } | {
    text: string;
    title: string;
    url: string;
    highlights: string[];
  } | null>(null);

  const topSources = [...(response.sources || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const topWebSources = [...(response.web_sources || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  useEffect(() => {
    if (!isHistory && response.answer) {
      let currentIndex = 0;
      let mounted = true;
      const hasAnySources = (response.sources?.length || 0) > 0 || (response.web_sources?.length || 0) > 0;
      setShowSources(false);

      const timer = setInterval(() => {
        if (!mounted) return;

        if (currentIndex < response.answer.length) {
          setDisplayedAnswer(response.answer.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          if (hasAnySources) {
            setTimeout(() => {
              if (mounted) {
                setShowSources(true);
              }
            }, 100);
          }
          clearInterval(timer);
        }
      }, 20);

      return () => {
        mounted = false;
        clearInterval(timer);
        setDisplayedAnswer(response.answer);
        setIsTyping(false);
        if (hasAnySources) {
          setShowSources(true);
        }
      };
    } else if (isHistory) {
      const hasAnySources = (response.sources?.length || 0) > 0 || (response.web_sources?.length || 0) > 0;
      setShowSources(hasAnySources);
    }
  }, [response.answer, isHistory]);

  const truncateText = (text: string) => {
    if (text.length <= 150) return text;
    return text.slice(0, 150) + '...';
  };

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
            <div className="markdown text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayedAnswer}
              </ReactMarkdown>
              {isTyping && <span className="animate-pulse">▊</span>}
            </div>

            {/* Document Sources Section */}
            {showSources && topSources.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Document Sources (Top 2):
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
                          Score: {source.score?.toFixed(2) ?? 'N/A'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{truncateText(source.content)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Web Sources Section */}
            {showSources && topWebSources.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Web Sources (Top 2):
                </h3>
                <div className="space-y-2">
                  {topWebSources.map((source, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg text-sm text-gray-700">
                      <div className="flex justify-between items-start mb-1">
                        <a 
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {source.title}
                        </a>
                        <span className="text-xs text-gray-500">
                          Score: {source.score?.toFixed(2) ?? 'N/A'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{truncateText(source.text)}</p>
                      {source.highlights.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Highlight:</strong> {source.highlights[0]}
                        </div>
                      )}
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
            <DialogTitle>
              {selectedSource && ('filename' in selectedSource 
                ? selectedSource.filename 
                : selectedSource.title)}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-lg">
              {selectedSource && ('content' in selectedSource 
                ? selectedSource.content 
                : selectedSource.text)}
            </pre>
            {selectedSource && 'url' in selectedSource && (
              <a 
                href={selectedSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-blue-600 hover:underline block"
              >
                Open in new tab
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 