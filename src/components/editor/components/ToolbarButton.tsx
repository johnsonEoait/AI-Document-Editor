'use client';

import React from 'react';
import { ToolbarButtonProps } from '../types/toolbar';

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  onClick, 
  active, 
  title, 
  children 
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        active ? 'bg-gray-100' : ''
      }`}
      title={title}
    >
      {children}
    </button>
  );
}; 