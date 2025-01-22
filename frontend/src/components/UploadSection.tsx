'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from '@/api';
import { useToast } from "@/hooks/use-toast";

interface UploadSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSection({ isOpen, onClose }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files => files.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setFiles([]); // Clear files when dialog is closed
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Upload Documents</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept=".pdf,.txt,.doc,.docx"
        />
        
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          `}
        >
          <p className="text-gray-600">
            Drag and drop your documents here, or{' '}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 hover:text-blue-600"
              type="button"
            >
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
                <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <Button 
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    for (const file of files) {
                      await api.uploadDocument(file);
                    }
                    toast({
                      title: "Success",
                      description: "Files uploaded successfully",
                    });
                    setFiles([]);
                    onClose();
                    window.location.reload();
                  } catch (error) {
                    console.error('Upload error:', error);
                    toast({
                      title: "Error",
                      description: error instanceof Error ? error.message : "Failed to upload files",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Upload
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}