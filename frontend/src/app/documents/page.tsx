import { DocumentList } from "@/components/DocumentList";
import { UploadButton } from "@/components/UploadButton";

export default function Documents() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">Manage your knowledge base</p>
        </div>
        <UploadButton />
      </header>

      <DocumentList />
    </div>
  );
}