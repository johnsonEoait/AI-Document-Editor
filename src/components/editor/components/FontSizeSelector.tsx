import { Editor } from '@tiptap/react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

// 按照从小到大的顺序排列字体大小
const fontSizes = [
  { label: '六号', size: '7.5px' },
  { label: '小五', size: '9px' },
  { label: '五号', size: '10.5px' },
  { label: '小四', size: '12px' },
  { label: '四号', size: '14px' },
  { label: '小三', size: '15px' },
  { label: '三号', size: '16px' },
  { label: '小二', size: '18px' },
  { label: '二号', size: '22px' },
  { label: '小一', size: '24px' },
  { label: '一号', size: '26px' },
  { label: '小初', size: '36px' },
  { label: '初号', size: '42px' },
];

interface FontSizeSelectorProps {
  editor: Editor;
}

export const FontSizeSelector = ({ editor }: FontSizeSelectorProps) => {
  const [selectedSize, setSelectedSize] = useState('三号');
  const [isOpen, setIsOpen] = useState(false);

  // 监听编辑器选择变化，更新当前字号
  useEffect(() => {
    const updateFontSize = () => {
      const currentSize = editor.getAttributes('textStyle').fontSize;
      if (currentSize) {
        const sizeItem = fontSizes.find(item => item.size === currentSize);
        if (sizeItem) {
          setSelectedSize(sizeItem.label);
        } else {
          // 如果没有找到完全匹配的字号，设置为默认的三号
          setSelectedSize('三号');
          editor.chain().focus().setFontSize('16px').run();
        }
      } else {
        // 如果没有字号设置，设置为默认的三号
        setSelectedSize('三号');
        editor.chain().focus().setFontSize('16px').run();
      }
    };

    editor.on('selectionUpdate', updateFontSize);
    editor.on('transaction', updateFontSize);
    
    // 初始化时执行一次
    updateFontSize();

    return () => {
      editor.off('selectionUpdate', updateFontSize);
      editor.off('transaction', updateFontSize);
    };
  }, [editor]);

  const handleSelect = (label: string, size: string) => {
    editor.chain().focus().setFontSize(size).run();
    setSelectedSize(label);
    setIsOpen(false);
  };

  const getCurrentSizeIndex = () => {
    const currentSize = editor.getAttributes('textStyle').fontSize;
    if (!currentSize) {
      return fontSizes.findIndex(size => size.label === '三号');
    }
    const index = fontSizes.findIndex(size => size.size === currentSize);
    return index === -1 ? fontSizes.findIndex(size => size.label === '三号') : index;
  };

  const handleIncrease = () => {
    const currentIndex = getCurrentSizeIndex();
    if (currentIndex < fontSizes.length - 1) {
      const nextSize = fontSizes[currentIndex + 1];
      handleSelect(nextSize.label, nextSize.size);
    }
  };

  const handleDecrease = () => {
    const currentIndex = getCurrentSizeIndex();
    if (currentIndex > 0) {
      const prevSize = fontSizes[currentIndex - 1];
      handleSelect(prevSize.label, prevSize.size);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button className="border rounded px-2 py-0.5 hover:bg-gray-50 flex items-center gap-1 min-w-[60px]">
            <span className="text-sm">{selectedSize}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="bg-white rounded-lg shadow-lg py-1 w-[100px] border border-gray-200 max-h-[300px] overflow-y-auto"
            sideOffset={5}
          >
            <div>
              {fontSizes.map(({ label, size }) => (
                <button
                  key={size}
                  className={`w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 flex items-center justify-between group ${
                    label === selectedSize ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelect(label, size)}
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <button
        className="border rounded px-1.5 py-0.5 hover:bg-gray-100 transition-colors flex items-center"
        onClick={handleDecrease}
        title="减小字号"
      >
        <span className="text-sm font-bold">A-</span>
      </button>

      <button
        className="border rounded px-1.5 py-0.5 hover:bg-gray-100 transition-colors flex items-center"
        onClick={handleIncrease}
        title="增大字号"
      >
        <span className="text-sm font-bold">A+</span>
      </button>
    </div>
  );
}; 