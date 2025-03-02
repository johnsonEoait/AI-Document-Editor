'use client';

import React from 'react';
import { X, RotateCcw, Check, Loader2 } from 'lucide-react';

interface AIGeneratedImageProps {
  imageUrl: string;
  dimensions?: { width: number, height: number, aspectRatio: string } | null;
  isLoading: boolean;
  onCancel: () => void;
  onRegenerate: () => void;
  onInsert: () => void;
}

export const AIGeneratedImage: React.FC<AIGeneratedImageProps> = ({
  imageUrl,
  dimensions,
  isLoading,
  onCancel,
  onRegenerate,
  onInsert
}) => {
  if (isLoading) {
    return (
      <div className="ai-generated-image flex-1 flex flex-col items-center justify-center p-8 min-h-[300px]">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-4" />
        <p className="text-sm text-gray-500">正在生成图像，请稍候...</p>
      </div>
    );
  }
  
  if (!imageUrl) return null;
  
  return (
    <>
      <div className="ai-generated-image flex-1 max-h-[400px] px-4 py-3 overflow-y-auto">
        <div className="flex flex-col items-center">
          <img 
            src={imageUrl} 
            alt="AI生成的图像" 
            className="max-w-full max-h-[320px] object-contain rounded-lg shadow-md" 
          />
          {dimensions && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                {dimensions.width} × {dimensions.height}
              </span>
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                {dimensions.aspectRatio}
              </span>
            </div>
          )}
        </div>
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
          className="magic-btn flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-900 rounded-lg transition-colors"
          aria-label="插入"
        >
          <Check className="w-3.5 h-3.5" />
          插入图像
        </button>
      </div>
    </>
  );
}; 