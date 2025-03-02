'use client';

import React from 'react';
import { AIProcessMode, SelectionRange } from '../types/aiToolbar';

interface AIToolbarFooterProps {
  mode: AIProcessMode;
  formatType: string;
  selectionRef: React.RefObject<SelectionRange | null>;
}

export const AIToolbarFooter: React.FC<AIToolbarFooterProps> = ({
  mode,
  formatType,
  selectionRef
}) => {
  return (
    <div className="mt-2 flex items-center justify-between text-[11px]">
      <div className="text-gray-500 flex items-center gap-1.5">
        {mode === 'image' ? (
          "生成并插入图像"
        ) : selectionRef.current && selectionRef.current.from !== selectionRef.current.to ? (
          "处理选中的文本"
        ) : (
          "在此处生成内容"
        )}
      </div>
      <div className="flex items-center gap-1 text-gray-500">
        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-50/70 rounded border border-gray-200/70">Alt</kbd>
        <span>+</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-50/70 rounded border border-gray-200/70">/</kbd>
      </div>
    </div>
  );
}; 