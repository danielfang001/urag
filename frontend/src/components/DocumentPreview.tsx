'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    content?: string;
    uploadDate: string;
    type: string;
  } | null;
}

export function DocumentPreview({ isOpen, onClose, document }: DocumentPreviewProps) {
  if (!document) return null;

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
              <Button variant="outline" size="icon" title="Download">
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
          
          <div className="mt-4 p-4 rounded-lg bg-gray-50 h-[calc(100vh-300px)] overflow-y-auto">
            {document.content ? (
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {document.content}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Preview not available
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}