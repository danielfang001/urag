'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleUpload = async () => {
    // TODO: Implement file upload
    setIsOpen(false);
    setFiles([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            mt-4 border-2 border-dashed rounded-lg p-8 text-center
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          `}
        >
          <p className="text-gray-600">
            Drag and drop your documents here, or{' '}
            <button className="text-blue-500 hover:text-blue-600">
              browse files
            </button>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: PDF, TXT, DOCX
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-700 mb-2">Selected Files</h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center justify-between">
                  <span>{file.name}</span>
                  <button
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <Button 
              onClick={handleUpload} 
              className="mt-4 w-full"
            >
              Upload Files
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}