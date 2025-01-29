'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { SearchResult } from '@/components/SearchResult';
import { SearchResponse } from '@/api';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/api';
import { MentionPopup } from '@/components/MentionPopup';

interface Message {
  query: string;
  response: SearchResponse;
  isNew?: boolean;
}

interface Reference {
  type: 'web' | 'file';
  source: string;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [references, setReferences] = useState<Reference[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadChat();
  }, [chatId]);

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

  const loadChat = async () => {
    try {
      const chat = await api.getChat(chatId);
      
      const isNew = chat.messages.length <= 2;
      setIsNewChat(isNew);

      const formattedMessages = chat.messages.reduce<Message[]>((acc, msg, index, arr) => {
        if (msg.role === 'user') {
          const nextMsg = arr[index + 1];
          if (nextMsg && nextMsg.role === 'assistant') {
            acc.push({
              query: msg.content,
              response: {
                answer: nextMsg.content,
                sources: (nextMsg.sources || []).map(source => ({
                  content: source.content,
                  score: source.score,
                  filename: source.filename
                })),
                web_sources: (nextMsg.web_sources || []).map(source => ({
                  text: source.text,
                  title: source.title,
                  url: source.url,
                  score: source.score,
                  highlights: source.highlights || []
                }))
              },
              isNew: isNew
            });
          }
        }
        return acc;
      }, []);
      
      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await api.searchDocuments(input, chatId, false);  // false for follow-up
      setMessages(prev => [...prev, {
        query: input,
        response: response,
        isNew: true
      }]);
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
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
      setShowMentionPopup(false);
    }
    
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleMentionSelect = (type: 'web' | 'file', source: string) => {
    setShowMentionPopup(false);
    setReferences([...references, { type, source }]);
    
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const newValue = input.slice(0, cursorPosition - 1) + input.slice(cursorPosition);
      setInput(newValue);
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Messages container with scrollbar */}
      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-8 space-y-8">
            {messages.map((message, index) => (
              <SearchResult
                key={index}
                query={message.query}
                response={message.response}
                isHistory={!message.isNew}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input form fixed at bottom */}
      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="p-4 relative">
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
              
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  placeholder="Type your message... Use @ to reference sources"
                  className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                  rows={1}
                  style={{ minHeight: '44px' }}
                  disabled={isSending}
                />
                <Button 
                  type="submit" 
                  disabled={isSending || !input.trim()}
                  className="h-auto min-h-[44px] px-6"
                >
                  {isSending ? (
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
    </div>
  );
}