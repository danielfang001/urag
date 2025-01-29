import { useState, useEffect } from 'react';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';

export interface MentionPopupProps {
  position: { top: number; left: number };
  onSelect: (type: 'web' | 'file', source: string) => void;
  onClose: () => void;
}

export function MentionPopup({ position, onSelect, onClose }: MentionPopupProps) {
  const [mode, setMode] = useState<'main' | 'web' | 'file'>('main');
  const [webUrl, setWebUrl] = useState('');
  const [documents, setDocuments] = useState<Array<{ name: string }>>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await api.getDocuments();
        setDocuments(docs.map(doc => ({ name: doc.name })));
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive",
        });
      }
    };
    loadDocuments();
  }, []);

  if (mode === 'web') {
    return (
      <div className="mention-popup absolute z-50 bg-white shadow-lg rounded-lg border p-2 w-96"
           style={{ bottom: '100%', left: '0', marginBottom: '8px' }}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 border-b pb-2">
            <button 
              onClick={() => setMode('main')} 
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-medium">Enter URL</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={() => {
                if (webUrl) {
                  onSelect('web', webUrl);
                  setWebUrl('');
                  setMode('main');
                }
              }}
              className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              Add URL
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'file') {
    return (
      <div className="mention-popup absolute z-50 bg-white shadow-lg rounded-lg border p-2 w-96"
           style={{ bottom: '100%', left: '0', marginBottom: '8px' }}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 border-b pb-2">
            <button 
              onClick={() => setMode('main')} 
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-medium">Select Document</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {documents.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => onSelect('file', doc.name)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">{doc.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mention-popup absolute z-50 bg-white shadow-lg rounded-lg border p-2 w-96"
         style={{ bottom: '100%', left: '0', marginBottom: '8px' }}>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
        onClick={() => setMode('web')}
      >
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>Web URL</span>
      </button>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
        onClick={() => setMode('file')}
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>File</span>
      </button>
    </div>
  );
} 