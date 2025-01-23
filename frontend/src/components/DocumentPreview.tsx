'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import { Document } from "@/api";
import { api } from "@/api";

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export function DocumentPreview({ isOpen, onClose, document }: DocumentPreviewProps) {
  const [numPages, setNumPages] = useState<number>();
  
  if (!document?.content) return null;

  const handleDownload = async () => {
    try {
      const blob = await api.getDocumentContent(document.name);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };


  const renderContent = () => {
    if (document.type.includes('pdf')) {
      return (
        <PDFDocument
          file={document.content}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          className="max-h-[60vh] overflow-y-auto"
        >
          {Array.from(new Array(numPages), (_, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
          ))}
        </PDFDocument>
      );
    } else {
      // Text viewer for other formats
      return (
        <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-lg max-h-[60vh] overflow-y-auto">
          {document.content}
        </pre>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {document.name}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleDownload} title="Download">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 mt-6 overflow-hidden">
          <div className="mb-4 text-sm text-gray-500">
            <p>Uploaded on {new Date(document.uploadDate).toLocaleDateString()}</p>
            <p>Type: {document.type}</p>
          </div>
          
          <div className="mt-4">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}