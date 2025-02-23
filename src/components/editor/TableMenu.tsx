import { Editor } from '@tiptap/react';
import { useState, useEffect } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Trash2,
  RowsIcon,
  ColumnsIcon,
} from 'lucide-react';

interface TableMenuProps {
  editor: Editor;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

export const TableMenu = ({ editor }: TableMenuProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest('td, th');
      
      if (cell && editor.isActive('table')) {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      } else {
        setContextMenu(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isMenuClick = target.closest('.table-context-menu');
      if (!isMenuClick) {
        setContextMenu(null);
      }
    };

    editor.view.dom.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);

    return () => {
      editor.view.dom.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, [editor]);

  const handleAddRow = (position: 'before' | 'after') => {
    if (position === 'before') {
      editor.chain().focus().addRowBefore().run();
    } else {
      editor.chain().focus().addRowAfter().run();
    }
    setContextMenu(null);
  };

  const handleAddColumn = (position: 'before' | 'after') => {
    if (position === 'before') {
      editor.chain().focus().addColumnBefore().run();
    } else {
      editor.chain().focus().addColumnAfter().run();
    }
    setContextMenu(null);
  };

  const handleDeleteRow = () => {
    editor.chain().focus().deleteRow().run();
    setContextMenu(null);
  };

  const handleDeleteColumn = () => {
    editor.chain().focus().deleteColumn().run();
    setContextMenu(null);
  };

  const handleDeleteTable = () => {
    editor.chain().focus().deleteTable().run();
    setContextMenu(null);
  };

  if (!contextMenu) return null;

  return (
    <div
      className="fixed z-[100] bg-white rounded-lg shadow-lg border border-gray-200 min-w-[180px] p-1 table-context-menu"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      <div className="flex flex-col">
        {/* 插入行 */}
        <div className="flex flex-col">
          <div className="px-3 py-1.5 text-sm text-gray-500 font-medium">插入行</div>
          <div
            role="menuitem"
            tabIndex={0}
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2"
            onClick={() => handleAddRow('before')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddRow('before');
              }
            }}
          >
            <ArrowUp className="w-4 h-4" />
            <span>在上方插入</span>
          </div>
          <div
            role="menuitem"
            tabIndex={0}
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2"
            onClick={() => handleAddRow('after')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddRow('after');
              }
            }}
          >
            <ArrowDown className="w-4 h-4" />
            <span>在下方插入</span>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* 插入列 */}
        <div className="flex flex-col">
          <div className="px-3 py-1.5 text-sm text-gray-500 font-medium">插入列</div>
          <div
            role="menuitem"
            tabIndex={0}
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2"
            onClick={() => handleAddColumn('before')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddColumn('before');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>在左侧插入</span>
          </div>
          <div
            role="menuitem"
            tabIndex={0}
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2"
            onClick={() => handleAddColumn('after')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddColumn('after');
              }
            }}
          >
            <ArrowRight className="w-4 h-4" />
            <span>在右侧插入</span>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* 删除行/列 */}
        <div
          role="menuitem"
          tabIndex={0}
          className="px-3 py-1.5 text-sm text-left hover:bg-gray-100 rounded text-red-500 cursor-pointer flex items-center gap-2"
          onClick={handleDeleteRow}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDeleteRow();
            }
          }}
        >
          <RowsIcon className="w-4 h-4" />
          <span>删除行</span>
        </div>
        <div
          role="menuitem"
          tabIndex={0}
          className="px-3 py-1.5 text-sm text-left hover:bg-gray-100 rounded text-red-500 cursor-pointer flex items-center gap-2"
          onClick={handleDeleteColumn}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDeleteColumn();
            }
          }}
        >
          <ColumnsIcon className="w-4 h-4" />
          <span>删除列</span>
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* 删除表格 */}
        <div
          role="menuitem"
          tabIndex={0}
          className="px-3 py-1.5 text-sm text-left hover:bg-gray-100 rounded text-red-500 cursor-pointer flex items-center gap-2"
          onClick={handleDeleteTable}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDeleteTable();
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
          <span>删除表格</span>
        </div>
      </div>
    </div>
  );
}; 