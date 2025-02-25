import React from 'react';

interface EditorFooterProps {
  wordCount: number;
  lastSaveTime: string;
}

export const EditorFooter: React.FC<EditorFooterProps> = ({ wordCount, lastSaveTime }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between px-6 py-3 text-sm text-gray-500">
          <div>字数统计：{wordCount}</div>
          <div>最后保存时间：{lastSaveTime}</div>
        </div>
      </div>
    </div>
  );
}; 