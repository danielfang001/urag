'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { api } from '@/api';
import { useDebounce } from '@/hooks/useDebounce';

interface ChatSearchProps {
  onSelectChat: (chatId: string) => void;
}

export function ChatSearch({ onSelectChat }: ChatSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof api.searchChats>>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const debouncedQuery = useDebounce(query, 300); // Debounce search for better performance

  // Auto-search when query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch();
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [debouncedQuery]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const searchResults = await api.searchChats(query.trim());
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "Unable to search chat history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Highlight matched text in content
  const highlightMatches = (content: string, searchQuery: string) => {
    if (!searchQuery.trim()) return content;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = content.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? 
        <span key={i} className="bg-yellow-100 text-gray-900">{part}</span> : 
        part
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="sticky top-0 bg-white pt-1 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chat history..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSearching}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
      </form>

      {/* Results Section */}
      <div className="space-y-3">
        {/* No Results State */}
        {hasSearched && results.length === 0 && !isSearching && (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No matching chats found</p>
            <p className="text-sm text-gray-500 mt-1">Try different search terms</p>
          </div>
        )}

        {/* Results List */}
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => onSelectChat(result.id)}
            className="w-full text-left"
          >
            <div className="bg-white p-3 rounded-lg shadow-sm border hover:border-blue-500 hover:shadow-md transition-all">
              {/* Chat Title and Info */}
              <div className="flex items-start gap-3 mb-2">
                <MessageCircle className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 break-words">
                    {highlightMatches(result.title, query)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(result.last_updated).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      {result.match_count} {result.match_count === 1 ? 'match' : 'matches'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Messages */}
              {result.preview_messages.map((msg, idx) => (
                <div key={idx} className="bg-gray-50 p-2 rounded text-sm mt-2 hover:bg-gray-100">
                  <div className="text-gray-600 break-words whitespace-pre-wrap">
                    {highlightMatches(msg.content, query)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 