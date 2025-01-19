'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DocumentPreview } from "./DocumentPreview";
import { api, Document } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async (doc: Document) => {
    try {
      const content = await api.getDocumentContent(doc.id);
      setSelectedDoc({ ...doc, content });
      setIsPreviewOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document content",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments(docs => docs.filter(d => d.id !== id));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

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
          {documents.map((doc) => (
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(doc.id)}
                >
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