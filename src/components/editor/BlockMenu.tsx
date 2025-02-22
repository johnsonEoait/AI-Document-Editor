'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback } from 'react';
import { GripVertical, Plus, Trash } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

interface BlockMenuProps {
  editor: Editor;
}

export const BlockMenu = ({ editor }: BlockMenuProps) => {
  const [activeBlock, setActiveBlock] = useState<{ top: number; node: any } | null>(null);

  const updateMenu = useCallback(() => {
    const { state } = editor;
    const { selection } = state;
    const { $anchor } = selection;

    // 获取当前块级节点的位置
    const depth = $anchor.depth;
    const node = $anchor.node(depth);
    const pos = depth === 0 ? $anchor.pos : $anchor.before(depth);

    // 获取节点的 DOM 元素
    const view = editor.view;
    const domAtPos = view.domAtPos(pos);
    if (!domAtPos) return;

    const nodeDOM = domAtPos.node.parentElement;
    if (!nodeDOM) return;

    // 计算相对位置
    const editorRect = view.dom.getBoundingClientRect();
    const nodeRect = nodeDOM.getBoundingClientRect();
    const top = nodeRect.top - editorRect.top;

    setActiveBlock({ top, node });
  }, [editor]);

  useEffect(() => {
    editor.on('selectionUpdate', updateMenu);
    editor.on('update', updateMenu);
    
    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('update', updateMenu);
    };
  }, [editor, updateMenu]);

  if (!activeBlock) return null;

  return (
    <div className="absolute -left-10 top-0 h-full">
      <div
        className="absolute"
        style={{
          top: `${activeBlock.top}px`,
        }}
      >
        <Popover.Root>
          <Popover.Trigger asChild>
            <button 
              className="p-1 rounded hover:bg-gray-100 opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
              sideOffset={5}
            >
              <div className="flex flex-col gap-1">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
                  onClick={() => {
                    const pos = editor.state.selection.$anchor.pos;
                    editor.chain().focus().insertContentAt(pos, '<p></p>').run();
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>添加块</span>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded text-red-500"
                  onClick={() => {
                    editor.chain().focus().deleteNode(activeBlock.node.type).run();
                  }}
                >
                  <Trash className="w-4 h-4" />
                  <span>删除块</span>
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}; 