'use client';

import { useState } from 'react';

export function UploadSection() {
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

    // We'll implement the upload logic later
  };

  return (
    <section className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
      
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
          <h3 className="font-medium text-gray-700 mb-2">Uploaded Files</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="text-sm text-gray-600">
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}