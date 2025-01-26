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
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadChat();
  }, [chatId]);

  const loadChat = async () => {
    try {
      console.log('Loading chat with ID:', chatId);
      const chat = await api.getChat(chatId);
      console.log('HERE IS THE CHAT before formatting:', chat);
      const formattedMessages = chat.messages.reduce<Message[]>((acc, msg, index, arr) => {
        if (msg.role === 'user') {
          const nextMsg = arr[index + 1];
          if (nextMsg && nextMsg.role === 'assistant') {
            acc.push({
              query: msg.content,
              response: {
                answer: nextMsg.content,
                sources: (nextMsg.sources || []).map(source => {
                  return {
                    content: source.content,
                    score: source.score,
                    filename: source.filename
                  };
                }),
                web_sources: (nextMsg.web_sources || []).map(source => {
                  return {
                    text: source.text,
                    title: source.title,
                    url: source.url,
                    score: source.score,
                    highlights: source.highlights || []
                  };
                })
              }
            });
          }
        }
        return acc;
      }, []);
      console.log('Formatted messages:', formattedMessages); // Debug log
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
        response: response
      }]);
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <SearchResult
            key={index}
            query={message.query}
            response={message.response}
            isHistory={index < messages.length - 1}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || !input.trim()}>
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}