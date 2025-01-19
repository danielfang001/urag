'use client';

import { User, Bot } from 'lucide-react';

interface SearchResultProps {
  query: string;
  response: {
    answer: string;
    sources: Array<{
      content: string;
      metadata: {
        filename: string;
        page?: number;
      };
    }>;
  } | null;
}

export function SearchResult({ query, response }: SearchResultProps) {
  if (!query) return null;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
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
              {/* Main Answer */}
              <div className="prose max-w-none">
                <p className="text-gray-900">{response.answer}</p>
              </div>

              {/* Sources */}
              {response.sources.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Sources:</p>
                  <div className="space-y-2">
                    {response.sources.map((source, index) => (
                      <div key={index} className="bg-white p-3 rounded border text-sm">
                        <p className="font-medium text-gray-900 mb-1">
                          {source.metadata.filename}
                          {source.metadata.page && ` (Page ${source.metadata.page})`}
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