export interface SearchResponse {
  answer: string;
  sources: Array<{
    content: string;
    filename: string;
    score: number;
  }>;
} 