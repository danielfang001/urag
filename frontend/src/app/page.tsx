import { SearchSection } from "@/components/SearchSection";
import { ApiKeyWarning } from "@/components/ApiKeyWarning";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ApiKeyWarning />
      <SearchSection />
    </div>
  );
}