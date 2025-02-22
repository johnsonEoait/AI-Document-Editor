'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback } from 'react';
import { GripVertical, Plus, Trash } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

interface BlockMenuProps {
  editor: Editor;
}

interface Block {
  id: string;
  top: number;
  height: number;
  type: string;
  pos: number;
  selected: boolean;
}

export const BlockMenu = ({ editor }: BlockMenuProps) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const updateBlocks = useCallback(() => {
    const newBlocks: Block[] = [];
    const editorView = editor.view;
    const editorRect = editorView.dom.getBoundingClientRect();
    const { from, to } = editor.state.selection;

    let skipTable = false;

    editor.state.doc.nodesBetween(0, editor.state.doc.content.size, (node, pos) => {
      if (skipTable) {
        if (node.type.name === 'table') {
          skipTable = false;
        }
        return false;
      }

      if (node.type.name === 'table') {
        const dom = editorView.nodeDOM(pos) as HTMLElement;
        if (dom) {
          const rect = dom.getBoundingClientRect();
          const nodeSize = node.nodeSize;
          const selected = pos <= from && pos + nodeSize >= to;
          
          newBlocks.push({
            id: `${pos}`,
            top: rect.top - editorRect.top,
            height: rect.height,
            type: node.type.name,
            pos: pos,
            selected,
          });
        }
        skipTable = true;
        return false;
      }

      if (node.isBlock && !node.isText && !['tableRow', 'tableCell', 'tableHeader'].includes(node.type.name)) {
        const dom = editorView.nodeDOM(pos) as HTMLElement;
        if (dom) {
          const rect = dom.getBoundingClientRect();
          const nodeSize = node.nodeSize;
          const selected = pos <= from && pos + nodeSize >= to;
          
          newBlocks.push({
            id: `${pos}`,
            top: rect.top - editorRect.top,
            height: rect.height,
            type: node.type.name,
            pos: pos,
            selected,
          });
        }
      }
      return true;
    });

    setBlocks(newBlocks);
  }, [editor]);

  useEffect(() => {
    const handleUpdate = () => {
      requestAnimationFrame(updateBlocks);
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    // 初始化
    handleUpdate();

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [editor, updateBlocks]);

  const handleAddBlock = (pos: number) => {
    editor.chain().focus().insertContentAt(pos, '<p></p>').run();
  };

  const handleDeleteBlock = (pos: number, type: string) => {
    if (type === 'table') {
      editor.chain().focus().deleteTable().run();
      return;
    }

    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    // 如果是文档中的最后一个块，则替换为空段落
    if (editor.state.doc.content.childCount === 1) {
      editor
        .chain()
        .focus()
        .clearContent()
        .insertContent('<p></p>')
        .run();
      return;
    }

    // 删除整个块
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.delete(pos, pos + node.nodeSize);
        return true;
      })
      .run();
  };

  return (
    <div className="relative">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="absolute w-full group"
          style={{
            top: block.top + 'px',
            height: block.height + 'px',
          }}
          onMouseEnter={() => setHoveredBlockId(block.id)}
          onMouseLeave={() => setHoveredBlockId(null)}
        >
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className={`absolute right-0 p-1 rounded hover:bg-gray-100 transition-opacity ${
                  hoveredBlockId === block.id || block.selected ? 'opacity-100' : 'opacity-0'
                } group-hover:opacity-100`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                onMouseDown={(e) => e.preventDefault()}
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
                    onClick={() => handleAddBlock(parseInt(block.id))}
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加块</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded text-red-500"
                    onClick={() => handleDeleteBlock(block.pos, block.type)}
                  >
                    <Trash className="w-4 h-4" />
                    <span>删除{block.type === 'table' ? '表格' : '块'}</span>
                  </button>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      ))}
    </div>
  );
}; 