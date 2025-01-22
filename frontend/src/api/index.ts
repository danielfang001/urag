interface ChatMessage {
  role: string;
  content: string;
  sources?: Array<{
    content: string;
    metadata: {
      filename: string;
      page?: number;
    }
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
}

export const api = {
  // Chat operations
  async createChat(title: string): Promise<{ id: string }> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error('Failed to create chat');
    return response.json();
  },

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

  // Document operations
  async getDocuments(): Promise<Document[]> {
    const response = await fetch('/api/documents');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch documents');
    }
    return response.json();
  },

  async uploadDocument(file: File): Promise<Document> {
    console.log('Starting upload for file:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
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

  async getDocumentContent(id: string): Promise<string> {
    const response = await fetch(`/api/documents/${id}/content`);
    if (!response.ok) throw new Error('Failed to fetch document content');
    return response.json();
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

  // Search operations
  async searchDocuments(query: string): Promise<SearchResponse> {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to search documents');
    }
    
    return response.json();
  }
}; 