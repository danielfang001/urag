'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DocumentPreview } from "./DocumentPreview";

type Document = {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  type: string;
  content?: string; // We'll fetch this when needed
};

// Temporary mock data
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'example.pdf',
    uploadDate: '2024-03-14',
    size: '2.4 MB',
    type: 'PDF',
    content: 'This is a sample document content...'
  },
  // Add more mock documents as needed
];

export function DocumentList() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (doc: Document) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-5 gap-4 p-4 font-medium text-gray-500 border-b">
          <div className="col-span-2">Name</div>
          <div>Type</div>
          <div>Size</div>
          <div>Upload Date</div>
        </div>
        
        <div className="divide-y">
          {mockDocuments.map((doc) => (
            <div key={doc.id} className="grid grid-cols-5 gap-4 p-4 items-center">
              <div className="col-span-2">
                <button
                  onClick={() => handlePreview(doc)}
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {doc.name}
                </button>
              </div>
              <div className="text-gray-500">{doc.type}</div>
              <div className="text-gray-500">{doc.size}</div>
              <div className="text-gray-500 flex items-center justify-between">
                {new Date(doc.uploadDate).toLocaleDateString()}
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DocumentPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={selectedDoc}
      />
    </>
  );
}