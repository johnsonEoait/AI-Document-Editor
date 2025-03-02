'use client';

import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { HeadingLevel, HeadingOption } from '../types/toolbar';

interface HeadingSelectorProps {
  onSelect: (level: HeadingLevel) => void;
  currentLevel: HeadingLevel | null;
}

export const HeadingSelector: React.FC<HeadingSelectorProps> = ({ 
  onSelect, 
  currentLevel 
}) => {
  const headingOptions: HeadingOption[] = [
    { level: 1, label: 'Heading 1', className: 'text-2xl font-bold' },
    { level: 2, label: 'Heading 2', className: 'text-xl font-bold' },
    { level: 3, label: 'Heading 3', className: 'text-lg font-bold' },
    { level: 4, label: 'Heading 4', className: 'text-base font-bold' },
    { level: 5, label: 'Heading 5', className: 'text-sm font-bold' },
    { level: 6, label: 'Heading 6', className: 'text-xs font-bold' },
    { level: 0, label: 'Normal text', className: 'text-base' },
  ];

  return (
    <div className="flex flex-col gap-1 p-1 min-w-[180px]">
      {headingOptions.map((option) => (
        <Popover.Close key={option.level} asChild>
          <button
            className={`px-3 py-2 text-left rounded hover:bg-gray-100 ${
              currentLevel === option.level ? 'bg-gray-100' : ''
            }`}
            onClick={() => onSelect(option.level)}
          >
            <span className={option.className}>{option.label}</span>
          </button>
        </Popover.Close>
      ))}
    </div>
  );
}; 