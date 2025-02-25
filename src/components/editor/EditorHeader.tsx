import React from 'react';
import { Editor } from '@tiptap/react';
import { EditorToolbar } from './Toolbar';

interface EditorHeaderProps {
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editor: Editor | null;
  onLinkClick: () => void;
  onSave: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTocClick: () => void;
  showToc: boolean;
  onSetTitleFromH1?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  onTitleChange,
  editor,
  onLinkClick,
  onSave,
  onTocClick,
  showToc,
  onSetTitleFromH1
}) => {
  if (!editor) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between py-4 px-6">
          <input
            type="text"
            value={title}
            onChange={onTitleChange}
            className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
            placeholder="输入文档标题"
          />
        </div>
        <div className="border-b">
          <EditorToolbar 
            editor={editor} 
            onLinkClick={onLinkClick}
            onSave={onSave}
            onTocClick={onTocClick}
            showToc={showToc}
            onSetTitleFromH1={onSetTitleFromH1}
          />
        </div>
      </div>
    </div>
  );
}; 