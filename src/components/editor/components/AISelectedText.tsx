'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { SelectionRange } from '../types/aiToolbar';

interface AISelectedTextProps {
  editor: Editor;
  selectionRef: React.RefObject<SelectionRange | null>;
}

export const AISelectedText: React.FC<AISelectedTextProps> = ({
  editor,
  selectionRef
}) => {
  if (!selectionRef.current || selectionRef.current.from === selectionRef.current.to) {
    return null;
  }

  return (
    <div className="mb-3 px-3 py-2 bg-gray-50/30 rounded-lg border border-gray-100/50 text-xs text-gray-600 max-h-[100px] overflow-y-auto">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-1 h-[calc(100%-2px)] bg-gray-300/50 rounded-full"></div>
        </div>
        <div className="flex-1 line-clamp-4 whitespace-pre-wrap">
          {editor.state.doc.textBetween(selectionRef.current.from, selectionRef.current.to, '\n')}
        </div>
      </div>
    </div>
  );
}; 