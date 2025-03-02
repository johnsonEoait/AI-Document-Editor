'use client';

import React from 'react';
import { Wand2, Send, Type, Image } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AIProcessMode, SelectionRange } from '../types/aiToolbar';

interface AIToolbarInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  mode: AIProcessMode;
  isLoading: boolean;
  formatType: string;
  selectionRef: React.RefObject<SelectionRange | null>;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  onSubmit: () => void;
  onFormatSelect: (format: string) => void;
  onModeChange: (mode: AIProcessMode) => void;
  editor: any;
}

export const AIToolbarInput: React.FC<AIToolbarInputProps> = ({
  prompt,
  setPrompt,
  mode,
  isLoading,
  formatType,
  selectionRef,
  inputRef,
  onSubmit,
  onFormatSelect,
  onModeChange,
  editor
}) => {
  return (
    <div className="ai-input-wrapper flex gap-2">
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Wand2 className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'image' 
              ? "描述你想要生成的图像..."
              : selectionRef.current && selectionRef.current.from !== selectionRef.current.to
                ? "翻译/总结/改写..."
                : "写一段/续写..."
          }
          className="magic-input flex-1 pl-10 pr-3 py-3 text-sm rounded-xl w-full focus:outline-none placeholder:text-gray-300"
          disabled={isLoading || mode === 'format'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      </div>
      
      {/* 模式选择下拉菜单 */}
      <div className="relative z-[200]">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="mode-btn p-3 text-gray-600 hover:text-gray-800 transition-all duration-300 rounded-xl border border-gray-200/50 bg-white/50 hover:bg-white/80"
              aria-label="选择模式"
            >
              {mode === 'image' ? (
                <Image className="w-4 h-4" />
              ) : (
                <Type className="w-4 h-4" />
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <div className="fixed z-[9999]" style={{ position: 'fixed' }}>
              <DropdownMenu.Content
                className="ai-toolbar-glass rounded-lg shadow-lg p-2 w-48"
                sideOffset={5}
                align="end"
                forceMount
              >
                <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-gray-500">
                  选择操作模式
                </DropdownMenu.Label>
                <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                <DropdownMenu.Item
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100/50 rounded cursor-pointer ${mode === 'process' || mode === 'generate' ? 'bg-gray-100/50' : ''}`}
                  onClick={() => onModeChange(selectionRef.current && selectionRef.current.from !== selectionRef.current.to ? 'process' : 'generate')}
                >
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-medium bg-gray-100 rounded">
                    <Wand2 className="w-3.5 h-3.5" />
                  </span>
                  文本处理/生成
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100/50 rounded cursor-pointer ${mode === 'image' ? 'bg-gray-100/50' : ''}`}
                  onClick={() => onModeChange('image')}
                >
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-medium bg-gray-100 rounded">
                    <Image className="w-3.5 h-3.5" />
                  </span>
                  图像生成
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </div>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="magic-btn p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 min-w-[46px] flex items-center justify-center"
        aria-label="发送"
      >
        {isLoading ? (
          <div className="ai-loading-indicator">
            <div></div>
            <div></div>
            <div></div>
          </div>
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}; 