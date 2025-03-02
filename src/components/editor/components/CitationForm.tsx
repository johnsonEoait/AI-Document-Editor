'use client';

import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { CitationData } from '../types/toolbar';

interface CitationFormProps {
  onInsert: (data: CitationData) => void;
  onCancel: () => void;
}

export const CitationForm: React.FC<CitationFormProps> = ({ onInsert, onCancel }) => {
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (source) {
      onInsert({ author, source, content });
      // 清空表单
      setAuthor('');
      setSource('');
      setContent('');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">添加引用文献</h3>
      <div className="flex flex-col gap-2">
        <input 
          type="text" 
          placeholder="作者 (可选)" 
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="来源 (必填)" 
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <textarea 
          placeholder="引用内容" 
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm min-h-[80px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Popover.Close asChild>
          <button 
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            onClick={onCancel}
          >
            取消
          </button>
        </Popover.Close>
        <Popover.Close asChild>
          <button 
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
            onClick={handleSubmit}
            disabled={!source}
          >
            插入引用
          </button>
        </Popover.Close>
      </div>
    </div>
  );
}; 