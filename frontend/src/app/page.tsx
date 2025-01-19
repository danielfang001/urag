import { SearchSection } from "@/components/SearchSection";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Document Search</h1>
        <p className="mt-2 text-gray-600">Ask questions about your documents</p>
      </header>

      <SearchSection />
    </div>
  );
}