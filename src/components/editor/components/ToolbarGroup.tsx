'use client';

import React from 'react';
import * as Toolbar from '@radix-ui/react-toolbar';

interface ToolbarGroupProps {
  children: React.ReactNode;
}

export const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ children }) => {
  return (
    <>
      <div className="flex items-center gap-0.5 px-0.5">
        {children}
      </div>
      <Toolbar.Separator className="w-[1px] bg-gray-200 mx-1 h-6" />
    </>
  );
}; 