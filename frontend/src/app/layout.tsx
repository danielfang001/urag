import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "URAG - Universal RAG System",
  description: "Search and query your documents with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}