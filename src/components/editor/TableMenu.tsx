import { Editor } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Trash2,
  RowsIcon,
  ColumnsIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Grid2x2,
  Pencil,
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest('td, th');
      
      if (cell && editor.isActive('table')) {
        e.preventDefault();
        // Clear previous selections
        editor.view.dom.querySelectorAll('td.is-selected, th.is-selected').forEach(el => {
          el.classList.remove('is-selected');
        });
        // Add selected class to current cell
        cell.classList.add('is-selected');
        setContextMenu({ x: e.clientX, y: e.clientY });
      } else {
        setContextMenu(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest('td, th');
      const isMenuClick = target.closest('.table-context-menu');
      
      if (cell && !isMenuClick && editor.isActive('table')) {
        // Clear previous selections
        editor.view.dom.querySelectorAll('td.is-selected, th.is-selected').forEach(el => {
          el.classList.remove('is-selected');
        });
        // Add selected class to clicked cell
        cell.classList.add('is-selected');
        editor.commands.focus();
      } else if (!isMenuClick) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu) {
        setContextMenu(null);
      }
    };

    editor.view.dom.addEventListener('contextmenu', handleContextMenu);
    editor.view.dom.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.view.dom.removeEventListener('contextmenu', handleContextMenu);
      editor.view.dom.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, contextMenu]);

  // 调整菜单位置以确保在屏幕内
  useEffect(() => {
    if (contextMenu && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let { x, y } = contextMenu;
      
      // 检查是否超出右边界
      if (x + rect.width > viewportWidth) {
        x = x - rect.width;
      }
      
      // 检查是否超出下边界
      if (y + rect.height > viewportHeight) {
        y = y - rect.height;
      }
      
      // 确保不会超出顶部或左侧
      x = Math.max(8, x);
      y = Math.max(8, y);
      
      if (x !== contextMenu.x || y !== contextMenu.y) {
        setContextMenu({ x, y });
      }
    }
  }, [contextMenu]);

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

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    editor.chain().focus().setCellAttribute('textAlign', align).run();
    setContextMenu(null);
  };

  if (!contextMenu) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] table-context-menu"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      <div className="flex flex-col">
        <div className="table-context-menu-title">
          <Grid2x2 className="w-3 h-3 inline-block mr-1.5 opacity-60" /> 表格
        </div>
        
        {/* 插入行 */}
        <div className="table-context-menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={() => handleAddRow('before')}
        >
          <ArrowUp className="w-4 h-4" />
          <span>在上方插入行</span>
        </div>
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item"
          onClick={() => handleAddRow('after')}
        >
          <ArrowDown className="w-4 h-4" />
          <span>在下方插入行</span>
        </div>

        <div className="table-context-menu-divider" />

        {/* 插入列 */}
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item"
          onClick={() => handleAddColumn('before')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>在左侧插入列</span>
        </div>
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item"
          onClick={() => handleAddColumn('after')}
        >
          <ArrowRight className="w-4 h-4" />
          <span>在右侧插入列</span>
        </div>

        <div className="table-context-menu-divider" />

        {/* 文本对齐 */}
        <div className="table-context-menu-title">文本格式</div>
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item"
          onClick={() => handleAlign('left')}
        >
          <AlignLeft className="w-4 h-4" />
          <span>左对齐</span>
        </div>
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item"
          onClick={() => handleAlign('center')}
        >
          <AlignCenter className="w-4 h-4" />
          <span>居中对齐</span>
        </div>
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item"
          onClick={() => handleAlign('right')}
        >
          <AlignRight className="w-4 h-4" />
          <span>右对齐</span>
        </div>

        <div className="table-context-menu-divider" />

        {/* 删除行/列 */}
        <div className="table-context-menu-title">删除</div>
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item text-red-500"
          onClick={handleDeleteRow}
        >
          <RowsIcon className="w-4 h-4" />
          <span>删除行</span>
        </div>
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item text-red-500"
          onClick={handleDeleteColumn}
        >
          <ColumnsIcon className="w-4 h-4" />
          <span>删除列</span>
        </div>
        <div
          role="menuitem"
          tabIndex={0}
          className="table-context-menu-item text-red-500"
          onClick={handleDeleteTable}
        >
          <Trash2 className="w-4 h-4" />
          <span>删除表格</span>
        </div>
      </div>
    </div>
  );
}; 