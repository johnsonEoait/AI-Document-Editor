'use client';

import React from 'react';
import { ColorPickerProps } from '../types/toolbar';

interface ColorOption {
  color: string;
  className: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  colors, 
  onSelectColor, 
  onClearColor,
  title = "选择颜色"
}) => {
  return (
    <div className="p-2">
      <div className="grid grid-cols-5 gap-1">
        {colors.map((colorOption) => (
          <button
            key={colorOption.color}
            className={`w-6 h-6 rounded cursor-pointer border border-gray-200 hover:scale-110 transition-transform ${colorOption.className}`}
            onClick={() => onSelectColor(colorOption.color)}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        {title}
      </div>
      <button
        className="w-full mt-2 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        onClick={onClearColor}
      >
        清除颜色
      </button>
    </div>
  );
}; 