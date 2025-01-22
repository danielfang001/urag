'use client';

import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface UploadButtonProps {
  onClick: () => void;
}

export function UploadButton({ onClick }: UploadButtonProps) {
  return (
    <Button onClick={onClick}>
      <Upload className="w-4 h-4 mr-2" />
      Upload Documents
    </Button>
  );
}