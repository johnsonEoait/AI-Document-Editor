import React from 'react';

interface EditorOverlayProps {
  isVisible: boolean;
}

export const EditorOverlay: React.FC<EditorOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] overflow-hidden editor-disabled-overlay"
      style={{ cursor: 'not-allowed' }}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-[4px] animate-gradient-xy" />
      
      {/* 动态光效 */}
      <div className="absolute inset-0">
        <div className="absolute w-[800px] h-[800px] bg-blue-200/30 rounded-full blur-3xl animate-blob" 
          style={{ top: '10%', left: '15%' }} 
        />
        <div className="absolute w-[700px] h-[700px] bg-purple-200/30 rounded-full blur-3xl animate-blob animation-delay-2000" 
          style={{ top: '40%', right: '15%' }} 
        />
        <div className="absolute w-[750px] h-[750px] bg-pink-200/30 rounded-full blur-3xl animate-blob animation-delay-4000" 
          style={{ bottom: '15%', left: '35%' }} 
        />
      </div>

      {/* AI 处理中提示 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="px-8 py-6 rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl transform hover:scale-105 transition-all duration-500">
          <div className="flex items-center gap-4">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-1 border-3 border-purple-400 border-t-transparent rounded-full animate-spin animation-delay-150" />
            </div>
            <span className="text-gray-700 font-medium text-lg">AI 创作中...</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 