import { Extension } from '@tiptap/core';

export interface BlockHandleOptions {
  HTMLAttributes: Record<string, any>;
}

export const BlockHandle = Extension.create<BlockHandleOptions>({
  name: 'blockHandle',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addProseMirrorPlugins() {
    // 已删除所有拖拽相关的业务代码
    return [];
  },
}); 