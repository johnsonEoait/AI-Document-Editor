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
  Type,
  Image,
  Table2,
  Quote,
  Code2,
  ListChecks,
  Minus,
  FileCode,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          editor
            .chain()
            .deleteRange(range)
            .insertContent({
              type: 'customImage',
              attrs: { src: result }
            })
            .run();
        }
      };
      reader.readAsDataURL(file);
    }
    // 清除选择的文件，这样相同的文件可以再次选择
    event.target.value = '';
  };

  const commandItems = [
    {
      title: '文本',
      description: '普通文本块',
      icon: <Type className="w-5 h-5 text-blue-600" />,
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
      title: '大标题',
      description: 'H1 标题',
      icon: <Heading1 className="w-5 h-5 text-blue-600" />,
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
      title: '中标题',
      description: 'H2 标题',
      icon: <Heading2 className="w-5 h-5 text-blue-600" />,
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
      title: '小标题',
      description: 'H3 标题',
      icon: <Heading3 className="w-5 h-5 text-blue-600" />,
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
      icon: <List className="w-5 h-5 text-blue-600" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: '有序列表',
      description: '创建有序列表',
      icon: <ListOrdered className="w-5 h-5 text-blue-600" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: '任务列表',
      description: '创建任务列表',
      icon: <ListChecks className="w-5 h-5 text-blue-600" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: '分割线',
      description: '插入水平分割线',
      icon: <Minus className="w-5 h-5 text-blue-600" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: '引用',
      description: '添加引用块',
      icon: <Quote className="w-5 h-5 text-blue-600" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: '代码',
      description: '行内代码',
      icon: <Code2 className="w-5 h-5 text-blue-600" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCode().run();
      },
    },
    {
      title: '代码块',
      description: '添加代码块',
      icon: <FileCode className="w-5 h-5 text-blue-600" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: '图片',
      description: '插入图片',
      icon: <Image className="w-5 h-5 text-blue-600" />,
      command: () => {
        fileInputRef.current?.click();
      },
    },
    {
      title: '表格',
      description: '插入表格',
      icon: <Table2 className="w-5 h-5 text-blue-600" />,
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
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
        <div className="relative max-h-[330px] w-[320px] overflow-y-auto p-2 scroll-smooth">
          {commandItems.map((item, index) => (
            <button
              key={index}
              className={`flex w-full items-center space-x-3 rounded-md px-4 py-2 text-left text-sm transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => selectItem(index)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
                {item.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900">{item.title}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
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