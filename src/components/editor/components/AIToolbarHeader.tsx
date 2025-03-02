'use client';

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { DragState } from '../types/aiToolbar';

interface AIToolbarHeaderProps {
  onDragStart: (e: React.MouseEvent) => void;
  onCancel: () => void;
}

export const AIToolbarHeader: React.FC<AIToolbarHeaderProps> = ({ 
  onDragStart, 
  onCancel 
}) => {
  return (
    <div 
      className="ai-drag-handle flex items-center justify-between px-4 py-2.5"
      onMouseDown={onDragStart}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-600 select-none">AI 助手</span>
      </div>
      <button
        onClick={onCancel}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
        aria-label="关闭"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}; 