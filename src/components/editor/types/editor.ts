import { JSONContent } from '@tiptap/react';

export interface SavedContent {
  content: JSONContent;
  lastSaved: string;
  title: string;
}

export interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  autoUpdateTitleFromH1?: boolean;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

export interface TableOfContentsItem {
  level: number;
  text: string;
}

export interface DialogPosition {
  x: number;
  y: number;
} 