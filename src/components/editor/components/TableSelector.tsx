'use client';

import React, { useState } from 'react';
import { TableSelectorProps } from '../types/toolbar';

export const TableSelector: React.FC<TableSelectorProps> = ({ onSelect }) => {
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startRow, setStartRow] = useState(0);
  const [startCol, setStartCol] = useState(0);

  // 处理鼠标进入单元格事件
  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging) {
      // 在拖动状态下，更新选择区域
      setRows(Math.max(row, startRow));
      setCols(Math.max(col, startCol));
    } else if (!isSelecting) {
      // 非选择状态下，仅预览当前单元格
      setRows(row);
      setCols(col);
    }
  };

  // 处理鼠标按下事件
  const handleMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setIsDragging(true);
    // 记录起始位置
    setStartRow(row);
    setStartCol(col);
    setRows(row);
    setCols(col);
    
    // 添加全局鼠标事件监听，以便在拖动超出组件范围时也能捕获鼠标释放
    document.addEventListener('mouseup', handleGlobalMouseUp, { once: true });
  };
  
  // 处理全局鼠标释放事件
  const handleGlobalMouseUp = () => {
    setIsDragging(false);
    if (isSelecting && rows >= 0 && cols >= 0) {
      onSelect(rows + 1, cols + 1);
      setTimeout(() => {
        setIsSelecting(false);
        // 重置选择状态
        setRows(0);
        setCols(0);
      }, 300);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2">
        <div 
          className="table-selector-grid"
          onMouseLeave={() => {
            if (!isDragging) {
              setRows(0);
              setCols(0);
            }
          }}
        >
          {Array.from({ length: 8 * 8 }).map((_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            
            // 计算是否为活动单元格
            const minRow = Math.min(startRow, rows);
            const maxRow = Math.max(startRow, rows);
            const minCol = Math.min(startCol, cols);
            const maxCol = Math.max(startCol, cols);
            
            const isActive = isDragging 
              ? (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol)
              : (row <= rows && col <= cols);
              
            return (
              <div
                key={i}
                className={`table-selector-cell ${isActive ? 'active' : ''}`}
                onMouseEnter={() => handleMouseEnter(row, col)}
                onMouseDown={() => handleMouseDown(row, col)}
                style={{
                  backgroundColor: isActive ? '#3b82f6' : 'white',
                  borderColor: isActive ? '#2563eb' : '#e2e8f0'
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="table-selector-info">
        {rows > 0 || cols > 0 ? `${rows + 1} × ${cols + 1} 表格` : '拖动选择表格大小'}
      </div>
    </div>
  );
}; 