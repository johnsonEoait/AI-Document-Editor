'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface TableQuickButtonsProps {
  editor: Editor;
}

export const TableQuickButtons = ({ editor }: TableQuickButtonsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const selection = editor.view.state.selection;
      if (!editor.isActive('table')) {
        setIsVisible(false);
        return;
      }

      const table = editor.view.domAtPos(selection.from).node as HTMLElement;
      const tableElement = table.closest('table');
      if (!tableElement) {
        setIsVisible(false);
        return;
      }

      const rect = tableElement.getBoundingClientRect();
      const editorRect = editor.view.dom.getBoundingClientRect();

      setPosition({
        top: rect.top - editorRect.top,
        left: rect.left - editorRect.left,
        width: rect.width,
        height: rect.height,
      });
      setIsVisible(true);
    };

    editor.on('selectionUpdate', updatePosition);
    editor.on('update', updatePosition);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('update', updatePosition);
    };
  }, [editor]);

  if (!isVisible) return null;

  const handleAddRow = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const handleAddColumn = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  return (
    <>
      {/* 添加行按钮 */}
      <button
        className="absolute flex items-center justify-center w-6 h-6 transform -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 group"
        style={{
          top: position.top + position.height + 8, // 表格底部下方8px
          left: position.left + position.width / 2, // 水平居中
        }}
        onClick={handleAddRow}
      >
        <Plus className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
        <div className="absolute invisible px-2 py-1 text-xs text-white transform translate-y-full bg-gray-800 rounded opacity-0 bottom-full group-hover:visible group-hover:opacity-100 whitespace-nowrap">
          添加行
        </div>
      </button>

      {/* 添加列按钮 */}
      <button
        className="absolute flex items-center justify-center w-6 h-6 transform -translate-y-1/2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 group"
        style={{
          top: position.top + position.height / 2, // 垂直居中
          left: position.left + position.width + 8, // 表格右侧外部8px
        }}
        onClick={handleAddColumn}
      >
        <Plus className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
        <div className="absolute invisible px-2 py-1 text-xs text-white transform translate-x-full bg-gray-800 rounded opacity-0 right-full group-hover:visible group-hover:opacity-100 whitespace-nowrap">
          添加列
        </div>
      </button>
    </>
  );
}; 