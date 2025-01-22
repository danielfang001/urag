'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, User, Bot } from "lucide-react";
import { api } from '@/api';
import { useToast } from "@/hooks/use-toast";
import { SearchResult } from '@/components/SearchResult';
import { SearchResponse } from '@/types/search';

export function SearchSection() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResponse = await api.searchDocuments(query);
      setResponse(searchResponse);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search documents",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <form onSubmit={handleSearch} className="sticky top-4 z-10 bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="flex items-start gap-2 max-w-3xl mx-auto">
          <textarea
            value={query}
            onChange={handleInput}
            placeholder="Ask anything about your documents..."
            className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
            rows={1}
            style={{ height: 'auto', minHeight: '44px' }}
          />
          <Button 
            type="submit" 
            disabled={isSearching}
            className="px-6"
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

      {response && (
        <SearchResult 
          query={query}
          response={response}
        />
      )}
    </div>
  );
}