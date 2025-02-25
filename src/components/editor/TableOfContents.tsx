import React from 'react';
import { TableOfContentsItem } from './types/editor';
import { Editor } from '@tiptap/react';

interface TableOfContentsProps {
  isVisible: boolean;
  onClose: () => void;
  tableOfContents: TableOfContentsItem[];
  editor: Editor | null;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  isVisible, 
  onClose, 
  tableOfContents, 
  editor 
}) => {
  if (!isVisible || !editor) return null;

  return (
    <div className={`fixed transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`} 
      style={{ 
        left: 'max(24px, calc((100vw - 1280px - 640px) / 2))', 
        top: '140px', 
        width: '280px',
        maxWidth: 'calc((100vw - 1280px) / 2 - 24px)'
      }}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">目录</div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="关闭目录"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-1 py-2">
          <div className="space-y-0.5 max-h-[calc(100vh-240px)] overflow-y-auto">
            {tableOfContents.map((heading, index) => {
              // 计算编号
              let prefix = '';
              let parentStack: { level: number; number: number }[] = [];
              let currentCount = 1;
              
              // 向前查找同级标题的数量
              for (let i = 0; i < index; i++) {
                const prevHeading = tableOfContents[i];
                
                if (prevHeading.level < heading.level) {
                  while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= prevHeading.level) {
                    parentStack.pop();
                  }
                  parentStack.push({
                    level: prevHeading.level,
                    number: i + 1
                  });
                  currentCount = 1;
                } else if (prevHeading.level === heading.level) {
                  currentCount++;
                }
              }
              
              // 生成编号
              if (parentStack.length > 0) {
                prefix = parentStack.map(p => p.number).join('.') + '.' + currentCount;
              } else {
                prefix = currentCount + '.';
              }
              
              return (
                <div
                  key={index}
                  className="group relative cursor-pointer text-[13px] leading-6 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  style={{ 
                    paddingLeft: `${(heading.level - 1) * 1.25 + 0.75}rem`,
                    paddingRight: '0.75rem',
                  }}
                  onClick={() => {
                    const text = heading.text;
                    let pos = 0;
                    editor.state.doc.descendants((node: any, nodePos: number) => {
                      if (node.type.name === 'heading' && node.textContent === text) {
                        pos = nodePos;
                        return false;
                      }
                    });
                    editor.commands.setTextSelection(pos);
                    editor.commands.scrollIntoView();
                  }}
                >
                  <div className="flex items-center py-1 gap-1.5">
                    <span className="text-gray-400 min-w-[1.5rem] text-right">
                      {prefix}
                    </span>
                    <span className="truncate flex-1">{heading.text}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
            {tableOfContents.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                暂无目录内容
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 