'use client';

import { useState } from 'react';
import { SearchResult } from './SearchResult';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Mock response for testing
const mockResponse = {
  answer: "Based on the provided documents, the key benefits of regular exercise include improved cardiovascular health, enhanced mental well-being, better sleep quality, and increased energy levels. Regular physical activity helps strengthen the heart, reduce stress and anxiety, regulate sleep patterns, and boost overall stamina.",
  sources: [
    {
      content: "Regular exercise has been shown to significantly improve cardiovascular health by strengthening the heart muscle and improving circulation.",
      metadata: {
        filename: "health_benefits.pdf",
        page: 12
      }
    },
    {
      content: "Studies indicate that physical activity releases endorphins, which help reduce stress and anxiety while improving overall mental well-being.",
      metadata: {
        filename: "mental_health.pdf",
        page: 5
      }
    }
  ]
};

export function SearchSection() {
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<typeof mockResponse | null>(null);
  const hasSearched = searchResult !== null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastQuery(query);
      setSearchResult(mockResponse);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (!hasSearched) {
    return (
      <div className="h-[100vh] flex flex-col items-center justify-center -mt-16">
        <div className="max-w-3xl w-full space-y-6 text-center px-4">
          <h1 className="text-4xl font-bold text-gray-900">Document Search</h1>
          <p className="text-lg text-gray-600">Ask questions about your documents</p>
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto w-full">
            <div className="flex gap-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your documents..."
                className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                rows={1}
                style={{ height: 'auto', minHeight: '44px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <Button 
                type="submit" 
                disabled={isSearching}
                className="px-6 self-start mt-1"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Search Results */}
      <div className="flex-1 py-4">
        <SearchResult 
          query={lastQuery} 
          response={searchResult}
        />
      </div>

      {/* Search Form at Bottom */}
      <div className="sticky bottom-0 bg-gray-50 py-4 border-t">
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto w-full px-4">
          <div className="flex items-start gap-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your documents..."
              className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <Button 
              type="submit" 
              disabled={isSearching}
              className="px-6 mt-1"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}