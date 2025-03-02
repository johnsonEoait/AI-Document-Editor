'use client';

import React from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { md } from '../constants/aiToolbarConstants';

interface AIGeneratedContentProps {
  generatedContent: string;
  isLoading: boolean;
  onCancel: () => void;
  onRegenerate: () => void;
  onInsert: () => void;
}

export const AIGeneratedContent: React.FC<AIGeneratedContentProps> = ({
  generatedContent,
  isLoading,
  onCancel,
  onRegenerate,
  onInsert
}) => {
  if (!generatedContent) return null;
  
  return (
    <>
      <div className="ai-generated-content flex-1 max-h-[400px] px-4 py-3 overflow-y-auto">
        <div 
          className="text-sm text-gray-700 leading-relaxed markdown-content"
          dangerouslySetInnerHTML={{ 
            __html: md.render(generatedContent) + (isLoading ? '<span class="typing-effect">&nbsp;</span>' : '') 
          }}
        />
      </div>
      <div className="flex justify-end gap-2 p-3 border-t border-gray-100/30">
        <button
          onClick={onCancel}
          className="simple-btn flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="取消"
        >
          <X className="w-3.5 h-3.5" />
          取消
        </button>
        <button
          onClick={onRegenerate}
          className="simple-btn flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="重新生成"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重新生成
        </button>
        <button
          onClick={onInsert}
          disabled={isLoading}
          className={`magic-btn flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-900 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="插入"
        >
          <Check className="w-3.5 h-3.5" />
          插入
        </button>
      </div>
    </>
  );
}; 