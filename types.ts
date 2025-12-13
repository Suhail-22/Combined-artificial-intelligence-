import React from 'react';

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  timestamp: number;
}

export interface Folder {
  id: string;
  name: string;
  snippets: Snippet[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content?: string; // For user
  modelsData?: { // For model
    [key: number]: {
      text: string;
      loading: boolean;
      error: string | null;
    }
  };
  timestamp: number;
  comparisonLoading?: boolean; // NEW: Track judging status
  comparison?: any;
  consensus?: {
    text: string;
    loading: boolean;
    error: string | null;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface Tool {
    id: string;
    icon: React.ReactNode;
    label: string;
    prompt: string;
}
