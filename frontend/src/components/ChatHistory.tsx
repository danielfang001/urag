'use client';

import { useState } from 'react';
import { MessageCircle, X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatSearch } from './ChatSearch';

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  trigger?: React.ReactNode;
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

export function ChatHistory({ onSelectChat, onNewChat, trigger }: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'search'>('chats');

  return (
    <>
      {/* Custom Trigger or Default Button */}
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg hover:shadow-xl"
          onClick={() => setIsOpen(true)}
          title="Chat History"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Floating Window */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat History Window */}
          <div className="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-xl border z-50 flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Chat History</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex-1 p-3 text-sm font-medium ${
                  activeTab === 'chats'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 p-3 text-sm font-medium ${
                  activeTab === 'search'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Search
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'chats' ? (
                <div className="space-y-3">
                  <Button onClick={onNewChat} className="w-full mb-4">
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                  
                  {mockChats.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center p-4">
                      No chat history yet. Start a new chat!
                    </p>
                  ) : (
                    mockChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          onSelectChat(chat.id);
                          setIsOpen(false);
                        }}
                        className="w-full p-3 text-left rounded-lg hover:bg-gray-100 border"
                      >
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{chat.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(chat.lastUpdated).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <ChatSearch onSelectChat={(chatId) => {
                  onSelectChat(chatId);
                  setIsOpen(false);
                }} />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
} 