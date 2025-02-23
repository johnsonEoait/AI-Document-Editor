import { Editor } from '@tiptap/react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, TextQuote } from 'lucide-react';
import { useState } from 'react';

const fontSizes = [
  { label: '初号', size: '42px' },
  { label: '小初', size: '36px' },
  { label: '一号', size: '26px' },
  { label: '小一', size: '24px' },
  { label: '二号', size: '22px' },
  { label: '小二', size: '18px' },
  { label: '三号', size: '16px' },
  { label: '小三', size: '15px' },
  { label: '四号', size: '14px' },
  { label: '小四', size: '12px' },
  { label: '五号', size: '10.5px' },
  { label: '小五', size: '9px' },
  { label: '六号', size: '7.5px' },
  { label: '小六', size: '6.5px' },
  { label: '七号', size: '5.5px' },
  { label: '八号', size: '5px' },
  { label: '9', size: '9px' },
  { label: '10', size: '10px' },
  { label: '10.5', size: '10.5px' },
  { label: '11', size: '11px' },
  { label: '12', size: '12px' },
  { label: '14', size: '14px' },
  { label: '16', size: '16px' },
  { label: '18', size: '18px' },
  { label: '20', size: '20px' },
  { label: '22', size: '22px' },
  { label: '26', size: '26px' },
  { label: '28', size: '28px' },
  { label: '36', size: '36px' },
  { label: '48', size: '48px' },
  { label: '56', size: '56px' },
  { label: '72', size: '72px' },
];

interface FontSizeSelectorProps {
  editor: Editor;
}

export const FontSizeSelector = ({ editor }: FontSizeSelectorProps) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (label: string, size: string) => {
    editor.chain().focus().setFontSize(size).run();
    setSelectedSize(label);
    setIsOpen(false);
  };

  const getCurrentSizeIndex = () => {
    const currentSize = editor.getAttributes('textStyle').fontSize;
    if (!currentSize) return fontSizes.findIndex(size => size.size === '16px'); // 默认字号
    return fontSizes.findIndex(size => size.size === currentSize);
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
            <span className="text-sm">{selectedSize || '三号'}</span>
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
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 flex items-center justify-between group"
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
        <span className="text-sm font-bold">A+</span>
      </button>

      <button
        className="border rounded px-1.5 py-0.5 hover:bg-gray-100 transition-colors flex items-center"
        onClick={handleIncrease}
        title="增大字号"
      >
        <span className="text-sm font-bold">A-</span>
      </button>
    </div>
  );
}; 