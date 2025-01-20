'use client';

import Link from "next/link";
import { ChatHistory } from "./ChatHistory";

export function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <div className="flex gap-4">
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
          </div>
        </div>
      </nav>
      <div className="flex">
        <ChatHistory 
          onSelectChat={(chatId) => console.log('Selected chat:', chatId)}
          onNewChat={() => console.log('New chat')}
        />
        <main className="flex-1 min-h-screen bg-gray-50 ml-[64px]">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
} 