'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export function ApiKeyWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const apiKey = localStorage.getItem('openai_api_key');
    setShowWarning(!apiKey);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            OpenAI API key not configured. Please set it in the Settings menu.
          </p>
        </div>
      </div>
    </div>
  );
} 