'use client';

import { useState } from 'react';
import { UploadSection } from "@/components/UploadSection";
import { DocumentList } from "@/components/DocumentList";
import { UploadButton } from "@/components/UploadButton";

export default function Documents() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">Manage your knowledge base</p>
        </div>
        <UploadButton onClick={() => setShowUpload(true)} />
      </header>

      <UploadSection 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
      />
      <DocumentList />
    </div>
  );
}