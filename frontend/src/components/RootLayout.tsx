'use client';

import Link from "next/link";
import { ChatHistory } from "./ChatHistory";
import { MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleSelectChat = (chatId: string) => {
    console.log('Selected chat:', chatId);
    // TODO: Implement chat selection logic
  };

  const handleNewChat = () => {
    console.log('New chat');
    // TODO: Implement new chat creation
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900"
            >
              URAG
            </Link>
            <div className="flex items-center gap-6">
              <div className="flex gap-6">
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Search
                </Link>
                <Link 
                  href="/documents" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Documents
                </Link>
              </div>
              <div className="h-6 w-px bg-gray-200" /> {/* Divider */}
              <ChatHistory 
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                trigger={
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Chat History</span>
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </>
  );
} 