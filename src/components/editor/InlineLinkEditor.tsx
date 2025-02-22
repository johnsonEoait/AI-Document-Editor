'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, Trash2 } from 'lucide-react';

interface InlineLinkEditorProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

export const InlineLinkEditor = ({ editor, isOpen, onClose }: InlineLinkEditorProps) => {
  const [url, setUrl] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasExistingLink, setHasExistingLink] = useState(false);

  const updatePosition = useCallback(() => {
    if (!editor || !isOpen) return;

    const { state } = editor;
    const { selection } = state;
    const { from, to } = selection;

    // 获取选中文本的坐标
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    
    setPosition({
      x: start.left,
      y: end.bottom + 5,
    });

    // 如果已经有链接，获取链接地址
    const marks = editor.state.doc.rangeHasMark(from, to, editor.schema.marks.link);
    setHasExistingLink(marks);
    if (marks) {
      const linkMark = editor.state.doc.nodeAt(from)?.marks.find(mark => mark.type.name === 'link');
      if (linkMark) {
        setUrl(linkMark.attrs.href || '');
      }
    } else {
      setUrl('');
    }
  }, [editor, isOpen]);

  useEffect(() => {
    updatePosition();
  }, [updatePosition, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
    onClose();
  };

  const handleUnlink = () => {
    editor.chain().focus().unsetLink().run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-gray-500 px-1">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>链接到</span>
            </div>
            {hasExistingLink && (
              <button
                type="button"
                onClick={handleUnlink}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-xs">取消链接</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="粘贴链接或搜索页面"
              className="w-80 px-2 py-1.5 text-sm bg-gray-50 rounded focus:outline-none focus:bg-gray-100 transition-colors"
              autoFocus
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs px-1">
            <div className="text-gray-500">
              按下回车确认，Esc取消
            </div>
            <button
              type="submit"
              className="text-gray-900 hover:text-gray-700 font-medium"
            >
              确认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 