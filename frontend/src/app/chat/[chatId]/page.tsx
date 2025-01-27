'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SearchResult } from '@/components/SearchResult';
import { SearchResponse } from '@/api';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/api';

interface Message {
  query: string;
  response: SearchResponse;
  isNew?: boolean;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const [isNewChat, setIsNewChat] = useState(false);

  useEffect(() => {
    loadChat();
  }, [chatId]);

  const loadChat = async () => {
    try {
      console.log('Loading chat with ID:', chatId);
      const chat = await api.getChat(chatId);
      console.log('HERE IS THE CHAT before formatting:', chat);
      
      // Check if this is a new chat (only has one message pair)
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
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Type your message..."
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
          </form>
        </div>
      </div>
    </div>
  );
}