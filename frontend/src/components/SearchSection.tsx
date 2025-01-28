'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, User, Bot } from "lucide-react";
import { api } from '@/api';
import { useToast } from "@/hooks/use-toast";
import { SearchResponse } from '@/api';
import { useRouter } from 'next/navigation';

interface Reference {
  type: 'web' | 'file';
  source: string;
}

export function SearchSection() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const parseReferences = (input: string): { text: string, refs: Reference[] } => {
    const refs: Reference[] = [];
    const regex = /@((?:https?:\/\/)?[\w-]+(?:\.[\w-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+|[^\s]+)/g;
    
    const text = input.replace(regex, (match, source) => {
      if (source.startsWith('http')) {
        refs.push({ type: 'web', source });
      } else {
        refs.push({ type: 'file', source });
      }
      return ''; // Remove the @mention from the text
    });

    return { text: text.trim(), refs };
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const { text, refs } = parseReferences(query);
      const searchResponse: SearchResponse = await api.searchDocuments(text, undefined, true, refs);
      
      console.log('Full search response:', searchResponse);
      
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
    const value = e.target.value;
    setQuery(value);
    const { refs } = parseReferences(value);
    setReferences(refs);
    
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 pt-64 mt-40 translate-y-8">
        <div className="w-full max-w-3xl space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">URAG</h1>
            <p className="text-lg text-gray-600">Your Universal RAG Assistant</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="flex flex-col gap-2">
              <div className="flex items-stretch gap-2">
                <textarea
                  value={query}
                  onChange={handleInput}
                  placeholder="Ask anything... Use @url or @filename to reference specific sources"
                  className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                  rows={1}
                  style={{ height: 'auto', minHeight: '44px' }}
                />
                <Button 
                  type="submit" 
                  disabled={isSearching}
                  className="px-6 h-auto min-h-[44px]"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      className="w-5 h-5"
                    >
                      <path 
                        d="M22 2L11 13"
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M22 2L15 22L11 13L2 9L22 2Z" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Button>
              </div>
              {references.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {references.map((ref, idx) => (
                    <span 
                      key={idx}
                      className={`px-2 py-1 rounded text-sm ${
                        ref.type === 'web' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {ref.type === 'web' ? '🌐' : '📄'} {ref.source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}