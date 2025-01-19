'use client';

import { useState } from 'react';
import { MessageCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

interface ChatSession {
  id: string;
  title: string;
  lastUpdated: string;
}

// Mock data - will be replaced with API calls
const mockChats: ChatSession[] = [
  {
    id: '1',
    title: 'Benefits of Exercise',
    lastUpdated: '2024-03-14T12:00:00Z'
  },
  // Add more mock chats
];

export function ChatHistory({ onSelectChat, onNewChat }: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div 
      className={`
        fixed top-0 left-0 h-full bg-gray-50 border-r transition-all duration-300
        ${isOpen ? 'w-64' : 'w-0'}
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-10 top-4 p-2 bg-gray-100 rounded-lg"
      >
        {isOpen ? <ChevronLeft /> : <ChevronRight />}
      </button>

      {isOpen && (
        <div className="flex flex-col h-full p-4">
          {/* New Chat Button */}
          <Button
            onClick={onNewChat}
            className="mb-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {mockChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="w-full p-3 text-left rounded-lg hover:bg-gray-100 flex items-center gap-3"
              >
                <MessageCircle className="w-4 h-4" />
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium">{chat.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(chat.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 