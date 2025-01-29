'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, User, Bot } from "lucide-react";
import { api } from '@/api';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { MentionPopup } from './MentionPopup';

interface Reference {
  type: 'web' | 'file';
  source: string;
}

export function SearchSection() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResponse = await api.searchDocuments(query, undefined, true, references);
      
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
    
    // Get cursor position and check for @ symbol
    const cursorPosition = e.target.selectionStart;
    const lastChar = value[cursorPosition - 1];
    
    if (lastChar === '@') {
      const rect = textareaRef.current?.getBoundingClientRect();
      if (rect) {
        setPopupPosition({
          top: -60,
          left: 10
        });
        setShowMentionPopup(true);
      }
    } else if (!value.includes('@')) {
      // Close popup if @ is deleted
      setShowMentionPopup(false);
    }
    
    // Adjust textarea height
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const popupElement = document.querySelector('.mention-popup');
      
      // Check if click is outside both textarea and popup
      if (textareaRef.current && 
          !textareaRef.current.contains(target) && 
          popupElement && 
          !popupElement.contains(target)) {
        setShowMentionPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to get precise caret coordinates
  const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const { offsetLeft: inputX, offsetTop: inputY } = element;
    
    // Create a hidden div with the same styling as the textarea
    const div = document.createElement('div');
    const style = getComputedStyle(element);
    
    // Copy styles that affect text position
    const properties = [
      'fontFamily', 'fontSize', 'fontWeight', 'wordWrap', 
      'whiteSpace', 'borderLeftWidth', 'borderTopWidth',
      'paddingLeft', 'paddingTop', 'lineHeight'
    ] as const;
    
    properties.forEach(prop => {
      div.style.setProperty(prop, style.getPropertyValue(prop));
    });
    
    // Set content and measure
    div.textContent = element.value.substring(0, position);
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = style.width;
    
    document.body.appendChild(div);
    const coordinates = {
      top: div.offsetHeight,
      left: div.offsetWidth
    };
    document.body.removeChild(div);
    
    return coordinates;
  };

  const handleMentionSelect = (type: 'web' | 'file', source: string) => {
    setShowMentionPopup(false);
    
    // Add the reference
    setReferences([...references, { type, source }]);
    
    // Focus back on textarea and remove the @ symbol
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const newValue = query.slice(0, cursorPosition - 1) + query.slice(cursorPosition);
      setQuery(newValue);
      textareaRef.current.focus();
    }
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
          <form onSubmit={handleSearch} className="w-full relative">
            <div className="flex flex-col gap-2">
              {references.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
                  {references.map((ref, idx) => (
                    <span 
                      key={idx}
                      className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                        ref.type === 'web' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {ref.type === 'web' ? '🌐' : '📄'} {ref.source}
                      <button
                        onClick={() => {
                          const newRefs = references.filter((_, i) => i !== idx);
                          setReferences(newRefs);
                        }}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-stretch gap-2">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={handleInput}
                  placeholder="Ask anything... Use @ to reference sources"
                  className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                  rows={1}
                  style={{ height: 'auto', minHeight: '44px' }}
                />
                <Button 
                  type="submit" 
                  disabled={isSearching}
                  className="h-auto min-h-[44px] px-6"
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
            </div>

            {showMentionPopup && (
              <MentionPopup
                position={popupPosition}
                onSelect={handleMentionSelect}
                onClose={() => setShowMentionPopup(false)}
              />
            )}
          </form>
        </div>
      </div>
    </main>
  );
}