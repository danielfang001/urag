'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Plus, Search, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatSearch } from './ChatSearch';
import { api } from '@/api';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void;
  trigger?: React.ReactNode;
}

export function ChatHistory({ onSelectChat, trigger }: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'search'>('chats');
  const [chats, setChats] = useState<Array<{ id: string; title: string; last_updated: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chats') {
      loadChats();
    }
  }, [isOpen, activeTab]);

  const handleNewChat = () => {
    router.push('/');
    setIsOpen(false);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteChat(chatId);
      await loadChats();
      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllChats = async () => {
    try {
      await api.deleteAllChats();
      await loadChats();
      toast({
        title: "Success",
        description: "All chats deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete all chats",
        variant: "destructive",
      });
    }
  };

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
                  <Button onClick={handleNewChat} className="w-full mb-4">
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleDeleteAllChats} 
                    className="w-full mb-4 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Chats
                  </Button>
                  
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : chats.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center p-4">
                      No chat history yet. Start a new chat!
                    </p>
                  ) : (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="w-full p-3 rounded-lg hover:bg-gray-100 border relative group flex items-center justify-between"
                      >
                        <button
                          onClick={() => {
                            onSelectChat(chat.id);
                            setIsOpen(false);
                          }}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <MessageCircle className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{chat.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(chat.last_updated).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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