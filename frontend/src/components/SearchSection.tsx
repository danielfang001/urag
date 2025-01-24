'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, User, Bot } from "lucide-react";
import { api } from '@/api';
import { useToast } from "@/hooks/use-toast";
import { SearchResult } from '@/components/SearchResult';
import { SearchResponse } from '@/api';
import { useRouter } from 'next/navigation';

export function SearchSection() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Search the documents
      const searchResponse: SearchResponse = await api.searchDocuments(query, undefined, true);  // true for homepage/initial search
      
      console.log('Search response:', searchResponse); 
      
      // Directly navigate to chat with ID instead of storing in localStorage
      if (searchResponse.chat_id) {
        router.push(`/chat/${searchResponse.chat_id}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create chat",
          variant: "destructive",
        });
      }
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl px-4 space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">URAG</h1>
          <p className="text-lg text-gray-600">Your Universal RAG Assistant</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="flex items-start gap-2">
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
      </div>
    </div>
  );
}