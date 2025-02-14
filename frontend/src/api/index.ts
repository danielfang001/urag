interface ChatMessage {
  role: string;
  content: string;
  sources?: Array<{
    content: string;
    score: number;
    filename: string;
  }>;
  web_sources?: Array<{
    score: number;
    title: string;
    url: string;
    text: string;
    highlights: string[];
  }>;
  created_at?: string;
}

interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  last_updated: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  content?: string;
}

export interface SearchResponse {
  answer: string;
  sources: Array<{
    content: string;
    filename: string;
    score: number;
  }>;
  web_sources?: Array<{
    score: number;
    title: string;
    url: string;
    text: string;
    highlights: string[];
  }>;
  chat_id?: string;
}

export const api = {

  async getChats(): Promise<Chat[]> {
    const response = await fetch('/api/chat');
    if (!response.ok) throw new Error('Failed to fetch chats');
    return response.json();
  },

  async getChat(chatId: string): Promise<Chat> {
    const response = await fetch(`/api/chat/${chatId}`);
    if (!response.ok) throw new Error('Failed to fetch chat');
    return response.json();
  },

  async addMessage(chatId: string, message: ChatMessage): Promise<void> {
    const response = await fetch(`/api/chat/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error('Failed to add message');
  },

  async searchChats(query: string): Promise<{
    id: string;
    title: string;
    last_updated: string;
    total_messages: number;
    match_count: number;
    preview_messages: Array<{
      content: string;
      created_at: string;
      matched_text: string | null;
    }>;
  }[]> {
    const response = await fetch(`/api/chat/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search chats');
    return response.json();
  },

  async getDocuments(): Promise<Document[]> {
    const response = await fetch('/api/documents');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch documents');
    }
    return response.json();
  },

  async uploadDocument(file: File): Promise<Document> {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Starting upload for file:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'X-OpenAI-Key': apiKey
        },
        body: formData,
      });
      
      const text = await response.text();
      console.log('Raw response:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', text);
        throw new Error(`Failed to parse response: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      return {
        id: data.id,
        name: file.name,
        type: file.type,
        size: `${Math.round(file.size / 1024)} KB`,
        uploadDate: data.uploadDate || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Upload error details:', error);
      throw error;
    }
  },

  async getDocumentContent(filename: string): Promise<Blob> {
    const response = await fetch(`/api/documents/${filename}/download`);
    if (!response.ok) throw new Error('Failed to fetch document content');
    return response.blob();
  },

  async deleteDocument(filename: string): Promise<void> {
    const response = await fetch(`/api/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete document');
    }
  },

  async searchDocuments(
    query: string, 
    chatId?: string, 
    fromHomePage: boolean = false,
    references?: Array<{ type: 'web' | 'file'; source: string; }>
  ): Promise<SearchResponse> {
    const apiKey = localStorage.getItem('openai_api_key');
    const model = localStorage.getItem('openai_model') || 'gpt-3.5-turbo';
    const exaKey = localStorage.getItem('exa_api_key');
    const enableWebSearch = localStorage.getItem('enable_web_search') === 'true';
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (enableWebSearch && !exaKey) {
      throw new Error('Exa.ai API key is required for web search');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-OpenAI-Key': apiKey,
      'X-OpenAI-Model': model,
    };

    if (enableWebSearch) {
      headers['X-Exa-Key'] = exaKey!;
      headers['X-Enable-Web-Search'] = 'true';
    }

    const response = await fetch('/api/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        chatId,
        initial: fromHomePage,
        references
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to search documents');
    }

    return response.json();
  },

  async deleteChat(chatId: string): Promise<void> {
    const response = await fetch(`/api/chat/${chatId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete chat');
  },

  async deleteAllChats(): Promise<void> {
    const response = await fetch('/api/chat/all', {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete all chats');
  }
}; 