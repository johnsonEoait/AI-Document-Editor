import { Editor } from '@tiptap/react';

// 扩展 Editor 类型
declare module '@tiptap/react' {
  interface Editor {
    aiToolbar?: {
      show: () => void;
    };
  }
}

// AI工具栏属性接口
export interface FloatingAIToolbarProps {
  editor: Editor;
  onLoadingChange: (isLoading: boolean) => void;
}

// 格式化选项类型
export interface FormatOption {
  label: string;
  value: string;
  icon: string;
}

// AI处理模式类型
export type AIProcessMode = 'process' | 'generate' | 'image';

// 闪光效果类型
export interface SparkleEffect {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

// 拖拽状态类型
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
}

// 选中范围类型
export interface SelectionRange {
  from: number;
  to: number;
}

// AI响应处理参数类型
export interface AIRequestParams {
  text: string;
  prompt: string;
  mode: string;
} 