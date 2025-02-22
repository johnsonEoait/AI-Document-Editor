'use client';

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import tippy from 'tippy.js';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Text,
  Image,
  Table,
  Quote,
  Code,
} from 'lucide-react';

interface CommandItemProps {
  title: string;
  description: string;
  icon: ReactNode;
}

interface CommandProps {
  editor: Editor;
  range: any;
}

const Command = ({ editor, range }: CommandProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commandItems = [
    {
      title: '文本',
      description: '普通文本块',
      icon: <Text className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode('paragraph', 'paragraph')
          .run();
      },
    },
    {
      title: '标题 1',
      description: '大标题',
      icon: <Heading1 className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode('heading', { level: 1 })
          .run();
      },
    },
    {
      title: '标题 2',
      description: '中标题',
      icon: <Heading2 className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode('heading', { level: 2 })
          .run();
      },
    },
    {
      title: '标题 3',
      description: '小标题',
      icon: <Heading3 className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode('heading', { level: 3 })
          .run();
      },
    },
    {
      title: '无序列表',
      description: '创建无序列表',
      icon: <List className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: '有序列表',
      description: '创建有序列表',
      icon: <ListOrdered className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: '引用',
      description: '添加引用块',
      icon: <Quote className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: '代码块',
      description: '添加代码块',
      icon: <Code className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: '图片',
      description: '插入图片',
      icon: <Image className="w-4 h-4" />,
      command: ({ editor, range }) => {
        const url = window.prompt('输入图片地址');
        if (url) {
          editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
        }
      },
    },
    {
      title: '表格',
      description: '插入表格',
      icon: <Table className="w-4 h-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3 })
          .run();
      },
    },
  ];

  const selectItem = useCallback(
    (index: number) => {
      const item = commandItems[index];
      if (item) {
        item.command({ editor, range });
      }
    },
    [commandItems, editor, range],
  );

  useEffect(() => {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + commandItems.length - 1) % commandItems.length);
          return true;
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % commandItems.length);
          return true;
        }
        if (e.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [selectItem, selectedIndex, commandItems.length]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="relative max-h-[330px] w-[320px] overflow-y-auto p-2 scroll-smooth">
        {commandItems.map((item, index) => (
          <button
            key={index}
            className={`flex w-full items-center space-x-3 rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100 ${
              index === selectedIndex ? 'bg-gray-100' : ''
            }`}
            onClick={() => selectItem(index)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white">
              {item.icon}
            </div>
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const CommandList = ({
  items,
  command,
  editor,
  range,
}: {
  items: CommandItemProps[];
  command: any;
  editor: Editor;
  range: any;
}) => {
  const commandListRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (commandListRef.current && items.length > 0) {
      tippy(commandListRef.current, {
        getReferenceClientRect: () => {
          const { ranges } = editor.state.selection;
          const from = Math.min(...ranges.map((range) => range.$from.pos));
          const domRect = editor.view.coordsAtPos(from);
          return domRect;
        },
        appendTo: () => document.body,
        interactive: true,
        placement: 'bottom-start',
        showOnCreate: true,
        trigger: 'manual',
        content: commandListRef.current,
      });
    }
  }, [editor, items]);

  return (
    <Command editor={editor} range={range} />
  );
};

export { CommandList, type CommandItemProps }; 