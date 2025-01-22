'use client';

import { useState } from 'react';
import { User, Bot } from 'lucide-react';
import { TypingAnimation } from './TypingAnimation';

interface SearchResultProps {
  query: string;
  response: {
    answer: string;
    sources: Array<{
      content: string;
      filename: string;
      score: number;
    }>;
  };
}

export function SearchResult({ query, response }: SearchResultProps) {
  const [showSources, setShowSources] = useState(false);

  if (!query) return null;

  return (
    <div className="space-y-4 max-w-3xl mx-auto px-4">
      {/* User Query */}
      <div className="bg-white p-6 rounded-lg">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-900">{query}</p>
          </div>
        </div>
      </div>

      {/* AI Response */}
      {response && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 space-y-4">
              {/* Main Answer with Typing Animation */}
              <div className="prose max-w-none">
                <p className="text-gray-900">
                  <TypingAnimation 
                    text={response.answer}
                    onComplete={() => setShowSources(true)}
                  />
                </p>
              </div>

              {/* Sources - Show immediately after typing is complete */}
              {showSources && response.sources.length > 0 && (
                <div className="mt-4 animate-fade-in">
                  <p className="text-sm font-medium text-gray-700 mb-2">Sources:</p>
                  <div className="space-y-2">
                    {response.sources.map((source, index) => (
                      <div key={index} className="bg-white p-3 rounded border text-sm">
                        <p className="font-medium text-gray-900 mb-1">
                          {source.filename}
                        </p>
                        <p className="text-gray-600">{source.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 