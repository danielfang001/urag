'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { ChatHistory } from "./ChatHistory";
import { Settings } from "./Settings";
import { MessageCircle, Search, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleSelectChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleNewChat = () => {
    router.push('/chat/new');
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-gray-900">
                URAG
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  <span>Search</span>
                </Button>
              </Link>
              <Link href="/documents" className="text-gray-600 hover:text-gray-900">
                <Button variant="ghost" className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ChatHistory 
                onSelectChat={handleSelectChat}
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
              <div className="h-6 w-px bg-gray-200" />
              <Settings />
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
} 